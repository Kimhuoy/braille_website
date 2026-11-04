"""
Post each new feedback message and contribution to the team's private Telegram group.
Setup: Backend/docs/security.md, section 4.

Settings (environment variables). Without both, nothing is sent and the /admin page still works:
  TELEGRAM_BOT_TOKEN  from @BotFather
  TELEGRAM_CHAT_ID    the group; `python telegram_notify.py find-chat` shows it

The record is always saved first and this runs in the background, so a Telegram problem never
stops the form or loses anything: the record stays on the server, /admin shows that it was not
sent, and "Send again" there retries it.

The bot only sends. It does not read commands, so messaging it cannot make it do anything.

    python telegram_notify.py find-chat   list the groups the bot has seen
    python telegram_notify.py check       send a test message
    python telegram_notify.py sync        send everything still waiting

In the container, run sync as the workers' user (docker exec -u app ...): it rewrites the
records, and the workers cannot read a record that root has written.
"""
import argparse
import logging
import os
import sys
import threading
import time
from datetime import datetime, timezone

import requests

import contributions
import feedback

API = "https://api.telegram.org"
TIMEOUT = 120                   # a document can be 20 MB on a slow line
MAX_TEXT = 4000                 # Telegram's limit is 4096 characters per message
MAX_ROWS_IN_MESSAGE = 20
MAX_WAIT_SECONDS = 30           # how long to obey "too many requests" before giving up for now

KINDS = {
    "feedback": (feedback.feedback_dir, "feedback.json"),
    "contribution": (contributions.contributions_dir, "submission.json"),
}
WAITING = ("pending", "failed")
CATEGORIES = {"suggestion": "Suggestion", "problem": "Problem", "translation": "Wrong translation", "other": "Other"}


class TelegramError(RuntimeError):
    """Safe to log and store: it never contains the bot token."""


def _token():
    return os.environ.get("TELEGRAM_BOT_TOKEN", "").strip()


def _chat_id():
    return os.environ.get("TELEGRAM_CHAT_ID", "").strip()


def is_configured():
    return bool(_token() and _chat_id())


def _call(method, data=None, file_path=None, file_name=None):
    url = f"{API}/bot{_token()}/{method}"
    for attempt in (1, 2):
        try:
            if file_path:
                with open(file_path, "rb") as f:
                    response = requests.post(url, data=data, files={"document": (file_name, f)}, timeout=TIMEOUT)
            else:
                response = requests.post(url, data=data, timeout=TIMEOUT)
        except requests.RequestException as error:
            # Not str(error): the address in it contains the token, and this text reaches logs and records.
            raise TelegramError(f"cannot reach Telegram ({type(error).__name__})") from None
        try:
            body = response.json()
        except ValueError:
            body = {}
        if body.get("ok"):
            return body.get("result")
        wait = (body.get("parameters") or {}).get("retry_after", 0)
        if response.status_code == 429 and attempt == 1 and wait <= MAX_WAIT_SECONDS:
            time.sleep(wait)
            continue
        break
    raise TelegramError(f"{response.status_code}: {str(body.get('description', 'no details'))[:200]}")


def _send_text(text):
    # Plain text (no parse_mode): what the public typed cannot format the message or make hidden
    # links, and no preview means Telegram never visits a link someone put in a message.
    for start in range(0, len(text), MAX_TEXT):
        _call("sendMessage", {"chat_id": _chat_id(), "text": text[start:start + MAX_TEXT],
                              "link_preview_options": '{"is_disabled": true}'})


def _send_file(path, name, caption):
    _call("sendDocument", {"chat_id": _chat_id(), "caption": caption[:1000]}, file_path=path, file_name=name)


def _who(person):
    who = " · ".join(x for x in (person.get("name"), person.get("organization")) if x) or "No name given"
    return f"From: {who}\nContact: {person.get('contact') or 'not given'}"


def feedback_text(record):
    parts = [f"New feedback: {CATEGORIES.get(record['category'], record['category'])}", "", record["message"]]
    if record.get("sample_text"):
        parts += ["", "Text being translated:", record["sample_text"]]
    return "\n".join(parts + ["", _who(record), f"Reference: {record['id']}"])


def _row(number, entry):
    line = f"{number}. {entry['text']}  →  {entry['braille_cells']}"
    return f"{line}  ({entry['source']})" if entry.get("source") else line


def contribution_text(record):
    entries, files = record["entries"], record["files"]
    parts = [f"New contribution: {len(entries)} rows, {len(files)} files", "", _who(record["contributor"])]
    if record.get("notes"):
        parts += ["", "Notes:", record["notes"]]
    if entries:
        parts += ["", *[_row(n, e) for n, e in enumerate(entries[:MAX_ROWS_IN_MESSAGE], start=1)]]
        if len(entries) > MAX_ROWS_IN_MESSAGE:
            parts.append(f"... all {len(entries)} rows are in entries.txt")
    return "\n".join(parts + ["", f"Reference: {record['id']}"])


def _send_contribution(record, folder):
    _send_text(contribution_text(record))
    entries = record["entries"]
    if len(entries) > MAX_ROWS_IN_MESSAGE:
        # .txt, not .csv: many Braille codes start with = + - @, which Excel would run as formulas.
        path = os.path.join(folder, "entries.txt")
        with open(path, "w", encoding="utf-8") as f:
            f.write("\n".join(_row(n, e) for n, e in enumerate(entries, start=1)) + "\n")
        try:
            _send_file(path, "entries.txt", f"All rows · {record['id']}")
        finally:
            os.unlink(path)
    for file in record["files"]:
        _send_file(os.path.join(folder, file["stored_as"]), file["original_name"],
                   f"{file['category']} · {record['id']} · from the public, check before opening")


def _record_path(kind, record_id):
    directory, record_file = KINDS[kind]
    return os.path.join(directory(), record_id, record_file)


def _set_status(path, status):
    record = contributions.load_json(path)      # read again: /admin may have changed it meanwhile
    record["telegram"] = status
    contributions.write_json(path, record)


def deliver(kind, record_id):
    """Send one record now and store the result in it."""
    path = _record_path(kind, record_id)
    try:
        record = contributions.load_json(path)
        if record.get("telegram", {}).get("status") == "sent":
            return "sent"
        if kind == "feedback":
            _send_text(feedback_text(record))
        else:
            _send_contribution(record, os.path.dirname(path))
        status = {"status": "sent"}
    except TelegramError as error:
        logging.warning("Telegram: %s %s not sent: %s", kind, record_id, error)
        status = {"status": "failed", "error": str(error)}
    except OSError as error:
        logging.warning("Telegram: %s %s not sent (%s)", kind, record_id, type(error).__name__)
        status = {"status": "failed", "error": type(error).__name__}
    status["at"] = datetime.now(timezone.utc).isoformat(timespec="seconds")
    try:
        _set_status(path, status)
    except OSError:
        pass        # deleted on /admin while it was being sent
    return status["status"]


def notify_async(kind, record_id):
    """Called after a record is saved; returns at once."""
    if not is_configured():
        return
    try:
        _set_status(_record_path(kind, record_id), {"status": "pending"})
    except OSError:
        logging.exception("Telegram: could not mark %s", record_id)
        return
    threading.Thread(target=deliver, args=(kind, record_id), daemon=True).start()


def waiting():
    """(kind, id) of records that should have reached Telegram but have not.
    Records from before Telegram was set up have no status, so they are not sent all at once."""
    found = []
    for kind, (directory, record_file) in KINDS.items():
        root = directory()
        if not os.path.isdir(root):
            continue
        for record_id in sorted(os.listdir(root)):
            path = os.path.join(root, record_id, record_file)
            if os.path.isfile(path) and contributions.load_json(path).get("telegram", {}).get("status") in WAITING:
                found.append((kind, record_id))
    return found


def resend_async():
    """Send everything still waiting, in the background. Returns how many that is."""
    items = waiting()

    def run():
        for kind, record_id in items:
            deliver(kind, record_id)

    threading.Thread(target=run, daemon=True).start()
    return len(items)


# ---------------------------------------------------------------------------

def _cmd_find_chat(_args):
    chats = {}
    for update in _call("getUpdates") or []:
        for value in update.values():
            chat = value.get("chat") if isinstance(value, dict) else None
            if chat:
                chats[chat["id"]] = chat
    if not chats:
        print("No chats seen yet. Add the bot to the group, send /start@<bot name> there, and run this again.")
    for chat_id, chat in chats.items():
        print(f"{chat_id}  {chat.get('type', '')}  {chat.get('title') or chat.get('username') or ''}")


def _cmd_check(_args):
    bot = _call("getMe")
    print(f"Token works: @{bot.get('username')}")
    _send_text("Braille website: connection test.")
    print("Test message sent. Check the group.")


def _cmd_sync(_args):
    failures = 0
    for kind, record_id in waiting():
        result = deliver(kind, record_id)
        failures += result != "sent"
        print(f"{kind:12} {record_id}  {result}")
    sys.exit(1 if failures else 0)


def main(argv=None):
    parser = argparse.ArgumentParser(description="Post feedback and contributions to Telegram.")
    commands = parser.add_subparsers(dest="command", required=True)
    for name, func, text in (("find-chat", _cmd_find_chat, "list the groups the bot has seen"),
                             ("check", _cmd_check, "send a test message"),
                             ("sync", _cmd_sync, "send everything still waiting")):
        commands.add_parser(name, help=text).set_defaults(func=func)
    args = parser.parse_args(argv)
    if not _token() or (args.command != "find-chat" and not _chat_id()):
        print("Set TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID first (Backend/docs/security.md, section 4).")
        sys.exit(1)
    try:
        args.func(args)
    except TelegramError as error:
        print(f"Failed: {error}")
        sys.exit(1)


if __name__ == "__main__":
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    main()
