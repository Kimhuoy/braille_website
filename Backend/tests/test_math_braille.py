"""
Golden tests: each case is a worked example from the Krousar Thmey math PDFs.
Expected values are the PDF's own Braille ASCII (SimBraille text layer).
Both sides are converted to 6-dot cells and compared with spaces removed,
because the PDFs are not consistent about spaces around "=".

Run:  python -I Backend/tests/test_math_braille.py      (from the repo root)
"""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))

from math_braille import ascii_to_cells, math_to_ascii, split_math_segments  # noqa: E402

CASES = [
    # (equation input, PDF Braille ASCII, PDF + page)
    ("x^2-5x+6=0",              'x^2"-5x+6.k#0',            "Fraction p.23"),
    ("2×2=4",                   "#2@*2.k#4",                "Fraction p.21"),
    ("x⋅x=x^2",                 "x*x.kx^2",                 "Fraction p.21"),
    ("x/5-2=8",                 "?x/5#-2.k#8",              "Fraction p.21"),
    ("1/2",                     "?1/2#",                    "Fraction p.20"),
    ("((x+1)/2)/((x-1)/3)",     ",??x+1/2#,/?x-1/3#,#",     "Fraction p.20"),
    ("2:4=4:8",                 '#2"1#4.k#4"1#8',           "Fraction p.20"),
    ("19÷3",                    "#19./3",                   "Fraction p.22"),
    ("X_1",                     ",x1",                      "Exponent p.19"),
    ("x^2",                     "x^2",                      "Exponent p.19"),
    ("x^n",                     "x^n",                      "Exponent p.19"),
    ("x_n",                     "x;n",                      "Exponent p.19"),
    ("40°+50°=90°",             '#40^.*"+50^.*.k#90^.*',    "Exponent p.19"),
    ("27℃",                     "#27^.*;,c",                "Exponent p.19"),
    ("f∘g",                     "f.*g",                     "Exponent p.19"),
    ("√(5^2)",                  '>5^2"]',                   "General p.24"),
    ("√25",                     ">25]",                     "General p.24"),
    ("√(3x+3y)",                ">3x+3y]",                  "General p.24"),
    ("√(x+√(1+x))",             ">x+.>1+x.]]",              "General p.25"),
    ("∛2",                      "<3>2]",                    "General p.25"),
    ("3∛(x+y)",                 "#3<3>x+y]",                "General p.25"),
    ("√(m&a/b)",                "<m>?a/b#]",                "General p.25"),
    ("√(y^2-3^2)",              '>y^2"-3^2"]',              "General p.25"),
    ("√(x_1+y_2)",              ">x1+y2]",                  "General p.25"),
    # PDF p.25 prints >x;n"+y;m] (no " before the closing ]), but p.36 and p.25 itself
    # use the baseline indicator before a closing mark; we keep the consistent form.
    ("√(x_n+y_m)",              '>x;n"+y;m"]',              "General p.25 (see note)"),
    ("y=e^(5x/7+1)",            "y.ke^?5x/7#+1",            "General p.26"),
    ("n^(a^b)",                 "n^a^^b",                   "General p.26"),
    ("n^(a+1^(b+1^(c+1)))",     "n^a+1^^b+1^^^c+1",         "General p.27"),
    ("x_(2k)",                  "x;2k",                     "General p.27"),
    ("3_x",                     "#3;x",                     "General p.27"),
    ("(y-k)^3",                 "(y-k)^3",                  "General p.29"),
    ("A^((k+1)+m)",             ",a^(k+1)+m",               "General p.29"),
    ("a_((k+1))",               "a;(k+1)",                  "General p.29"),
    ("π^2",                     ".p^2",                     "General p.29"),
    ("α_2",                     ".a2",                      "General p.29"),
    ("Y_(-2)",                  ",y;-2",                    "General p.29"),
    ("2^10×2^6",                '#2^10"@*2^6',              "General p.30"),
    ("x'^2",                    "x'^2",                     "General p.31"),
    ("x'_a",                    "x';a",                     "General p.31"),
    ("lim_(x→a) f(x)=1",        '"lim%x$oa}f(x).k#1',       "General p.31"),
    ("∑_(i=1)^n x_i",           '".,s%i.k#1<n}x;i',         "General p.33"),
    ("cos (2π)/3",              "cos?2.p/3#",               "General p.34"),
    ("sin^2 α+cos^2 α",         "sin^2.a+cos^2.a",          "General p.34"),
    ("log_a x",                 "log;ax",                   "General p.34"),
    ("|1-x|",                   "\\1-x\\",                  "General p.32"),
    ("x^2+y^2",                 'x^2"+y^2',                 "General p.30"),
    ("∫_a^b f(x)dx",            '!;a^b"f(x)dx',             "General p.37"),
    ("∫_1^3 dx",                '!;1^3"dx',                 "General p.37"),
    ("∬",                       "!!",                       "General p.36"),
    ("t↦5t^3",                  "t$|33o#5t^3",              "General p.32"),
    ("X̄",                       ",x:",                      "Fraction p.22"),
    ("(AB)⃗",                    '",a,b<$o]',                "General p.35"),
    ("(ABC)̂",                    '",a,b,c<.$[]',             "General p.35"),
    ("∠ABC",                    "$[,a,b,c",                 "Geometric p.68-69"),
    ("△ABC",                    "$t,a,b,c",                 "Geometric p.69"),
    ("CM⊥AB",                   ",c,m$p,a,b",               "Geometric p.69"),
    ("AB∥CD",                   ",a,b$l,c,d",               "Geometric p.69"),
    ("A+B≡B+A",                 ",a+,b_l,b+,a",             "Geometric p.71"),
    ("x∈A",                     "x@e,a",                    "Geometric p.72"),
    # ---- Chemistry (pages 40-45, read from the SimBraille dots) ----
    ("NaOH+NH4Cl",              ",na,o,h+,n,h4,cl",         "Chemistry p.40"),
    ("NaCl+NH₃+H₂O",            ",na,cl+,n,h3+,h2,o",       "Chemistry p.40"),
    ("NaOH+NH4Cl→┴(ដុតកំដៅ)NaCl", ",na,o,h+,n,h4,cldctgyd_%$33o,na,cl", "Chemistry p.40"),
    ("_(29)^(63)Cu",            '^63";29",cu',              "Chemistry p.40"),
    ("Cu^(2+)+SO4^(2-)",        ',cu^2+"+,s,o4^2-',         "Chemistry p.43"),
    ("Cu+2Ag^+→Cu^(2+)+2Ag↓",   ',cu+2,ag^+$33o,cu^2+"+2,ag$%33o', "Chemistry p.43"),
    ("2H^+ +Zn→H2↑+Zn^(2+)",    '#2,h^+"+,zn$33o,h2$<33o+,zn^2+', "Chemistry p.43"),
    ("Al^(3+)+3e^-⇌Al",         ',al^3+"+3e^-$33@o$,[33,al', "Chemistry p.43, p.45"),
    ("CH3—CH2—CH3",             ",c,h331,c,h231,c,h3",      "Chemistry p.43"),
    ("HCl_((g))",               ",h,cl%(g)]",               "Chemistry p.44"),
    ("O═O",                     ",o72,o",                   "Chemistry p.42 (ex. 11)"),
    ("N☰N",                     ",n=l,n",                   "Chemistry p.42 (ex. 14)"),
    ("⇡",                       '"$<33o',                   "Chemistry p.45 (weak)"),
    ("⇣",                       '"$%33o',                   "Chemistry p.45 (weak)"),
    # Roman numerals: p.44 prints +,ii here but -,i,i in the H2O example on the
    # same page; the website writes a capital sign before each capital (,i,i).
    ("Cu┴(+II)O┴(-II)+C┴0→Cu┴0+C┴(+II)O┴(+II)",
     '",cu<+,i,i]",o<-,i,i]+",c<0]$33o",cu<0]+",c<+,i,i]",o<+,i,i]', "Chemistry p.44 (see note)"),
]


def norm(ascii_text):
    return ascii_to_cells(ascii_text.replace(" ", "").replace("\n", ""))


def run():
    failures = 0
    for expr, pdf_ascii, source in CASES:
        unmapped = set()
        got = math_to_ascii(expr, unmapped)
        ok = norm(got) == norm(pdf_ascii) and not unmapped
        if not ok:
            failures += 1
        mark = "PASS" if ok else "FAIL"
        extra = f"  unmapped={sorted(unmapped)}" if unmapped else ""
        print(f"{mark}  {expr:24} -> {got:28} PDF {pdf_ascii:26} [{source}]{extra}")

    # Matrix (Determinant p.22): one row per line, entries start with #
    got = math_to_ascii("(■(3&-1@1&2))")
    assert got == "@(#3 -1@)\n@(#1 #2@)", got
    print("PASS  matrix rows ->", got.replace("\n", " | "))

    # Unknown symbols are reported, never silently dropped
    unmapped = set()
    math_to_ascii("x≤⬚", unmapped)
    assert unmapped == {"≤", "⬚"}, unmapped
    print("PASS  unmapped symbols reported:", sorted(unmapped))

    assert split_math_segments("ក ⟦x^2⟧ ខ") == [(False, "ក "), (True, "x^2"), (False, " ខ")]
    print("PASS  ⟦ ⟧ segment split")

    print(f"\n{len(CASES) - failures}/{len(CASES)} PDF examples match")
    return failures


if __name__ == "__main__":
    sys.exit(1 if run() else 0)
