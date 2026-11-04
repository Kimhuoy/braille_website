# Contributions: how institutes send resources and how we add them

The website's **Contribute** page (`/contribute`, `Frontend/src/Components/Home/contribute-page.jsx`)
lets institutes, teachers and Braille experts send us:

| What | Stored as entry type | Goes into (after review) |
|---|---|---|
| A Khmer character / sign and its Braille | `character` | `khmer_to_english_dictionary.json` |
| A math / science symbol and its Braille | `symbol` | `math_symbols.json` |
| A word or sentence and its correct Braille | `example` | `tests/contributed_examples.json` |
| Documents (original + Braille version, handbooks, standards) | files | read by the team, used as test material |

Braille can be typed as Braille ASCII (SimBraille keys) or pasted as Unicode
dots; both are normalised to Braille ASCII, the format the dictionaries use.

Nothing goes into the live system automatically. Every submission is saved for
review, and a team member merges it with `contributions.py`.

> The backend for this page is currently off and the page says it is not open yet:
> see [forms-backend-handoff.md](forms-backend-handoff.md). This document describes how it works once it is on.

## 1. Server setup (once)

Submissions are written to `CONTRIBUTIONS_DIR` and feedback to `FEEDBACK_DIR`
(`/data/contributions` and `/data/feedback` in the container). **The container is
replaced on every deploy, so without a volume at `/data` everything is lost.**
The stack settings are in [security.md](security.md#1-server-setup).

The team reads and manages everything on the website's password-protected
`/admin` page. There is no email or other outside service. Merging still needs
the folder on your machine, as below.

`Backend/contributions/` and `Backend/feedback/` are in `.gitignore` and
`.dockerignore`: they can contain people's names and contact details and must never be committed.

## 2. What a submission looks like

```
<CONTRIBUTIONS_DIR>/20261024-083015-a1b2c3/
    submission.json
    files/01-original-lesson1.docx
    files/02-braille-lesson1.brf
```

`submission.json` holds the contributor (name, organization, contact, all
optional; older records have email and phone instead of contact), their notes, the consent flag, each entry (type, text, Braille as typed,
normalised `braille_ascii`, `kind` for symbols, meaning, source, and its
status when received), and the file list with each file's original name and
category (`original`, `braille`, `handbook`, `other`). File names are made
safe on disk, which removes Khmer letters, so use `original_name` to see what
the contributor called the file.

Limits (in `contributions.py`): 500 entries, 10 files, 20 MB per file, 100 MB in
one submission. A file's content must match its extension (see `FILE_SIGNATURES`).

## 3. Reviewing and merging

On `/admin`, open the contribution, choose **Download everything (.zip)**, and
unzip it into `Backend/contributions/`. Then, from the repo root:

```bash
python Backend/contributions.py list
python Backend/contributions.py show 20261024-083015-a1b2c3
python Backend/contributions.py merge 20261024-083015-a1b2c3 --dry-run
python Backend/contributions.py merge 20261024-083015-a1b2c3 --rows 1,2,5
```

Use `--dir <folder>` (before the command) if the submissions are somewhere else.

`show` re-checks every entry against **today's** dictionaries:

* `new`: not in our dictionary. `merge` adds it.
* `same`: we already have it. `merge` skips it.
* `different`: we have this character/symbol with a different code. `merge`
  never overwrites. Compare the contributor's source with ours, and edit the
  dictionary by hand if they are right.
* `invalid`: a field is missing or the Braille contains non-Braille characters.

What `merge` does:

* **character** entries are appended to the end of
  `khmer_to_english_dictionary.json` as text, so the hand-made formatting
  (CRLF, `\u` escapes) is kept and the git diff shows only the new lines.
  Entries of more than one character are **not** merged: `khmer_to_braille()`
  looks Khmer up one character at a time (plus the vowel combinations in its
  `combos` list), so a longer key would never be used. Add those by hand only
  together with a code change that uses them.
* **symbol** entries are added to `math_symbols.json` with
  `source: "Contributed by <organization> (<id>): <their source>"`. They need a
  `kind` (`op`, `rel`, `reset`, `shape`, `sup`; see `_about` in that file). If
  the contributor chose "Not sure", set `kind` in `submission.json`, then merge
  again.
* **example** entries are appended to `tests/contributed_examples.json`.
* The submission is marked `"status": "merged"`, with the merged rows and the
  time.

Then:

1. Run the tests: `python -I Backend/tests/test_math_braille.py` and
   `python -I Backend/tests/test_contributions.py`.
2. Read the git diff of the dictionaries.
3. Commit and deploy as usual.
4. On `/admin`, set the contribution to **Done**. If the contributor left a way to
   reach them, thank them and say what was added.

## 4. Documents

Documents are not merged automatically. Typical uses:

* An **original + Braille** pair (same name, categories `original` and
  `braille`) is a ready-made test: translate the original on the website and
  compare it with their Braille version. Any differences show missing
  dictionary entries or translator rules.
* **Handbooks / standards** are the reference for new codes. Put the page
  number in each dictionary entry's `source`, as `math_symbols.json` already
  does.

## 5. API (used by the page)

The API lives under `/api/` because `/contribute` and `/feedback` are website
pages: the server must return the page for a GET on those paths.

* `POST /api/contribute`: multipart form with `consent=true`, and optionally `name`,
  `organization`, `contact`, `notes`, `lang`, `entries` (JSON list),
  `file_categories` (JSON list, same order as files), and `files`.
  Returns `201 {"id": ...}`, or `400 {"error": <code>, ...}`, where the code is
  one the page translates (`no_consent`, `empty`, `invalid_entries`,
  `too_many_entries`, `too_many_files`, `file_type`, `file_too_large`,
  `storage_full`), `413 {"error": "too_large"}`, or `429 {"error": "rate_limited"}`.
  A hidden `website` field acts as a spam trap.
