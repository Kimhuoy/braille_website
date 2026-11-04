// Symbol catalog for the equation ribbon (symbol gallery categories).
//
// Structure: SUBJECTS -> each has a label (km/en) and a list of CATEGORIES.
// Each category has a label (km/en) and a list of items: { symbol, label }.
//
// `label` is the Khmer description of the symbol, authored by the research team —
// same as translation content, it is NOT swapped by the interface EN/KM toggle.
//
// Braille codes are NOT kept here: they live in one place, the backend
// dictionaries (Backend/math_symbols.json + khmer_to_english_dictionary.json),
// and the ribbon asks GET /math-symbols which symbols already have a code.

export const symbolCatalog = {
  mathematics: {
    label: { km: "គណិតវិទ្យា", en: "Mathematics" },
    categories: [
      {
        key: "general",
        label: { km: "សញ្ញាកាត់ទូទៅ", en: "General symbols" },
        items: [
          { symbol: "∈", label: "របស់" },
          { symbol: "Ǝ", label: "មាន" },
          { symbol: "Ǝ'", label: "ដែលមាន" },
          { symbol: "∀", label: "គ្រប់" },
          { symbol: "&", label: "និង" },
          { symbol: "∉", label: "មិនមែនជារបស់" },
          { symbol: "ℝ", label: "ចំនួនពិត" },
          { symbol: "ℕ", label: "ចំនួនគត់" },
          { symbol: "ℤ-", label: "សំណុំចំនួនគត់ រឺឡាទីបអវិជ្ជមាន" },
          { symbol: "ℤ+", label: "សំណុំចំនួនគត់ រឺឡាទីបវិជ្ជមាន" },
          { symbol: "ℚ", label: "ចំនួនសនិទាន" },
          { symbol: "𝔽", label: "សំណុំប្រភាគ" },
          { symbol: "≎", label: "ស្មើនឹង ឬ សមមូល" },
          { symbol: "⊆", label: "ដែលមាននៅក្នុង" },
          { symbol: "∅", label: "គ្មានន័យ" },
          { symbol: "∨", label: "រឺ" },
          { symbol: "∧", label: "និង" },
          { symbol: "∩", label: "ប្រសណ្វ" },
          { symbol: "∪", label: "ប្រជុំ" },
          { symbol: "⊥", label: "កែង" },
          { symbol: "∆", label: "ត្រីកោណ" },
          { symbol: "⇔", label: "សមមូល" },
          { symbol: "∠", label: "មុំ" },
          { symbol: "⋀", label: "រង្វាស់មុំ" },
          { symbol: "∥", label: "បន្ទាត់ស្រប" },
          { symbol: "\\", label: "បែកស្លាស់" },
          { symbol: "/", label: "ស្លាស់" },
          { symbol: "→", label: "ទិសដៅស្រប" },
          { symbol: "←", label: "ទិសដៅច្រាស" },
          { symbol: "⊂", label: "នៅក្នុង" },
          { symbol: "⊃", label: "មិននៅក្នុង" },
          { symbol: "≠", label: "មិនស្មើ" },
          { symbol: "✴", label: "ផ្កា" },
          { symbol: "✩", label: "ផ្កាយ" },
          { symbol: "∞", label: "អនន្ត" },
          { symbol: "<", label: "តូចជាង" },
          { symbol: ">", label: "ធំជាង" },
          { symbol: "≼", label: "តូចជាងឬស្មើ" },
          { symbol: "≽", label: "ធំជាងឬស្មើ" },
          { symbol: "~", label: "ដូច" },
          { symbol: "≈", label: "ប្រហែល ឬ ដូច" },
          { symbol: "≃", label: "ប្រហែល ឬ​ ស្មើ" },
          { symbol: "≅", label: "ប្រហែល ឬ ប៉ុន" },
          { symbol: "≪", label: "តូចធៀបនឹង" },
          { symbol: "≫", label: "ធំធៀបនឹង" },
          { symbol: "╫", label: "មិនស្រប" },
          { symbol: "ℂ", label: "សំណុំចំនួនកុំផ្លិច" },
          { symbol: "(", label: "បន្ទាត់" },
          { symbol: ")", label: "បន្ទាត់" },
          { symbol: "[", label: "អង្កត់" },
          { symbol: "]", label: "អង្កត់" },
          { symbol: "{", label: "របាំង" },
          { symbol: "}", label: "របាំង" },
          { symbol: "|", label: "អង្កត់រង្វាស់ ឬ តម្លៃដាច់ខាត" },
        ],
      },
      {
        key: "calculate",
        label: { km: "សញ្ញាសម្រាប់គណនា", en: "Calculation symbols" },
        items: [
          { symbol: "π", label: "ផៃ" },
          { symbol: "√", label: "ឫសការេ" },
          { symbol: "∛", label: "ឫសគីប" },
          { symbol: "∫", label: "អាំងតេក្រាល" },
          { symbol: "б", label: "ស៊ីកម៉ាតូច" },
          { symbol: "∑", label: "ស៊ីកម៉ាធំ" },
          { symbol: "Fˈ(x)", label: "ដេរីវេ" },
          { symbol: "Fˈˈ(x)", label: "ដេរីវេទីពីរ" },
          { symbol: "Fˈˈˈ(x)", label: "ដេរីវេទីបី" },
          { symbol: "F(4)(x)", label: "ដេរីវេទីបួន" },
          { symbol: "Fˈ+(x)", label: "" },
          { symbol: "Fˈ_(x)", label: "" },
          { symbol: "Mo", label: "ម៉ូត" },
          { symbol: "P(E)", label: "ប្រួបាបនែព្រឹត្តការណ៍ E" },
          { symbol: "Me", label: "មេដ្យាន" },
          { symbol: "⌒", label: "រង្វាស់អង្កត់ធ្នូ" },
          { symbol: "⌣", label: "ធ្នូ" },
        ],
      },
      {
        key: "greek",
        label: { km: "អក្សរក្រិច", en: "Greek letters" },
        items: [
          { symbol: "β", label: "បែតា" },
          { symbol: "Δ", label: "ដែលតា" },
          { symbol: "α", label: "អាល់ហ្វា" },
          { symbol: "Ω", label: "អូម" },
          { symbol: "μ", label: "មុយ" },
          { symbol: "p'", label: "ពេព្រីម" },
          { symbol: "p''", label: "ពេសឺកុង" },
          { symbol: "ε", label: "អាប់ស៊ីឡោន" },
          { symbol: "θ", label: "តែតា" },
          { symbol: "ω", label: "អូមេហ្កា" },
          { symbol: "λ", label: "ឡាំដា" },
          { symbol: "γ", label: "ហ្គាមា" },
          { symbol: "ρ", label: "រ់ូ" },
          { symbol: "ö", label: "អូត្រេម៉ា" },
          { symbol: "lο", label: "អិលសូន្យ" },
        ],
      },
      {
        key: "basic",
        label: { km: "សញ្ញាគណិតវិទ្យាទូទៅ", en: "Basic / common signs" },
        items: [
          { symbol: "%", label: "ភាគរយ" },
          { symbol: "‰", label: "ភាគពាន់" },
          { symbol: "$", label: "ដុល្លា" },
          { symbol: "£", label: "ផោន" },
          { symbol: "@", label: "អែតម៉ាក" },
          { symbol: "!", label: "ហ្វាតូរីយ៉ែល" },
          { symbol: ",", label: "កាត់លំដាប់ខ្ទង់" },
          { symbol: "✗", label: "សញ្ញាខុស" },
          { symbol: "✓", label: "សញ្ញាត្រូវ" },
          { symbol: "/", label: "ក្នុង" },
          { symbol: ":", label: "កំណាត់់ម៉ោង" },
          { symbol: "⌗", label: "Number Sign Cross hatch" },
        ],
      },
      {
        key: "physical",
        label: { km: "សញ្ញាក្នុងរូបវិទ្យា", en: "Physics symbols" },
        items: [
          { symbol: "𝒥", label: "ស៊ូល" },
          { symbol: "𝒩", label: "ញូតុន" },
          { symbol: "Å", label: "អង់ស្ត្រុង" },
          { symbol: "°C", label: "អង្សារសេ" },
          { symbol: "°K", label: "អង្សាកែលវិន" },
          { symbol: "°F", label: "អង្សាហ្វារិនហៃ" },
          { symbol: "φ", label: "ហ្វី" },
          { symbol: "ø", label: "ហ្វី" },
          { symbol: "τ", label: "តូ" },
          { symbol: "f", label: "ប្រេកង់" },
          { symbol: "Ο", label: "អំពូលភ្លើង" },
          { symbol: "🅐", label: "អំពែម៉ែត្រ" },
          { symbol: "⑤", label: "ក្នុងរង្វង់ជាលេខ" },
        ],
      },
      {
        key: "arrow",
        label: { km: "សញ្ញាព្រួញ", en: "Arrows" },
        items: [
          { symbol: "↖", label: "ទៅទិសឆ្វេងលើ" },
          { symbol: "↗", label: "ទៅទិសស្តាំលើ" },
          { symbol: "↙", label: "ទៅទិសឆ្វេងក្រោម" },
          { symbol: "↘", label: "ទៅទិសស្តាំក្រោម" },
          { symbol: "↺", label: "បង្វិលច្រាសទ្រនិចនាឡិកា" },
          { symbol: "↻", label: "បង្វិលតាមទ្រនិចនាឡិកា" },
          { symbol: "⇒", label: "នាំឱ្យមាន (ទាញទៅជា)" },
          { symbol: "⇄", label: "ប្តូរទិសពីរផ្លូវ" },
          { symbol: "⇆", label: "ប្តូរទិសពីរផ្លូវ" },
          { symbol: "⇵", label: "ចុះ-ឡើងឆ្លាស់គ្នា" },
          { symbol: "⇅", label: "ឡើង-ចុះឆ្លាស់គ្នា" },
          { symbol: "⟷", label: "ទិសដៅទាំងពីរ (បន្ទាត់វែង)" },
          { symbol: "⇢", label: "ព្រួញចំណុចទៅស្តាំ" },
          { symbol: "⇠", label: "ព្រួញចំណុចទៅឆ្វេង" },
          { symbol: "⟶", label: "ព្រួញទៅស្តាំ (វែង)" },
          { symbol: "↔", label: "ទិសដៅទាំងពីរ" },
          { symbol: "→", label: "ទៅស្តាំ" },
          { symbol: "←", label: "ទៅឆ្វេង" },
          { symbol: "⟼", label: "ផ្គូផ្គងទៅជា" },
        ],
      },
      {
        // Added from Mathematics_Geometric_Symbols.pdf. Only symbols with a
        // faithful, unambiguous single Unicode character were included —
        // several hand-drawn icons in that PDF (angle-type markers, hatched
        // "equal sides" shape variants, compound comparison patterns like
        // "><" or ">=<") have no real standalone Unicode equivalent and were
        // left out rather than approximated. Also skipped anything that
        // already exists above (∈, ∉, ∠, ∥, ≈, ≃, ≅, ≪, ≫, brackets, etc.).
        key: "geometry",
        label: { km: "សញ្ញាធរណីមាត្រ", en: "Geometry" },
        items: [
          { symbol: "○", label: "រង្វង់" },
          { symbol: "⊙", label: "ចំនុចក្នុងរង្វង់" },
          { symbol: "⊕", label: "បូកក្នុងរង្វង់" },
          { symbol: "▭", label: "ចតុកោណកែង" },
          { symbol: "⬠", label: "បញ្ចកោណ" },
          { symbol: "⬡", label: "ឆកោណ" },
          { symbol: "∦", label: "មិនស្រប" },
          { symbol: "≡", label: "ត្រួតស៊ីគ្នា" },
        ],
      },
    ],
  },

  // Placeholder subjects — ready for the next version. Add categories the same
  // way as mathematics above once the symbol set + Khmer labels are defined.
  // Chemistry symbols from the Krousar Thmey handbook, pages 40-45.
  chemistry: {
    label: { km: "គីមីវិទ្យា", en: "Chemistry" },
    categories: [
      {
        key: "chem-arrows",
        label: { km: "ព្រួញប្រតិកម្ម", en: "Reaction arrows" },
        items: [
          { symbol: "→", label: "ប្រតិកម្ម (ផ្តល់ជា)" },
          { symbol: "⇌", label: "ប្រតិកម្មទៅមក" },
          { symbol: "↑", label: "ភាយខ្លាំង (ឧស្ម័ន)" },
          { symbol: "⇡", label: "ភាយតិច" },
          { symbol: "↓", label: "កករខ្លាំង" },
          { symbol: "⇣", label: "កករតិច" },
        ],
      },
      {
        key: "chem-bonds",
        label: { km: "សម្ព័ន្ធ", en: "Bonds" },
        items: [
          { symbol: "—", label: "សម្ព័ន្ធទោល (វ៉ាឡង់ I)" },
          { symbol: "═", label: "សម្ព័ន្ធទ្វេ (វ៉ាឡង់ II)" },
          { symbol: "☰", label: "សម្ព័ន្ធត្រី (វ៉ាឡង់ III)" },
          { symbol: "Ⅰ", label: "សញ្ញាវ៉ាឡង់ I" },
          { symbol: "Ⅱ", label: "សញ្ញាវ៉ាឡង់ II" },
          { symbol: "Ⅲ", label: "សញ្ញាវ៉ាឡង់ III" },
        ],
      },
      {
        // Table on pages 44-45: used in drawings written over several lines
        key: "chem-drawing",
        label: { km: "សញ្ញាគំនូសឡឺវីស", en: "Lewis drawing marks" },
        items: [
          { symbol: "◦", label: "ចំនុច (អេឡិចត្រុង)" },
          { symbol: "|", label: "គំនូសតាងឆ្វេង ស្តាំ" },
          { symbol: "—", label: "គំនូសតាងលើ ក្រោម" },
          { symbol: "∷", label: "ចំនុចពីរជាន់" },
          { symbol: "⋮⋮", label: "ចំនុចបីជាន់" },
          { symbol: "⋰", label: "ចំនុចបញ្ឆិតឆ្វេង" },
          { symbol: "⋱", label: "ចំនុចបញ្ឆិតស្តាំ" },
          { symbol: "/", label: "គំនូសបញ្ឆិតឆ្វេង" },
          { symbol: "\\", label: "គំនូសបញ្ឆិតស្តាំ" },
          { symbol: "⏟", label: "សញ្ញាម៉ូលេគុល (វង់ក្រចកក្រោម)" },
        ],
      },
      {
        key: "chem-cell",
        label: { km: "អេឡិចត្រូគីមី", en: "Electrochemistry" },
        items: [
          { symbol: "⊖", label: "ប៉ូលអវិជ្ជមាន" },
          { symbol: "⊕", label: "ប៉ូលវិជ្ជមាន" },
          { symbol: "|", label: "ព្រំដែនដំណាក់កាល" },
          { symbol: "¦¦", label: "បន្ទះខ័ណ្ឌស្ពាន (ស្ពានអំបិល)" },
        ],
      },
      {
        key: "chem-common",
        label: { km: "សញ្ញាទូទៅ", en: "Common signs" },
        items: [
          { symbol: "+", label: "បូក" },
          { symbol: "=", label: "ស្មើ" },
          { symbol: "°", label: "អង្សា" },
          { symbol: "≡", label: "ត្រួតស៊ីគ្នា" },
        ],
      },
    ],
  },

  // Biology symbols from the Krousar Thmey handbook, page 46.
  biology: {
    label: { km: "ជីវវិទ្យា", en: "Biology" },
    categories: [
      {
        key: "bio-genetics",
        label: { km: "ពន្ធុវិទ្យា", en: "Genetics" },
        items: [
          { symbol: "♂", label: "ប្រុស" },
          { symbol: "♀", label: "ស្រី" },
          { symbol: "×", label: "ការបង្កាត់" },
          { symbol: "↓", label: "ផ្តល់ជា (កូន)" },
        ],
      },
      {
        key: "bio-common",
        label: { km: "សញ្ញាទូទៅ", en: "Common signs" },
        items: [
          { symbol: "→", label: "ផ្តល់ជា" },
          { symbol: "+", label: "បូក" },
          { symbol: "=", label: "ស្មើ" },
        ],
      },
    ],
  },
};

export const subjectOrder = ["mathematics", "chemistry", "biology"];
