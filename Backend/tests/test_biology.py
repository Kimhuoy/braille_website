"""
Golden tests for the Biology page of the Krousar Thmey handbook (p.46).
Unlike test_math_braille.py, spaces are compared too: in a genetic cross they
separate the genotypes (AA 2Aa aa).

Run:  python -I -X utf8 Backend/tests/test_biology.py      (from the repo root)
"""
import contextlib
import io
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))

with contextlib.redirect_stdout(io.StringIO()):     # the translator prints debug output
    import main  # noqa: E402
import contributions  # noqa: E402

STRIKE = "̶"

# (input, handbook Braille ASCII). Equations are written between ⟦ ⟧.
CASES = [
    ("⟦Aa × Aa⟧",                 ",aa @* ,aa"),
    ("⟦↓⟧",                       "$%33o"),
    ("⟦AA 2Aa aa⟧",               ",a,a #2,aa aa"),
    ("⟦Aa × Aa ↓ AA 2Aa aa⟧",     ",aa @* ,aa $%33o ,a,a #2,aa aa"),
    ("♂",                         "m$o"),
    ("♀",                         "f_="),
    ("VIP",                       ",,vip"),
    ("A B C",                     ",a ,b ,c"),
    ("⟦a" + STRIKE + "⟧",          "[a]"),
    ("⟦(a, b, c)" + STRIKE + "⟧",  "[a, b, c]"),
    ("⟦(A, B, C)" + STRIKE + "⟧",  "[,a, ,b, ,c]"),
    ("ADN",                       ",,adn"),
    ("P.M.H.",                    ",p4 ,m4 ,h4"),
]


def to_ascii(cells):
    return "".join(contributions.CELL_TO_ASCII.get(c, c) for c in cells)


def translate(text):
    with contextlib.redirect_stdout(io.StringIO()):
        return to_ascii(main.translate_for_check(text))


def run():
    failures = 0
    for text, want in CASES:
        got = translate(text)
        ok = got == want
        failures += not ok
        print(f"{'PASS' if ok else 'FAIL'}  {text:26} -> {got:34} handbook {want}")

    # pasted text with a stroke on every character is one struck group
    assert translate("⟦a" + STRIKE + " " + STRIKE + "," + STRIKE + " " + STRIKE + "b" + STRIKE + "⟧") == "[a, b]"
    # abbreviations and capital words inside Khmer text
    assert translate("គឺ P.M.H. និង ADN").endswith(",p4 ,m4 ,h4 ,n/] ,,adn")
    # one letter is not a "word in capitals"
    assert translate("A") == ",a"
    # spaces next to + and = are still ignored, as before (handbook math pages)
    assert translate("⟦x + 1 = 2⟧") == translate("⟦x+1=2⟧")
    print("PASS  struck pasted text, abbreviations in sentences, unchanged math spacing")

    print(f"\n{len(CASES) - failures}/{len(CASES)} Biology p.46 examples match")
    return failures


if __name__ == "__main__":
    sys.exit(1 if run() else 0)
