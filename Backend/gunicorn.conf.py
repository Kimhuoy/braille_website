"""
Loaded by gunicorn on its own (it reads ./gunicorn.conf.py from the working directory, /app).

Gunicorn adds "Server: gunicorn" to every response, which tells an attacker what software
the site runs. The response line is built in gunicorn.http.wsgi.Response.default_headers;
this drops that one header and leaves everything else as gunicorn made it.
"""
from gunicorn.http import wsgi

_default_headers = wsgi.Response.default_headers


def _without_server_header(self):
    return [h for h in _default_headers(self) if not h.lower().startswith("server:")]


wsgi.Response.default_headers = _without_server_header
