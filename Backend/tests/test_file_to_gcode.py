"""
file_to_gcode: .txt / .docx / .pdf -> Braille -> G-code, in a temporary folder.

Run:  python -I -X utf8 Backend/tests/test_file_to_gcode.py      (from the repo root)
"""
import contextlib
import io
import os
import sys
import tempfile

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "file-to-gcode"))

import fitz  # noqa: E402
from docx import Document  # noqa: E402

import file_to_gcode as f2g  # noqa: E402


def gcode_dots(path):
    with open(path, encoding="utf-8") as f:
        return sum(1 for line in f if line.startswith("M3 S255"))


def run():
    with tempfile.TemporaryDirectory() as tmp:
        # .txt: Khmer with a chemical formula; lines fit the paper (26 cells on A4)
        txt = os.path.join(tmp, "lesson.txt")
        with open(txt, "w", encoding="utf-8") as f:
            f.write("ទឹក H2O " * 20 + "\nបន្ទាត់ថ្មី")
        result = f2g.convert_file(txt, os.path.join(tmp, "out", "lesson.gcode"), save_braille=True)
        lines = result["braille"].split("\n")
        assert f2g.cells_per_line() == 26
        assert max(len(line) for line in lines) <= 26, max(len(line) for line in lines)
        assert "⠠⠓⠆⠠⠕" in result["braille"]                       # H2O: 2 as the low cell
        assert lines[-1] == f2g.translate_text("បន្ទាត់ថ្មី")[0]     # the line break is kept
        assert gcode_dots(result["output"]) > 0 and result["pages"] >= 1
        assert os.path.exists(os.path.join(tmp, "out", "lesson.braille.txt"))
        print(f"PASS  .txt -> {len(lines)} lines of at most 26 cells, H2O = ⠠⠓⠆⠠⠕, {result['pages']} page(s)")

        # running again replaces the file (no lesson(1).gcode)
        f2g.convert_file(txt, result["output"])
        assert sorted(os.listdir(os.path.join(tmp, "out"))) == ["lesson.braille.pdf", "lesson.braille.txt", "lesson.gcode"]
        print("PASS  the output file is replaced, not copied to lesson(1).gcode")

        # .docx, English Braille
        doc = Document()
        doc.add_paragraph("Hello world")
        docx = os.path.join(tmp, "story.docx")
        doc.save(docx)
        result = f2g.convert_file(docx, os.path.join(tmp, "story.gcode"), braille_type="english")
        assert result["braille"] == "⠠⠓⠑⠇⠇⠕⠀⠺⠕⠗⠇⠙", result["braille"]
        # dots in the G-code = dots in the Braille
        assert gcode_dots(result["output"]) == sum(bin(ord(c) - 0x2800).count("1") for c in result["braille"])
        print("PASS  .docx, English Braille: every dot is embossed once")

        # .pdf with its own text
        pdf = fitz.open()
        pdf.new_page().insert_text((72, 72), "Room 12")
        pdf_path = os.path.join(tmp, "note.pdf")
        pdf.save(pdf_path)
        result = f2g.convert_file(pdf_path, os.path.join(tmp, "note.gcode"), braille_type="english")
        assert result["braille"] == "⠠⠗⠕⠕⠍⠀⠼⠁⠃", result["braille"]
        print("PASS  .pdf text layer")

        # long documents go over several pages, with a pause for each sheet
        long_txt = os.path.join(tmp, "long.txt")
        with open(long_txt, "w", encoding="utf-8") as f:
            f.write("\n".join(f"line {n}" for n in range(60)))
        result = f2g.convert_file(long_txt, os.path.join(tmp, "long.gcode"), braille_type="english")
        with open(result["output"], encoding="utf-8") as f:
            pauses = f.read().splitlines().count("M0")
        assert result["pages"] == 3 and pauses == 2, (result["pages"], pauses)
        print("PASS  60 lines -> 3 pages of 23 lines, M0 pause before each new sheet")

        # files that cannot be converted say why
        for name, data, reason in (("photo.png", b"\x89PNG", "not a .docx, .doc, .txt or .pdf"),
                                   ("blank.txt", b"   ", "no text")):
            path = os.path.join(tmp, name)
            with open(path, "wb") as f:
                f.write(data)
            try:
                f2g.convert_file(path, os.path.join(tmp, name + ".gcode"))
            except f2g.ConversionError as error:
                assert reason in str(error), (name, str(error))
            else:
                raise AssertionError(name + " was converted")
        print("PASS  images / empty files give a clear reason")

        # command line: a folder of files, one bad one -> exit code 1, the good one still written
        folder = os.path.join(tmp, "batch")
        os.makedirs(folder)
        for name in ("a.txt", "b.txt"):
            with open(os.path.join(folder, name), "w", encoding="utf-8") as f:
                f.write("សួស្តី" if name == "a.txt" else "")
        out = io.StringIO()
        with contextlib.redirect_stdout(out):
            code = f2g.main([os.path.join(folder, "a.txt"), os.path.join(folder, "b.txt"), "-o", os.path.join(tmp, "batch-out")])
        assert code == 1 and sorted(os.listdir(os.path.join(tmp, "batch-out"))) == ["a.braille.pdf", "a.gcode"], (code, out.getvalue())
        assert "OK      a.txt" in out.getvalue() and "FAILED  b.txt" in out.getvalue()
        print("PASS  command line: good files converted, failures reported, exit code 1")
    return 0


if __name__ == "__main__":
    sys.exit(run())
