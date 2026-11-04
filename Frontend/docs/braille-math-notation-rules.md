# Khmer Braille — Math Notation Encoding Rules (backend reference)

**What this is:** an organized index of the Khmer Braille transcription rules
found in four source PDFs:

- `Mathematics_Exponent_Symbols_Index_Symbols.pdf`
- `Mathematics_Fraction_Symbols_Repeating_Decimal_Symbols.pdf`
- `Mathematics_Determinant_Theorem.pdf`
- `Mathematics_General_Mathematical_Symbols.pdf`

**What this is NOT:** a frontend feature. These four PDFs mostly describe how
a *compound expression* (a superscript, a fraction, a limit, an integral...)
gets transcribed into a sequence of Braille cells — that's translation-engine
logic, the same category as the core Khmer↔Braille text translation. It does
not belong in the frontend symbol picker, which only inserts single glyphs
into the Khmer input box.

This document is an **index with representative examples**, not a line-by-line
transcription of every example in the source PDFs (several pages contain 10–20
near-duplicate variations of the same rule). Each section names the exact
source page(s) so the full detail is always one lookup away in the original
PDF. Codes are copied exactly as shown in the source; I did not invent or
"correct" any of them.

---

## 1. Base marker legend

The four PDFs consistently reuse a small set of ASCII-style markers to spell
out Braille cells in print. These are the building blocks everything else is
made of:

| Marker | Meaning | Source |
|---|---|---|
| `^` | Superscript (exponent) marker | Exponent PDF, p.19 |
| `;` | Subscript marker | Exponent PDF, p.19 |
| `.*` | Degree sign (°) | Exponent PDF, p.19 |
| `?...#` | Fraction open / close | Fraction PDF, p.20 |
| `,?...,/...,#` | Mixed-number fraction (whole number + fraction) | Fraction PDF, p.20 |
| `:` | Ratio sign (2 : 4) | Fraction PDF, p.21 |
| `::` | Proportion sign (2/4 = 1/2, written as `::`) | Fraction PDF, p.21 |
| `_...._` | Repeating-decimal / "out of" fraction marker | Fraction PDF, p.21 |
| `"` | Decimal point | Fraction PDF, p.21 |
| `@(...@)` | Matrix / system-of-equations brackets | Determinant PDF, p.22–23 |
| `>` | Square-root radical | General PDF, p.24–25 |
| `<n>` | n-th root (cube root = `<3>`, etc.) | General PDF, p.24–25 |
| `"` (between a radical/exponent and what follows) | Resume-baseline marker — closes out of a nested superscript/subscript/radical back to the main line | General PDF, p.26–30 |
| `*` | Multiplication dot (used only when ambiguity needs it) | General PDF, p.26 |
| `.(...` / `@(...@)` | System-of-equations / matrix brackets | General PDF, p.22–23 |
| `#` | Number sign (opens a numeral) | General PDF, throughout |
| `,` (leading) | Capital-letter indicator | General PDF, throughout |
| `!` | Integral sign; `!!` double integral; `!!!` triple integral | General PDF, p.36 |
| `$33o` | "maps to" / function-arrow marker (`f`, `R`, etc. over an arrow) | General PDF, p.30, 35 |
| `~` | Vinculum / grouping marker for nested radicals, repeating decimals | General PDF, p.24–25, p.21 |
| `\...\` | Absolute value bars | General PDF, p.32 |
| `[...]` | Grouping used inside compound sub/superscripts | General PDF, p.27–29 |

---

## 2. Exponents & subscripts — `Mathematics_Exponent_Symbols_Index_Symbols.pdf` (p.19)

Core rule: **a plain numeral subscript needs no marker** (`X₁` → `X1`); a
**variable/algebraic exponent always uses `^`** (`X²` → `X^2`); a
**variable/algebraic subscript uses `;`** when the sub/superscript is itself
a variable rather than a bare digit.

- `X₁ = X1` — numeral subscript, no marker needed
- `X² = X^2` — variable exponent → `^`
- `Xⁿ = X^n` — variable exponent, variable value → `^`
- `Xₙ = X;n` — variable subscript → `;`
- Degree symbol `°` → `.*`, e.g. `27°C = #27~.*,c`
- Composite example: `45°C + 5°C = 50°C` → `#45^.*;,c +5^.*;,C .K #50^.*;,c`
- Function composition `f ∘ g` → `f.*g`

## 3. Fractions, ratios & repeating decimals — `Mathematics_Fraction_Symbols_Repeating_Decimal_Symbols.pdf` (p.20–21)

- Simple fraction `1/2` → `?1/2#` (opening `?`, slash separates numerator/
  denominator, closing `#`)
- Compound/nested fraction (a fraction whose numerator or denominator is
  itself a fraction, e.g. `(x+1)/2` over `(x−1)/3`) → doubled markers:
  `,??X+1/2#,/?X-1/3#,#`
- Ratio `2 : 4 = 4 : 8` → `#2"1#4.K#4"1#8` (colon → `"1`, read "to")
- Proportion (cross-multiplication equivalence, `2/4 :: 1/2`) → `?2/4#;2?1/2#`
- Mixed number `2⅕` → `#2_?1/5_#`
- Repeating decimal `0.4̄6` → `#0."4~6:` (vinculum over repeating digits
  marked with `~...: `)

## 4. Determinants & similar-triangle ratios — `Mathematics_Determinant_Theorem.pdf` (p.22–23)

- 2×2 determinant bars `|a b; a' b'|` → `@(#a -1 K #1@) / @(#1 #2 k #0@)`
  style bracket pairing (system laid out as a bracketed matrix, not literal
  vertical bars)
- Similar-triangle ratio chains (`AB/A'B' = BC/B'C' = AC/A'C'`) are
  transcribed as a sequence of bracketed fraction groups, one per ratio,
  joined in reading order — see p.23 for the full worked example
  (`△ABC ~ △A'B'C'`)

## 5. General mathematical symbols — `Mathematics_General_Mathematical_Symbols.pdf` (p.24–38)

This is the largest and most detailed source — it's organized by sub-topic
internally, so the page ranges below point straight to each:

| Sub-topic | Page(s) | Example |
|---|---|---|
| Superscript/subscript combined, nested (`aᵇ`, `6^(x²-3x+1)`, `n^(a+1)^(b+1)^(c+1)`) | 26–29 | `n^a^^b`, `#6^x^^2"-3x+1` |
| Radicals: square root, cube root, n-th root, nested radicals (`√(x+√(1+x))`) | 24–25 | `>x+.>1+x.}}`, `<3>2~2"]` |
| Scientific/multiplication shorthand (`2×2=4`, `x·x=x²`) | 26 | `#2@*2.k#4` |
| Solving equations, inequality chains, ordered pairs (`a,b,c`), decimal
  grouping (`25,50`) | 27 | `?x/5#-2.K#8` |
| Abbreviated/repeating numerals (`3̄4`, `1.3̄7`, `X̄²`) | 21, 29 | `"34<:]`, `#1."37<:]` |
| Vectors, magnitude, dot product, angle-between-vectors (`‖U‖·‖V‖`, `(U,V)` angle) | 34–35 | `||"u<$O]||*||"v<$O]||` |
| Summation notation (`Σ₀ⁿ aₖ`, `Σ aᵢxᵢ = a Σ xᵢ`) | 32–33 | `.,S0^n"a;k` |
| Logarithms, nested logs, log with subscript base (`log_a√(a²−1)`) | 33–34 | `log;a >a^2"-1}` |
| Trig functions, trig identities (`cos2a`, `sin(π/4+x)`) | 33–34 | `cos #2a`, `,?sin (?.P/4#+x)` |
| Limits (one-sided, at infinity, piecewise) | 31–32 | `lim%x$Oa]f(x)` |
| Derivatives, function notation (`f'(x₀) = lim Δy/Δx`) | 32 | `f'(x0).k"lim%.,dx$o#0}` |
| Single/double/triple integrals, definite integrals, bounds | 36–37 | `!;a^b"f(x)dx` |
| Set/function mapping notation (`t ↦ U(t)`) | 32 | `t"$33o<u}u(t)` |
| Geometric reference notation: angle (`∠ABC`), arc (`AB⌢`), vector (`AB→`),
  parallel/congruent marks reused inline in formulas | 35, 69–72 | `",a,b,c<.$[]` (∠ABC) |

**Page 26–30 in particular is dense** — it's a systematic table of every
combination of (plain / subscripted / superscripted) base with (plain /
subscripted / superscripted) exponent, 11 patterns in total, each with its
own marker combination (`^`, `^^`, `^;`, `;^`, `^;^`, `;;^`, etc.). This is
the kind of table worth giving directly to whoever implements the transcription
function, since it's already exhaustive in the source.

## 6. Geometric symbols reference — `Mathematics_Geometric_Symbols.pdf` (p.67–73)

Standalone glyphs from this PDF with a clean Unicode match (circle, concentric
circle, circled plus, rectangle, pentagon, hexagon, not-parallel, congruent/
identical) were added directly to the frontend symbol picker's new **Geometry**
category — see `src/data/symbol-catalog.js`. The rest of this PDF (p.70–73)
is comparison/interval notation (`≡`, `≈`, bracket pairs for open/closed
intervals, `⌢`/`⌣` arc marks with their Braille codes) and belongs with the
rest of this document for the transcription engine, not the picker.

---

## Suggested next step

Rather than transcribing every remaining example from pages 26–38 by hand
(high risk of a copy error turning into a silent mistranslation), it's
probably faster and safer for whoever builds the transcription function to
work directly from the original PDFs for the page ranges above — this index
just saves them from re-reading all five PDFs cover-to-cover to find the
relevant page. Happy to transcribe any specific section in full if that's
more useful than the page pointer.
