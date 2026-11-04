# Math and Chemistry to Braille: how it works and what still needs a decision

## The pipeline (same idea for Khmer text and math)

```
Khmer text / math        Braille ASCII (SimBraille)        6-dot Unicode Braille
  "π"            ──►        ".p"               ──►              ⠨⠏
          step 1: dictionary                step 2: english_to_braille_dictionary.json
```

* **Step 1 — Khmer characters**: `khmer_to_english_dictionary.json` (unchanged).
* **Step 1 — math symbols**: `math_symbols.json`. Every code comes from the
  Krousar Thmey math PDFs; the `source` field gives the page.
* **Step 1 — equations** written between `⟦ ⟧`: `math_braille.py` applies the
  PDF rules (fractions, superscripts, subscripts, radicals, Σ, lim, integrals,
  accents, matrices) and looks symbols up in `math_symbols.json`.
* **Step 2**: `english_to_braille_dictionary.json` turns each Braille ASCII
  character into one 6-dot cell. It follows the SimBraille font that the PDFs
  were typed in, so the website output shows the same dots as the PDF.

Why equations need their own step: in the PDFs, digits inside math use the
lower cells (x² = ⠭⠘⠆), while Khmer literary text uses the upper cells
(២ = ⠼⠃); and structures such as fractions need the whole expression, not one
character at a time.

## Writing equations (what the website's equation tools insert)

| Write | Meaning | Braille ASCII |
|---|---|---|
| `⟦x^2⟧` | superscript | `x^2` |
| `⟦x_1⟧`, `⟦x_n⟧` | subscript | `x1`, `x;n` |
| `⟦(x+1)/(x-1)⟧` | fraction | `?x+1/x-1#` |
| `⟦√(x)⟧`, `⟦√(n&x)⟧`, `⟦∛(x)⟧` | roots | `>x]`, `<n>x]`, `<3>x]` |
| `⟦∫_a^b f(x)dx⟧` | integral | `!;a^b"f(x)dx` |
| `⟦∑_(i=1)^n x_i⟧` | sum | `".,s%i.k#1<n}x;i` |
| `⟦lim_(x→a) f(x)⟧` | limit | `"lim%x$oa} f(x)` |
| `⟦(AB)⃗⟧`, `⟦x̄⟧` | vector, bar | `",a,b<$o]`, `x:` |
| `⟦(■(a&b@c&d))⟧` | matrix | `@(a b@)` / `@(c d@)` |

### Chemistry (handbook pages 40-45)

Formulas typed as plain text are found and translated as equations
(`mark_formulas`), so `H2O` gives `,h2,o` (the low cell ⠆), not the literary
number `,h#b,o`. A formula is found when every capital letter is an element and
it has a subscript (H₂O), a charge (Cu²⁺), or a number after an element with two
elements or more (H2O, NH4Cl, 2H2O) or O2, N2, Cl2 .... One element with a number
(B12, U2) stays plain text; put it in `⟦ ⟧` if it is a formula. Pasted Unicode
such as `H₂O` or `Cu²⁺` works in both places. In English Braille (UEB), H₂O uses
the UEB subscript indicator: `⠠⠓⠢⠼⠃⠠⠕`.

| Write | Meaning | Braille ASCII |
|---|---|---|
| `⟦NaOH+NH4Cl⟧` | formula (number after an element = subscript) | `,na,o,h+,n,h4,cl` |
| `⟦Cu^(2+)+SO4^(2-)⟧` | ions | `,cu^2+"+,s,o4^2-` |
| `⟦_(29)^(63)Cu⟧` | isotope | `^63";29",cu` |
| `⟦→┴(ដុតកំដៅ)⟧` | condition over an arrow | `dctgyd_%$33o` |
| `⟦⇌⟧` `⟦↑⟧` `⟦↓⟧` `⟦⇡⟧` `⟦⇣⟧` | reversible, gas, precipitate, weak forms | `$33@o$,[33` `$<33o` `$%33o` `"$<33o` `"$%33o` |
| `⟦HCl_((g))⟧` | state (g) (l) (s) (aq) | `,h,cl%(g)]` |
| `⟦Cu┴(+II)⟧` | oxidation number above | `",cu<+,i,i]` |
| `⟦CH3—CH2—CH3⟧` `⟦O═O⟧` `⟦N☰N⟧` | single, double, triple bond | `31` `72` `=l` |
| `⟦⊖Zn\|Zn^(2+)¦¦Cu^(2+)\|Cu⊕⟧` | cell | `$c_$-] ,zn\,zn^2+"ll ...` |

| `⟦Ⅰ⟧` `⟦Ⅱ⟧` `⟦Ⅲ⟧` | valence signs (p.45: dots 456 before the number sign) | `_#1` `_#2` `_#3` |

The triple bond uses ☰ (not ≡), because the handbook gives ≡ its own code
(identical, `_l`) on page 45. Inside a drawing, ≡ is the triple bond.

### Chemistry drawings: Lewis structures and structural formulas (p.40-45)

An equation written over **several lines** is a drawing (`drawing_to_ascii`).
The equation tools insert drawings with a line break after `⟦` and before `⟧`.
Each print line gives one Braille line; items on the same print column get the
same Braille column (the smallest columns that keep every line's items apart);
a typed space gives a blank cell, no space gives none.

```
⟦                         ,h
   H                        _
   |          ->       ,h31 ,c 31,h
H— C —H                     _
   |                       ,h
   H
⟧
```

| Mark | On the atom's line | Above / below an atom | Elsewhere |
|---|---|---|---|
| `◦` `·` (electron) | left `"` ⠐ (5), right `1` ⠂ (2) | `,` ⠠ (6) / `@` ⠈ (4) | |
| `\|` | left `_` ⠸ (456), right `l` ⠇ (123) | bond `_` ⠸ (456) | |
| `/` `\` | left / right bar, as `\|` (p.41 ex.6-7) | | `,i` ⠠⠊ (6,24) / `e'` ⠑⠄ (15,3) |
| `—` | single bond `31` (25,2) | bar `-'` ⠤⠄ (36,3) / `ca` ⠉⠁ (14,1) | |
| `=` `≡` | double `72`, triple `=l` | | |
| `∷` or `::`, `⋮⋮` | `7` ⠶ (2356), `_l` ⠸⠇ (456,123) | `:` → `.` ⠨ (46, p.42 ex.8) | |
| `⋰` `⋱` | | | slanted dots `i` ⠊ (24) / `e` ⠑ (15) |
| `(··)` | shared pair `&11y` ⠯⠂⠂⠽ (p.41 ex.5) | | |
| `⏟` (last line) | brace: `"` before the line with the most atoms, `%.)]` after it | | |

"On the atom's line" left/right depends on whether an atom comes before the
mark on that line. A mark above or below an atom is placed on the atom's
column: `\|` and `:` on the letter (not the capital sign); dots and bars centred
on the atom, rounded left (`,h` → first cell, `,na` → second cell). Tests:
`Backend/tests/test_chemistry.py` (17 drawings from pages 40-43).

### Biology (handbook page 46)

| Write | Meaning | Braille ASCII |
|---|---|---|
| `⟦Aa × Aa ↓ AA 2Aa aa⟧` | genetic cross | `,aa @* ,aa $%33o ,a,a #2,aa aa` |
| `♂` `♀` | male, female | `m$o` `f_=` |
| `⟦a̶⟧` `⟦(a, b, c)̶⟧` `⟦(A, B, C)̶⟧` | struck out (simplification signs) | `[a]` `[a, b, c]` `[,a, ,b, ,c]` |
| `A B C` | separate capitals | `,a ,b ,c` |
| `VIP` `ADN` (text) | word in capitals | `,,vip` `,,adn` |
| `P.M.H.` (text) | abbreviation | `,p4 ,m4 ,h4` |

Spaces inside `⟦ ⟧` are normally ignored, but print uses them in biology to
separate genotypes, so a typed space is kept **between two terms**
(`AA 2Aa aa`), **after a comma** and **on both sides of ×** when it is typed
with spaces. A space before a number brings back the number sign (`#2`).
Spaces next to `+`, `=` and other signs are still ignored, so the handbook's
math examples are unchanged.

The strike is the combining long stroke U+0336 after a letter or a bracket
group (`(a, b)̶`); text pasted with a stroke on every character (`a̶,̶ ̶b̶`) is
read as one struck group. Words in capitals and abbreviations are plain text
(not inside `⟦ ⟧`): inside an equation every capital is a separate variable,
which is what genotypes need (`AA` → `,a,a`).

Characters with no code are **reported** to the user (the `unmapped` list in
the `/text` response) instead of disappearing silently.

## Adding a symbol

Add one line to `math_symbols.json`, for example

```json
"≤": {"code": "...", "kind": "rel", "source": "book, page"}
```

`kind`: `op` plain · `rel` relation (space before/after, number sign after) ·
`reset` number sign after · `shape` space after · `sup` written as superscript.
Use only the 64 Braille ASCII characters of `english_to_braille_dictionary.json`
(6-dot). The website picks the change up automatically (`GET /math-symbols`).

## .brf files (Duxbury DBT, SimBraille)

The `.brf` download is Braille ASCII with the same codes as the SimBraille
font (checked key by key with the SimBraille font embedded in the PDFs) and
as Krousar Thmey's own Duxbury file (`uploads/*.dxb`). Page format: 42 cells
per line, 25 lines per page (form feed between pages), CR LF line ends — the
page set-up stored in that Duxbury file. In Duxbury: File > Open, choose the
.brf file (Braille file).

## Tests

```
python -I Backend/tests/test_math_braille.py
python -I -X utf8 Backend/tests/test_biology.py
python -I -X utf8 Backend/tests/test_chemistry.py
```

74 worked examples copied from the PDFs (59 math, 15 chemistry), compared
cell by cell, plus the 13 examples of the Biology page compared with their
spaces. All pass.

## Questions for the Braille team

1. **Baseline sign before a closing mark after a subscript.** PDF p.25 prints
   `>x;n"+y;m]` (no `"` before `]`), but p.25 and p.36 use `"` in the same
   position elsewhere. The website writes `>x;n"+y;m"]`. Which is correct?
2. **Return from a nested superscript.** PDF p.26 prints `6^(x²−3x+1)` as
   `#6^x^^2"-3x+1`. The `"` returns to the baseline, which reads as
   6^(x²) − 3x + 1. The website writes `#6^x^^2^-3x+1` (stays in the exponent).
   Please confirm.
3. **Spaces around =.** The PDFs are not consistent (`.k#0` and ` .k #0` both
   appear). The website puts a space on each side of relations, as most
   examples do.
4. **≤ ≥ ≪ ≫ and other comparison signs** (Geometric p.73) are printed with
   8-dot cells in the PDF, so their 6-dot form could not be read reliably.
5. **8-dot cells in the PDF tables** (e.g. ∈ on p.72 shows dots 7-8): the
   website drops dots 7-8 and uses the 6-dot cell (∈ = `@e`). Please confirm.
6. **Braille → Khmer** (the reverse direction) does not translate math yet;
   for example ⠜ (√) comes back as the Khmer sign ័.
7. **Roman numerals in oxidation numbers.** Chemistry p.44 prints `+,ii`
   (one capital sign) in the CuO example but `-,i,i` in the H₂O example on the
   same page. The website writes `,i,i`.
8. **Salt bridge ¦¦.** p.43 defines it as `ll` (⠇⠇), but the example line shows
   `_ll` (⠸⠇⠇). The website writes `ll`.
9. **⇌ in the Cu²⁺ + 2e⁻ example** (p.43) reads `$33o$[33`, while the
   definition on p.45 and the Al³⁺ example use `$33@o$,[33`. The website uses
   the p.45 definition.
10. **Drawings (p.40-43) are laid out by hand in the handbook**, so a few
    things are not consistent and the website picked one form:
    * Bars beside an atom: `⠸⠠⠝⠑⠇` (Ne, Ar, ex.13-14, no blank cell) but
      `⠸ ⠠⠉⠇ ⠇` (Cl, O, with blank cells). The website follows what is typed.
    * Bar above He / Ne / Ar sits over the letters (second cell); one-cell
      marks above H, C, N, O sit over the capital sign. The website centres
      every mark, rounded left (bar over He starts on the capital sign).
    * Ex.12 (O∷C∷O) prints ⠉⠁ (bar *below*) above the O atoms, and dot 3
      instead of the capital sign before the second O. The website uses the
      table on p.44 (bar above ⠤⠄).
    * Ex.15 (propane) starts with `⠨⠅` (`.k`, the equals sign) before `,h`.
      The website does not write it.
    * Ex.6 puts the slanted dots under the O; the website puts them where they
      are typed.
11. **H(−O−)H with oxidation numbers and dashed brackets** (p.44) and
    **E⁰ with a fraction index** (p.43) are not translated as drawings yet.

## Symbols in the picker that still need a code (96)

Ǝ Ǝ' ∀ & ℝ ℕ ℤ- ℤ+ ℚ 𝔽 ≎ ⊆ ∅ ∨ ∧ ∩ ∪ ⇔ ⋀ \ / ← ⊂ ⊃ ✴ ✩ ≼ ≽ ≪ ≫ ╫ ℂ б
Fˈ(x) Fˈˈ(x) Fˈˈˈ(x) Fˈ+(x) Fˈ_(x) ⌒ ⌣ Ω μ ε ω λ γ ρ ö lο % ‰ $ £ @ ! ✗ ✓ ⌗
𝒥 𝒩 Å φ ø τ Ο 🅐 ⑤ ↖ ↗ ↙ ↘ ↺ ↻ ⇄ ⇆ ⇵ ⇅ ⟷ ⇢ ⇠ ⟶ ↔ ⟼ ± ∝ ≤ ≥ ∓ ∁ ∂ ℉ ∇ ∃ ∄ ∋ ↑

The website marks these with an orange dot.
