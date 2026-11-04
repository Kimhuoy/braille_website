# Reading Braille: Khmer Braille, English Braille, and English words inside Khmer

The website has two **Braille types**. The user picks one; it is sent to the
backend as `braille_type` (`"khmer"` or `"english"`) on `/text`, `/braille`,
`/updateTextFile` and `/updatebraille`.

## English Braille: UEB uncontracted (`english_braille.py`)

* One cell per letter, both directions (`to_braille`, `to_english`).
* **Capitals**: capital letter `,`, capital word `,,`, capital passage `,,,`, terminator `,'`.
* **Numbers**: the number sign `#`, then a–j. `.` and `,` can appear inside a number. A letter a–j right after a number gets the grade 1 indicator `;` (`2a` → `#b;a`).
* **Punctuation and signs**: written as dot numbers in `SYMBOL_DOTS`, checked against liblouis (`en-ueb-chardefs.uti`).
* **Positional readings**: `236` is `?` at the end of a word and `“` at the start, and liblouis's `;8` also reads as `?`.
* **Not supported**: contracted English Braille (Grade 2). It would need liblouis rather than a hand-made table.

## English words inside Khmer Braille

The Khmer translator writes English words letter by letter, without a marker,
and English letters share cells with Khmer letters (`⠛` = g = ក). So when
reading Khmer Braille, `english_braille.classify_word` checks each Braille word
(text between spaces). A word counts as an English candidate when it is made
only of letters and capital signs, and:

* **`,,word`** (capitals) → English, sure.
* **A capital sign before a letter that is never a Khmer `,x` code** (`,h`, `,a` …) → English, sure.
* **An English dictionary word** (pyspellchecker), 4 or more letters → English, sure.
* **An English dictionary word of 2–3 letters** → only suggested; it stays Khmer, and the user can switch it.

`main.translate_braille` returns `parts` and `words`. Each word carries both
readings, so the page can show it as a chip the user clicks to switch.

## Khmer round trips (Khmer → Braille → Khmer)

Measured on the 874 Khmer words used on the website itself: **91.6% → 99.3%** exact.

* **The reader now follows the writing dictionary** (`khmer_to_english_dictionary.json`) wherever the two disagree. The reading table had ោះ and "!" swapped, and was missing ុំ (`$`).
* **Vowels េ ែ ៃ ើ and ្រ move past the whole consonant cluster**: ក្មេង, not កេ្មង; ស្ត្រ, not ស្រ្ត.
* **Writing**: ាំ ុំ ោះ stay in place when a sign follows (ចំណាំ៖), and a number inside a word gets its number sign (ទី២ → `,te#b`).

What is left:

* **ឱ / ឲ**: they share a cell, and both spellings are valid.
* **One rare ៊ + vowel order** (អ៊ីម៊ែល).

Tests: `python -I -X utf8 Backend/tests/test_reading.py`.
