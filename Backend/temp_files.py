"""
Files the website only needs while answering one request: G-code and zip downloads, and
uploaded documents while they are read. Nothing a visitor sends or downloads is meant to stay.

Each route deletes its own file when it finishes. If a worker is killed first (gunicorn's
request timeout, a crash, a redeploy of a worker), that step never runs, so everything is kept
in one folder and anything old is removed whenever the next temporary file is made.
"""
import logging
import os
import secrets
import shutil
import tempfile
import time

# gunicorn stops a request after 120 s, so nothing this old can still be in use.
MAX_AGE_SECONDS = 15 * 60


def folder():
    path = os.path.join(tempfile.gettempdir(), "braille-website-temp")
    os.makedirs(path, mode=0o700, exist_ok=True)
    return path


def sweep(now=None):
    """Delete what a killed worker left behind."""
    root = folder()
    limit = (now or time.time()) - MAX_AGE_SECONDS
    for name in os.listdir(root):
        path = os.path.join(root, name)
        try:
            if os.path.getmtime(path) >= limit:
                continue
            if os.path.isdir(path):
                shutil.rmtree(path)
            else:
                os.unlink(path)
            logging.info("Removed abandoned temporary file %s", name)
        except FileNotFoundError:
            pass        # another worker was faster
        except OSError:
            logging.exception("Could not remove temporary file %s", name)


def new_path(suffix=""):
    """A path for a file that does not exist yet. The caller must delete the file."""
    sweep()
    return os.path.join(folder(), secrets.token_hex(16) + suffix)


def new_folder():
    """A folder that is deleted when its `with` block ends."""
    sweep()
    return tempfile.TemporaryDirectory(dir=folder())
