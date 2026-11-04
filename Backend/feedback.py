"""
Messages sent from the website's Feedback page (Frontend/src/Components/Home/feedback-page.jsx).

Each message is saved as <FEEDBACK_DIR>/<id>/feedback.json. The team reads and
manages them on the website's /admin page (admin.py).
"""
import os
from datetime import datetime, timezone

from contributions import ContributionError, clean_text, ensure_free_space, new_submission_id, write_json

_DIR = os.path.dirname(os.path.abspath(__file__))
CATEGORIES = ("suggestion", "problem", "translation", "other")
MAX_MESSAGE_CHARS = 5000


def feedback_dir():
    # Like CONTRIBUTIONS_DIR, this must be on a mounted volume on the server.
    return os.environ.get("FEEDBACK_DIR") or os.path.join(_DIR, "feedback")


def save_feedback(data, directory=None):
    """Validate and store one message. Returns its id."""
    message = clean_text(data.get("message"), MAX_MESSAGE_CHARS)
    if not message:
        raise ContributionError("missing_message")
    root = directory or feedback_dir()
    ensure_free_space(root)

    record = {
        "id": new_submission_id(),
        "received_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "status": "new",
        "category": data.get("category") if data.get("category") in CATEGORIES else "other",
        "message": message,
        "sample_text": clean_text(data.get("sample_text"), 2000),
        "name": clean_text(data.get("name"), 200),
        "contact": clean_text(data.get("contact"), 200),
        "interface_lang": clean_text(data.get("lang"), 5),
    }
    folder = os.path.join(root, record["id"])
    os.makedirs(folder)
    write_json(os.path.join(folder, "feedback.json"), record)
    return record["id"]
