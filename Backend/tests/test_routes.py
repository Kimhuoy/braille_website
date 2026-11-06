"""
Page links and the fixes from the 2026-11-04 security audit (Security-Audit-2026-11-04.pdf).

Page links opened directly (typed, bookmarked, refreshed) must return the website, not a 404:
braille.idri.edu.kh/printer-guide once answered "404 Not Found" because Flask's own static route
caught every path before the website's fallback could send index.html.

Run:  python -I -X utf8 Backend/tests/test_routes.py      (from the repo root)
"""
import io
import os
import sys
import tempfile

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))

_tmp = tempfile.TemporaryDirectory()
os.environ.update(RATE_LIMIT_DB=os.path.join(_tmp.name, "limits.sqlite3"), TRUSTED_PROXY_HOPS="1")
os.environ.pop("FORMS_BACKEND", None)

import FileFormat  # noqa: E402
import main  # noqa: E402
import security  # noqa: E402

# Every path in Frontend/src/App.jsx, plus one that does not exist (React sends it home)
PAGES = ["/", "/guideline", "/about", "/printer-guide", "/contribute", "/feedback", "/admin", "/no-such-page"]


def run():
    dist = os.path.join(_tmp.name, "dist")
    os.makedirs(os.path.join(dist, "assets"))
    with open(os.path.join(dist, "index.html"), "w") as f:
        f.write("<!doctype html><div id=root></div>")
    with open(os.path.join(dist, "assets", "app.js"), "w") as f:
        f.write("console.log(1)")
    main.app.static_folder = dist
    client = main.app.test_client()

    for page in PAGES:
        response = client.get(page)
        assert response.status_code == 200, (page, response.status_code)
        assert b"id=root" in response.data, page
    print("PASS  every page link opened directly returns the website")

    assert client.get("/assets/app.js").data == b"console.log(1)"
    for path in ["/api/nothing", "/api"]:
        response = client.get(path)
        assert response.status_code == 404 and response.is_json, path
    print("PASS  built files served as themselves; unknown API addresses get a JSON 404")

    for path in ["/../main.py", "/%2e%2e/main.py", "/..%2fmain.py", "/assets/../../main.py"]:
        assert b"from KhmerToBrailleLogic" not in client.get(path).data, path
    print("PASS  no path reaches the server's own code")

    # V1: other websites cannot use the API from their visitors' browsers
    for origin in ["https://evil.com", "null", "https://braille.idri.edu.kh.evil.com",
                   "https://evil.braille.idri.edu.kh", "http://braille.idri.edu.kh"]:
        response = client.options("/text", headers={"Origin": origin, "Access-Control-Request-Method": "POST"})
        assert "Access-Control-Allow-Origin" not in response.headers, origin
    assert "Access-Control-Allow-Origin" not in client.get("/").headers
    print("PASS  CORS refuses foreign, null and look-alike origins (V1)")

    # V2 + V9: security headers on pages; no third-party icon API in the CSP
    headers = client.get("/printer-guide", headers={"X-Forwarded-Proto": "https"}).headers
    for name in ["Content-Security-Policy", "X-Frame-Options", "X-Content-Type-Options", "Referrer-Policy",
                 "Permissions-Policy", "Cross-Origin-Opener-Policy", "Strict-Transport-Security"]:
        assert name in headers, name
    csp = headers["Content-Security-Policy"]
    assert "frame-ancestors 'none'" in csp and "iconify" not in csp and "simplesvg" not in csp and "unisvg" not in csp
    print("PASS  security headers present; CSP allows no icon API (V2, V9)")

    # V4: plain http behind the proxy is sent to https
    response = client.get("/printer-guide?x=1", headers={"X-Forwarded-Proto": "http"})
    assert response.status_code == 301
    assert response.headers["Location"].startswith("https://") and response.headers["Location"].endswith("/printer-guide?x=1")
    assert client.get("/", headers={"X-Forwarded-Proto": "https"}).status_code == 200
    assert client.get("/").status_code == 200          # no proxy (development): no redirect
    print("PASS  http is redirected to https (V4)")

    # V12: when the counters cannot be stored, sign-in and forms refuse; the translator keeps working
    saved = os.environ["RATE_LIMIT_DB"]
    os.environ["RATE_LIMIT_DB"] = os.path.join(_tmp.name, "missing-folder", "x.sqlite3")
    try:
        assert security.over_limit("x", 1, 60) == 0
        assert security.over_limit("x", 1, 60, fail_closed=True) > 0
        assert security.FAIL_CLOSED >= {"admin.login", "submit_feedback", "submit_contribution"}
        response = client.post("/text", json={"text": "ក"}, environ_base={"REMOTE_ADDR": "93.184.216.7"})
        assert response.status_code == 200
    finally:
        os.environ["RATE_LIMIT_DB"] = saved
    print("PASS  rate limits fail closed for sign-in and forms only (V12)")

    # V11: PEF files are parsed with defusedxml
    class Upload:
        def __init__(self, name, data):
            self.filename, self._data = name, data

        def save(self, path):
            with open(path, "wb") as f:
                f.write(self._data)

    good = (b'<?xml version="1.0"?><pef xmlns="http://www.daisy.org/ns/2008/pef"><body><volume><section>'
            b'<page><row>\xe2\xa0\x93\xe2\xa0\x8a</row></page></section></volume></body></pef>')
    assert FileFormat.read_upload(Upload("a.pef", good), braille=True) == "⠓⠊"
    entity = (b'<?xml version="1.0"?><!DOCTYPE pef [<!ENTITY x "boom">]><pef><row>&x;</row></pef>')
    try:
        FileFormat.read_upload(Upload("b.pef", entity), braille=True)
        raise AssertionError("entity accepted")
    except FileFormat.UploadError as error:
        assert str(error) == "unreadable"
    import inspect
    assert "defusedxml" in inspect.getsource(FileFormat.pef_text)
    print("PASS  PEF read with defusedxml; entity declarations refused (V11)")

    # V10: no helper module starts the debugger
    backend = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
    for name in os.listdir(backend):
        if name.endswith(".py"):
            with open(os.path.join(backend, name), encoding="utf-8") as f:
                assert "debug=True" not in f.read(), name
    print("PASS  no module runs Flask with debug=True (V10)")

    # V15: gunicorn.conf.py removes the "Server: gunicorn" header
    import importlib.util
    from gunicorn.http import wsgi
    spec = importlib.util.spec_from_file_location("gunicorn_conf", os.path.join(backend, "gunicorn.conf.py"))
    spec.loader.exec_module(importlib.util.module_from_spec(spec))

    class Fake:
        upgrade, chunked, status, version = False, False, "200 OK", wsgi.SERVER

        class req:
            version = (1, 1)

        def should_close(self):
            return False

    lines = wsgi.Response.default_headers(Fake())
    assert lines[0].startswith("HTTP/1.1 200") and not any(h.lower().startswith("server:") for h in lines)
    assert any(h.startswith("Date:") for h in lines)
    print("PASS  gunicorn sends no Server header (V15)")
    return 0


if __name__ == "__main__":
    sys.exit(run())
