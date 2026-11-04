# How big a document the website handles

## The limits

They are set in `Backend/FileFormat.py`, and the website shows the same numbers
(`i18n.js` → `upload.limits`, `translate.limits`):

| Limit | Value | Error code shown to the user |
|---|---|---|
| File size | **20 MB** (`MAX_UPLOAD_MB`) | `file_too_large`. The browser refuses the file before uploading it, and the server checks again. |
| Text in one document (or typed / pasted) | **300,000 characters ≈ 200 A4 pages** (`MAX_CHARS`) | `too_long` |
| PDF pages (PDFs with their own text) | **200** (`MAX_PDF_PAGES`) | `too_many_pages` |
| Scanned PDF pages (read as pictures) | **10** (`MAX_SCAN_PAGES`) | `scan_too_long` |

The server runs gunicorn with `--timeout 120` (Dockerfile). The default of 30
seconds would cut off a long document or a scanned PDF while it is being read.

## Why these numbers (measured October 2026)

The measurements were taken on a laptop (Intel i5-1235U, 16 GB), using real
Khmer sentences from the website.

**Page size.** Word lays out 20,000 Khmer characters (Khmer OS Siemreap 12pt,
A4) on 13 pages, so one page is about 1,540 characters. 300,000 characters is
therefore about 200 pages.

**Time per step.** Each step grows in a straight line with the size of the text:

| Characters (≈ pages) | Read Word file | Khmer → Braille | Braille → Khmer | G-code |
|---|---|---|---|---|
| 50,000 (≈ 33) | 0.0 s | 0.6 s | 0.3 s | 0.2 s |
| 150,000 (≈ 100) | 0.1 s | 1.9 s | 0.8 s | 0.6 s |
| 300,000 (≈ 200) | 0.1 s | 3.9 s | 1.6 s | 1.2 s |
| 600,000 (≈ 390) | 0.1 s | 7.8 s | 3.1 s | 2.2 s |

**Memory and PDFs.**

* Memory stays small: about +5 MB per request.
* The word-splitting model loads once, about 80 MB and a few seconds, on the first translation after the server starts.
* Reading the text layer of a 100-page PDF takes 0.05 s.

**Through the website.** A 295,000-character Word file (about 190 pages) went
from "Choose file" to the finished Braille in 9.9 s. That covers two
translation requests: the upload, and one refresh of the result.

**Scanned PDFs.** Every page is turned into a 300 dpi picture and read by
Tesseract. This was not measured, because Tesseract is not installed on the
test laptop. It typically takes a few seconds per page, so 10 pages stay
inside the 120-second limit, with Word or .txt recommended instead.

## If you change a limit

1. Change it in `FileFormat.py`, `MAX_UPLOAD_BYTES` in `file-upload-dialog.jsx`, and `MAX_CHARS` in `translation-page.jsx`.
2. Update the texts in `i18n.js` (`limits` and the error messages) and the Help page item "File size" (`guideline-page.jsx`).
3. Keep one request well under the gunicorn timeout. Allow for the server being 2–3 times slower than the laptop above, and for 4 workers sharing it.

Tests: `Backend/tests/test_uploads.py` (the limits) and `test_reading.py` (the routes refuse oversized requests).
