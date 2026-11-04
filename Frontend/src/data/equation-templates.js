// Equation structures for the Word-style equation ribbon.
//
// `insert` is the linear text placed in the input box. It uses the same
// linear form as MS Word's equation editor (UnicodeMath) and is translated
// to Braille by Backend/math_braille.py following the Krousar Thmey PDFs.
// ⬚ is an empty box to fill in (Tab jumps to the next one).
// `preview` is static, author-written HTML for the gallery tile.

const B = '<span class="eq-ph"></span>'; // preview placeholder box
const frac = (n, d) => `<span class="eq-frac"><span>${n}</span><span>${d}</span></span>`;
const sup = (base, s) => `${base}<sup class="eq-sup">${s}</sup>`;
const sub = (base, s) => `${base}<sub class="eq-sub">${s}</sub>`;
const subsup = (base, s, p) =>
  `${base}<span class="eq-subsup"><sup>${p}</sup><sub>${s}</sub></span>`;
const rad = (body, index = "") =>
  `${index ? `<sup class="eq-idx">${index}</sup>` : ""}<span class="eq-rad">√</span><span class="eq-radbody">${body}</span>`;
const over = (body, cls) => `<span class="${cls}">${body}</span>`;
const under = (op, u, o) =>
  `<span class="eq-uo">${o ? `<small>${o}</small>` : ""}<span>${op}</span><small>${u}</small></span>`;
const mat = (rows) =>
  `<span class="eq-mat">${rows.map((r) => `<span>${r.join("&nbsp;&nbsp;")}</span>`).join("")}</span>`;

export const STRUCTURE_GROUPS = [
  {
    key: "fraction",
    label: { km: "ប្រភាគ", en: "Fraction" },
    icon: frac("x", "y"),
    items: [
      { insert: "(⬚)/(⬚)", preview: frac(B, B), label: { km: "ប្រភាគ", en: "Stacked fraction" } },
      { insert: "dy/dx", preview: frac("dy", "dx"), label: { km: "ដេរីវេ", en: "Differential" } },
      { insert: "Δy/Δx", preview: frac("Δy", "Δx"), label: { km: "បម្រែបម្រួល", en: "Delta y over delta x" } },
      { insert: "π/2", preview: frac("π", "2"), label: { km: "ផៃលើពីរ", en: "Pi over 2" } },
      { insert: "1/2", preview: frac("1", "2"), label: { km: "មួយភាគពីរ", en: "One half" } },
    ],
  },
  {
    key: "script",
    label: { km: "និទស្សន្ត", en: "Script" },
    icon: sup("e", "x"),
    items: [
      { insert: "⬚^(⬚)", preview: sup(B, B), label: { km: "និទស្សន្ត", en: "Superscript" } },
      { insert: "⬚_(⬚)", preview: sub(B, B), label: { km: "សន្ទស្សន៍", en: "Subscript" } },
      { insert: "⬚_(⬚)^(⬚)", preview: subsup(B, B, B), label: { km: "សន្ទស្សន៍ និងនិទស្សន្ត", en: "Subscript-superscript" } },
      { insert: "x^2", preview: sup("x", "2"), label: { km: "x ការេ", en: "x squared" } },
      { insert: "x_1", preview: sub("x", "1"), label: { km: "x មួយ", en: "x sub 1" } },
      { insert: "e^(-x)", preview: sup("e", "−x"), label: { km: "e ស្វ័យគុណ −x", en: "e to the minus x" } },
    ],
  },
  {
    key: "radical",
    label: { km: "ឫស", en: "Radical" },
    icon: rad("x", "n"),
    items: [
      { insert: "√(⬚)", preview: rad(B), label: { km: "ឫសការេ", en: "Square root" } },
      { insert: "√(⬚&⬚)", preview: rad(B, B), label: { km: "ឫសទី n", en: "Radical with degree" } },
      { insert: "∛(⬚)", preview: rad(B, "3"), label: { km: "ឫសគូប", en: "Cube root" } },
      { insert: "∜(⬚)", preview: rad(B, "4"), label: { km: "ឫសទី ៤", en: "Fourth root" } },
      { insert: "√(a^2+b^2)", preview: rad("a²+b²"), label: { km: "ឧទាហរណ៍", en: "Example" } },
    ],
  },
  {
    key: "integral",
    label: { km: "អាំងតេក្រាល", en: "Integral" },
    icon: "∫<sub class=\"eq-sub\">−x</sub>",
    items: [
      { insert: "∫⬚", preview: `∫${B}`, label: { km: "អាំងតេក្រាល", en: "Integral" } },
      { insert: "∫_(⬚)^(⬚) ⬚", preview: `${subsup("∫", B, B)}${B}`, label: { km: "អាំងតេក្រាលកំណត់", en: "Definite integral" } },
      { insert: "∫_(⬚)^(⬚) ⬚ d⬚", preview: `${subsup("∫", B, B)}${B}d${B}`, label: { km: "មាន d", en: "With differential" } },
      { insert: "∬⬚", preview: `∬${B}`, label: { km: "អាំងតេក្រាលពីរជាន់", en: "Double integral" } },
      { insert: "∭⬚", preview: `∭${B}`, label: { km: "អាំងតេក្រាលបីជាន់", en: "Triple integral" } },
    ],
  },
  {
    key: "largeOperator",
    label: { km: "ផលបូក", en: "Large Operator" },
    icon: under("∑", "i=0", "n"),
    items: [
      { insert: "∑⬚", preview: `∑${B}`, label: { km: "ផលបូក", en: "Summation" } },
      { insert: "∑_(⬚)^(⬚) ⬚", preview: `${under("∑", B, B)}${B}`, label: { km: "ផលបូកមានដែនកំណត់", en: "Summation with limits" } },
      { insert: "∑_(⬚) ⬚", preview: `${under("∑", B)}${B}`, label: { km: "ផលបូកមានសន្ទស្សន៍", en: "Summation with subscript" } },
      { insert: "∑_(i=1)^n x_i", preview: `${under("∑", "i=1", "n")}x<sub>i</sub>`, label: { km: "ឧទាហរណ៍", en: "Example" } },
    ],
  },
  {
    key: "bracket",
    label: { km: "វង់ក្រចក", en: "Bracket" },
    icon: "{()}",
    items: [
      { insert: "(⬚)", preview: `(${B})`, label: { km: "វង់ក្រចក", en: "Parentheses" } },
      { insert: "[⬚]", preview: `[${B}]`, label: { km: "តង្កៀប", en: "Brackets" } },
      { insert: "{⬚}", preview: `{${B}}`, label: { km: "របាំង", en: "Braces" } },
      { insert: "|⬚|", preview: `|${B}|`, label: { km: "តម្លៃដាច់ខាត", en: "Absolute value" } },
      { insert: "‖⬚‖", preview: `‖${B}‖`, label: { km: "ណមវ៉ិចទ័រ", en: "Norm" } },
    ],
  },
  {
    key: "function",
    label: { km: "អនុគមន៍", en: "Function" },
    icon: "sinθ",
    items: ["sin", "cos", "tan", "cot", "sec", "csc"].map((f) => ({
      insert: `${f} ⬚`,
      preview: `${f}&thinsp;${B}`,
      label: { km: f, en: f },
    })),
  },
  {
    key: "accent",
    label: { km: "សញ្ញាលើ", en: "Accent" },
    icon: "ä",
    items: [
      { insert: "⬚̄", preview: over(B, "eq-bar"), label: { km: "របារលើអក្សរ (មធ្យម)", en: "Bar (one letter)" } },
      { insert: "(⬚)̄", preview: over(`${B}${B}`, "eq-bar"), label: { km: "បន្ទាត់លើ", en: "Overbar (group)" } },
      { insert: "(⬚)⃗", preview: over(`${B}${B}`, "eq-vec"), label: { km: "វ៉ិចទ័រ", en: "Vector arrow" } },
      { insert: "(⬚)̂", preview: over(`${B}${B}`, "eq-hat"), label: { km: "មុំ", en: "Angle (hat)" } },
    ],
  },
  {
    key: "limitLog",
    label: { km: "លីមីត និង log", en: "Limit and Log" },
    icon: under("lim", "n→∞"),
    items: [
      { insert: "log_(⬚) ⬚", preview: `${sub("log", B)}${B}`, label: { km: "log មានគោល", en: "Log with base" } },
      { insert: "log ⬚", preview: `log&thinsp;${B}`, label: { km: "log", en: "Log" } },
      { insert: "ln ⬚", preview: `ln&thinsp;${B}`, label: { km: "ln", en: "Natural log" } },
      { insert: "lim_(⬚→⬚) ⬚", preview: `${under("lim", `${B}→${B}`)}${B}`, label: { km: "លីមីត", en: "Limit" } },
      { insert: "lim_(n→∞) ⬚", preview: `${under("lim", "n→∞")}${B}`, label: { km: "លីមីតទៅអនន្ត", en: "Limit to infinity" } },
    ],
  },
  {
    key: "operator",
    label: { km: "ប្រមាណវិធី", en: "Operator" },
    icon: "≜",
    // Relations and arrows taken from the PDFs (inserted as plain symbols).
    symbols: ["=", "≠", "≈", "≃", "≅", "≡", "∼", "∥", "∦", "⊥", "∈", "∉", "→", "⇒", "↦", "∷", "×", "÷", "⋅", "∘"],
  },
  {
    key: "matrix",
    label: { km: "ម៉ាទ្រីស", en: "Matrix" },
    icon: mat([["1", "0"], ["0", "1"]]),
    items: [
      { insert: "(■(⬚&⬚))", preview: `(${mat([[B, B]])})`, label: { km: "1×2", en: "1×2 matrix" } },
      { insert: "(■(⬚@⬚))", preview: `(${mat([[B], [B]])})`, label: { km: "2×1", en: "2×1 matrix" } },
      { insert: "(■(⬚&⬚@⬚&⬚))", preview: `(${mat([[B, B], [B, B]])})`, label: { km: "2×2", en: "2×2 matrix" } },
      { insert: "(■(⬚&⬚&⬚@⬚&⬚&⬚@⬚&⬚&⬚))", preview: `(${mat([[B, B, B], [B, B, B], [B, B, B]])})`, label: { km: "3×3", en: "3×3 matrix" } },
      { insert: "|■(⬚&⬚@⬚&⬚)|", preview: `|${mat([[B, B], [B, B]])}|`, label: { km: "ដេទែមីណង់", en: "2×2 determinant" } },
      { insert: "(■(1&0@0&1))", preview: `(${mat([["1", "0"], ["0", "1"]])})`, label: { km: "ម៉ាទ្រីសឯកតា 2×2", en: "2×2 identity" } },
      { insert: "(■(1&0&0@0&1&0@0&0&1))", preview: `(${mat([["1", "0", "0"], ["0", "1", "0"], ["0", "0", "1"]])})`, label: { km: "ម៉ាទ្រីសឯកតា 3×3", en: "3×3 identity" } },
    ],
  },
];

// The two-row symbol strip, same order as Word's "Basic Math" gallery.
export const QUICK_SYMBOLS = [
  "±", "∞", "=", "≠", "∼", "×", "÷", "!", "∝", "<", "≪", ">", "≫", "≤", "≥", "∓", "≅", "≈", "≡",
  "∀", "∁", "∂", "√", "∛", "∜", "∪", "∩", "∅", "%", "°", "℉", "℃", "∆", "∇", "∃", "∄", "∈", "∋", "←", "↑",
];

// ---------------------------------------------------------------------------
// Chemistry (Krousar Thmey handbook pages 40-45). Same linear form; the
// backend writes numbers after an element as subscripts (H₂O -> ,h2,o),
// charges as superscripts (Cu^(2+) -> ,cu^2+), and so on. Formulas are
// inserted with real subscripts (H₂O) so the input box shows them as print does.
const arrowOver = (label, arrow = "→") =>
  `<span class="eq-uo"><small>${label}</small><span>${arrow}</span></span>`;
const pre = (sub, sup, base) =>
  `<span class="eq-subsup"><sup>${sup}</sup><sub>${sub}</sub></span>${base}`;

// Drawings (Lewis structures, structural formulas) are written over several
// lines, as in print: things on the same column stay on the same Braille column
// (Backend/math_braille.py, drawing_to_ascii). They start and end with a line break.
const drawing = (text) => ({ insert: `\n${text}\n`, preview: `<span class="eq-draw">${text}</span>` });

export const CHEM_STRUCTURE_GROUPS = [
  {
    key: "formula",
    label: { km: "រូបមន្ត", en: "Formula" },
    icon: sub("H", "2") + "O",
    items: [
      { insert: "⬚_(⬚)", preview: sub(B, B), label: { km: "ចំនួនអាតូម", en: "Atom count" } },
      { insert: "H₂O", preview: sub("H", "2") + "O", label: { km: "ទឹក", en: "Water" } },
      { insert: "CO₂", preview: "CO" + sub("", "2"), label: { km: "កាបូនឌីអុកស៊ីត", en: "Carbon dioxide" } },
      { insert: "NaCl", preview: "NaCl", label: { km: "អំបិល", en: "Sodium chloride" } },
      { insert: "H₂SO₄", preview: sub("H", "2") + "SO" + sub("", "4"), label: { km: "អាស៊ីតស៊ុលហ្វួរិក", en: "Sulfuric acid" } },
      { insert: "NH₄Cl", preview: `NH${sub("", "4")}Cl`, label: { km: "អាម៉ូញ៉ូមក្លរួ", en: "Ammonium chloride" } },
      { insert: "CH₃—CH₂—CH₃", preview: `CH${sub("", "3")}—CH${sub("", "2")}—CH${sub("", "3")}`, label: { km: "ប្រូប៉ាន", en: "Propane" } },
    ],
  },
  {
    key: "lewisAtom",
    label: { km: "ទំរង់ឡឺវីសនៃអាតូម", en: "Lewis: atoms" },
    icon: '<span class="eq-draw"> ◦\n◦C◦\n ◦</span>',
    // Handbook pages 40-41
    items: [
      { ...drawing(" ◦\nH"), label: { km: "អ៊ីដ្រូសែន", en: "Hydrogen" } },
      { ...drawing("  ◦\n◦ C ◦\n  ◦"), label: { km: "កាបូន", en: "Carbon" } },
      { ...drawing("  ◦\n◦ N ◦\n  —"), label: { km: "អាសូត", en: "Nitrogen" } },
      { ...drawing("  ◦\n| O ◦\n  —"), label: { km: "អុកស៊ីសែន", en: "Oxygen" } },
      { ...drawing("◦\nNa"), label: { km: "សូដ្យូម", en: "Sodium" } },
      { ...drawing("  ◦\n| Cl |\n  —"), label: { km: "ក្លរ", en: "Chlorine" } },
      { ...drawing("—\nHe"), label: { km: "អេល្យូម", en: "Helium" } },
      { ...drawing(" —\n|Ne|\n —"), label: { km: "នេអុង", en: "Neon" } },
    ],
  },
  {
    key: "molecule",
    label: { km: "គំនូសម៉ូលេគុល", en: "Molecule drawings" },
    icon: '<span class="eq-draw">H—C—H</span>',
    // Handbook pages 41-43, examples 4-15
    items: [
      { ...drawing("A· B·\n⏟"), label: { km: "អាតូមនៅដាច់ពីគ្នា", en: "Atoms apart" } },
      { ...drawing("A (··) B"), label: { km: "អាតូមចងភ្ជាប់គ្នា", en: "Atoms bonded" } },
      { ...drawing(" /O\\\n ⋰⋱\nH  H"), label: { km: "ទឹក (ចំនុច)", en: "Water (dots)" } },
      { ...drawing(" /O\\\n / \\\nH   H"), label: { km: "ទឹក (គំនូស)", en: "Water (lines)" } },
      { ...drawing("     H\n     :\nH .. C ..H\n     :\n     H\n⏟"), label: { km: "មេតាន (ចំនុច)", en: "Methane (dots)" } },
      { ...drawing("   H\n   |\nH— C —H\n   |\n   H"), label: { km: "មេតាន (គំនូស)", en: "Methane (lines)" } },
      { ...drawing("—    —\nO :: O\n—    —\n⏟"), label: { km: "អុកស៊ីសែន O∷O", en: "Oxygen O∷O" } },
      { ...drawing("—   —\nO = O\n—   —\n⏟"), label: { km: "អុកស៊ីសែន O=O", en: "Oxygen O=O" } },
      { ...drawing("—         —\nO :: C :: O\n—         —\n⏟"), label: { km: "កាបូនឌីអុកស៊ីត", en: "Carbon dioxide" } },
      { ...drawing("|N ⋮⋮ N|\n⏟"), label: { km: "អាសូត N⋮⋮N", en: "Nitrogen N⋮⋮N" } },
      { ...drawing("|N ≡ N|\n⏟"), label: { km: "អាសូត N≡N", en: "Nitrogen N≡N" } },
      { ...drawing("    H    H    H\n    |    |    |\nH — C —  C —  C — H\n    |    |    |\n    H    H    H"), label: { km: "ប្រូប៉ាន", en: "Propane" } },
    ],
  },
  {
    key: "drawMarks",
    label: { km: "សញ្ញាគំនូស", en: "Drawing marks" },
    icon: "◦|∷",
    // Table on pages 44-45; the code depends on where the mark is (see the Help page)
    symbols: ["◦", "|", "—", "∷", "⋮⋮", "⋰", "⋱", "/", "\\", "⏟"],
  },
  {
    key: "valence",
    label: { km: "វ៉ាឡង់", en: "Valence" },
    icon: "Ⅰ Ⅱ Ⅲ",
    symbols: ["Ⅰ", "Ⅱ", "Ⅲ"],
  },
  {
    key: "ion",
    label: { km: "អ៊ីយ៉ុង", en: "Ion" },
    icon: sup("Cu", "2+"),
    items: [
      { insert: "⬚^(⬚+)", preview: sup(B, `${B}+`), label: { km: "អ៊ីយ៉ុងវិជ្ជមាន", en: "Positive ion" } },
      { insert: "⬚^(⬚-)", preview: sup(B, `${B}−`), label: { km: "អ៊ីយ៉ុងអវិជ្ជមាន", en: "Negative ion" } },
      { insert: "⬚^+", preview: sup(B, "+"), label: { km: "បន្ទុក +", en: "Charge +" } },
      { insert: "⬚^-", preview: sup(B, "−"), label: { km: "បន្ទុក −", en: "Charge −" } },
      { insert: "e^-", preview: sup("e", "−"), label: { km: "អេឡិចត្រុង", en: "Electron" } },
      { insert: "SO₄²⁻", preview: subsup("SO", "4", "2−"), label: { km: "ស៊ុលហ្វាត", en: "Sulfate" } },
      { insert: "Cu²⁺", preview: sup("Cu", "2+"), label: { km: "អ៊ីយ៉ុងទង់ដែង", en: "Copper ion" } },
    ],
  },
  {
    key: "isotope",
    label: { km: "អ៊ីសូតូប", en: "Isotope" },
    icon: pre("29", "63", "Cu"),
    items: [
      { insert: "_(⬚)^(⬚)⬚", preview: pre(B, B, B), label: { km: "លេខម៉ាស និងលេខរៀង", en: "Mass and atomic number" } },
      { insert: "_(29)^(63)Cu", preview: pre("29", "63", "Cu"), label: { km: "ឧទាហរណ៍", en: "Example" } },
    ],
  },
  {
    key: "reaction",
    label: { km: "ប្រតិកម្ម", en: "Reaction" },
    icon: arrowOver("t°"),
    items: [
      { insert: "⬚ → ⬚", preview: `${B}→${B}`, label: { km: "ប្រតិកម្ម", en: "Reaction" } },
      { insert: "⬚ ⇌ ⬚", preview: `${B}⇌${B}`, label: { km: "ប្រតិកម្មទៅមក", en: "Reversible" } },
      { insert: "→┴(⬚)", preview: arrowOver(B), label: { km: "លក្ខខណ្ឌលើព្រួញ", en: "Condition over arrow" } },
      { insert: "⇌┴(⬚)", preview: arrowOver(B, "⇌"), label: { km: "លក្ខខណ្ឌលើព្រួញទៅមក", en: "Condition over ⇌" } },
      { insert: "→┴(ដុតកំដៅ)", preview: arrowOver("ដុតកំដៅ"), label: { km: "ដុតកំដៅ", en: "Heating" } },
    ],
  },
  {
    key: "gasPrecipitate",
    label: { km: "ភាយ និងកករ", en: "Gas / Precipitate" },
    icon: "↑↓",
    symbols: ["↑", "⇡", "↓", "⇣"],
  },
  {
    key: "state",
    label: { km: "ភាព", en: "State" },
    icon: sub("H₂O", "(l)"),
    items: [
      { insert: "⬚_((g))", preview: sub(B, "(g)"), label: { km: "ឧស្ម័ន", en: "Gas (g)" } },
      { insert: "⬚_((l))", preview: sub(B, "(l)"), label: { km: "រាវ", en: "Liquid (l)" } },
      { insert: "⬚_((s))", preview: sub(B, "(s)"), label: { km: "រឹង", en: "Solid (s)" } },
      { insert: "⬚_((aq))", preview: sub(B, "(aq)"), label: { km: "សូលុយស្យុង", en: "Aqueous (aq)" } },
    ],
  },
  {
    key: "oxidation",
    label: { km: "ចំនួនអុកស៊ីតកម្ម", en: "Oxidation number" },
    icon: `<span class="eq-uo"><small>+II</small><span>Cu</span></span>`,
    items: [
      { insert: "⬚┴(⬚)", preview: `<span class="eq-uo"><small>${B}</small><span>${B}</span></span>`, label: { km: "លេខលើធាតុ", en: "Number above element" } },
      { insert: "Cu┴(+II)", preview: `<span class="eq-uo"><small>+II</small><span>Cu</span></span>`, label: { km: "ឧទាហរណ៍", en: "Example" } },
    ],
  },
  {
    key: "bond",
    label: { km: "សម្ព័ន្ធ", en: "Bond" },
    icon: "C═O",
    symbols: ["—", "═", "☰"],
  },
  {
    key: "cell",
    label: { km: "ថ្មអគ្គិសនី", en: "Cell" },
    icon: "⊖|¦¦|⊕",
    items: [
      { insert: "⊖⬚|⬚¦¦⬚|⬚⊕", preview: `⊖${B}|${B}¦¦${B}|${B}⊕`, label: { km: "ថ្មអគ្គិសនី", en: "Galvanic cell" } },
      { insert: "⊖Zn|Zn^(2+)¦¦Cu^(2+)|Cu⊕", preview: `⊖Zn|Zn${sup("", "2+")}¦¦Cu${sup("", "2+")}|Cu⊕`, label: { km: "ឧទាហរណ៍", en: "Example" } },
    ],
  },
];

export const CHEM_QUICK_SYMBOLS = ["→", "⇌", "↑", "↓", "⇡", "⇣", "+", "=", "—", "═", "☰", "⊖", "⊕", "|", "¦¦", "°", "e⁻"];

// Biology signs from the Krousar Thmey handbook, page 46.
// A struck-out letter uses the combining long stroke after it (a̶), written [a] in Braille.
const STRIKE = String.fromCharCode(0x336);

export const BIO_STRUCTURE_GROUPS = [
  {
    key: "cross",
    label: { km: "ការបង្កាត់", en: "Genetic cross" },
    icon: "Aa×Aa",
    items: [
      { insert: "⬚ × ⬚", preview: `${B} × ${B}`, label: { km: "ការបង្កាត់", en: "Cross" } },
      { insert: "⬚ × ⬚ ↓ ⬚", preview: `${B} × ${B} ↓ ${B}`, label: { km: "ការបង្កាត់ និងកូន", en: "Cross and offspring" } },
      { insert: "Aa × Aa ↓ AA 2Aa aa", preview: "Aa × Aa ↓ AA 2Aa aa", label: { km: "ឧទាហរណ៍", en: "Example" } },
    ],
  },
  {
    key: "strike",
    label: { km: "សញ្ញាប្រើសំរួល", en: "Struck out" },
    icon: "<s>a</s>",
    items: [
      { insert: `⬚${STRIKE}`, preview: `<s>${B}</s>`, label: { km: "អក្សរមួយ", en: "One letter" } },
      { insert: `(⬚, ⬚, ⬚)${STRIKE}`, preview: `<s>${B}, ${B}, ${B}</s>`, label: { km: "អក្សរច្រើន", en: "Several letters" } },
      { insert: `(A, B, C)${STRIKE}`, preview: "<s>A, B, C</s>", label: { km: "ឧទាហរណ៍", en: "Example" } },
    ],
  },
  {
    key: "sex",
    label: { km: "ភេទ", en: "Sex" },
    icon: "♂♀",
    symbols: ["♂", "♀"],
  },
];

export const BIO_QUICK_SYMBOLS = ["♂", "♀", "×", "↓", "→", "+", "="];

// Which tools each subject tab shows.
export const SUBJECT_TOOLS = {
  mathematics: { quick: QUICK_SYMBOLS, groups: STRUCTURE_GROUPS },
  chemistry: { quick: CHEM_QUICK_SYMBOLS, groups: CHEM_STRUCTURE_GROUPS },
  biology: { quick: BIO_QUICK_SYMBOLS, groups: BIO_STRUCTURE_GROUPS },
};
