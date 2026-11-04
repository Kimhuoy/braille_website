from khmernltk import word_tokenize
from docx import Document
from docx.table import Table
from docx.text.paragraph import Paragraph
import os
import re
import temp_files
import zipfile
from PIL import Image
import pytesseract
import fitz
from docx2pdf import convert

# ========Format for writing braille to file =========
def format_output_file(words, max_line_length=42):
    formatted_list = []
    current_line = ""
    for word in words:
        if len(current_line) + len(word) + 1 <= max_line_length:
            if current_line:
                current_line += " "
            current_line += word
        else:
            formatted_list.append(current_line)
            current_line = word
    if current_line:
        formatted_list.append(current_line)

    return formatted_list


# ====================Read file ========================
def read_ocr_file(file_path):
    paragraph = []
    pdf_document = fitz.open(file_path)
    images = []
    KHSYMBOL = set(u')(][!@#$%^&*{}+-=ˈ_.,|\/')
    for page_number in range(pdf_document.page_count):
        page = pdf_document.load_page(page_number)
        pix = page.get_pixmap()
        img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
        images.append(img)
    pdf_document.close()
    ocr_text = ""
    for img in images:
        text = pytesseract.image_to_string(img, lang="khm")  # Specify Khmer language
        ocr_text += text
        paragraph.append(ocr_text)
    clean_paragraph = []
    for para in paragraph:
        sentences = para.split("\n")
        for sentence in sentences:
            if sentence == '':
                continue
            else:
                clean_sentence = ''
                for word in word_tokenize(sentence):
                    if word in KHSYMBOL:
                        continue
                    else:
                        clean_sentence += word 
            clean_paragraph.append(clean_sentence)
    return clean_paragraph

def read_word_file(file):
    all_file_word = []
    doc = Document(file)
    for line in doc.paragraphs:
        all_file_word.append(line.text)
    return '\n' .join(all_file_word)

def read_text_file(file):
    all_line_text_file = []
    with open(file, 'r', encoding="utf-8") as f:
        for i in f:
            all_line_text_file.append(i)
    return all_line_text_file


# ========= Read a file uploaded on the website ("choose file") =========

UPLOAD_EXTENSIONS = (".txt", ".docx", ".pdf")
OCR_DPI = 300       # get_pixmap() defaults to 72 dpi, too small to recognise Khmer

# How much one upload may contain. Measured (Backend/docs/upload-limits.md): one
# A4 page of Khmer (Khmer OS Siemreap 12pt) is about 1,540 characters, and
# Khmer -> Braille takes about 1.3 s per 100,000 characters, so 300,000
# characters (about 200 pages) stay well inside the server's request time.
# The website shows the same numbers (i18n.js upload.limits).
MAX_UPLOAD_MB = 20          # file size
MAX_CHARS = 300_000         # text in one document, about 200 A4 pages
MAX_PDF_PAGES = 200         # PDF pages read from the PDF's own text
MAX_SCAN_PAGES = 10         # scanned PDF pages: each is a picture to recognise (slow)
MAX_DOCX_UNPACKED_MB = 300  # a small .docx can unpack to gigabytes and exhaust the memory ("zip bomb")
MAX_SCAN_PIXELS = 60_000_000    # one page at OCR_DPI; A3 at 300 dpi is 17 million
KHSYMBOL = set(")(][!@#$%^&*{}+-=ˈ_.,|\\/")   # OCR noise dropped from recognised lines


class UploadError(ValueError):
    """An error code that the website shows in the user's language."""


def decode_text_file(data):
    """UTF-8 (with or without BOM) or UTF-16, which Notepad can also save."""
    if data.startswith((b"\xff\xfe", b"\xfe\xff")):
        return data.decode("utf-16")
    try:
        return data.decode("utf-8-sig")
    except UnicodeDecodeError:
        raise UploadError("encoding")


def docx_text(path):
    """Paragraphs and table rows in document order (tables used to be skipped)."""
    with zipfile.ZipFile(path) as package:
        if sum(info.file_size for info in package.infolist()) > MAX_DOCX_UNPACKED_MB * 2**20:
            raise UploadError("unreadable")
    document = Document(path)
    lines = []
    for block in document.element.body.iterchildren():
        tag = block.tag.rsplit("}", 1)[-1]
        if tag == "p":
            lines.append(Paragraph(block, document).text)
        elif tag == "tbl":
            for row in Table(block, document).rows:
                cells, seen = [], set()
                for cell in row.cells:
                    if cell._tc in seen:      # a merged cell is listed once per column
                        continue
                    seen.add(cell._tc)
                    if cell.text.strip():
                        cells.append(cell.text.strip())
                lines.append(" ".join(cells))
    return "\n".join(lines)


def pdf_ocr_text(path):
    """Khmer text recognised from each page image, one output line per text line."""
    lines = []
    with fitz.open(path) as pdf:
        if pdf.page_count > MAX_SCAN_PAGES:
            raise UploadError("scan_too_long")
        for page in pdf:
            # A PDF can declare a page of any size; its picture would not fit in memory.
            if page.rect.width * page.rect.height * (OCR_DPI / 72) ** 2 > MAX_SCAN_PIXELS:
                raise UploadError("pdf_failed")
            pix = page.get_pixmap(dpi=OCR_DPI)
            img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
            for line in pytesseract.image_to_string(img, lang="khm").split("\n"):
                cleaned = "".join(w for w in word_tokenize(line) if w not in KHSYMBOL)
                if cleaned.strip():
                    lines.append(cleaned)
    return "\n".join(lines)


def pdf_text_layer(path):
    with fitz.open(path) as pdf:
        if pdf.page_count > MAX_PDF_PAGES:
            raise UploadError("too_many_pages")
        return "".join(page.get_text("text") for page in pdf)


KHMER_MARKS = "឴-៓៝"   # dependent vowels and signs, coeng ្


def clean_pdf_khmer(text):
    """
    A PDF made from Word keeps its Khmer text exactly, but the layout adds a
    space or line break before a vowel drawn to the left (រ ៀន) and can break a
    line after a coeng (ស្\\nតី). Neither is ever valid inside a Khmer word.
    """
    text = re.sub(rf"\s+(?=[{KHMER_MARKS}])", "", text)
    return re.sub(r"(?<=្)\s+", "", text)


def pdf_khmer_text(path):
    """Use the PDF's own text; recognise page images only for scans (no text layer)."""
    text = clean_pdf_khmer(pdf_text_layer(path))
    if text.strip():
        return text
    try:
        return pdf_ocr_text(path)
    except pytesseract.TesseractNotFoundError as error:
        raise UploadError("pdf_scanned") from error


BRAILLE_EXTENSIONS = (".brf", ".brl", ".pef")    # Braille ASCII (Duxbury, this website) and PEF
DUXBURY_EXTENSIONS = (".dxb", ".dxp")            # Duxbury's own closed format: export as .brf


def pef_text(path):
    """PEF (Portable Embosser Format, XML): each <row> is one line of Unicode Braille."""
    import xml.etree.ElementTree as ET
    from xml.parsers import expat

    def refuse(*_):     # PEF files have no DOCTYPE; malicious XML attacks a parser through one
        raise UploadError("unreadable")

    checker = expat.ParserCreate()
    checker.StartDoctypeDeclHandler = refuse
    with open(path, "rb") as f:
        checker.ParseFile(f)
    root = ET.parse(path).getroot()
    return "\n".join(el.text or "" for el in root.iter() if el.tag.rsplit("}", 1)[-1] == "row")


def to_braille_cells(text):
    """
    The Braille -> Khmer translator reads 6-dot cells (⠛) only. Braille ASCII
    (.brf files, SimBraille text in Word or PDF) is turned into cells; a file
    that already has cells is kept as it is. Page breaks become line breaks.
    """
    from math_braille import ascii_to_cells   # lazy: math_braille loads the dictionaries
    text = text.replace("\f", "\n")
    if re.search("[\u2800-\u28ff]", text):
        return text
    return "\n".join(ascii_to_cells(line) for line in text.split("\n"))


def read_upload(upload, braille=False):
    """
    Text of an uploaded file. Khmer text: .txt / .docx / .pdf (PDF text layer,
    or page images for scans). Braille (braille=True): also .brf / .brl / .pef,
    and the result is always 6-dot Braille cells.
    The file is saved in a private temporary folder that is deleted afterwards,
    so uploads are not kept on the server and two people uploading files with
    the same name cannot get each other's text.
    """
    ext = os.path.splitext(upload.filename or "")[1].lower()
    if ext == ".doc":
        raise UploadError("old_word")
    if ext in DUXBURY_EXTENSIONS:
        raise UploadError("duxbury")
    if ext in BRAILLE_EXTENSIONS and not braille:
        raise UploadError("braille_file")
    if ext not in UPLOAD_EXTENSIONS + (BRAILLE_EXTENSIONS if braille else ()):
        raise UploadError("unsupported")
    with temp_files.new_folder() as tmp:
        path = os.path.join(tmp, "upload" + ext)
        upload.save(path)
        try:
            if ext in (".txt", ".brf", ".brl"):
                with open(path, "rb") as f:
                    text = decode_text_file(f.read())
            elif ext == ".docx":
                text = docx_text(path)
            elif ext == ".pef":
                text = pef_text(path)
            elif braille:
                text = pdf_text_layer(path)
            else:
                text = pdf_khmer_text(path)
        except UploadError:
            raise
        except Exception as error:
            raise UploadError("pdf_failed" if ext == ".pdf" else "unreadable") from error
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    if braille:
        text = to_braille_cells(text)
    # spaces at the end of a line (PDF lines end with one) would start the next Braille line with a blank cell
    text = re.sub(r"[ \t\u2800]+\n", "\n", text)
    if not text.strip(" \t\n\u2800"):
        raise UploadError("empty")
    if len(text) > MAX_CHARS:
        raise UploadError("too_long")
    return text


# ===============Write file ========================

def write_doc_file(list, out_put_file):
    doc = Document()
    for line in list:
        doc.add_paragraph(line)
        doc.save(out_put_file)
    
def write_pdf_file(list, out_put_file):
    write_doc_file(list, "output.docx")
    convert("output.docx", out_put_file)

def write_txt_file(list,out_put_file):
    with open(out_put_file, 'a', encoding='utf-8') as f:
        for line in list:
            f.write(line)
