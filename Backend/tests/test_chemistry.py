"""
Chemistry, Krousar Thmey handbook pages 40-45: drawings (Lewis structures and
structural formulas), valence signs, and formulas typed as plain text.

Expected values are read from the handbook's Braille dots (scans in
Dataset/chemistry/0040-0045.jpg). Drawings are compared line by line, with
the columns the website gives them (the handbook's layout is hand-made and
not always on whole cells).

Run:  python -I -X utf8 Backend/tests/test_chemistry.py      (from the repo root)
"""
import contextlib
import io
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))

with contextlib.redirect_stdout(io.StringIO()):
    import main  # noqa: E402
import english_braille  # noqa: E402
from math_braille import cells_to_ascii, mark_formulas, math_to_ascii  # noqa: E402

# (print drawing, Braille ASCII lines, handbook example)
DRAWINGS = [
    # atoms (p.40-41)
    ("\n ◦\nH", [",", ",h"], "p.40 H"),
    ("\n  ◦\n◦ C ◦\n  ◦", ["  ,", '" ,c 1', "  @"], "p.40 C"),
    ("\n  ◦\n◦ N ◦\n  —", ["  ,", '" ,n 1', "  ca"], "p.40 N"),
    ("\n  ◦\n| O ◦\n  —", ["  ,", "_ ,o 1", "  ca"], "p.40 O"),
    ("\n◦\nNa", [" ,", ",na"], "p.41 Na"),
    ("\n  ◦\n| Cl |\n  —", ["   ,", "_ ,cl l", "  ca"], "p.41 Cl"),
    ("\n—\nHe", ["-'", ",he"], "p.41 He"),
    ("\n —\n|Ne|\n —", [" -'", "_,nel", " ca"], "p.41 Ne"),
    # molecules (p.41-43)
    ("\nA· B·\n⏟", ['",a1 ,b1%.)]'], "p.41 ex.4"),
    ("\nA (··) B", [",a &11y ,b"], "p.41 ex.5"),
    ("\n /O\\\n ⋰⋱\nH  H", ["_,ol", "ie", ",h ,h"], "p.41 ex.6"),
    ("\n /O\\\n / \\\nH   H", ["_,ol", ",i e'", ",h ,h"], "p.41 ex.7"),
    ("\n     H\n     :\nH .. C ..H\n     :\n     H\n⏟",
     ["       ,h", "        .", '",h 11 ,c 11,h%.)]', "        .", "       ,h"], "p.42 ex.8"),
    ("\n   H\n   |\nH— C —H\n   |\n   H",
     ["     ,h", "      _", ",h31 ,c 31,h", "      _", "     ,h"], "p.42 ex.9"),
    ("\n—    —\nO :: O\n—    —\n⏟", [" -'   -'", '",o 7 ,o%.)]', " ca   ca"], "p.42 ex.10"),
    ("\n—   —\nO = O\n—   —\n⏟", [" -'    -'", '",o 72 ,o%.)]', " ca    ca"], "p.42 ex.11"),
    # p.42 ex.12 prints ⠉⠁ (bar below) above the O atoms too, and dot 3 for the
    # capital sign of the second O; the website follows the table (p.44: bar above 36,3)
    ("\n—         —\nO :: C :: O\n—         —\n⏟", [" -'        -'", '",o 7 ,c 7 ,o%.)]', " ca        ca"], "p.42 ex.12"),
    ("\n|N ⋮⋮ N|\n⏟", ['"_,n _l ,nl%.)]'], "p.42 ex.13"),
    ("\n|N ≡ N|\n⏟", ['"_,n =l ,nl%.)]'], "p.42 ex.14"),
    ("\n    H    H    H\n    |    |    |\nH — C —  C —  C — H\n    |    |    |\n    H    H    H",
     ["      ,h    ,h    ,h", "       _     _     _", ",h 31 ,c 31 ,c 31 ,c 31 ,h",
      "       _     _     _", "      ,h    ,h    ,h"], "p.43 ex.15"),
]

# Formulas typed without the equation tools: the number is a subscript (lower cell)
PLAIN = [
    ("H2O", ",h2,o"),
    ("H₂O", ",h2,o"),
    ("ទឹក H2O", ",t[g ,h2,o"),
    ("H2SO4", ",h2,s,o4"),
    ("NH4Cl", ",n,h4,cl"),
    ("CO2", ",c,o2"),
    ("O2", ",o2"),
    ("2H2O", "#2,h2,o"),
    ("Cu²⁺", ",cu^2+"),
    # left alone: not formulas
    ("B12", ",b#ab"),
    ("A4", ",a#d"),
    ("VIP", ",,vip"),
]


def quiet(fn, *args):
    with contextlib.redirect_stdout(io.StringIO()):
        return fn(*args)


def run():
    failures = 0
    for drawing, want, source in DRAWINGS:
        unmapped = set()
        got = math_to_ascii(drawing, unmapped).split("\n")
        ok = got == want and not unmapped
        failures += not ok
        print(f"{'PASS' if ok else 'FAIL'}  {source:12} {' | '.join(got)}")
        if not ok:
            print(f"      want         {' | '.join(want)}   unmapped={sorted(unmapped)}")

    # valence signs (p.45): dots 456 before the number sign
    for sign, want in (("Ⅰ", "_#1"), ("Ⅱ", "_#2"), ("Ⅲ", "_#3")):
        assert math_to_ascii(sign) == want, (sign, math_to_ascii(sign))
    print("PASS  valence signs I II III -> _#1 _#2 _#3")

    for text, want in PLAIN:
        got = cells_to_ascii(quiet(main.text_to_braille, text, "khmer", set()).replace("⠀", " "))
        ok = got.replace(" ", "") == want.replace(" ", "")
        failures += not ok
        print(f"{'PASS' if ok else 'FAIL'}  plain {text:10} -> {got}" + ("" if ok else f"   want {want}"))
    assert mark_formulas("⟦H2O⟧ and H2O") == "⟦H2O⟧ and ⟦H2O⟧"

    # A drawing inside a sentence starts on its own Braille lines
    out = quiet(main.text_to_braille, "ក ⟦\n   H\n   |\nH— C —H\n   |\n   H\n⟧ ខ", "khmer", set())
    assert len(out.split("\n")) == 7, out
    print("PASS  a drawing in a sentence keeps its own lines")

    # English Braille: H₂O and Cu²⁺ use the UEB level indicators (used to crash)
    assert english_braille.to_braille("H₂O") == "⠠⠓⠢⠼⠃⠠⠕"
    assert english_braille.to_braille("Cu²⁺") == "⠠⠉⠥⠔⠣⠼⠃⠐⠖⠜"
    unmapped = set()
    english_braille.to_braille("២", unmapped)
    assert unmapped == {"២"}
    print("PASS  English Braille: H₂O, Cu²⁺; Khmer digits reported, not a crash")

    print(f"\n{failures} failure(s)")
    return failures


if __name__ == "__main__":
    sys.exit(1 if run() else 0)
