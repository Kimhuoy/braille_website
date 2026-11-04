"""
Contribute page backend: Braille normalisation, entry checks, saving a
submission, and merging into the hand-formatted Khmer dictionary.

Run:  python -I Backend/tests/test_contributions.py      (from the repo root)
"""
import io
import json
import os
import sys
import tempfile

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))

from werkzeug.datastructures import FileStorage  # noqa: E402

import contributions as c  # noqa: E402

KHMER = {"ក": "g", "ខ": "k"}
MATH = {"=": {"code": ".k", "kind": "rel"}}
FORM = {"name": "Dara", "organization": "Test School", "contact": "012 345 678", "consent": "true"}


def run():
    # Braille ASCII (any case), Unicode dots and a mix all give the same cells
    assert c.normalize_braille("g") == ("g", "⠛", [])
    assert c.normalize_braille("G")[0] == "g"
    assert c.normalize_braille("⠛")[0] == "g"
    assert c.normalize_braille(",G⠁")[0] == ",ga"
    assert c.normalize_braille("{")[0] == "["              # SimBraille alias
    assert c.normalize_braille("⣿")[2] == ["⣿"]            # 8-dot cell rejected
    assert c.normalize_braille("ក")[2] == ["ក"]
    print("PASS  normalize_braille")

    check = lambda e, t=None: c.check_entry(e, KHMER, MATH, t)["status"]
    assert check({"type": "character", "text": "គ", "braille": ",g"}) == "new"
    assert check({"type": "character", "text": "ក", "braille": "⠛"}) == "same"
    assert check({"type": "character", "text": "ក", "braille": "k"}) == "different"
    assert check({"type": "symbol", "text": "=", "braille": ".K"}) == "same"
    assert check({"type": "symbol", "text": "≈", "braille": "@9"}) == "new"
    assert check({"type": "character", "text": "", "braille": "g"}) == "invalid"
    assert check({"type": "character", "text": "ក", "braille": "ក"}) == "invalid"
    assert check({"type": "word", "text": "ក", "braille": "g"}) == "invalid"
    assert check({"type": "example", "text": "កខ", "braille": "gk"}, lambda t: "⠛⠅") == "matches"
    assert check({"type": "example", "text": "កខ", "braille": "gg"}, lambda t: "⠛⠅") == "differs"
    assert c.check_entry({"type": "character", "text": "កខ", "braille": "gk"}, KHMER, MATH)["warning"] == "multi_char"
    print("PASS  check_entry statuses")

    # Appending keeps the existing text (CRLF, escapes, no final newline) untouched
    original = '{\r\n    "ក": "g",\r\n    "\\u0027":"\\u0027"\r\n\r\n}'
    merged = c.append_khmer_entries(original, [("គ", ",g")])
    assert merged.startswith('{\r\n    "ក": "g",\r\n    "\\u0027":"\\u0027",\r\n'), merged
    assert merged.endswith('    "គ": ",g"\r\n}'), merged
    assert json.loads(merged)["គ"] == ",g"
    print("PASS  append_khmer_entries keeps formatting")

    with tempfile.TemporaryDirectory() as tmp:
        upload = FileStorage(io.BytesIO(b"%PDF-1.7 sample"), filename="ឯកសារ.PDF")
        entries = [{"type": "character", "text": "គ", "braille": ",g", "meaning": "ko"}]
        sub_id = c.save_submission(FORM, entries, [(upload, "braille")], directory=tmp)
        sub = c.load_submission(sub_id, tmp)
        assert sub["entries"][0]["braille_ascii"] == ",g"
        assert sub["files"][0]["original_name"] == "ឯកសារ.PDF"
        assert sub["files"][0]["stored_as"] == "files/01-braille-file.pdf", sub["files"]
        assert os.path.isfile(os.path.join(tmp, sub_id, "files", "01-braille-file.pdf"))

        def error_code(form=FORM, entries=entries, uploads=()):
            try:
                c.save_submission(form, entries, list(uploads), directory=tmp)
            except c.ContributionError as error:
                return error.code
            return None

        assert error_code(form={**FORM, "consent": ""}) == "no_consent"
        assert error_code(entries=[]) == "empty"
        assert error_code(entries=[{"type": "character", "text": "គ", "braille": "ក"}]) == "invalid_entries"
        bad_file = FileStorage(io.BytesIO(b"x"), filename="run.exe")
        assert error_code(uploads=[(bad_file, "other")]) == "file_type"
        assert len(os.listdir(tmp)) == 1, "failed submissions must not leave folders"

        # The website form sends only text and Braille: the server guesses the type
        rows = [{"text": t, "braille": b} for t, b in (("គ", ",g"), ("ុំ", "$"), ("=", ".k"), ("ខ្មែរ", "<kvmr"))]
        sub = c.load_submission(c.save_submission(FORM, rows, [], directory=tmp), tmp)
        assert [e["type"] for e in sub["entries"]] == ["character", "character", "symbol", "example"], sub["entries"]
        assert error_code(entries=[{"type": "word", "text": "ក", "braille": "g"}]) == "invalid_entries"
    print("PASS  save_submission and validation; rows without a type get one")
    return 0


if __name__ == "__main__":
    sys.exit(run())
