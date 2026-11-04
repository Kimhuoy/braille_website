"""
Resources that institutes share through the website's "Contribute" page.

Each submission is saved as one folder (see Backend/docs/contributions.md):
    <CONTRIBUTIONS_DIR>/<id>/submission.json
    <CONTRIBUTIONS_DIR>/<id>/files/...

Entry types:
  character -> khmer_to_english_dictionary.json   (Khmer character -> Braille ASCII)
  symbol    -> math_symbols.json                  (math / science symbol)
  example   -> tests/contributed_examples.json    (word or sentence + its correct
                                                   Braille, used to check the translator)

Review and merge from the repo root:
    python Backend/contributions.py list
    python Backend/contributions.py show <id>
    python Backend/contributions.py merge <id> [--rows 1,3] [--dry-run]
"""
import argparse
import json
import os
import re
import secrets
import shutil
import sys
import tempfile
from datetime import datetime, timezone

from werkzeug.utils import secure_filename

_DIR = os.path.dirname(os.path.abspath(__file__))
KHMER_DICT_PATH = os.path.join(_DIR, "khmer_to_english_dictionary.json")
MATH_SYMBOLS_PATH = os.path.join(_DIR, "math_symbols.json")
ASCII_DICT_PATH = os.path.join(_DIR, "english_to_braille_dictionary.json")
EXAMPLES_PATH = os.path.join(_DIR, "tests", "contributed_examples.json")

ENTRY_TYPES = ("character", "symbol", "example")
SYMBOL_KINDS = ("op", "rel", "reset", "shape", "sup")   # see math_symbols.json "_about"
FILE_CATEGORIES = ("original", "braille", "handbook", "other")
ALLOWED_EXTENSIONS = {
    ".pdf", ".docx", ".doc", ".odt", ".rtf", ".txt", ".brf", ".brl",
    ".csv", ".xlsx", ".xls", ".json", ".png", ".jpg", ".jpeg",
}
# What the first bytes of each file type must be, so a program renamed to
# lesson.docx is refused. The other types are text or PDF: see _content_matches.
_ZIP, _OLE, _RTF = b"PK\x03\x04", b"\xd0\xcf\x11\xe0", b"{\\rtf"
FILE_SIGNATURES = {
    ".docx": (_ZIP,), ".xlsx": (_ZIP,), ".odt": (_ZIP,),
    ".doc": (_OLE, _RTF), ".xls": (_OLE,), ".rtf": (_RTF,),
    ".png": (b"\x89PNG\r\n\x1a\n",), ".jpg": (b"\xff\xd8\xff",), ".jpeg": (b"\xff\xd8\xff",),
}

MAX_ENTRIES = 500
MAX_FILES = 10
MAX_FILE_BYTES = 20 * 1024 * 1024
MAX_REQUEST_BYTES = 100 * 1024 * 1024    # same as security.MAX_CONTRIBUTION_BYTES
MAX_FIELD_CHARS = 2000
MIN_FREE_BYTES = 1024 * 1024 * 1024      # stop accepting records before the server's disk is full


def contributions_dir():
    # On the server this must point at a mounted volume, or submissions are
    # lost when the container is replaced on the next deploy.
    return os.environ.get("CONTRIBUTIONS_DIR") or os.path.join(_DIR, "contributions")


def load_json(path):
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def write_json(path, data):
    """Replace the file in one step, so a crash or a second writer cannot leave half a record."""
    handle, temporary = tempfile.mkstemp(dir=os.path.dirname(path), suffix=".tmp")
    try:
        with os.fdopen(handle, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        os.replace(temporary, path)
    except BaseException:
        if os.path.exists(temporary):
            os.unlink(temporary)
        raise


# ---------------------------------------------------------------------------
# Braille ASCII <-> 6-dot cells (same 64 cells as english_to_braille_dictionary.json)

_BRAILLE_ASCII_KEYS = " abcdefghijklmnopqrstuvwxyz0123456789!\"#$%&'()*+,-./:;<=>?@[\\]^_"
# Extra keys that SimBraille shows as an existing cell (same as Frontend/src/data/braille-ascii.js)
_ALIASES = {"`": "@", "{": "[", "}": "]", "|": "\\", "~": "^"}

_ascii_dict = load_json(ASCII_DICT_PATH)
ASCII_TO_CELL = {k: _ascii_dict[k] for k in _BRAILLE_ASCII_KEYS}
CELL_TO_ASCII = {cell: k for k, cell in ASCII_TO_CELL.items()}
CELL_TO_ASCII["⠀"] = " "   # blank cell


def normalize_braille(text):
    """
    Accept Braille typed as Braille ASCII (SimBraille keys, any case) or as
    Unicode Braille dots, or a mix. Returns (ascii, cells, bad_chars).
    """
    ascii_out, bad = [], []
    for ch in (text or "").strip():
        low = ch.lower()
        if ch.isspace():
            ascii_out.append(" ")
        elif low in ASCII_TO_CELL:
            ascii_out.append(low)
        elif low in _ALIASES:
            ascii_out.append(_ALIASES[low])
        elif ch in CELL_TO_ASCII:
            ascii_out.append(CELL_TO_ASCII[ch])
        else:
            bad.append(ch)          # 8-dot cells, Khmer letters, other symbols
    ascii_code = "".join(ascii_out)
    cells = "".join(ASCII_TO_CELL[a] for a in ascii_code)
    return ascii_code, cells, sorted(set(bad))


def _squash(ascii_code):
    return ascii_code.replace(" ", "")


# ---------------------------------------------------------------------------
# Checking entries against what the system already knows

def guess_type(text):
    """
    Type of a row sent without one. The website form only asks for the Khmer
    text (or sign) and its Braille; the team can change the type when reviewing.
      character - Khmer with at most one consonant: ក, ា, ុំ, អា
      symbol    - a short sign that is not Khmer: =, ≈, ♂
      example   - anything else: words and sentences
    """
    text = (text or "").strip()
    if any("ក" <= ch <= "៿" for ch in text):
        consonants = sum("ក" <= ch <= "អ" for ch in text)
        return "character" if consonants <= 1 and " " not in text else "example"
    if len(text) <= 3 and " " not in text and not text.isalnum():
        return "symbol"
    return "example"


def load_tables():
    return load_json(KHMER_DICT_PATH), load_json(MATH_SYMBOLS_PATH)["symbols"]


def check_entry(entry, khmer_dict, math_symbols, translate=None):
    """
    Status of one entry:
      invalid    - missing type/text/Braille, or Braille has characters that are not Braille
      new        - not in our dictionary yet
      same       - already in our dictionary with the same Braille
      different  - in our dictionary with different Braille ("current" shows ours)
      matches / differs - (examples) whether today's translator already gives this Braille
    """
    etype = entry.get("type")
    text = (entry.get("text") or "").strip()
    if etype not in ENTRY_TYPES:
        return {"status": "invalid", "reason": "type"}
    if not text:
        return {"status": "invalid", "reason": "text"}

    ascii_code, cells, bad = normalize_braille(entry.get("braille"))
    if bad:
        return {"status": "invalid", "reason": "braille_chars", "bad": bad}
    if not _squash(ascii_code):
        return {"status": "invalid", "reason": "braille"}

    result = {"braille_ascii": ascii_code, "braille_cells": cells}

    if etype == "example":
        if translate is None:
            result["status"] = "new"
            return result
        current_ascii = normalize_braille(translate(text))[0]
        result["status"] = "matches" if _squash(current_ascii) == _squash(ascii_code) else "differs"
        result["current_cells"] = "".join(ASCII_TO_CELL[a] for a in current_ascii)
        return result

    if etype == "character":
        existing = khmer_dict.get(text)
        if len(text) > 1:
            # khmer_to_braille() looks Khmer up one character at a time (plus a
            # few vowel combinations), so a longer key would never be used.
            result["warning"] = "multi_char"
    else:
        existing = math_symbols.get(text, {}).get("code")

    if existing is None:
        result["status"] = "new"
    elif _squash(normalize_braille(existing)[0]) == _squash(ascii_code):
        result["status"] = "same"
    else:
        result["status"] = "different"
        result["current_ascii"] = existing
        result["current_cells"] = normalize_braille(existing)[1]
    return result


# ---------------------------------------------------------------------------
# Saving a submission (called by main.py's /contribute route)

class ContributionError(ValueError):
    """Error code (and details) the website shows in the user's language."""

    def __init__(self, code, **details):
        super().__init__(code)
        self.code = code
        self.details = details


def new_submission_id():
    return datetime.now(timezone.utc).strftime("%Y%m%d-%H%M%S") + "-" + secrets.token_hex(3)


def clean_text(value, limit=MAX_FIELD_CHARS):
    """A text field from the public website; anything that is not text counts as empty."""
    return value.strip()[:limit] if isinstance(value, str) else ""


def ensure_free_space(path):
    """Refuse new records when the disk is nearly full, so the website itself keeps running."""
    path = os.path.abspath(path)
    while not os.path.exists(path) and os.path.dirname(path) != path:
        path = os.path.dirname(path)
    if shutil.disk_usage(path).free < MIN_FREE_BYTES:
        raise ContributionError("storage_full")


def _content_matches(ext, upload):
    """Do the file's first bytes fit its extension? Never trust the name alone."""
    head = upload.stream.read(1024)
    upload.stream.seek(0)
    if ext == ".pdf":
        return b"%PDF-" in head
    if ext in FILE_SIGNATURES:
        return head.startswith(FILE_SIGNATURES[ext])
    # .txt .brf .brl .csv .json: text has no NUL bytes, except UTF-16 (which starts with a BOM)
    return head.startswith((b"\xff\xfe", b"\xfe\xff")) or b"\x00" not in head


def _safe_original_name(name):
    """The contributor's file name, kept only to show it: no folders or control characters."""
    return re.sub(r"[\x00-\x1f\x7f/\\]", "_", name or "file")[:200]


def validate_submission(form, entries, uploads):
    """form: dict of text fields; entries: list of dicts; uploads: list of (FileStorage, category)."""
    # All optional. The name or institute is used to credit the contributor; contact is
    # however they would like to be reached, if they want a reply.
    contributor = {
        "name": clean_text(form.get("name"), 200),
        "organization": clean_text(form.get("organization"), 200),
        "contact": clean_text(form.get("contact"), 200),
    }
    if form.get("consent") != "true":
        raise ContributionError("no_consent")

    if not entries and not uploads:
        raise ContributionError("empty")
    if len(entries) > MAX_ENTRIES:
        raise ContributionError("too_many_entries", max=MAX_ENTRIES)
    if len(uploads) > MAX_FILES:
        raise ContributionError("too_many_files", max=MAX_FILES)
    for upload, _ in uploads:
        ext = os.path.splitext(upload.filename or "")[1].lower()
        if ext not in ALLOWED_EXTENSIONS or not _content_matches(ext, upload):
            raise ContributionError("file_type", file=_safe_original_name(upload.filename))

    khmer_dict, math_symbols = load_tables()
    clean_entries, bad_rows = [], []
    for row, raw in enumerate(entries, start=1):
        if not isinstance(raw, dict):
            bad_rows.append(row)
            continue
        text = clean_text(raw.get("text"), 500)
        entry = {
            "type": clean_text(raw.get("type"), 20) or guess_type(text),
            "text": text,
            "braille": clean_text(raw.get("braille"), 1000),
            "kind": clean_text(raw.get("kind"), 10) if raw.get("kind") in SYMBOL_KINDS else "",
            "meaning": clean_text(raw.get("meaning"), 500),
            "source": clean_text(raw.get("source"), 500),
        }
        check = check_entry(entry, khmer_dict, math_symbols)
        if check["status"] == "invalid":
            bad_rows.append(row)
        entry["braille_ascii"] = check.get("braille_ascii", "")
        entry["braille_cells"] = check.get("braille_cells", "")
        entry["status_when_received"] = check["status"]
        clean_entries.append(entry)
    if bad_rows:
        raise ContributionError("invalid_entries", rows=bad_rows)

    return contributor, clean_entries


def save_submission(form, entries, uploads, directory=None):
    """Validate and store one submission. Returns its id."""
    contributor, clean_entries = validate_submission(form, entries, uploads)
    root = directory or contributions_dir()
    ensure_free_space(root)

    sub_id = new_submission_id()
    folder = os.path.join(root, sub_id)
    files_dir = os.path.join(folder, "files")
    os.makedirs(files_dir)

    try:
        files = []
        for i, (upload, category) in enumerate(uploads, start=1):
            base, ext = os.path.splitext(upload.filename)
            category = category if category in FILE_CATEGORIES else "other"
            # secure_filename() drops Khmer letters, so the original name is kept in submission.json
            stored_as = f"{i:02d}-{category}-{secure_filename(base)[:80] or 'file'}{ext.lower()}"
            path = os.path.join(files_dir, stored_as)
            upload.save(path)
            size = os.path.getsize(path)
            if size > MAX_FILE_BYTES:
                raise ContributionError("file_too_large", file=_safe_original_name(upload.filename),
                                        max_mb=MAX_FILE_BYTES // 2**20)
            files.append({
                "original_name": _safe_original_name(upload.filename),
                "stored_as": f"files/{stored_as}",
                "category": category,
                "size": size,
            })

        submission = {
            "id": sub_id,
            "received_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
            "status": "new",
            "contributor": contributor,
            "interface_lang": clean_text(form.get("lang"), 5),
            "notes": clean_text(form.get("notes")),
            "consent": True,
            "entries": clean_entries,
            "files": files,
        }
        write_json(os.path.join(folder, "submission.json"), submission)
    except Exception:
        shutil.rmtree(folder, ignore_errors=True)
        raise
    return sub_id


# ---------------------------------------------------------------------------
# Merging reviewed entries into the system (command line, run by the team)

def append_khmer_entries(text, items):
    """
    Add (key, ascii) pairs at the end of khmer_to_english_dictionary.json's
    text. The file is hand-formatted (CRLF, \\u escapes), so it is edited as
    text instead of re-dumped, keeping the git diff to the new lines only.
    """
    newline = "\r\n" if "\r\n" in text else "\n"
    body = text.rstrip()
    tail = text[len(body):]
    if not body.endswith("}"):
        raise ValueError("khmer_to_english_dictionary.json does not end with }")
    head = body[:-1].rstrip()
    lines = [
        f"    {json.dumps(k, ensure_ascii=False)}: {json.dumps(v, ensure_ascii=False)}"
        for k, v in items
    ]
    sep = "" if head.endswith("{") else ","
    new_text = head + sep + newline + ("," + newline).join(lines) + newline + "}" + tail
    parsed = json.loads(new_text)
    assert all(parsed[k] == v for k, v in items), "merge check failed"
    return new_text


def _submission_path(sub_id, directory):
    return os.path.join(directory or contributions_dir(), sub_id, "submission.json")


def load_submission(sub_id, directory=None):
    return load_json(_submission_path(sub_id, directory))


def merge(sub_id, rows=None, dry_run=False, directory=None):
    sub = load_submission(sub_id, directory)
    who = sub["contributor"]
    org = who.get("organization") or who.get("name") or "an anonymous contributor"
    khmer_dict, math_symbols = load_tables()

    khmer_new, symbols_new, examples_new, merged_rows = [], {}, [], []
    for row, entry in enumerate(sub["entries"], start=1):
        if rows and row not in rows:
            continue
        check = check_entry(entry, khmer_dict, math_symbols)
        label = f"row {row:>3} {entry['type']:9} {entry['text']!r:14} {check.get('braille_ascii', '')!r}"
        status = check["status"]
        source = f"Contributed by {org} ({sub_id})" + (f": {entry['source']}" if entry.get("source") else "")

        if status == "invalid":
            print(f"SKIP  {label}  invalid ({check['reason']})")
        elif status == "same":
            print(f"SKIP  {label}  already in the dictionary")
        elif status == "different":
            print(f"CHECK {label}  ours is {check['current_ascii']!r} - decide and edit the file by hand")
        elif entry["type"] == "character":
            if entry["text"] in dict(khmer_new):
                print(f"SKIP  {label}  same character earlier in this submission")
                continue
            if check.get("warning") == "multi_char":
                print(f"CHECK {label}  several characters - the translator looks up one at a time, add by hand if a rule supports it")
                continue
            khmer_new.append((entry["text"], check["braille_ascii"]))
            merged_rows.append(row)
            print(f"ADD   {label}  -> khmer_to_english_dictionary.json")
        elif entry["type"] == "symbol":
            if entry.get("kind") not in SYMBOL_KINDS:
                print(f"CHECK {label}  needs a kind {SYMBOL_KINDS} - set \"kind\" in submission.json and merge again")
                continue
            symbols_new[entry["text"]] = {"code": check["braille_ascii"], "kind": entry["kind"], "source": source}
            merged_rows.append(row)
            print(f"ADD   {label}  -> math_symbols.json")
        else:
            examples_new.append({"text": entry["text"], "expected": check["braille_ascii"], "source": source})
            merged_rows.append(row)
            print(f"ADD   {label}  -> tests/contributed_examples.json")

    print(f"\n{len(merged_rows)} entr{'y' if len(merged_rows) == 1 else 'ies'} to add.")
    if dry_run or not merged_rows:
        if dry_run:
            print("Dry run: nothing written.")
        return merged_rows

    if khmer_new:
        with open(KHMER_DICT_PATH, encoding="utf-8", newline="") as f:
            text = f.read()
        with open(KHMER_DICT_PATH, "w", encoding="utf-8", newline="") as f:
            f.write(append_khmer_entries(text, khmer_new))
    if symbols_new:
        data = load_json(MATH_SYMBOLS_PATH)
        data["symbols"].update(symbols_new)
        with open(MATH_SYMBOLS_PATH, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
    if examples_new:
        examples = load_json(EXAMPLES_PATH) if os.path.exists(EXAMPLES_PATH) else []
        examples.extend(examples_new)
        with open(EXAMPLES_PATH, "w", encoding="utf-8") as f:
            json.dump(examples, f, ensure_ascii=False, indent=2)
            f.write("\n")

    sub.setdefault("merges", []).append({
        "at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "rows": merged_rows,
    })
    sub["status"] = "merged"
    write_json(_submission_path(sub_id, directory), sub)
    print("Written. Run the tests, review the git diff, then commit.")
    return merged_rows


def _cmd_list(args):
    root = args.dir or contributions_dir()
    if not os.path.isdir(root):
        print(f"No submissions in {root}")
        return
    for sub_id in sorted(os.listdir(root)):
        path = os.path.join(root, sub_id, "submission.json")
        if not os.path.isfile(path):
            continue
        sub = load_json(path)
        counts = {t: sum(e["type"] == t for e in sub["entries"]) for t in ENTRY_TYPES}
        who = sub["contributor"].get("organization") or sub["contributor"].get("name") or "-"
        print(f"{sub_id}  {sub['status']:7}  {who[:30]:30}  "
              f"chars={counts['character']} symbols={counts['symbol']} "
              f"examples={counts['example']} files={len(sub['files'])}")


def _cmd_show(args):
    sub = load_submission(args.id, args.dir)
    c = sub["contributor"]
    print(f"{sub['id']}  received {sub['received_at']}  status {sub['status']}")
    contact = c.get("contact") or " ".join(x for x in (c.get("email"), c.get("phone")) if x)
    print(f"From: {c.get('name') or '-'} - {c.get('organization') or '-'} - {contact or 'no contact'}")
    if sub["notes"]:
        print(f"Notes: {sub['notes']}")
    khmer_dict, math_symbols = load_tables()
    print("\nEntries (status against today's dictionaries):")
    for row, entry in enumerate(sub["entries"], start=1):
        check = check_entry(entry, khmer_dict, math_symbols)
        extra = f" (ours: {check['current_ascii']!r})" if check["status"] == "different" else ""
        print(f"  {row:>3} {entry['type']:9} {entry['text']!r:14} {entry['braille_ascii']!r:16} "
              f"{check['status']}{extra}  {entry['meaning']}  [{entry['source']}]")
    print("\nFiles:")
    for f in sub["files"]:
        print(f"  {f['category']:9} {f['original_name']}  -> {f['stored_as']}  ({f['size']:,} bytes)")


def _cmd_merge(args):
    rows = {int(r) for r in args.rows.split(",")} if args.rows else None
    merge(args.id, rows=rows, dry_run=args.dry_run, directory=args.dir)


def main(argv=None):
    parser = argparse.ArgumentParser(description="Review and merge contributed Braille resources.")
    parser.add_argument("--dir", help="submissions folder (default: CONTRIBUTIONS_DIR or Backend/contributions)")
    sub = parser.add_subparsers(dest="command", required=True)
    sub.add_parser("list", help="list submissions").set_defaults(func=_cmd_list)
    show = sub.add_parser("show", help="show one submission")
    show.add_argument("id")
    show.set_defaults(func=_cmd_show)
    m = sub.add_parser("merge", help="add a submission's new entries to the dictionaries")
    m.add_argument("id")
    m.add_argument("--rows", help="only these row numbers, e.g. 1,3,5")
    m.add_argument("--dry-run", action="store_true", help="print what would change, write nothing")
    m.set_defaults(func=_cmd_merge)
    args = parser.parse_args(argv)
    args.func(args)


if __name__ == "__main__":
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")   # Khmer in the Windows console
    main()
