"""
Protections shared by every route: real client address behind the proxy,
security headers, request size limits and rate limits.
What each setting is for: Backend/docs/security.md

Settings (environment variables, all optional):
  TRUSTED_PROXY_HOPS  reverse proxies in front of the app (default 1: Traefik)
  CORS_ORIGINS        other websites allowed to call the public API, comma separated
                      (default: only the local Vite dev server)
  RATE_LIMIT_DB       where the request counters are kept (default: the temp folder)
  FORMS_API_ORIGIN    a separate service the forms send to, e.g. https://forms.example.org
"""
import ipaddress
import logging
import os
import random
import sqlite3
import tempfile
import time
from contextlib import closing

from flask import jsonify, redirect, request, send_file
from flask_cors import CORS
from werkzeug.middleware.proxy_fix import ProxyFix

from FileFormat import MAX_UPLOAD_MB

MB = 2**20
MAX_CONTRIBUTION_BYTES = 100 * MB   # same as contributions.MAX_REQUEST_BYTES

# The largest request body each route needs; everything else gets DEFAULT_BODY_LIMIT.
BODY_LIMITS = {
    "handleTextToBraille": 4 * MB,          # 300,000 Khmer characters are 0.9 MB of UTF-8
    "handleBrailleToText": 4 * MB,
    "generate_gcode": 4 * MB,
    "updateTextFile": MAX_UPLOAD_MB * MB + 64 * 1024,
    "updateBrailleFile": MAX_UPLOAD_MB * MB + 64 * 1024,
    "submit_contribution": MAX_CONTRIBUTION_BYTES,
}
DEFAULT_BODY_LIMIT = 64 * 1024

# Requests allowed per visitor address: endpoint -> (count, seconds). A whole school can
# share one address and the page translates while people type, so the translator's limits
# are wide. They stop floods, not classrooms.
RATE_LIMITS = {
    "handleTextToBraille": (600, 60),
    "handleBrailleToText": (600, 60),
    "updateTextFile": (30, 600),            # can run OCR, which holds a worker for a minute
    "updateBrailleFile": (30, 600),
    "generate_gcode": (30, 600),
    "submit_feedback": (10, 3600),
    "submit_contribution": (10, 3600),
    "admin.login": (10, 900),
}
# Limits on everyone together, so many addresses cannot fill the disk or keep guessing the password.
GLOBAL_LIMITS = {
    "submit_feedback": (500, 86400),
    "submit_contribution": (100, 86400),
    "admin.login": (100, 900),
}
# A long document costs more than a typed word: one extra hit per this many bytes.
WEIGHTED_ENDPOINTS = {"handleTextToBraille", "handleBrailleToText"}
WEIGHT_BYTES = 50 * 1024
# When the proxy hides visitors (see client_address), they all share one counter.
HIDDEN_CLIENTS_FACTOR = 10

CONTENT_SECURITY_POLICY = "; ".join([
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",   # React style={} attributes
    "font-src 'self' data: https://fonts.gstatic.com",
    "img-src 'self' data: blob:",
    # Icons ship with the website (Frontend/scripts/build-icons.mjs), so no icon API is allowed here
    " ".join(["connect-src 'self'", os.environ.get("FORMS_API_ORIGIN", "")]).strip(),
    "media-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
])
SECURITY_HEADERS = {
    "Content-Security-Policy": CONTENT_SECURITY_POLICY,
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
    "Cross-Origin-Opener-Policy": "same-origin",
}
# No includeSubDomains: other *.braille.idri.edu.kh names are not served by this app.
HSTS = "max-age=31536000"

# Reachable from the Vite dev server (or CORS_ORIGINS). /api/admin is never listed.
PUBLIC_API = r"^/(text|braille|gcode|updateTextFile|updatebraille|math-symbols|api/feedback|api/contribute)$"


def client_address():
    """(address, hidden). hidden: the proxy did not pass on the visitor's real address."""
    address = request.remote_addr or ""
    try:
        parsed = ipaddress.ip_address(address)
        parsed = getattr(parsed, "ipv4_mapped", None) or parsed
    except ValueError:
        return address, True
    return address, parsed.is_private and not parsed.is_loopback


def _db_path():
    return os.environ.get("RATE_LIMIT_DB") or os.path.join(tempfile.gettempdir(), "braille-rate-limit.sqlite3")


# Routes that must stay limited even when the counters cannot be stored: the admin password
# could otherwise be guessed without limit, and the forms could fill the disk.
FAIL_CLOSED = {"admin.login", "submit_feedback", "submit_contribution"}
STORAGE_DOWN_WAIT = 60


def over_limit(key, limit, seconds, cost=1, fail_closed=False):
    """
    Count a request. Returns the seconds to wait if the limit is exceeded, else 0.
    Gunicorn runs several workers, so the counters live in one small SQLite file.
    If that file cannot be used, the translator keeps working without limits (fail_closed=False),
    while the sign-in and the forms refuse requests until it works again (fail_closed=True).
    """
    now = int(time.time())
    window = now // seconds
    try:
        with closing(sqlite3.connect(_db_path(), timeout=1)) as db, db:
            db.execute("CREATE TABLE IF NOT EXISTS hits"
                       " (key TEXT, window INTEGER, count INTEGER, expires INTEGER, PRIMARY KEY (key, window))")
            db.execute("INSERT INTO hits VALUES (?, ?, ?, ?)"
                       " ON CONFLICT (key, window) DO UPDATE SET count = count + excluded.count",
                       (key, window, cost, now + seconds))
            count = db.execute("SELECT count FROM hits WHERE key = ? AND window = ?", (key, window)).fetchone()[0]
            if random.random() < 0.01:
                db.execute("DELETE FROM hits WHERE expires < ?", (now,))
    except sqlite3.Error:
        logging.exception("Rate limit storage failed")
        return STORAGE_DOWN_WAIT if fail_closed else 0
    return seconds - now % seconds if count > limit else 0


def _rate_limited(wait):
    response = jsonify({"error": "rate_limited", "retry_after": wait})
    response.status_code = 429
    response.headers["Retry-After"] = str(wait)
    return response


def _before_request():
    request.max_content_length = BODY_LIMITS.get(request.endpoint, DEFAULT_BODY_LIMIT)
    if request.method == "OPTIONS":
        return None

    # The proxy said the visitor used plain http: send them to the https address.
    # (Traefik normally does this itself; this covers an http route without the redirect.)
    if request.headers.get("X-Forwarded-Proto") == "http" and request.method in ("GET", "HEAD"):
        return redirect(request.url.replace("http://", "https://", 1), code=301)

    endpoint = request.endpoint
    strict = endpoint in FAIL_CLOSED
    if endpoint in GLOBAL_LIMITS and (wait := over_limit(f"all:{endpoint}", *GLOBAL_LIMITS[endpoint],
                                                         fail_closed=strict)):
        return _rate_limited(wait)
    if endpoint in RATE_LIMITS:
        address, hidden = client_address()
        if address in ("127.0.0.1", "::1"):     # this computer: development and tests
            return None
        limit, seconds = RATE_LIMITS[endpoint]
        cost = 1
        if endpoint in WEIGHTED_ENDPOINTS:
            cost += (request.content_length or 0) // WEIGHT_BYTES
        key = f"{endpoint}:hidden" if hidden else f"{endpoint}:{address}"
        if (wait := over_limit(key, limit * HIDDEN_CLIENTS_FACTOR if hidden else limit, seconds, cost,
                               fail_closed=strict)):
            logging.warning("Rate limit reached on %s", endpoint)
            return _rate_limited(wait)
    return None


def _after_request(response):
    for name, value in SECURITY_HEADERS.items():
        response.headers.setdefault(name, value)
    if request.is_secure:
        response.headers.setdefault("Strict-Transport-Security", HSTS)
    if request.path.startswith("/admin") or request.path.startswith("/api/"):
        response.headers.setdefault("X-Robots-Tag", "noindex")
    if request.path.startswith("/api/admin"):
        response.headers["Cache-Control"] = "no-store"
    return response


def _too_large(_error):
    return jsonify({"error": "too_large"}), 413


def send_and_delete(path, **kwargs):
    """Send a temporary file, then remove it."""
    response = send_file(path, **kwargs)
    response.direct_passthrough = False     # with it on, Werkzeug never runs the on-close callbacks

    def remove():
        try:
            os.unlink(path)
        except OSError:
            logging.exception("Could not delete temporary file")

    response.call_on_close(remove)
    return response


def init_app(app):
    hops = int(os.environ.get("TRUSTED_PROXY_HOPS", "1"))
    if hops:
        app.wsgi_app = ProxyFix(app.wsgi_app, x_for=hops, x_proto=hops)

    # Not the default 500 KB: a contribution's 500 rows of Khmer arrive as one form field.
    app.config.update(MAX_CONTENT_LENGTH=MAX_CONTRIBUTION_BYTES, MAX_FORM_MEMORY_SIZE=8 * MB)

    origins = os.environ.get("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173")
    CORS(app, resources={PUBLIC_API: {"origins": [o.strip() for o in origins.split(",") if o.strip()]}})

    app.before_request(_before_request)
    app.after_request(_after_request)
    app.register_error_handler(413, _too_large)
