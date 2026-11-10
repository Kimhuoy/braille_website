
from KhmerToBrailleLogic import khmer_to_braille
from math_braille import (DRAWING_MARKS, FALLBACK_SYMBOLS, MATH_SYMBOLS, ascii_to_cells, mark_formulas,
                          math_to_braille, split_math_segments)
from BrailleToKhmerLogic import translateBrailleToKhmer
from BrailleToGcodeV2 import braille_to_gcode, clean_braille_text
from FileFormat import MAX_CHARS, MAX_UPLOAD_MB, UploadError, read_upload, write_doc_file, write_pdf_file, write_txt_file
# from KhmerToBrailleLogic import createUnicode
from flask import Flask, request, jsonify, send_from_directory
from docx import Document
from werkzeug.security import safe_join
import os, json
import admin
import contributions
import english_braille
import feedback
from PIL import Image
import pymupdf as fitz
import pytesseract
from khmernltk import word_tokenize
from gcc_segmentation import GCCSegmentation
import logging
import re
import security
import telegram_notify
import temp_files

backend_dir = os.path.dirname(os.path.abspath(__file__))
container_dist_dir = os.path.join(backend_dir, "dist")
local_dist_dir = os.path.abspath(os.path.join(backend_dir, "..", "Frontend", "dist"))
dist_dir = container_dist_dir if os.path.isdir(container_dist_dir) else local_dist_dir

# static_folder is set after creating the app on purpose: passing it to Flask()
# with static_url_path="" adds Flask's own "/<path:filename>" route, which
# answered page links such as /guideline or /contribute with 404 before
# serve_frontend_asset() could return index.html.
app = Flask(__name__, static_folder=None)
app.static_folder = dist_dir
security.init_app(app)
admin.init_app(app)
segmenter = GCCSegmentation()


def forms_backend_on():
    """
    The Feedback and Contribute backend (and /admin) is off unless FORMS_BACKEND=on. Nobody looks
    after it while it is off, so a public route that stores uploads must not be left running.
    See docs/forms-backend-handoff.md.
    """
    return os.environ.get("FORMS_BACKEND") == "on"


@app.before_request
def forms_backend_switch():
    endpoint = request.endpoint or ""
    if not forms_backend_on() and (endpoint in ("submit_feedback", "submit_contribution") or endpoint.startswith("admin.")):
        return jsonify({"error": "Not Found"}), 404


@app.get("/health")
def health_check():
    has_frontend_build = bool(
        app.static_folder and os.path.isfile(os.path.join(app.static_folder, "index.html"))
    )
    return jsonify(
        {
            "status": "ok",
            "service": "braille-backend",
            "frontend_build_available": has_frontend_build,
        }
    ), 200


@app.get("/")
def serve_index():
    index_path = os.path.join(app.static_folder or "", "index.html")
    if not os.path.isfile(index_path):
        return jsonify({"status": "ok", "message": "Braille backend is running"}), 200
    return send_from_directory(app.static_folder, "index.html")


@app.get("/<path:path>")
def serve_frontend_asset(path):
    if path == "api" or path.startswith("api/"):
        return jsonify({"error": "Not Found"}), 404
    if app.static_folder:
        asset_path = safe_join(app.static_folder, path)
        if asset_path and os.path.isfile(asset_path):
            return send_from_directory(app.static_folder, path)

        index_path = os.path.join(app.static_folder, "index.html")
        if os.path.isfile(index_path):
            return send_from_directory(app.static_folder, "index.html")

    return jsonify({"error": "Not Found"}), 404
# def format_khmer_and_braille_text(khmer_words, max_line_length=42):
#     formatted_lines = []
#     current_braille_line = ""

#     for word in khmer_words:
#         # Split word on \n to handle new lines within the word
#         split_words = word.split('\n')
#         for i, part in enumerate(split_words):
#             braille_word = khmer_to_braille(part)

#             # Check if adding this braille_word would exceed the max_line_length
#             if len(current_braille_line) + len(braille_word) <= max_line_length:
#                 current_braille_line += braille_word
#             else:
#                 formatted_lines.append(current_braille_line)
#                 current_braille_line = braille_word

#             # If not the last part, it means there was a '\n' — force a new line
#             if i < len(split_words) - 1:
#                 formatted_lines.append(current_braille_line)
#                 current_braille_line = ""

#     # Add any remaining braille text to the formatted lines
#     if current_braille_line:
#         formatted_lines.append(current_braille_line)

#     return formatted_lines

class MathSegment(str):
    """An equation typed between ⟦ ⟧; translated by math_braille, not word by word."""


class Abbreviation(str):
    """Capitals with full stops (P.M.H.); word_tokenize would split it as 'P.', 'M.', 'H', '.'."""


ABBREVIATION_RE = re.compile(r"(?<![A-Za-z.])((?:[A-Z]\.){2,})")


def abbreviation_to_braille(abbr):
    """P.M.H. -> ,p4 ,m4 ,h4 : each letter with its full stop, then a space (Biology p.46)."""
    return ascii_to_cells(" ".join("," + letter.lower() + "4" for letter in abbr[::2]))


def tokenize_with_math(text, keep_newlines=True):
    """
    Split text into Khmer words (khmernltk), whole equations (⟦ ⟧) and
    abbreviations (P.M.H.). Equations stay in one piece so the math rules
    (fractions, scripts ...) can see the whole expression. Chemical formulas
    typed as plain text (H2O) are equations too, so 2 is a subscript (,h2,o).
    """
    tokens = []
    for is_math, chunk in split_math_segments(mark_formulas(text)):
        if is_math:
            tokens.append(MathSegment(chunk))
            continue
        # One line at a time. Padding the line break with spaces (" <NEWLINE> ")
        # used to end every Braille line with a blank cell and start the next with one.
        lines = chunk.split('\n') if keep_newlines else [chunk]
        for n, line in enumerate(lines):
            if n:
                tokens.append("<NEWLINE>")
            pieces = ABBREVIATION_RE.split(line)
            for k, piece in enumerate(pieces):
                if k % 2:
                    tokens.append(Abbreviation(piece))
                    continue
                body = piece.strip(' ')
                # keep the spaces next to an equation or abbreviation (word_tokenize drops edge spaces)
                if piece.startswith(' ') and tokens:
                    tokens.append(' ')
                if body:
                    tokens.extend(word_tokenize(body))
                    line_break_follows = k == len(pieces) - 1 and n < len(lines) - 1
                    if piece.endswith(' ') and not line_break_follows:
                        tokens.append(' ')
    return tokens


def format_khmer_and_braille_text(khmer_words, max_line_length=42, unmapped=None):
    formatted_lines = []
    current_braille_line = ""

    for word in khmer_words:

        # Explicit newline
        if word == "<NEWLINE>":
            if current_braille_line.strip():
                formatted_lines.append(current_braille_line)
                current_braille_line = ""
            # else: do NOTHING (no empty line)
            continue

        if isinstance(word, MathSegment):
            braille_word = math_to_braille(word, unmapped)
        elif isinstance(word, Abbreviation):
            braille_word = abbreviation_to_braille(word)
        else:
            braille_word = khmer_to_braille(word, unmapped)

        # A drawing or matrix (several Braille lines) starts on its own line so its columns line up
        if "\n" in braille_word:
            if current_braille_line.strip("⠀ "):
                formatted_lines.append(current_braille_line)
            formatted_lines.extend(braille_word.split("\n"))
            current_braille_line = ""
            continue

        # Oversized word protection
        if len(braille_word) > max_line_length:
            if current_braille_line.strip():
                formatted_lines.append(current_braille_line)
            formatted_lines.append(braille_word)
            current_braille_line = ""
            continue

        # Word-style wrapping
        if len(current_braille_line) + len(braille_word) > max_line_length:
            # The space at the break belongs to neither line (a blank cell would look like an indent)
            if current_braille_line.strip():
                formatted_lines.append(current_braille_line.rstrip("⠀ "))
            current_braille_line = braille_word.lstrip("⠀ ")
        else:
            current_braille_line += braille_word

    # Final flush
    if current_braille_line.strip():
        formatted_lines.append(current_braille_line)

    return formatted_lines


BRAILLE_TYPES = ("khmer", "english")
MAX_GCODE_CHARS = 3 * MAX_CHARS     # Braille takes more cells than the Khmer letters it came from


def json_body():
    """The request's JSON object, or {} for anything else (never an error page with details)."""
    data = request.get_json(silent=True)
    return data if isinstance(data, dict) else {}


def wrap_braille_line(line, max_line_length=42):
    """Break a Braille line at blank cells so no line is longer than max_line_length."""
    lines, current = [], ""
    for word in re.split("(⠀)", line):
        if len(current) + len(word) > max_line_length and current.strip("⠀"):
            lines.append(current.rstrip("⠀"))
            current = word.lstrip("⠀")
        else:
            current += word
    lines.append(current)
    return "\n".join(lines)


def text_to_braille(text, braille_type="khmer", unmapped=None, keep_newlines=True, max_line_length=42):
    """
    Print text -> Braille: Khmer Braille, or English Braille (UEB uncontracted). Equations ⟦ ⟧ use the math rules.
    Lines are broken between words at max_line_length cells (42 on the website; the embosser fits fewer).
    """
    if braille_type != "english":
        tokens = tokenize_with_math(text, keep_newlines=keep_newlines)
        return "\n".join(format_khmer_and_braille_text(tokens, max_line_length=max_line_length, unmapped=unmapped))
    if not keep_newlines:
        text = text.replace("\n", " ")
    braille = "".join(math_to_braille(chunk, unmapped) if is_math else english_braille.to_braille(chunk, unmapped)
                      for is_math, chunk in split_math_segments(text))
    return "\n".join(wrap_braille_line(line, max_line_length) for line in braille.split("\n"))


def translate_braille(braille, braille_type="khmer"):
    """
    Braille -> print text.
      english: English Braille (UEB uncontracted) -> English.
      khmer:   Khmer Braille -> Khmer. English words written inside Khmer Braille
               (no marker, same cells as Khmer letters) are found and returned in
               `words` with both readings, so the user can switch any of them.
    The result is `parts`: {"text": ...} or {"word": index into words}.
    """
    if braille_type == "english":
        text = english_braille.to_english(braille)
        return {"result": text, "parts": [{"text": text}], "words": []}
    parts, words = [], []
    for n, line in enumerate(braille.split("\n")):
        if n:
            parts.append({"text": "\n"})
        khmer_run = ""
        for piece in re.split("([ ⠀]+)", line):
            info = english_braille.classify_word(piece) if piece.strip(" ⠀") else None
            if info is None:
                khmer_run += piece
                continue
            if khmer_run:
                parts.append({"text": translateBrailleToKhmer(khmer_run)})
                khmer_run = ""
            words.append({"english": info["english"], "khmer": translateBrailleToKhmer(piece),
                          "use": info["default"], "certain": info["certain"]})
            parts.append({"word": len(words) - 1})
        if khmer_run:
            parts.append({"text": translateBrailleToKhmer(khmer_run)})
    result = "".join(p["text"] if "text" in p else words[p["word"]][words[p["word"]]["use"]] for p in parts)
    return {"result": result, "parts": parts, "words": words}



def upload_too_large():
    """Checked before the file is read (limits in FileFormat.py, shown on the website)."""
    if (request.content_length or 0) > MAX_UPLOAD_MB * 2**20 + 64 * 1024:   # + form fields
        return jsonify({"error": "file_too_large", "max_mb": MAX_UPLOAD_MB}), 413
    return None


# handle for upload text file to translate
@app.route('/updateTextFile', methods=['POST'])
def updateTextFile():
    if (too_large := upload_too_large()):
        return too_large
    upload = request.files.get('file')
    if upload is None or not upload.filename:
        return jsonify({"error": "no_file"}), 400
    try:
        uploaded_text = read_upload(upload)
    except UploadError as error:
        # error codes are shown to the user in their language (text-file-translate.jsx)
        return jsonify({"error": str(error)}), 400

    unmapped = set()
    formatted_braille_text = text_to_braille(uploaded_text, request.form.get("braille_type"),
                                             unmapped, keep_newlines=False)
    return jsonify({"result": formatted_braille_text, "uploaded": uploaded_text,
                    "unmapped": sorted(unmapped)})

@app.route('/gcode', methods=['POST'])
def generate_gcode():
    braille_text = json_body().get('braille', '')

    if not isinstance(braille_text, str) or not braille_text.strip():
        return jsonify({'error': 'Braille text is required'}), 400
    if len(braille_text) > MAX_GCODE_CHARS:
        return jsonify({'error': 'too_long', 'max_chars': MAX_GCODE_CHARS}), 413

    braille_lines = clean_braille_text(braille_text)
    has_braille = any(
        0x2800 <= ord(char) <= 0x28FF
        for line in braille_lines
        for char in line
    )

    if not has_braille:
        return jsonify({'error': 'No Braille characters were supplied'}), 400

    output_path = temp_files.new_path('.gcode')
    try:
        braille_to_gcode(braille_lines, filename=output_path)
        return security.send_and_delete(
            output_path,
            as_attachment=True,
            download_name='khmer_braille.gcode',
            mimetype='text/plain',
        )
    except (OSError, ValueError):
        logging.exception('Unable to generate G-code')
        if os.path.exists(output_path):
            os.unlink(output_path)
        return jsonify({'error': 'server'}), 500


#handle to upload text to translate to braille
@app.route('/text', methods=['POST'])

def handleTextToBraille():
    data = json_body()
    
    uploaded_text = data.get("text", "")
    if not isinstance(uploaded_text, str):
        return jsonify({"error": "bad_request"}), 400
    if len(uploaded_text) > MAX_CHARS:
        return jsonify({"error": "too_long", "max_chars": MAX_CHARS}), 413

    # Remove tabs
    uploaded_text = uploaded_text.replace('\t', ' ')

    unmapped = set()
    formatted_output = text_to_braille(uploaded_text, data.get("braille_type"), unmapped)

    # "unmapped": characters with no Braille code yet (shown to the user
    # instead of being dropped silently)
    return jsonify({"result": formatted_output, "unmapped": sorted(unmapped)})


@app.get('/math-symbols')
def list_math_symbols():
    """Math symbols that have a Braille code (from the PDFs) -> used by the
    website's equation tools to mark which symbols are already supported."""
    symbols = {**FALLBACK_SYMBOLS, **MATH_SYMBOLS}
    return jsonify({**DRAWING_MARKS, **{sym: entry["code"] for sym, entry in symbols.items()}})


def translate_for_check(text):
    """Today's translator output for one contributed example (no line wrapping)."""
    tokens = tokenize_with_math(text, keep_newlines=False)
    return "".join(format_khmer_and_braille_text(tokens, max_line_length=10**6))


@app.post('/api/contribute')
def submit_contribution():
    """Save a contribution (form fields + entries JSON + files) for the team to review."""
    if (request.content_length or 0) > contributions.MAX_REQUEST_BYTES:
        return jsonify({"error": "too_large", "max_mb": contributions.MAX_FILE_BYTES // 2**20}), 413
    form = request.form
    # Hidden "website" field: people never fill it, spam bots do. Pretend it worked.
    if form.get("website"):
        return jsonify({"id": contributions.new_submission_id()}), 201
    try:
        entries = json.loads(form.get("entries") or "[]")
        categories = json.loads(form.get("file_categories") or "[]")
    except ValueError:
        return jsonify({"error": "bad_request"}), 400
    if not isinstance(entries, list) or not isinstance(categories, list):
        return jsonify({"error": "bad_request"}), 400
    files = request.files.getlist("files")
    uploads = [(f, categories[i] if i < len(categories) else "other") for i, f in enumerate(files)]
    try:
        sub_id = contributions.save_submission(form, entries, uploads)
    except contributions.ContributionError as error:
        return jsonify({"error": error.code, **error.details}), 400
    except OSError:
        logging.exception("Unable to save contribution")
        return jsonify({"error": "server"}), 500
    logging.info("Saved contribution %s", sub_id)
    telegram_notify.notify_async("contribution", sub_id)
    return jsonify({"id": sub_id}), 201


@app.post('/api/feedback')
def submit_feedback():
    """Save a message from the Feedback page; the team reads it on the /admin page."""
    data = json_body()
    if data.get("website"):          # spam trap, as on /api/contribute
        return jsonify({"id": contributions.new_submission_id()}), 201
    try:
        feedback_id = feedback.save_feedback(data)
    except contributions.ContributionError as error:
        return jsonify({"error": error.code, **error.details}), 400
    except OSError:
        logging.exception("Unable to save feedback")
        return jsonify({"error": "server"}), 500
    telegram_notify.notify_async("feedback", feedback_id)
    return jsonify({"id": feedback_id}), 201

# def handleTextToBraille():
#     data = request.get_json()
#     uploaded_text = data.get("text", "")
#     print("Uploaded text:", uploaded_text)
#     khmer_word = word_tokenize(uploaded_text)
#     # khmer_words = segmenter.seg_gcc(uploaded_text)
#     # Format the Khmer words into Braille text lines
#     formatted_text = format_khmer_and_braille_text(khmer_word, max_line_length=42)
    
#     # Join the formatted lines into a single string
#     formatted_output = "\n".join(formatted_text)
    
#     # Corrected print statement for the formatted output
#     print(khmer_word)

#     # Return the result and Unicode data as JSON
#     return jsonify({"result": formatted_output})

    
# def handleTextToBraille():
#     data = request.get_json()
#     uploaded_text = data.get("text", "")
#     print("Upload text: ",uploaded_text)
#     text = translateKhmerToBraille(uploaded_text)
#     print(text)
#     unicode = createUnicode();
#     return jsonify({"result":text, "unicodeData":unicode})

#handle to upload braille file to translate
@app.route('/updatebraille', methods=['POST'])
def updateBrailleFile():
    if (too_large := upload_too_large()):
        return too_large
    upload = request.files.get('file')
    if upload is None or not upload.filename:
        return jsonify({"error": "no_file"}), 400
    try:
        uploaded_braille = read_upload(upload, braille=True)
    except UploadError as error:
        return jsonify({"error": str(error)}), 400

    # .brf files are read as English Braille (UEB) only; the page switches to English when told so
    braille_type = "english" if upload.filename.lower().endswith(".brf") else request.form.get("braille_type")
    translated = translate_braille(uploaded_braille, braille_type)
    return jsonify({**translated, "uploaded": uploaded_braille, "braille_type": braille_type or "khmer"})

@app.route('/braille', methods=['POST'])
def handleBrailleToText():
    try:
        data = json_body()
        uploaded_braille = data.get("braille")
        if not isinstance(uploaded_braille, str):
            return jsonify({"error": "Invalid request data"}), 400
        if len(uploaded_braille) > MAX_CHARS:
            return jsonify({"error": "too_long", "max_chars": MAX_CHARS}), 413
        return jsonify(translate_braille(uploaded_braille, data.get("braille_type")))
    except Exception:
        logging.exception("Error processing request")
        return jsonify({"error": "Internal Server Error"}), 500



if __name__ == '__main__':
    # Debug mode lets anyone who reaches it run code, so it is off unless asked for.
    app.run(debug=os.environ.get("FLASK_DEBUG") == "1")
