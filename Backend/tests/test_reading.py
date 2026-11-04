"""
Reading Braille: English Braille (UEB uncontracted) both ways, English words
inside Khmer Braille, and Khmer round trips.

Run:  python -I -X utf8 Backend/tests/test_reading.py      (from the repo root)
"""
import contextlib
import io
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))

with contextlib.redirect_stdout(io.StringIO()):     # the translators print debug output
    import main  # noqa: E402
    from BrailleToKhmerLogic import translateBrailleToKhmer  # noqa: E402
import contributions  # noqa: E402
import english_braille as eb  # noqa: E402


def ascii_of(cells):
    return "".join(contributions.CELL_TO_ASCII.get(c, c) for c in cells)


def quiet(fn, *args):
    with contextlib.redirect_stdout(io.StringIO()):
        return fn(*args)


# (English, UEB uncontracted Braille ASCII)
ENGLISH = [
    ("Hello, world!", ",hello1 world6"),
    ("VIP and ADN", ",,vip and ,,adn"),
    ("I have 2 cats and 3.5 kg.", ",i have #b cats and #c4e kg4"),
    ("2a", "#b;a"),
    ("Room 12B", ",room #ab,b"),
    ("It's (very) good - really", ',it\'s "<very"> good - really'),
    ("100%", "#ajj.0"),
    ("e-mail: test@cadt.edu.kh", "e-mail3 test@acadt4edu4kh"),
]

# Khmer words that used to come back wrong after Khmer -> Braille -> Khmer
KHMER_ROUND_TRIP = ["កន្លែង", "ខ្មែរ", "ក្មេង", "ការបំប្លែង", "ចំពោះ", "ឈ្មោះ", "ខ្ញុំ", "កុំព្យូទ័រ",
                    "ចំណាំ៖", "មន្ត្រីរាជការ", "វិទ្យាសាស្ត្រ", "ទី២", "ស្រែ", "សួស្តី ពិភពលោក"]


def run():
    for text, want in ENGLISH:
        cells = eb.to_braille(text)
        assert ascii_of(cells) == want, (text, ascii_of(cells), want)
        assert eb.to_english(cells) == text, (text, eb.to_english(cells))
    assert eb.to_english(eb.to_braille('"Yes?" she said.')) == "“Yes?” she said."   # Braille has curly quotes only
    assert eb.to_english(eb.to_braille("one\ntwo")) == "one\ntwo"
    print(f"PASS  English Braille: {len(ENGLISH)} examples both ways")

    for text in KHMER_ROUND_TRIP:
        back = quiet(translateBrailleToKhmer, quiet(main.translate_for_check, text))
        assert back == text, (text, back)
    print(f"PASS  Khmer round trips: {len(KHMER_ROUND_TRIP)} words (ោះ ុំ, vowel and ្រ order, ទី២)")

    # English words inside Khmer Braille, no marker
    cells = quiet(main.translate_for_check, "ខ្ញុំរៀន computer នៅ CADT")
    r = quiet(main.translate_braille, cells, "khmer")
    assert r["result"] == "ខ្ញុំរៀន computer នៅ CADT", r["result"]
    assert [(w["english"], w["use"]) for w in r["words"]] == [("computer", "english"), ("CADT", "english")]
    cells = quiet(main.translate_for_check, "ក្មេង go to school")
    r = quiet(main.translate_braille, cells, "khmer")
    uses = {w["english"]: (w["use"], w["certain"]) for w in r["words"]}
    assert uses == {"go": ("khmer", False), "to": ("khmer", False), "school": ("english", True)}, uses
    assert r["result"].startswith("ក្មេង ") and r["result"].endswith(" school"), r["result"]
    # each word carries both readings, and parts rebuild the result
    rebuilt = "".join(p["text"] if "text" in p else r["words"][p["word"]][r["words"][p["word"]]["use"]] for p in r["parts"])
    assert rebuilt == r["result"]
    assert all(w["khmer"] for w in r["words"])
    print("PASS  English words in Khmer Braille: found, short ones only suggested")

    # the English option: text -> Braille -> text
    cells = main.text_to_braille("Hello VIP 2a", "english", set())
    assert ascii_of(cells) == ",hello ,,vip #b;a"
    assert quiet(main.translate_braille, cells, "english")["result"] == "Hello VIP 2a"
    unmapped = set()
    main.text_to_braille("Hello សួស្តី", "english", unmapped)
    assert unmapped == set("សួស្តី"), unmapped
    long_line = main.text_to_braille(" ".join(["word"] * 20), "english", set())
    assert max(len(line) for line in long_line.split("\n")) <= 42
    print("PASS  English option both ways; Khmer in English mode is reported; lines wrap at 42 cells")

    # Upload size and text length limits on the routes
    client = main.app.test_client()
    too_big = b"x" * (main.MAX_UPLOAD_MB * 2**20 + 200 * 1024)
    for route in ("/updateTextFile", "/updatebraille"):
        r = client.post(route, data={"file": (io.BytesIO(too_big), "big.txt")}, content_type="multipart/form-data")
        assert r.status_code == 413 and r.get_json()["error"] == "file_too_large", (route, r.status_code)
    r = client.post("/text", json={"text": "ក" * (main.MAX_CHARS + 1)})
    assert r.status_code == 413 and r.get_json()["error"] == "too_long"
    r = client.post("/braille", json={"braille": "⠛" * (main.MAX_CHARS + 1)})
    assert r.status_code == 413 and r.get_json()["error"] == "too_long"
    print("PASS  routes refuse files over 20 MB and text over 300,000 characters")

    # .brf files are English Braille only, even when Khmer is chosen
    r = client.post("/updatebraille", data={"file": (io.BytesIO(b",hello world"), "story.brf"), "braille_type": "khmer"},
                    content_type="multipart/form-data")
    assert r.status_code == 200 and r.get_json()["braille_type"] == "english", r.get_json()
    assert r.get_json()["result"] == "Hello world", r.get_json()["result"]
    print("PASS  .brf upload is read as English Braille")

    return 0


if __name__ == "__main__":
    sys.exit(run())
