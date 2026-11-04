# Cambodia Braille System

A website that translates between Khmer or English text and Braille, and produces G-code for a Braille embosser. It handles Khmer complex script, math, chemistry and biology notation.

It is built by the Institute of Digital Research and Innovation (IDRI) at the Cambodia Academy of Digital Technology (CADT), with the National Institute for Special Education (NISE) and Krousar Thmey. Krousar Thmey's Khmer Braille handbooks are the reference for the translation rules.

## Features

- **Two-way translation:** text to Braille and Braille to text, in Khmer Braille or English Braille (UEB uncontracted).
- **Math and science:** math, chemistry and biology symbols, with an equation ribbon for typing them.
- **File upload:** `.txt`, `.docx` and `.pdf`, including scanned PDFs through OCR. Braille uploads also accept `.brf`, `.brl` and `.pef`.
- **Downloads:** text, Word, Braille ASCII (`.brf`) and G-code for the embosser.
- **Read aloud:** English text is read with the browser's speech engine.
- **Khmer and English interface.**
- **Optional forms:** Feedback and Contribute pages with an admin inbox. These are off by default.

## How it fits together

| Part | Stack | Role |
|---|---|---|
| `Frontend/` | React 18, Vite, Tailwind CSS, Zustand | The website |
| `Backend/` | Python 3.11, Flask, PyMuPDF, khmer-nltk, Tesseract | Translation, file reading, G-code |
| `file-to-gcode.zip` | Python | Separate command-line tool: document to G-code and a Braille PDF |

In production, one Docker container runs Flask under gunicorn and serves both the API and the built frontend.

```
Backend/
  main.py                    Flask app and routes
  KhmerToBrailleLogic.py     Khmer to Braille
  BrailleToKhmerLogic.py     Braille to Khmer
  english_braille.py         English Braille, both directions
  math_braille.py            Math and science notation
  BrailleToGcodeV2.py        Braille to embosser G-code
  FileFormat.py              Reads uploads; sets the size limits
  security.py                Security headers, rate limits, CORS
  admin.py, contributions.py, feedback.py, telegram_notify.py    Optional forms backend
  *.json                     Braille dictionaries
  docs/                      Design notes and operations guides
  tests/
Frontend/src/
  Components/                Pages and UI
  config/                    API address and forms switches
  data/                      Symbol catalog and equation templates
  i18n.js                    Interface text in Khmer and English
```

## Getting started

You need Python 3.11 and Node.js 22. [Tesseract](https://github.com/tesseract-ocr/tesseract) with Khmer language data is only needed to read scanned PDFs.

**1. Start the backend** on <http://localhost:5000>:

```bash
cd Backend
python -m venv venv
venv\Scripts\activate          # macOS/Linux: source venv/bin/activate
pip install -r requirements.txt
python main.py
```

The first translation after a start takes a few seconds while the word-splitting model loads.

**2. Start the frontend** in a second terminal, on <http://localhost:5173>:

```bash
cd Frontend
npm ci
npm run dev
```

### Run with Docker

This builds the frontend and backend into one image, which listens on port 80:

```bash
docker build -t braille-web .
docker run -p 8080:80 -v braille-data:/data braille-web
```

Then open <http://localhost:8080>. The `/data` volume keeps feedback and contributions across deploys, if the forms are switched on.

## Testing

The tests are plain Python scripts. Run them from the repository root with the backend's virtual environment active:

```bash
python -I -X utf8 Backend/tests/test_math_braille.py
```

To run them all:

```bash
# Bash
for t in Backend/tests/test_*.py; do python -I -X utf8 "$t" || echo "FAILED: $t"; done
```

```powershell
# PowerShell
Get-ChildItem Backend/tests/test_*.py | ForEach-Object { python -I -X utf8 $_.FullName }
```

`test_file_to_gcode.py` and `test_gcode_end_to_end.py` also need the command-line tool. Extract `file-to-gcode.zip` into the repository root first, or they stop with `No module named 'file_to_gcode'`.

## Configuration

Everything has a working default for local development.

**Backend** (environment variables):

| Variable | Purpose | Default |
|---|---|---|
| `FLASK_DEBUG` | `1` turns on Flask debug mode. Never use it on a server. | off |
| `CORS_ORIGINS` | Origins allowed to call the API | `http://localhost:5173,http://127.0.0.1:5173` |
| `TRUSTED_PROXY_HOPS` | Number of proxies in front of the app | `1` |
| `RATE_LIMIT_DB` | Location of the rate-limit database | System temp folder |
| `FORMS_BACKEND` | `on` enables the forms routes and `/api/admin` | off |
| `ADMIN_PASSWORD` | Password for the `/admin` page | None |
| `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` | Telegram notifications for form submissions | None |
| `CONTRIBUTIONS_DIR`, `FEEDBACK_DIR` | Where submissions are stored | `Backend/contributions`, `Backend/feedback` (`/data/...` in Docker) |
| `FORMS_API_ORIGIN` | Address of a separate forms service, if one is used | None |

**Frontend** (read at build time):

| Variable | Purpose | Default |
|---|---|---|
| `VITE_API_BASE_URL` | Backend address | `http://localhost:5000` in development, same origin in production |
| `VITE_FORMS_API_URL` | Where the forms send data; empty keeps them closed | Empty |
| `VITE_ADMIN_PAGE` | `on` enables the `/admin` page | off |

Everything in the frontend is visible to visitors, so never put a secret in a `VITE_` variable.

To open the forms, follow [forms-backend-handoff.md](Backend/docs/forms-backend-handoff.md).

## API

| Method and path | Purpose |
|---|---|
| `POST /text` | Text to Braille. JSON: `text`, `braille_type` |
| `POST /braille` | Braille to text. JSON: `braille`, `braille_type` |
| `POST /updateTextFile` | Text document to Braille. Form: `file`, `braille_type` |
| `POST /updatebraille` | Braille document to text. Form: `file`, `braille_type` |
| `POST /gcode` | Braille to a G-code download. JSON: `braille` |
| `GET /math-symbols` | Math symbols that have a Braille code |
| `GET /health` | Health check |
| `POST /api/feedback`, `POST /api/contribute`, `/api/admin/*` | Forms backend; returns 404 unless `FORMS_BACKEND=on` |

`braille_type` is `khmer` or `english`. For example:

```bash
curl -X POST http://localhost:5000/text \
  -H "Content-Type: application/json" \
  -d '{"text": "hello", "braille_type": "english"}'
```

```json
{"result": "⠓⠑⠇⠇⠕", "unmapped": []}
```

`unmapped` lists characters that have no Braille code yet.

## Upload limits

| Limit | Value |
|---|---|
| File size | 20 MB |
| Text in one document | 300,000 characters (about 200 A4 pages) |
| PDF pages with their own text | 200 |
| Scanned PDF pages | 10 |

These are set in `Backend/FileFormat.py`. [upload-limits.md](Backend/docs/upload-limits.md) explains how they were chosen.

## File to G-code tool

`file-to-gcode.zip` contains a command-line tool that needs no website. It turns a document into G-code and a PDF preview of the Braille:

```bash
python file_to_gcode.py lesson.docx
```

It has its own copy of the translation code, so a fix made in `Backend/` has to be made in the tool by hand. Full usage is in the `README.md` inside the zip.

## Deployment

Every push to `main` runs [cd.yml](.github/workflows/cd.yml), which builds the image, pushes it to GitHub Container Registry and deploys it to the Docker Swarm server over SSH. Set a new `IMAGE_TAG` in that file for each release.

Server setup, Cloudflare and domain names are covered in [security.md](Backend/docs/security.md).

## Documentation

| Guide | Covers |
|---|---|
| [braille-reading.md](Backend/docs/braille-reading.md) | How Khmer and English Braille are read |
| [math_braille.md](Backend/docs/math_braille.md) | How math and chemistry are translated |
| [braille-math-notation-rules.md](Frontend/docs/braille-math-notation-rules.md) | Khmer Braille math notation rules |
| [contributions.md](Backend/docs/contributions.md) | How submitted resources are reviewed and added |
| [forms-backend-handoff.md](Backend/docs/forms-backend-handoff.md) | Setting up the Feedback and Contribute backend |
| [security.md](Backend/docs/security.md) | Security, server setup and domain names |
| [upload-limits.md](Backend/docs/upload-limits.md) | Document size limits and measurements |
