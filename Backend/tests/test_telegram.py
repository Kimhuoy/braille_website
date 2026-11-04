"""
Telegram delivery, through real HTTP requests to a fake Telegram server on this computer
(no account or internet needed).

Run:  python -I -X utf8 Backend/tests/test_telegram.py      (from the repo root)
"""
import io
import json
import logging
import os
import sys
import tempfile
import threading
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

from werkzeug.formparser import parse_form_data

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))

TOKEN = "123456:SECRET-TOKEN-VALUE"
PASSWORD = "correct horse battery"
_tmp = tempfile.TemporaryDirectory()
os.environ.update(
    ADMIN_PASSWORD=PASSWORD,
    FEEDBACK_DIR=os.path.join(_tmp.name, "feedback"),
    CONTRIBUTIONS_DIR=os.path.join(_tmp.name, "contributions"),
    RATE_LIMIT_DB=os.path.join(_tmp.name, "limits.sqlite3"),
)
os.environ["FORMS_BACKEND"] = "on"
os.environ.pop("TELEGRAM_BOT_TOKEN", None)
os.environ.pop("TELEGRAM_CHAT_ID", None)

import contributions  # noqa: E402
import main  # noqa: E402
import telegram_notify as tg  # noqa: E402

ADMIN = {"X-Requested-With": "braille-admin"}
sent = []           # what the fake server received
script = []         # (status, body) answers to give before going back to "ok"


class FakeTelegram(BaseHTTPRequestHandler):
    def do_POST(self):
        body = self.rfile.read(int(self.headers.get("Content-Length", 0)))
        environ = {"wsgi.input": io.BytesIO(body), "CONTENT_LENGTH": str(len(body)), "REQUEST_METHOD": "POST",
                   "CONTENT_TYPE": self.headers.get("Content-Type", "")}
        _, form, files = parse_form_data(environ)
        document = files.get("document")
        sent.append({"path": self.path, "method": self.path.rsplit("/", 1)[-1], "form": dict(form),
                     "file_name": document.filename if document else None,
                     "file": document.read() if document else None})
        status, answer = script.pop(0) if script else (200, {"ok": True, "result": {}})
        data = json.dumps(answer).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def log_message(self, *_):
        pass


def client():
    return main.app.test_client()


def admin():
    c = client()
    r = c.post("/api/admin/login", json={"password": PASSWORD}, headers=ADMIN, base_url="https://localhost")
    assert r.status_code == 200
    return c


def record_of(kind, record_id):
    return contributions.load_json(tg._record_path(kind, record_id))


def wait_until_done(kind, record_id):
    for _ in range(200):
        if record_of(kind, record_id).get("telegram", {}).get("status") in ("sent", "failed"):
            return
        time.sleep(0.02)
    raise AssertionError("delivery did not finish")


def send_feedback(**fields):
    r = client().post("/api/feedback", json={"message": "hello", **fields})
    assert r.status_code == 201, r.get_json()
    return r.get_json()["id"]


def run():
    # --- Not set up: nothing is sent, and the form works as before
    before_setup = fid = send_feedback()
    assert "telegram" not in record_of("feedback", fid)
    assert not tg.is_configured()
    print("PASS  off until the token and chat are set")

    server = ThreadingHTTPServer(("127.0.0.1", 0), FakeTelegram)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    tg.API = f"http://127.0.0.1:{server.server_port}"
    os.environ.update(TELEGRAM_BOT_TOKEN=TOKEN, TELEGRAM_CHAT_ID="-100123")

    logs = io.StringIO()
    handler = logging.StreamHandler(logs)
    logging.getLogger().addHandler(handler)

    # --- Feedback reaches the group as plain text; the form did not wait for it
    html = '<a href="http://evil.example">click</a> *bold* [x](http://evil.example)'
    fid = send_feedback(message=html, category="problem", name="Dara", contact="Telegram @dara", sample_text="សួស្តី")
    wait_until_done("feedback", fid)
    assert record_of("feedback", fid)["telegram"]["status"] == "sent"
    assert len(sent) == 1 and sent[0]["method"] == "sendMessage", sent
    form = sent[0]["form"]
    assert form["chat_id"] == "-100123" and "parse_mode" not in form
    assert json.loads(form["link_preview_options"]) == {"is_disabled": True}
    for part in (html, "Problem", "សួស្តី", "Dara", "Telegram @dara", fid):
        assert part in form["text"], part
    print("PASS  feedback sent as plain text, no link preview")

    # --- Spam trap: stored nowhere, sent nowhere
    sent.clear()
    r = client().post("/api/feedback", json={"message": "buy now", "website": "http://spam"})
    assert r.status_code == 201
    time.sleep(0.1)
    assert not sent
    print("PASS  spam trap never reaches Telegram")

    # --- Telegram's message limit
    fid = send_feedback(message="ក" * 5000, sample_text="ខ" * 2000)
    wait_until_done("feedback", fid)
    assert len(sent) == 2 and all(len(s["form"]["text"]) <= 4096 for s in sent), [len(s["form"]["text"]) for s in sent]
    assert "".join(s["form"]["text"] for s in sent).count("ក") == 5000
    print("PASS  long messages are split, nothing cut off")

    # --- Contribution with files, including a Khmer file name
    sent.clear()
    rows = [{"text": "គ", "braille": ",g", "source": "NISE"}, {"text": "=", "braille": ".k"}]
    data = {"consent": "true", "name": "Dara", "organization": "School", "notes": "two rows",
            "entries": json.dumps(rows, ensure_ascii=False), "file_categories": '["original"]',
            "files": (io.BytesIO(b"%PDF-1.7 content"), "មេរៀន.pdf")}
    r = client().post("/api/contribute", data=data, content_type="multipart/form-data")
    sub = r.get_json()["id"]
    wait_until_done("contribution", sub)
    assert [s["method"] for s in sent] == ["sendMessage", "sendDocument"], sent
    text = sent[0]["form"]["text"]
    for part in ("2 rows, 1 files", "School", "two rows", "គ", "⠠⠛", "NISE", sub):
        assert part in text, part
    assert sent[1]["file_name"] == "មេរៀន.pdf" and sent[1]["file"] == b"%PDF-1.7 content", sent[1]
    assert "check before opening" in sent[1]["form"]["caption"]
    print("PASS  contribution: summary, then its files with the original names")

    # --- Many rows: first ones in the message, all in a text file that Excel cannot run
    sent.clear()
    rows = [{"text": "ក", "braille": "=g"} for _ in range(25)]
    r = client().post("/api/contribute", data={"consent": "true", "entries": json.dumps(rows, ensure_ascii=False)},
                      content_type="multipart/form-data")
    big = r.get_json()["id"]
    wait_until_done("contribution", big)
    assert [s["method"] for s in sent] == ["sendMessage", "sendDocument"]
    assert sent[1]["file_name"] == "entries.txt" and sent[1]["file"].decode().count("\n") == 25
    assert "entries.txt" in sent[0]["form"]["text"] and sent[0]["form"]["text"].count("→") == tg.MAX_ROWS_IN_MESSAGE
    folder = os.path.dirname(tg._record_path("contribution", big))
    assert not os.path.exists(os.path.join(folder, "entries.txt")), "no extra file left in the record"
    print("PASS  many rows go in entries.txt")

    # --- Telegram refuses (wrong token): the record is safe, the form still answers 201
    sent.clear()
    script.append((401, {"ok": False, "description": "Unauthorized"}))
    failed = send_feedback(message="keep me")
    wait_until_done("feedback", failed)
    status = record_of("feedback", failed)["telegram"]
    assert status["status"] == "failed" and "Unauthorized" in status["error"], status
    assert record_of("feedback", failed)["message"] == "keep me"
    print("PASS  refused by Telegram: kept and marked as failed")

    # --- "Too many requests": wait and try once more
    sent.clear()
    script.append((429, {"ok": False, "description": "Too Many Requests", "parameters": {"retry_after": 0}}))
    limited = send_feedback()
    wait_until_done("feedback", limited)
    assert record_of("feedback", limited)["telegram"]["status"] == "sent" and len(sent) == 2
    print("PASS  obeys Telegram's rate limit")

    # --- Telegram unreachable: the token must not appear in logs or records
    good_api = tg.API
    tg.API = "http://127.0.0.1:9"
    down = send_feedback(message="while down")
    wait_until_done("feedback", down)
    status = record_of("feedback", down)["telegram"]
    assert status["status"] == "failed" and "cannot reach" in status["error"], status
    tg.API = good_api
    assert TOKEN not in json.dumps(status) and "SECRET" not in logs.getvalue(), logs.getvalue()
    print("PASS  bot token stays out of logs and records")

    # --- /admin shows what is waiting, and sends it again
    c = admin()
    base = "https://localhost"
    items = {i["id"]: i for i in c.get("/api/admin/items", base_url=base).get_json()["items"]}
    assert items[down]["telegram"] == "failed" and items[limited]["telegram"] == "sent"
    assert items[failed]["telegram"] == "failed"
    assert c.post("/api/admin/telegram/resend", base_url=base).status_code == 403, "needs the admin header"
    assert client().post("/api/admin/telegram/resend", headers=ADMIN).status_code == 401, "needs sign-in"

    sent.clear()
    r = c.post("/api/admin/telegram/resend", headers=ADMIN, base_url=base)
    assert r.status_code == 200 and r.get_json()["sending"] == 2, r.get_json()
    wait_until_done("feedback", down)
    for _ in range(200):
        if len(sent) == 2 and record_of("feedback", failed)["telegram"]["status"] == "sent" \
                and record_of("feedback", down)["telegram"]["status"] == "sent":
            break
        time.sleep(0.02)
    assert record_of("feedback", down)["telegram"]["status"] == "sent"
    assert record_of("feedback", failed)["telegram"]["status"] == "sent"
    joined = " ".join(s["form"]["text"] for s in sent)
    assert "while down" in joined and "keep me" in joined and len(sent) == 2, joined
    # The first record, saved before Telegram was set up, was left alone
    assert "telegram" not in record_of("feedback", before_setup)

    sent.clear()
    assert tg.deliver("feedback", down) == "sent" and not sent, "must never be sent twice"
    print("PASS  /admin lists failures and sends them again, once; older records stay put")

    # --- Sending must not undo a status set on /admin, and a deleted record is not an error
    fid = send_feedback()
    wait_until_done("feedback", fid)
    assert c.patch(f"/api/admin/items/feedback/{fid}", json={"status": "done"}, headers=ADMIN, base_url=base).status_code == 200
    record = record_of("feedback", fid)
    assert record["status"] == "done" and record["telegram"]["status"] == "sent"
    gone = send_feedback()
    wait_until_done("feedback", gone)
    assert c.delete(f"/api/admin/items/feedback/{gone}", headers=ADMIN, base_url=base).status_code == 200
    assert tg.deliver("feedback", gone) == "failed"     # nothing to send, and no crash
    print("PASS  works together with /admin")

    server.shutdown()
    return 0


if __name__ == "__main__":
    sys.exit(run())
