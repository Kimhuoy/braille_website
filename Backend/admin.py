"""
The team's inbox for messages and contributions (the website's /admin page,
Frontend/src/Components/Home/admin-page.jsx).

There is one setting, ADMIN_PASSWORD, chosen by the team and kept on the server. It needs no
email, Microsoft or other organization account. Without it (or if it is shorter than
MIN_PASSWORD_LENGTH) the inbox stays closed and everything else on the website works as usual.
"""
import hashlib
import hmac
import logging
import os
import re
import shutil
import zipfile
from datetime import timedelta

from flask import Blueprint, jsonify, request, send_from_directory, session

import contributions
import security
import telegram_notify
import temp_files
from telegram_notify import KINDS

MIN_PASSWORD_LENGTH = 12
SESSION_HOURS = 8
CSRF_HEADER_VALUE = "braille-admin"
STATUSES = ("new", "read", "done")     # "merged" is set by contributions.py merge
ID_RE = re.compile(r"^\d{8}-\d{6}-[0-9a-f]{6}$")

bp = Blueprint("admin", __name__, url_prefix="/api/admin")


def _password():
    password = os.environ.get("ADMIN_PASSWORD", "")
    return password if len(password) >= MIN_PASSWORD_LENGTH else ""


def session_secret():
    """Sessions are signed with a key made from the password, so changing it signs everyone out."""
    return hashlib.pbkdf2_hmac("sha256", _password().encode(), b"braille-admin-session", 200_000)


def init_app(app):
    if os.environ.get("ADMIN_PASSWORD") and not _password():
        logging.error("ADMIN_PASSWORD is shorter than %d characters: the admin page stays closed", MIN_PASSWORD_LENGTH)
    app.secret_key = session_secret() if _password() else os.urandom(32)
    # __Host-: sent only to this exact host name over HTTPS, so no other subdomain can set or read it.
    app.config.update(
        SESSION_COOKIE_NAME="__Host-braille-admin",
        SESSION_COOKIE_SECURE=True,
        SESSION_COOKIE_HTTPONLY=True,
        SESSION_COOKIE_SAMESITE="Strict",
        SESSION_REFRESH_EACH_REQUEST=False,     # signed in for at most SESSION_HOURS
        PERMANENT_SESSION_LIFETIME=timedelta(hours=SESSION_HOURS),
    )
    app.register_blueprint(bp)


@bp.before_request
def _guard():
    if request.endpoint == "admin.status":
        return None
    if not _password():
        return jsonify({"error": "not_configured"}), 503
    # Other websites cannot add this header (CORS is closed here), so they cannot act as a signed-in admin.
    if request.method != "GET" and request.headers.get("X-Requested-With") != CSRF_HEADER_VALUE:
        return jsonify({"error": "forbidden"}), 403
    if request.endpoint != "admin.login" and not session.get("admin"):
        return jsonify({"error": "unauthorized"}), 401
    return None


@bp.get("/session")
def status():
    return jsonify({"configured": bool(_password()), "logged_in": bool(_password() and session.get("admin"))})


@bp.post("/login")
def login():
    data = request.get_json(silent=True)
    given = data.get("password") if isinstance(data, dict) else None
    if not isinstance(given, str) or not hmac.compare_digest(
            hashlib.sha256(given.encode()).digest(), hashlib.sha256(_password().encode()).digest()):
        logging.warning("Failed admin sign-in from %s", request.remote_addr)
        return jsonify({"error": "wrong_password"}), 401
    session.clear()
    session.permanent = True
    session["admin"] = True
    logging.info("Admin signed in from %s", request.remote_addr)
    return jsonify({"logged_in": True})


@bp.post("/logout")
def logout():
    session.clear()
    return jsonify({"logged_in": False})


# ---------------------------------------------------------------------------
# Records: one folder per message or contribution, written by feedback.py and contributions.py

def _read_record(kind, record_id):
    directory, record_file = KINDS[kind]
    return contributions.load_json(os.path.join(directory(), record_id, record_file))


def _found(kind, record_id):
    if kind not in KINDS or not ID_RE.match(record_id):
        return False
    directory, record_file = KINDS[kind]
    return os.path.isfile(os.path.join(directory(), record_id, record_file))


def _contact(record):
    """Records from before the contact field have email and phone."""
    return record.get("contact") or " ".join(x for x in (record.get("email"), record.get("phone")) if x)


def _people(kind, record):
    who = record if kind == "feedback" else record.get("contributor", {})
    return {"name": who.get("name", ""), "organization": who.get("organization", ""), "contact": _contact(who)}


def _summary(kind, record):
    if kind == "feedback":
        title = " ".join(record.get("message", "").split())[:100]
    else:
        title = ""
    return {
        "kind": kind,
        "id": record["id"],
        "received_at": record.get("received_at", ""),
        "status": record.get("status", "new"),
        "category": record.get("category", ""),
        "title": title,
        "rows": len(record.get("entries", [])),
        "files": len(record.get("files", [])),
        "telegram": record.get("telegram", {}).get("status", ""),
        **_people(kind, record),
    }


def _all_records():
    for kind, (directory, record_file) in KINDS.items():
        root = directory()
        if not os.path.isdir(root):
            continue
        for record_id in os.listdir(root):
            if ID_RE.match(record_id) and os.path.isfile(os.path.join(root, record_id, record_file)):
                yield kind, record_id


def _existing_parent(path):
    while not os.path.exists(path):
        parent = os.path.dirname(path)
        if parent == path:
            break
        path = parent
    return path


def _system():
    """Problems the team should see: records lost on redeploy, a full disk, hidden visitor addresses."""
    root = os.path.abspath(os.sep)
    folders = [_existing_parent(os.path.abspath(directory())) for directory, _ in KINDS.values()]
    return {
        "persistent": all(os.stat(f).st_dev != os.stat(root).st_dev for f in folders),
        "free_gb": round(min(shutil.disk_usage(f).free for f in folders) / 2**30, 1),
        "clients_hidden": security.client_address()[1],
    }


@bp.get("/items")
def items():
    records = []
    for kind, record_id in _all_records():
        try:
            records.append(_summary(kind, _read_record(kind, record_id)))
        except (OSError, ValueError, KeyError):
            logging.exception("Unreadable record %s", record_id)
    records.sort(key=lambda r: r["id"], reverse=True)   # ids start with the date and time
    return jsonify({"items": records, "system": _system()})


@bp.post("/telegram/resend")
def resend_to_telegram():
    """Try again for everything Telegram has not received yet (telegram_notify.py)."""
    if not telegram_notify.is_configured():
        return jsonify({"error": "telegram_not_configured"}), 400
    return jsonify({"sending": telegram_notify.resend_async()})


@bp.get("/items/<kind>/<record_id>")
def item(kind, record_id):
    if not _found(kind, record_id):
        return jsonify({"error": "not_found"}), 404
    record = _read_record(kind, record_id)
    return jsonify({**record, "kind": kind, "status": record.get("status", "new"), "people": _people(kind, record)})


@bp.patch("/items/<kind>/<record_id>")
def set_status(kind, record_id):
    if not _found(kind, record_id):
        return jsonify({"error": "not_found"}), 404
    data = request.get_json(silent=True)
    status_value = data.get("status") if isinstance(data, dict) else None
    if not isinstance(status_value, str) or status_value not in STATUSES:
        return jsonify({"error": "bad_request"}), 400
    directory, record_file = KINDS[kind]
    record = _read_record(kind, record_id)
    record["status"] = status_value
    contributions.write_json(os.path.join(directory(), record_id, record_file), record)
    return jsonify({"status": status_value})


@bp.delete("/items/<kind>/<record_id>")
def delete(kind, record_id):
    if not _found(kind, record_id):
        return jsonify({"error": "not_found"}), 404
    shutil.rmtree(os.path.join(KINDS[kind][0](), record_id))
    logging.info("Admin deleted %s %s", kind, record_id)
    return jsonify({"deleted": record_id})


@bp.get("/items/contribution/<record_id>/files/<int:number>")
def download_file(record_id, number):
    if not _found("contribution", record_id):
        return jsonify({"error": "not_found"}), 404
    files = _read_record("contribution", record_id).get("files", [])
    if number >= len(files):
        return jsonify({"error": "not_found"}), 404
    # Always a download with a neutral type: uploaded files must never run in this site's pages.
    return send_from_directory(os.path.join(contributions.contributions_dir(), record_id), files[number]["stored_as"],
                               as_attachment=True, download_name=files[number]["original_name"],
                               mimetype="application/octet-stream")


def _zip(folders, download_name):
    """folders: (name inside the zip, folder on disk)."""
    path = temp_files.new_path(".zip")
    try:
        with zipfile.ZipFile(path, "w", zipfile.ZIP_DEFLATED) as archive:
            for prefix, folder in folders:
                for current, _, names in os.walk(folder):
                    for name in names:
                        full = os.path.join(current, name)
                        archive.write(full, os.path.join(prefix, os.path.relpath(full, folder)))
        return security.send_and_delete(path, as_attachment=True, download_name=download_name,
                                        mimetype="application/zip")
    except Exception:
        if os.path.exists(path):
            os.unlink(path)
        raise


@bp.get("/items/contribution/<record_id>/download")
def download_contribution(record_id):
    """The whole folder: unzip it into Backend/contributions/ to merge it (docs/contributions.md)."""
    if not _found("contribution", record_id):
        return jsonify({"error": "not_found"}), 404
    return _zip([(record_id, os.path.join(contributions.contributions_dir(), record_id))], f"{record_id}.zip")


@bp.get("/export")
def export():
    """Everything, for a backup."""
    return _zip([(kind, directory()) for kind, (directory, _) in KINDS.items() if os.path.isdir(directory())],
                "braille-website-records.zip")
