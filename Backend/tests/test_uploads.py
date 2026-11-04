"""
Reading files uploaded with "choose file": Word tables, Notepad encodings,
unsupported files and PDF pages (OCR is replaced by a fake, so Tesseract is
not needed to run this).

Run:  python -I -X utf8 Backend/tests/test_uploads.py      (from the repo root)
"""
import contextlib
import io
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))

import fitz  # noqa: E402
from docx import Document  # noqa: E402
from werkzeug.datastructures import FileStorage  # noqa: E402

import FileFormat  # noqa: E402
from FileFormat import UploadError, read_upload  # noqa: E402


def upload(name, data):
    return FileStorage(io.BytesIO(data), filename=name)


def error_code(name, data, **kwargs):
    try:
        read_upload(upload(name, data), **kwargs)
    except UploadError as error:
        return str(error)
    return None


def run():
    # Word: paragraphs and tables, in order; a merged cell is read once
    doc = Document()
    doc.add_paragraph("សួស្តី")
    table = doc.add_table(rows=2, cols=3)
    table.cell(0, 0).text, table.cell(0, 1).text, table.cell(0, 2).text = "ក", "ខ", "គ"
    merged = table.cell(1, 0).merge(table.cell(1, 1))
    merged.text, table.cell(1, 2).text = "ឃ", "ង"
    doc.add_paragraph("ចប់")
    buf = io.BytesIO()
    doc.save(buf)
    assert read_upload(upload("lesson.docx", buf.getvalue())) == "សួស្តី\nក ខ គ\nឃ ង\nចប់"
    print("PASS  Word tables are read, merged cells once")

    # Notepad: UTF-8, UTF-8 with BOM, UTF-16; Windows line endings
    assert read_upload(upload("spaces.txt", b"one  \ntwo\t\nthree")) == "one\ntwo\nthree"
    text = "សួស្តី\r\nពិភពលោក"
    for data in (text.encode("utf-8"), text.encode("utf-8-sig"), text.encode("utf-16")):
        assert read_upload(upload("notes.txt", data)) == "សួស្តី\nពិភពលោក"
    assert error_code("notes.txt", "សួស្តី".encode("cp1252", "ignore") + b"\x81\xfe") == "encoding"
    print("PASS  .txt in UTF-8, UTF-8 BOM and UTF-16")

    # Files we cannot read give an error, never someone else's text
    assert error_code("old.doc", b"\xd0\xcf\x11\xe0") == "old_word"
    assert error_code("photo.png", b"\x89PNG") == "unsupported"
    assert error_code("broken.docx", b"not a zip") == "unreadable"
    assert error_code("empty.txt", b"  \n ") == "empty"
    print("PASS  .doc / images / broken / empty files give an error code")

    # PDF: every page read once, at 300 dpi (OCR replaced by a fake)
    pdf = fitz.open()
    for _ in range(3):
        pdf.new_page()
    pdf_bytes = pdf.tobytes()
    seen_sizes = []

    def fake_ocr(img, lang):
        seen_sizes.append(img.size)
        return f"ទំព័រ{len(seen_sizes)}\n\nបន្ទាត់"

    real_ocr = FileFormat.pytesseract.image_to_string
    FileFormat.pytesseract.image_to_string = fake_ocr
    try:
        out = read_upload(upload("book.pdf", pdf_bytes))
    finally:
        FileFormat.pytesseract.image_to_string = real_ocr
    assert out.split("\n") == ["ទំព័រ1", "បន្ទាត់", "ទំព័រ2", "បន្ទាត់", "ទំព័រ3", "បន្ទាត់"], out
    assert seen_sizes[0][0] > 2000, seen_sizes        # A4 at 300 dpi is ~2480 px wide (72 dpi: 595)
    print("PASS  PDF pages read once each, at 300 dpi")

    # Khmer PDFs saved from Word: their own text is used, without the spaces and
    # line breaks the layout puts inside words (seen in Word PDFs, 4 Khmer fonts)
    assert FileFormat.clean_pdf_khmer("ខ្ញុំរ ៀនភាសា «ចំណ េះដឹង»") == "ខ្ញុំរៀនភាសា «ចំណេះដឹង»"
    assert FileFormat.clean_pdf_khmer("ស\nួស្\nតី ពិភពលោក\nបន្ទាត់ថ្មី") == "សួស្តី ពិភពលោក\nបន្ទាត់ថ្មី"
    pdf = fitz.open()
    pdf.new_page().insert_text((72, 72), "Hello 123")
    FileFormat.pytesseract.image_to_string = lambda *a, **k: (_ for _ in ()).throw(AssertionError("OCR not needed"))
    try:
        assert read_upload(upload("typed.pdf", pdf.tobytes())).strip() == "Hello 123"
    finally:
        FileFormat.pytesseract.image_to_string = real_ocr
    print("PASS  PDF text layer used before OCR, Khmer layout spaces removed")

    # A scan on a computer without Tesseract: a clear message, not a crash
    def no_tesseract(*args, **kwargs):
        raise FileFormat.pytesseract.TesseractNotFoundError()
    FileFormat.pytesseract.image_to_string = no_tesseract
    try:
        assert error_code("scan.pdf", pdf_bytes) == "pdf_scanned"
    finally:
        FileFormat.pytesseract.image_to_string = real_ocr
    print("PASS  scanned PDF without Tesseract -> pdf_scanned")

    # Braille files (Braille -> Khmer direction): always returned as 6-dot cells
    # .brf from Duxbury: Braille ASCII, upper case, CRLF, form feed between pages
    assert read_upload(upload("lesson.brf", b",G ,K\r\n#AB\r\n\f,G\r\n"), braille=True) == "⠠⠛⠀⠠⠅\n⠼⠁⠃\n\n⠠⠛\n"
    assert read_upload(upload("lesson.brl", b",g"), braille=True) == "⠠⠛"
    # Unicode Braille in .txt is kept; SimBraille text typed in Word becomes cells
    assert read_upload(upload("dots.txt", "⠠⠛⠀⠠⠅".encode()), braille=True) == "⠠⠛⠀⠠⠅"
    doc = Document()
    doc.add_paragraph(",g ,k")
    buf = io.BytesIO()
    doc.save(buf)
    assert read_upload(upload("simbraille.docx", buf.getvalue()), braille=True) == "⠠⠛⠀⠠⠅"
    # PEF (Portable Embosser Format): one <row> of Unicode Braille per line
    pef = ('<?xml version="1.0" encoding="UTF-8"?><pef version="2008-1" xmlns="http://www.daisy.org/ns/2008/pef">'
           '<body><volume><section><page><row>⠠⠛⠀⠠⠅</row><row>⠛</row></page>'
           '<page><row>⠅</row></page></section></volume></body></pef>')
    assert read_upload(upload("book.pef", pef.encode()), braille=True) == "⠠⠛⠀⠠⠅\n⠛\n⠅"
    # Braille PDF: its text layer, in Braille ASCII -> cells
    pdf = fitz.open()
    pdf.new_page().insert_text((72, 72), ",g ,k")
    assert read_upload(upload("braille.pdf", pdf.tobytes()), braille=True).strip("\n") == "⠠⠛⠀⠠⠅"
    # Clear messages: Duxbury's own format, and a Braille file in the Khmer -> Braille direction
    assert error_code("book.dxb", b"\x00dxb", braille=True) == "duxbury"
    assert error_code("lesson.brf", b",g") == "braille_file"
    assert error_code("blank.brf", b"\r\n\f\r\n", braille=True) == "empty"
    print("PASS  Braille files: .brf/.brl, .pef, dots in .txt, SimBraille in Word/PDF, .dxb message")

    # Size limits (FileFormat.py): characters, PDF pages, scanned PDF pages
    assert error_code("long.txt", ("ក" * (FileFormat.MAX_CHARS + 1)).encode()) == "too_long"
    assert read_upload(upload("ok.txt", ("ក" * FileFormat.MAX_CHARS).encode()))
    big = fitz.open()
    for _ in range(FileFormat.MAX_PDF_PAGES + 1):
        big.new_page().insert_text((72, 72), "page")
    assert error_code("big.pdf", big.tobytes()) == "too_many_pages"
    scan = fitz.open()
    for _ in range(FileFormat.MAX_SCAN_PAGES + 1):
        scan.new_page()                       # no text layer: a scan
    assert error_code("scan.pdf", scan.tobytes()) == "scan_too_long"
    print("PASS  limits: 300,000 characters, 200 PDF pages, 10 scanned pages")

    # Braille -> Khmer used to crash (500) on these, and to drop the last letters
    from BrailleToKhmerLogic import translateBrailleToKhmer
    with contextlib.redirect_stdout(io.StringIO()):
        for text in ("", " ", "Hello 123", "⠧⠗"):
            translateBrailleToKhmer(text)
        assert translateBrailleToKhmer("⠝⠊⠓") == "ណហៃ"
    print("PASS  Braille -> Khmer: empty, non-Braille and ្រ input; last letters kept")
    return 0


if __name__ == "__main__":
    sys.exit(run())
