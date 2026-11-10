"""
The whole process: a document -> translate to Braille -> G-code.

The G-code is read back the way the embosser follows it (moves, dots, pauses for
paper), rebuilt into pages of Braille and compared with the translation, so a
wrong dot, a blank line or a blank sheet fails here.

Run:  python -I -X utf8 Backend/tests/test_gcode_end_to_end.py      (from the repo root)
"""
import contextlib
import io
import os
import re
import sys
import tempfile

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "file-to-gcode"))

import pymupdf as fitz  # noqa: E402
from docx import Document  # noqa: E402

import file_to_gcode as f2g  # noqa: E402

LEFT, TOP, CELL, LINE, DOT = 5.0, 10.0, 6.5, 11.0, 2.5     # mm, as in BrailleToGcodeV2.py
DOT_BITS = {(0, 0): 0, (0, 1): 1, (0, 2): 2, (1, 0): 3, (1, 1): 4, (1, 2): 5}
LINES_PER_PAGE = 23
KHMER = "សួស្តី ពិភពលោក ខ្ញុំរៀនអក្សរប្រៃ ទឹក H2O " * 6


def emboss(gcode):
    """G-code text -> sheets of paper: each a {line number: {cell number: Braille cell}}."""
    x = y = 0.0
    sheets = [{}]
    for raw in gcode.splitlines():
        code = raw.split(";")[0].strip()
        if code.startswith("G1"):
            mx, my = re.search(r"X(-?[\d.]+)", code), re.search(r"Y(-?[\d.]+)", code)
            x = float(mx.group(1)) if mx else x
            y = float(my.group(1)) if my else y
        elif code.startswith("M0"):
            sheets.append({})
        elif code.startswith("M3 S255"):
            column, dx = divmod(x - LEFT, CELL)
            row, dy = divmod(y - TOP, LINE)
            bit = DOT_BITS[(round(dx / DOT), round(dy / DOT))]
            line = sheets[-1].setdefault(int(row), {})
            line[int(column)] = line.get(int(column), 0x2800) | (1 << bit)
    return sheets


def check_gcode(gcode, braille, name):
    """Every sheet has dots, no line is skipped, and the dots spell the translation line by line."""
    sheets = emboss(gcode)
    assert all(sheets), f"{name}: a blank sheet of paper"
    rebuilt = []
    for sheet in sheets:
        assert sorted(sheet) == list(range(len(sheet))) or "⠀\n" in braille or "\n\n" in braille, f"{name}: a blank line"
        assert max(sheet) < LINES_PER_PAGE, f"{name}: below the last line of the page"
        for number in sorted(sheet):
            cells = sheet[number]
            assert max(cells) < f2g.cells_per_line(), f"{name}: wider than the page"
            rebuilt.append("".join(chr(cells.get(c, 0x2800)) for c in range(max(cells) + 1)))
    want = [line.rstrip("⠀ ") for line in braille.split("\n") if line.strip("⠀ ")]
    assert rebuilt == want, f"{name}: the G-code does not spell the translation\n{rebuilt[:3]}\n{want[:3]}"
    return len(sheets)


def gcode_of(braille, **kwargs):
    with tempfile.TemporaryDirectory() as tmp:
        path = os.path.join(tmp, "a.gcode")
        pages = f2g.braille_to_gcode_file(braille, path, **kwargs)
        with open(path, encoding="utf-8") as f:
            return f.read(), pages


def sample_files(folder):
    """A Khmer .txt, a Khmer Word file and an English PDF."""
    txt = os.path.join(folder, "lesson.txt")
    with open(txt, "w", encoding="utf-8") as f:
        f.write(KHMER + "\nបន្ទាត់ថ្មី")
    docx = os.path.join(folder, "lesson.docx")
    doc = Document()
    doc.add_paragraph(KHMER)
    table = doc.add_table(rows=1, cols=2)
    table.cell(0, 0).text, table.cell(0, 1).text = "ក", "ខ"
    doc.save(docx)
    pdf_path = os.path.join(folder, "note.pdf")
    pdf = fitz.open()
    pdf.new_page().insert_text((72, 72), "Room 12 is open today")
    pdf.save(pdf_path)
    return [(txt, "khmer"), (docx, "khmer"), (pdf_path, "english")]


def run():
    # Layout at the edges of a line and a page
    cell = "⠁"
    for name, lines, pages in (("full lines", [cell * 26] * 3, 1),
                               ("a full page", [cell * 5] * 23, 1),
                               ("a full page of full lines", [cell * 26] * 23, 1),
                               ("one line over a page", [cell * 5] * 24, 2),
                               ("two full pages", [cell * 5] * 46, 2),
                               ("blank cells at the line ends", [cell * 5 + "⠀⠀"] * 3, 1),
                               ("blank lines at the end", [cell * 5, "", "⠀", ""], 1)):
        braille = "\n".join(lines)
        gcode, declared = gcode_of(braille)
        assert declared == pages == check_gcode(gcode, braille, name), (name, declared, pages)
    print("PASS  full lines and full pages: no blank line, no blank sheet")

    gcode, _ = gcode_of(cell * 60)            # one word longer than a line: split, nothing lost
    assert sum(len(line) for line in emboss(gcode)[0].values()) == 60
    gcode, pages = gcode_of("\n".join([cell * 5] * 30), paper_height=280)
    assert pages == 2 and "G1 X5.0 Y280\n" in gcode and "G1 Y280\n" in gcode
    print("PASS  a word longer than a line is split; the paper height is used to release the sheet")

    # Line breaks fall between words, without a blank cell at either side
    braille, _ = f2g.translate_text(KHMER)
    assert all(len(line) <= 26 and line[:1] != "⠀" and line[-1:] != "⠀" for line in braille.split("\n")), braille
    print("PASS  Braille lines fit the paper and do not start or end with a blank cell")

    with tempfile.TemporaryDirectory() as tmp:
        files = sample_files(tmp)

        # 1. The command: python file_to_gcode.py <file>
        for path, braille_type in files:
            with contextlib.redirect_stdout(io.StringIO()):
                code = f2g.main([path, "-o", os.path.join(tmp, "out"), "-t", braille_type, "--braille-txt"])
            assert code == 0
            stem = os.path.join(tmp, "out", os.path.splitext(os.path.basename(path))[0])
            with open(stem + ".gcode", encoding="utf-8") as f, open(stem + ".braille.txt", encoding="utf-8") as b:
                check_gcode(f.read(), b.read(), path)
        print("PASS  .txt, .docx and .pdf -> Braille -> G-code that spells the Braille")

        # 2. A document that is already Braille only needs embossing
        dots = os.path.join(tmp, "dots.txt")
        with open(dots, "w", encoding="utf-8") as f:
            f.write("⠠⠛⠀⠠⠅\n⠁⠃⠉")
        result = f2g.convert_file(dots, os.path.join(tmp, "dots.gcode"))
        assert result["braille"] == "⠠⠛⠀⠠⠅\n⠁⠃⠉" and result["unmapped"] == []
        print("PASS  a file that is already Braille goes straight to G-code")

        # 3. With no output given, the G-code is saved next to the document
        result = f2g.convert_file(files[0][0])
        assert result["output"] == os.path.join(tmp, "lesson.gcode") and os.path.exists(result["output"])
        print("PASS  the G-code is saved next to the document")

        # 3b. The PDF that comes with the G-code shows what the G-code embosses, one page per sheet, every dot once
        long_doc = os.path.join(tmp, "long.txt")
        with open(long_doc, "w", encoding="utf-8") as f:
            f.write("\n".join(f"line {n}" for n in range(40)))
        result = f2g.convert_file(long_doc, braille_type="english")
        with open(result["output"], encoding="utf-8") as f:
            sheets = emboss(f.read())
        assert result["pdf"] == os.path.join(tmp, "long.braille.pdf")
        pdf = fitz.open(result["pdf"])
        assert pdf.page_count == len(sheets) == result["pages"] == 2
        for page, sheet in zip(pdf, sheets):
            assert round(page.rect.width * 25.4 / 72) == 210 and round(page.rect.height * 25.4 / 72) == 297
            drawn = sum(item == "c" for d in page.get_drawings() for item in [i[0] for i in d["items"]])
            want = sum(bin(cell - 0x2800).count("1") for line in sheet.values() for cell in line.values())
            assert drawn == want * 4, (drawn, want)      # a circle is drawn as 4 curves
        pdf.close()
        print("PASS  the Braille PDF: one page per sheet, every embossed dot drawn once")

        # 3c. Only the result: no words on the PDF, no comments in the G-code
        pdf = fitz.open(result["pdf"])
        assert all(not page.get_text().strip() for page in pdf)
        pdf.close()
        with open(result["output"], encoding="utf-8") as f:
            gcode = f.read()
        assert ";" not in gcode and all(re.match(r"^[GM]\d+( [A-Z][\d.]*)*$", line) for line in gcode.splitlines()), gcode[:200]
        print("PASS  only the result: no text on the PDF, only machine commands in the G-code")

        # 4. An old Word file, through Microsoft Word (skipped where Word is not installed)
        word_available = True
        try:
            import pythoncom
            import win32com.client
            pythoncom.CoInitialize()
            word = win32com.client.DispatchEx("Word.Application")
        except Exception:
            word_available = False
        if word_available:
            doc_path = os.path.join(tmp, "old.doc")
            word.Visible = False
            word.DisplayAlerts = 0
            document = word.Documents.Open(files[1][0], ReadOnly=True)
            document.SaveAs2(doc_path, FileFormat=0)       # 0 = Word 97-2003 .doc
            document.Close(False)
            word.Quit()
            result = f2g.convert_file(doc_path, os.path.join(tmp, "old.gcode"))
            docx = f2g.convert_file(files[1][0], os.path.join(tmp, "new.gcode"))
            assert result["braille"] == docx["braille"], (result["braille"][:60], docx["braille"][:60])
            with open(result["output"], encoding="utf-8") as f:
                check_gcode(f.read(), result["braille"], "old.doc")
            print("PASS  .doc through Word gives the same Braille as the .docx")
        else:
            print("SKIP  .doc: Microsoft Word is not installed here")

        # 5. Files that cannot be converted say why
        for name, data, reason in (("photo.png", b"\x89PNG", "not a .docx"),
                                   ("blank.txt", b"  ", "no text")):
            path = os.path.join(tmp, name)
            with open(path, "wb") as f:
                f.write(data)
            try:
                f2g.convert_file(path, os.path.join(tmp, name + ".gcode"))
            except f2g.ConversionError as error:
                assert reason in str(error), (name, str(error))
            else:
                raise AssertionError(name + " was converted")
        # Without Word (for example on a Linux server), a .doc asks to be saved as .docx
        no_word = os.path.join(tmp, "no_word.doc")
        with open(no_word, "wb") as f:
            f.write(b"hello")
        saved = sys.modules.get("pythoncom")
        sys.modules["pythoncom"] = None     # makes "import pythoncom" fail
        try:
            f2g.convert_file(no_word, os.path.join(tmp, "no_word.gcode"))
        except f2g.ConversionError as error:
            assert "save it as .docx" in str(error), str(error)
        else:
            raise AssertionError(".doc was converted without Word")
        finally:
            sys.modules["pythoncom"] = saved
        try:
            f2g.translate_text("hello", "french")
        except f2g.ConversionError as error:
            assert "unknown Braille type" in str(error)
        print("PASS  files that cannot be converted give a clear reason")
    return 0


if __name__ == "__main__":
    sys.exit(run())
