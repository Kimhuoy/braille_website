"""
Feedback storage, the admin inbox and the website's protections, through real HTTP requests
to the Flask app (no network).

Run:  python -I -X utf8 Backend/tests/test_security.py      (from the repo root)
"""
import time
import io
import json
import os
import sys
import tempfile
import zipfile

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))

PASSWORD = "correct horse battery"
PUBLIC_IP = "93.184.216.7"
_tmp = tempfile.TemporaryDirectory()
os.environ.update(
    ADMIN_PASSWORD=PASSWORD,
    FEEDBACK_DIR=os.path.join(_tmp.name, "feedback"),
    CONTRIBUTIONS_DIR=os.path.join(_tmp.name, "contributions"),
    RATE_LIMIT_DB=os.path.join(_tmp.name, "limits.sqlite3"),
    TRUSTED_PROXY_HOPS="1",
)
os.environ.pop("FORMS_BACKEND", None)

import contributions  # noqa: E402
import feedback  # noqa: E402
import FileFormat  # noqa: E402
import main  # noqa: E402
import security  # noqa: E402
import temp_files  # noqa: E402

_temp_work = os.path.join(_tmp.name, "temp-files")     # starts empty, so anything left is a bug
os.makedirs(_temp_work)
temp_files.folder = lambda: _temp_work

ADMIN = {"X-Requested-With": "braille-admin"}
counter = [0]


def client():
    return main.app.test_client()


def admin_client():
    c = client()
    assert c.post("/api/admin/login", json={"password": PASSWORD}, headers=ADMIN, base_url="https://localhost").status_code == 200
    return c


def https(c, method, path, **kw):
    return getattr(c, method)(path, base_url="https://localhost", **kw)


def visitor():
    """Each call is a different address behind the proxy, so tests do not share rate limits."""
    counter[0] += 1
    return {"X-Forwarded-For": f"93.184.217.{counter[0]}"}


def contribution(**fields):
    form = {"consent": "true", "entries": json.dumps([{"text": "គ", "braille": ",g"}]), **fields}
    return client().post("/api/contribute", data=form, content_type="multipart/form-data", headers=visitor())


def run():
    # --- Off by default: public routes that store things are closed until someone looks after them
    for method, path in (("post", "/api/feedback"), ("post", "/api/contribute"), ("get", "/api/admin/session"),
                         ("post", "/api/admin/login"), ("get", "/api/admin/items"), ("get", "/api/admin/export")):
        r = getattr(client(), method)(path, json={"message": "x"} if method == "post" else None, headers=ADMIN)
        assert r.status_code == 404, (path, r.status_code)
    assert not os.path.exists(feedback.feedback_dir()) and not os.path.exists(contributions.contributions_dir())
    assert client().post("/text", json={"text": "ក"}).status_code == 200, "the translator is not affected"
    assert client().get("/health").status_code == 200
    os.environ["FORMS_BACKEND"] = "on"
    print("PASS  forms backend and /admin are off unless FORMS_BACKEND=on; the translator still works")

    # --- Feedback needs only a message; no email, name or organization
    r = client().post("/api/feedback", json={"message": "Great site"}, headers=visitor())
    assert r.status_code == 201, r.get_json()
    anon_id = r.get_json()["id"]
    record = contributions.load_json(os.path.join(feedback.feedback_dir(), anon_id, "feedback.json"))
    assert record["category"] == "other" and record["status"] == "new" and record["contact"] == ""
    assert "email" not in record
    r = client().post("/api/feedback", json={"message": "  "}, headers=visitor())
    assert r.status_code == 400 and r.get_json()["error"] == "missing_message"
    for not_an_object in ([], ["message"], "text", 5):
        assert client().post("/api/feedback", json=not_an_object, headers=visitor()).status_code == 400
    r = client().post("/api/feedback", json={"message": ["not text"], "name": {"a": 1}}, headers=visitor())
    assert r.status_code == 400, "wrong types must not cause a 500"
    r = client().post("/api/feedback", json={"message": "hi", "contact": "Telegram @dara", "name": "Dara",
                                             "category": "problem", "sample_text": "ក"}, headers=visitor())
    fb_id = r.get_json()["id"]
    print("PASS  feedback: message only, wrong data types refused")

    # --- Spam trap: looks like success, nothing is stored
    before = len(os.listdir(feedback.feedback_dir()))
    r = client().post("/api/feedback", json={"message": "buy now", "website": "http://spam"}, headers=visitor())
    assert r.status_code == 201 and len(os.listdir(feedback.feedback_dir())) == before
    print("PASS  spam trap")

    # --- Contribution: consent is the only required field; contact details are all optional
    r = contribution()
    assert r.status_code == 201, r.get_json()
    sub_id = r.get_json()["id"]
    assert contributions.load_submission(sub_id)["contributor"] == {"name": "", "organization": "", "contact": ""}
    assert contribution(consent="").get_json()["error"] == "no_consent"
    assert contribution(entries='{"not": "a list"}').status_code == 400
    assert contribution(entries='[5]').get_json()["error"] == "invalid_entries"
    assert contribution(file_categories='"x"').status_code == 400
    print("PASS  contribution: nothing personal required, bad JSON refused")

    # --- Uploaded files must really be what their name says
    def send_file(name, data):
        return client().post("/api/contribute", data={"consent": "true", "files": (io.BytesIO(data), name)},
                             content_type="multipart/form-data", headers=visitor())
    assert send_file("lesson.docx", b"MZ\x90\x00 a program").get_json()["error"] == "file_type"
    assert send_file("lesson.pdf", b"MZ\x90\x00 a program").get_json()["error"] == "file_type"
    assert send_file("photo.png", b"<svg onload=alert(1)>").get_json()["error"] == "file_type"
    assert send_file("notes.txt", b"MZ\x00\x00\x00binary").get_json()["error"] == "file_type"
    assert send_file("archive.zip", b"PK\x03\x04").get_json()["error"] == "file_type"
    assert send_file("run.exe", b"MZ").get_json()["error"] == "file_type"
    assert send_file("a.pdf", b"%PDF-1.7 ...").status_code == 201
    r = send_file("../../etc/ខ្មែរ\x07lesson.txt", "ក".encode())
    assert r.status_code == 201
    stored = contributions.load_submission(r.get_json()["id"])["files"][0]
    assert "\x07" not in stored["original_name"] and "/" not in stored["original_name"], stored
    assert ".." not in stored["stored_as"], stored
    print("PASS  uploads: disguised programs refused, file names made safe")

    # --- Admin: closed until signed in
    c = client()
    for method, path in (("get", "/api/admin/items"), ("get", f"/api/admin/items/feedback/{fb_id}"),
                         ("get", "/api/admin/export"), ("get", f"/api/admin/items/contribution/{sub_id}/download")):
        assert getattr(c, method)(path).status_code == 401, path
    for method, path in (("patch", f"/api/admin/items/feedback/{fb_id}"), ("delete", f"/api/admin/items/feedback/{fb_id}")):
        assert getattr(c, method)(path, headers=ADMIN).status_code == 401, path
    assert c.get("/api/admin/session").get_json() == {"configured": True, "logged_in": False}
    r = c.post("/api/admin/login", json={"password": "wrong password here"}, headers=ADMIN)
    assert r.status_code == 401 and "set-cookie" not in {k.lower() for k in r.headers.keys()}
    assert c.post("/api/admin/login", json={"password": ["x"]}, headers=ADMIN).status_code == 401
    # Another website's form cannot add the header
    assert c.post("/api/admin/login", json={"password": PASSWORD}).status_code == 403
    print("PASS  admin: closed without the password; cross-site requests refused")

    # --- The cookie
    c = client()
    r = https(c, "post", "/api/admin/login", json={"password": PASSWORD}, headers=ADMIN)
    cookie = r.headers["Set-Cookie"]
    for part in ("__Host-braille-admin=", "Secure", "HttpOnly", "SameSite=Strict", "Path=/"):
        assert part in cookie, cookie
    assert "Domain" not in cookie, cookie
    print("PASS  admin cookie: Secure, HttpOnly, SameSite=Strict, this host only")

    # --- Inbox
    r = https(c, "get", "/api/admin/items")
    assert r.status_code == 200 and r.headers["Cache-Control"] == "no-store"
    data = r.get_json()
    summary = {i["id"]: i for i in data["items"]}
    assert summary[fb_id]["contact"] == "Telegram @dara" and summary[fb_id]["title"] == "hi"
    assert summary[sub_id]["rows"] == 1
    assert [i["id"] for i in data["items"]] == sorted(summary, reverse=True)
    assert set(data["system"]) == {"persistent", "free_gb", "clients_hidden"}
    assert summary[fb_id]["telegram"] == ""
    assert https(c, "get", f"/api/admin/items/feedback/{fb_id}").get_json()["message"] == "hi"
    print("PASS  admin inbox lists both kinds")

    # --- Status
    path = f"/api/admin/items/feedback/{fb_id}"
    assert https(c, "patch", path, json={"status": "done"}, headers=ADMIN).status_code == 200
    assert https(c, "get", path).get_json()["status"] == "done"
    for bad in ("../x", "merged", 5, ["new"]):
        assert https(c, "patch", path, json={"status": bad}, headers=ADMIN).status_code == 400
    print("PASS  status changes, bad values refused")

    # --- Records from before this version (email / phone, no status) still work
    old_id = "20261031-170538-93537f"
    os.makedirs(os.path.join(feedback.feedback_dir(), old_id))
    contributions.write_json(os.path.join(feedback.feedback_dir(), old_id, "feedback.json"), {
        "id": old_id, "received_at": "2026-10-31T17:05:38+00:00", "category": "other", "message": "old",
        "sample_text": "", "name": "", "email": "old@example.org", "interface_lang": "en"})
    old = https(c, "get", f"/api/admin/items/feedback/{old_id}").get_json()
    assert old["status"] == "new" and old["people"]["contact"] == "old@example.org"
    print("PASS  older records still open")

    # --- Paths from the address bar cannot leave the records folder
    for bad in ("..", "..%2f..%2fetc", "20261031-170538-93537f%2f..", "x", "20261031-170538-93537F"):
        r = https(c, "get", f"/api/admin/items/feedback/{bad}")
        assert r.status_code == 404, (bad, r.status_code)
    assert https(c, "get", f"/api/admin/items/secrets/{fb_id}").status_code == 404
    assert https(c, "delete", "/api/admin/items/feedback/..", headers=ADMIN).status_code in (404, 405)
    print("PASS  path traversal refused")

    # --- Downloads are never shown inline
    r = client().post("/api/contribute", data={"consent": "true", "files": (io.BytesIO(b"<script>alert(1)</script>"), "x.txt")},
                      content_type="multipart/form-data", headers=visitor())
    with_file = r.get_json()["id"]
    r = https(c, "get", f"/api/admin/items/contribution/{with_file}/files/0")
    assert r.status_code == 200 and r.mimetype == "application/octet-stream"
    assert r.headers["Content-Disposition"].startswith("attachment"), r.headers["Content-Disposition"]
    assert r.headers["X-Content-Type-Options"] == "nosniff"
    r.close()
    assert https(c, "get", f"/api/admin/items/contribution/{with_file}/files/9").status_code == 404
    r = https(c, "get", f"/api/admin/items/contribution/{with_file}/download")
    with zipfile.ZipFile(io.BytesIO(r.data)) as archive:
        assert f"{with_file}/submission.json" in [n.replace("\\", "/") for n in archive.namelist()]
    r.close()
    r = https(c, "get", "/api/admin/export")
    with zipfile.ZipFile(io.BytesIO(r.data)) as archive:
        names = [n.replace("\\", "/") for n in archive.namelist()]
    assert f"feedback/{fb_id}/feedback.json" in names and f"contribution/{sub_id}/submission.json" in names
    r.close()
    print("PASS  downloads: attachment only; contribution and full export zips")

    # --- Delete, sign out
    assert https(c, "delete", f"/api/admin/items/feedback/{anon_id}", headers=ADMIN).status_code == 200
    assert not os.path.exists(os.path.join(feedback.feedback_dir(), anon_id))
    assert https(c, "get", f"/api/admin/items/feedback/{anon_id}").status_code == 404
    assert https(c, "post", "/api/admin/logout", headers=ADMIN).status_code == 200
    assert https(c, "get", "/api/admin/items").status_code == 401
    print("PASS  delete and sign out")

    # --- Too short a password leaves the admin closed; everything else keeps working
    os.environ["ADMIN_PASSWORD"] = "short"
    assert client().get("/api/admin/session").get_json() == {"configured": False, "logged_in": False}
    r = client().post("/api/admin/login", json={"password": "short"}, headers=ADMIN)
    assert r.status_code == 503 and r.get_json()["error"] == "not_configured"
    os.environ["ADMIN_PASSWORD"] = ""
    assert client().post("/api/admin/login", json={"password": ""}, headers=ADMIN).status_code == 503
    os.environ["ADMIN_PASSWORD"] = PASSWORD
    print("PASS  admin stays closed without a long enough password")

    # --- Rate limits
    # Login: 10 tries per address per 15 minutes. Different addresses are counted apart.
    guess = {"X-Forwarded-For": PUBLIC_IP}
    codes = [client().post("/api/admin/login", json={"password": "wrong wrong wrong"}, headers={**ADMIN, **guess}).status_code
             for _ in range(11)]
    assert codes == [401] * 10 + [429], codes
    r = client().post("/api/admin/login", json={"password": PASSWORD}, headers={**ADMIN, **guess})
    assert r.status_code == 429 and int(r.headers["Retry-After"]) > 0 and r.get_json()["error"] == "rate_limited"
    other = {"X-Forwarded-For": "93.184.216.8"}
    assert client().post("/api/admin/login", json={"password": PASSWORD}, headers={**ADMIN, **other}).status_code == 200
    # Only the last address counts: the proxy adds the true one, a client can only add to the front
    spoof = {"X-Forwarded-For": f"1.2.3.4, {PUBLIC_IP}"}
    assert client().post("/api/admin/login", json={"password": PASSWORD}, headers={**ADMIN, **spoof}).status_code == 429
    # Feedback: 10 per hour
    flood = {"X-Forwarded-For": "93.184.216.9"}
    codes = [client().post("/api/feedback", json={"message": "x"}, headers=flood).status_code for _ in range(11)]
    assert codes == [201] * 10 + [429], codes
    # Long texts use up the translator's limit faster than typing
    heavy = {"X-Forwarded-For": "93.184.216.10"}
    big = {"text": "a" * 200_000}
    assert security.over_limit("handleTextToBraille:93.184.216.10", 600, 60, 598) == 0
    assert client().post("/text", json=big, headers=heavy).status_code == 429
    # This computer is not limited (development), and a broken counter file must not stop the website
    assert client().post("/text", json={"text": "ក"}).status_code == 200
    saved = os.environ["RATE_LIMIT_DB"]
    os.environ["RATE_LIMIT_DB"] = os.path.join(_tmp.name, "missing-folder", "x.sqlite3")
    assert security.over_limit("x", 1, 60, 99) == 0
    os.environ["RATE_LIMIT_DB"] = saved
    # A proxy that hides visitors: they share one, wider, counter
    assert security.RATE_LIMITS["submit_feedback"][0] * security.HIDDEN_CLIENTS_FACTOR == 100
    hidden = {"X-Forwarded-For": "10.0.0.2"}
    assert client().post("/api/feedback", json={"message": "x"}, headers=hidden).status_code == 201
    r = https(admin_client(), "get", "/api/admin/items", headers=hidden)
    assert r.get_json()["system"]["clients_hidden"] is True
    print("PASS  rate limits: per address, not spoofable, weighted, safe when the counter fails")

    # --- Size limits
    r = client().post("/api/feedback", data=b"x" * (70 * 1024), content_type="application/json", headers=visitor())
    assert r.status_code == 413 and r.get_json()["error"] == "too_large", r.status_code
    r = client().post("/text", data=b"x" * (4 * 2**20 + 1), content_type="application/json", headers=visitor())
    assert r.status_code == 413
    r = client().post("/gcode", json={"braille": "⠛" * (main.MAX_GCODE_CHARS + 1)}, headers=visitor())
    assert r.status_code == 413
    rows = [{"text": "ក", "braille": "g", "source": "ខ" * 400}] * contributions.MAX_ENTRIES
    assert contribution(entries=json.dumps(rows, ensure_ascii=False)).status_code == 201, "500 rows must still fit"
    print("PASS  request size limits; a full 500-row contribution still fits")

    # --- Disk nearly full: refused with a clear code, the site itself keeps working
    contributions.MIN_FREE_BYTES = 2**62
    assert client().post("/api/feedback", json={"message": "x"}, headers=visitor()).get_json()["error"] == "storage_full"
    assert contribution().get_json()["error"] == "storage_full"
    contributions.MIN_FREE_BYTES = 1024**3
    print("PASS  full disk refused cleanly")

    # --- Security headers on pages and API
    r = client().post("/text", json={"text": "ក"})
    for name in ("Content-Security-Policy", "X-Content-Type-Options", "X-Frame-Options", "Referrer-Policy", "Permissions-Policy"):
        assert name in r.headers, name
    csp = r.headers["Content-Security-Policy"]
    assert "script-src 'self'" in csp and "unsafe-eval" not in csp and "frame-ancestors 'none'" in csp
    assert "Strict-Transport-Security" not in r.headers, "HSTS only over HTTPS"
    r = client().post("/text", json={"text": "ក"}, headers={"X-Forwarded-Proto": "https"})
    assert r.headers["Strict-Transport-Security"] == security.HSTS and "includeSubDomains" not in security.HSTS
    print("PASS  security headers; HSTS only over HTTPS and not on other subdomains")

    # --- CORS: the public website is same-origin, so strangers get no permission
    evil = {"Origin": "https://evil.example"}
    assert "Access-Control-Allow-Origin" not in client().post("/text", json={"text": "ក"}, headers=evil).headers
    dev = {"Origin": "http://localhost:5173"}
    assert client().post("/text", json={"text": "ក"}, headers=dev).headers["Access-Control-Allow-Origin"] == dev["Origin"]
    for path in ("/api/admin/session", "/api/admin/items"):
        assert "Access-Control-Allow-Origin" not in client().get(path, headers=dev).headers, path
    print("PASS  CORS closed to other websites and always closed on /api/admin")

    # --- Errors tell the visitor nothing about the server
    original = main.translate_braille
    main.translate_braille = lambda *_: 1 / 0
    r = client().post("/braille", json={"braille": "⠛"})
    assert r.status_code == 500 and "division" not in r.get_data(as_text=True), r.get_data(as_text=True)
    main.translate_braille = original
    assert client().post("/braille", json={"braille": 5}).status_code == 400
    assert client().post("/text", json={"text": 5}).status_code == 400
    print("PASS  errors hide internal details")

    # --- /api/... is never answered with the website's HTML page
    assert client().get("/api/nothing").status_code == 404
    assert client().get("/api/contribute").status_code == 404
    assert client().post("/api/contribute/check", json={}).status_code in (404, 405)
    assert client().get("/../main.py").status_code != 500
    r = client().get("/admin")
    assert r.headers["X-Robots-Tag"] == "noindex"
    print("PASS  unknown API paths and search engines")

    # --- Nothing a visitor uploads or downloads stays on the server
    def nothing_left(what):
        left = os.listdir(temp_files.folder())
        assert not left, f"{what} left {left} on the server"

    r = client().post("/gcode", json={"braille": "⠛⠅"}, headers=visitor())
    assert r.status_code == 200 and r.data
    r.close()
    nothing_left("G-code download")
    r = client().post("/gcode", json={"braille": "⠛⠅"}, headers=visitor())
    assert r.status_code == 200
    r.close()       # the visitor cancelled: nothing was read
    nothing_left("cancelled G-code download")

    def upload(route, name, data):
        return client().post(route, data={"file": (io.BytesIO(data), name)},
                             content_type="multipart/form-data", headers=visitor())
    assert upload("/updateTextFile", "lesson.txt", "សួស្តី".encode()).status_code == 200
    nothing_left("text upload")
    assert upload("/updatebraille", "lesson.brf", b",hello").status_code == 200
    nothing_left("Braille upload")
    assert upload("/updateTextFile", "broken.docx", b"not a document").status_code == 400
    nothing_left("unreadable upload")
    assert upload("/updateTextFile", "broken.pdf", b"not a document").status_code == 400
    nothing_left("unreadable PDF")

    c = admin_client()
    r = https(c, "get", f"/api/admin/items/contribution/{with_file}/download")
    assert r.status_code == 200 and r.data
    r.close()
    r = https(c, "get", "/api/admin/export")
    assert r.status_code == 200 and r.data
    r.close()
    nothing_left("zip download")
    print("PASS  uploads and downloads leave nothing behind, also when cancelled or refused")

    # A worker killed mid-request cannot clean up: the next request does, once the file is old
    abandoned = temp_files.new_path(".gcode")
    open(abandoned, "w").close()
    abandoned_folder = temp_files.new_folder()
    temp_files.sweep()
    assert os.path.exists(abandoned), "a recent file may still be in use"
    later = time.time() + temp_files.MAX_AGE_SECONDS + 1
    temp_files.sweep(now=later)
    assert not os.path.exists(abandoned) and not os.path.exists(abandoned_folder.name)
    nothing_left("sweep")
    print("PASS  files left by a killed worker are removed")

    # Team records are not temporary: downloading one must not delete it
    r = https(c, "get", f"/api/admin/items/contribution/{with_file}/files/0")
    assert r.data == b"<script>alert(1)</script>"
    r.close()
    r = https(c, "get", f"/api/admin/items/contribution/{with_file}/files/0")
    assert r.status_code == 200, "a contributed file must survive being downloaded"
    r.close()
    print("PASS  contributed files stay after the team downloads them")

    # --- Malicious documents
    def read(name, data, **kw):
        from werkzeug.datastructures import FileStorage
        try:
            FileFormat.read_upload(FileStorage(io.BytesIO(data), filename=name), **kw)
        except FileFormat.UploadError as error:
            return str(error)
        return None

    laughs = ('<?xml version="1.0"?><!DOCTYPE lolz [<!ENTITY a "aaaaaaaaaa"><!ENTITY b "&a;&a;&a;">]>'
              '<pef><row>&b;</row></pef>')
    assert read("x.pef", laughs.encode(), braille=True) == "unreadable"
    assert read("x.pef", laughs.replace('"1.0"?', '"1.0" encoding="UTF-16"?').encode("utf-16"), braille=True) == "unreadable"
    bomb = io.BytesIO()
    with zipfile.ZipFile(bomb, "w", zipfile.ZIP_DEFLATED) as z:
        z.writestr("word/document.xml", b"\0" * (FileFormat.MAX_DOCX_UNPACKED_MB * 2**20 + 1))
    assert len(bomb.getvalue()) < 2 * 2**20
    assert read("bomb.docx", bomb.getvalue()) == "unreadable"
    import fitz
    pdf = fitz.open()
    pdf.new_page(width=14400, height=14400)
    assert read("huge-scan.pdf", pdf.tobytes()) == "pdf_failed"
    print("PASS  XML entity attack, zip bomb and giant PDF page refused")

    return 0


if __name__ == "__main__":
    sys.exit(run())
