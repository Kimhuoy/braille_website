"""
English Braille: Unified English Braille (UEB), uncontracted (grade 1).

    to_braille("Hello, VIP 2a")  ->  ⠠⠓⠑⠇⠇⠕⠂⠀⠠⠠⠧⠊⠏⠀⠼⠃⠰⠁
    to_english("⠠⠓⠑⠇⠇⠕⠂")      ->  Hello,

Codes are written as dot numbers, as in "The Rules of Unified English
Braille" (2013), so the Braille team can check them. They were checked
against liblouis (tables/en-ueb-chardefs.uti and en-ueb-g1.ctb).

Also: find English words inside Khmer Braille (english_words_in_khmer), where
English letters use the same cells as Khmer letters and are not marked.
"""
import json
import os
import re

from spellchecker import SpellChecker


def _cell(dots):
    """'2356' -> ⠶"""
    return chr(0x2800 + sum(1 << (int(d) - 1) for d in dots))


def _cells(seq):
    """'5-126' -> ⠐⠣"""
    return "".join(_cell(d) for d in seq.split("-"))


LETTER_DOTS = {
    "a": "1", "b": "12", "c": "14", "d": "145", "e": "15", "f": "124", "g": "1245",
    "h": "125", "i": "24", "j": "245", "k": "13", "l": "123", "m": "134", "n": "1345",
    "o": "135", "p": "1234", "q": "12345", "r": "1235", "s": "234", "t": "2345",
    "u": "136", "v": "1236", "w": "2456", "x": "1346", "y": "13456", "z": "1356",
}
LETTERS = {k: _cell(v) for k, v in LETTER_DOTS.items()}
CELL_LETTER = {v: k for k, v in LETTERS.items()}
DIGITS = {d: LETTERS[l] for d, l in zip("1234567890", "abcdefghij")}   # after the number sign
CELL_DIGIT = {v: k for k, v in DIGITS.items()}

NUMBER = _cell("3456")
CAPITAL = _cell("6")
CAPS_WORD = _cells("6-6")
CAPS_PASSAGE = _cells("6-6-6")
CAPS_END = _cells("6-3")
GRADE1 = _cell("56")          # grade 1 indicator: a letter a-j right after a number
SPACE = "⠀"
# Level indicators for H₂O, Cu²⁺ (UEB Rules 11.4): one item, or a group in ⠣ ⠜
SUBSCRIPT, SUPERSCRIPT = _cell("26"), _cell("35")
GROUP_OPEN, GROUP_CLOSE = _cell("126"), _cell("345")
SUBSCRIPT_CHARS = dict(zip("₀₁₂₃₄₅₆₇₈₉₊₋₌₍₎", "0123456789+-=()"))
SUPERSCRIPT_CHARS = dict(zip("⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻⁼⁽⁾ⁿ", "0123456789+-=()n"))

# char -> dots (UEB Rules / liblouis en-ueb-chardefs.uti)
SYMBOL_DOTS = {
    ",": "2", ";": "23", ":": "25", ".": "256", "!": "235", "?": "236", "'": "3", "-": "36",
    "“": "236", "”": "356", "‘": "6-236", "’": "6-356", '"': "6-2356",
    "(": "5-126", ")": "5-345", "[": "46-126", "]": "46-345", "{": "456-126", "}": "456-345",
    "/": "456-34", "&": "4-12346", "@": "4-1", "*": "5-35", "%": "46-356", "$": "4-234",
    "#": "456-1456", "_": "46-36", "|": "456-1256", "+": "5-235", "=": "5-2356",
    "<": "4-126", ">": "4-345", "×": "5-236", "÷": "5-34", "−": "5-36",
    "°": "45-245", "£": "4-123", "€": "4-15", "—": "6-36", "–": "6-36", "…": "256-256-256",
}
SYMBOLS = {k: _cells(v) for k, v in SYMBOL_DOTS.items()}
# back-translation: longest sequences first; – reads back as — and ' as ' (not ’)
CELL_SYMBOL = {}
for _ch, _code in sorted(SYMBOLS.items(), key=lambda kv: -len(kv[1])):
    if _ch not in ("–", "“"):
        CELL_SYMBOL.setdefault(_code, _ch)
QUESTION = SYMBOLS["?"]       # also the opening double quote “ (same cell, told apart by position)
UNKNOWN = "[_]"               # same mark as the Khmer back-translator


# ---------------------------------------------------------------------------
# English text -> English Braille

def _word_to_braille(word):
    """A run of letters: ,,vip for VIP, ,hello for Hello, ,mac,donald for MacDonald."""
    if len(word) >= 2 and word.isupper():
        return CAPS_WORD + "".join(LETTERS[c.lower()] for c in word)
    return "".join((CAPITAL if c.isupper() else "") + LETTERS[c.lower()] for c in word)


def to_braille(text, unmapped=None):
    out, i, n = [], 0, len(text)
    while i < n:
        c = text[i]
        if c == "\n":
            out.append("\n")
            i += 1
        elif c.isspace():
            out.append(SPACE)
            i += 1
        elif c in SUBSCRIPT_CHARS or c in SUPERSCRIPT_CHARS:
            table = SUBSCRIPT_CHARS if c in SUBSCRIPT_CHARS else SUPERSCRIPT_CHARS
            j = i
            while j < n and text[j] in table:
                j += 1
            level = "".join(table[ch] for ch in text[i:j])
            body = to_braille(level, unmapped)
            if len(level) > 1 and not level.isdigit():     # Cu²⁺ -> ⠔⠣⠼⠃⠐⠖⠜
                body = GROUP_OPEN + body + GROUP_CLOSE
            out.append((SUBSCRIPT if table is SUBSCRIPT_CHARS else SUPERSCRIPT) + body)
            i = j
        elif c in "0123456789":
            # #ab.c : the number sign once, then a-j; . and , inside a number
            j = i + 1
            while j < n and (text[j] in "0123456789" or (text[j] in ".," and j + 1 < n and text[j + 1] in "0123456789")):
                j += 1
            out.append(NUMBER + "".join(DIGITS.get(d) or SYMBOLS[d] for d in text[i:j]))
            if j < n and text[j].lower() in "abcdefghij" and text[j].islower():
                out.append(GRADE1)          # 2a -> #b;a, else "a" would read as a digit
            i = j
        elif c.isascii() and c.isalpha():
            j = i
            while j < n and text[j].isascii() and text[j].isalpha():
                j += 1
            out.append(_word_to_braille(text[i:j]))
            i = j
        elif c == '"':
            # straight quote: opening at the start of a word, closing otherwise
            opening = i == 0 or text[i - 1].isspace() or text[i - 1] in "([{"
            out.append(SYMBOLS["“" if opening else "”"])
            i += 1
        elif c in SYMBOLS:
            out.append(SYMBOLS[c])
            i += 1
        else:
            if unmapped is not None:
                unmapped.add(c)
            i += 1
    return "".join(out)


# ---------------------------------------------------------------------------
# English Braille -> English text

def to_english(braille):
    """Back-translate uncontracted UEB, line by line."""
    return "\n".join(_line_to_english(line) for line in braille.split("\n"))


def _line_to_english(cells):
    out = []
    caps = None            # None, "letter", "word" or "passage"
    numeric = False
    i, n = 0, len(cells)

    def at_word_start():
        return not out or out[-1] in (" ", "(", "[", "{")

    while i < n:
        c = cells[i]
        rest = cells[i:]
        if c in (SPACE, " "):
            out.append(" ")
            numeric = False
            if caps != "passage":
                caps = None
            i += 1
            continue
        if rest.startswith(CAPS_END):
            caps = None
            i += len(CAPS_END)
            continue
        if rest.startswith(CAPS_PASSAGE):
            caps, i = "passage", i + 3
            continue
        if rest.startswith(CAPS_WORD) and i + 2 < n and cells[i + 2] in CELL_LETTER:
            caps, i = "word", i + 2
            continue
        if c == CAPITAL and i + 1 < n and cells[i + 1] in CELL_LETTER:
            caps, i = caps or "letter", i + 1
            if caps == "letter":
                out.append(CELL_LETTER[cells[i]].upper())
                caps = None
                i += 1
            continue
        if c == NUMBER and i + 1 < n and cells[i + 1] in CELL_DIGIT:
            numeric, i = True, i + 1
            continue
        if numeric:
            if c in CELL_DIGIT:
                out.append(CELL_DIGIT[c])
                i += 1
                continue
            if c in (SYMBOLS["."], SYMBOLS[","]) and i + 1 < n and cells[i + 1] in CELL_DIGIT:
                out.append("." if c == SYMBOLS["."] else ",")
                i += 1
                continue
            numeric = False
        if c == GRADE1:
            if i + 1 < n and cells[i + 1] == QUESTION:      # liblouis writes ? as ;8
                out.append("?")
                i += 2
            else:
                i += 1
            continue
        if c in CELL_LETTER:
            letter = CELL_LETTER[c]
            out.append(letter.upper() if caps in ("word", "passage") else letter)
            i += 1
            continue
        if c == QUESTION:
            out.append("“" if at_word_start() and i + 1 < n and cells[i + 1] not in (SPACE, " ") else "?")
            i += 1
            continue
        for length in (3, 2, 1):
            code = cells[i:i + length]
            if len(code) == length and code in CELL_SYMBOL:
                out.append(CELL_SYMBOL[code])
                i += length
                break
        else:
            out.append(UNKNOWN)
            i += 1
    return "".join(out)


# ---------------------------------------------------------------------------
# English words inside Khmer Braille
#
# The Khmer -> Braille translator writes English words letter by letter with
# no marker, and English letters share cells with Khmer letters (⠛ = g = ក).
# A word (between spaces) is taken as English when its cells are only letters
# with capital signs and it reads as an English word. Short words are often
# real Khmer too, so they are only suggested (the user switches them).

_DIR = os.path.dirname(os.path.abspath(__file__))
with open(os.path.join(_DIR, "khmer_to_english_dictionary.json"), encoding="utf-8") as _f:
    _KHMER_CODES = set(json.load(_f).values())
# ,x codes that are Khmer letters (,g = គ). A capital sign before any other
# letter (,h ,a ...) cannot be Khmer, so that word is English.
_KHMER_CAPITAL_LETTERS = {code[1] for code in _KHMER_CODES if len(code) == 2 and code[0] == ","}
_english = SpellChecker()

_WORD_RE = re.compile("^(" + re.escape(CAPS_WORD) + ")?((?:" + re.escape(CAPITAL) + ")?["
                      + "".join(LETTERS.values()) + "])+$")
_TRAILING = (SYMBOLS["."], SYMBOLS[","], SYMBOLS["!"], SYMBOLS["?"])


def classify_word(cells):
    """
    For one Braille word of Khmer Braille: None (Khmer), or
    {"english": text, "certain": bool, "default": "english" | "khmer"}.
    """
    core = cells.rstrip("".join(_TRAILING))
    tail = cells[len(core):]
    if not core or not _WORD_RE.match(core):
        return None
    english = to_english(core)
    letters = english.lower()
    if core.startswith(CAPS_WORD):                      # ,,vip -> VIP
        certain = len(letters) >= 2
    else:
        capitals = [core[k + 1] for k, ch in enumerate(core) if ch == CAPITAL]
        if any(CELL_LETTER[c] not in _KHMER_CAPITAL_LETTERS for c in capitals):
            certain = len(letters) >= 2                 # ,h ,a ... are never Khmer
        elif letters in _english and len(letters) >= 2:
            certain = len(letters) >= 4
        else:
            return None
    return {
        "english": english + to_english(tail),
        "certain": certain,
        "default": "english" if certain else "khmer",
    }
