import React, { useRef, useState } from "react";
import axios from "axios";
import { saveAs } from "file-saver";
import { Icon } from "@iconify/react";
import appStore from "../../store/app";
import { FORMS_API_URL, FORMS_OPEN } from "../../config/forms";
import { asciiToBraille, BRAILLE_ASCII_LEGEND } from "../../data/braille-ascii";
import { Field, inputClass } from "../Form/form-field";
import FormsClosedNotice from "../Form/forms-closed-notice";

// Same limits as Backend/contributions.py. Contributors only send the Khmer
// text (or sign) and its Braille; the server guesses the row type
// (contributions.guess_type) and the technical team reviews and updates the
// dictionaries — contributors never edit them.
const FILE_CATEGORIES = ["original", "braille", "handbook", "other"];
const ACCEPTED = [".pdf", ".docx", ".doc", ".odt", ".rtf", ".txt", ".brf", ".brl",
  ".csv", ".xlsx", ".xls", ".json", ".png", ".jpg", ".jpeg"];
const MAX_FILES = 10;
const MAX_FILE_MB = 20;
const BOM = String.fromCharCode(0xfeff); // lets Excel open the CSV as UTF-8 (Khmer)
const CSV_COLUMNS = ["text", "braille", "source"];

// Real rows of the kind of data we collect. Letters and signs: NISE's Khmer
// Braille mapping (Khmer_Braille_Mapping.xlsx); symbols: the Krousar Thmey
// handbook; sentences: this translator's output, checked to read back the same.
const SAMPLE = [
  { text: "ក", braille: "g", source: "nise", group: "consonant" },
  { text: "គ", braille: ",g", source: "nise", group: "consonant" },
  { text: "ង", braille: "]", source: "nise", group: "consonant" },
  { text: "ា", braille: "*", source: "nise", group: "vowel" },
  { text: "ុ", braille: "c", source: "nise", group: "vowel" },
  { text: "ឧ", braille: "ca", source: "nise", group: "independent" },
  { text: "ុំ", braille: "$", source: "nise", group: "final" },
  { text: "ះ", braille: "a", source: "nise", group: "final" },
  { text: "=", braille: ".k", source: "math", group: "symbol" },
  { text: "H₂O", braille: ",h2,o", source: "chemistry", group: "symbol" },
  { text: "ខ្មែរ", braille: "<kvmr", source: "sentence", group: "word" },
  { text: "សួស្តី ពិភពលោក", braille: "s2svte &/,p&,l:g", source: "sentence", group: "sentence" },
  { text: "ខ្ញុំរៀនអក្សរប្រៃ។", braille: "kv,?$r(,nogvsrivrb=", source: "sentence", group: "sentence" },
];

const csvCell = (v) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
const CSV_TEMPLATE = [
  CSV_COLUMNS.join(","),
  "# One row = one Khmer letter, sign, word or sentence and its Braille. Lines starting with # are skipped; delete them.",
  ...SAMPLE.map((s) => "# " + [s.text, s.braille, ""].map(csvCell).join(",")),
].join("\r\n");

// Page content per interface language.
const content = {
  km: {
    title: "ចូលរួមចែករំលែកធនធានអក្សរប្រៃ",
    intro:
      "ប្រសិនបើស្ថាប័នរបស់អ្នកមានអត្ថបទខ្មែរ និងអក្សរប្រៃរបស់វា (តួអក្សរ សញ្ញា ពាក្យ ឬប្រយោគ) ឬឯកសារគំរូ សូមផ្ញើមកយើងខ្ញុំតាមទំព័រនេះ។ អ្នកគ្រាន់តែផ្ញើអត្ថបទខ្មែរ និងអក្សរប្រៃរបស់វាប៉ុណ្ណោះ — ក្រុមបច្ចេកទេសរបស់យើងនឹងពិនិត្យ និងធ្វើបច្ចុប្បន្នភាពប្រព័ន្ធបកប្រែ។ អ្នកមិនចាំបាច់កែវចនានុក្រមណាមួយទេ។",
    shareTitle: "អ្វីដែលអ្នកអាចចែករំលែក",
    share: [
      { icon: "mdi:alphabet-latin", title: "តួអក្សរ និងសញ្ញាខ្មែរ", desc: "តួអក្សរ ស្រៈ ឬសញ្ញាខ្មែរ និងអក្សរប្រៃរបស់វា។ ឧ. ក → g (⠛)។" },
      { icon: "mdi:text-box-outline", title: "ពាក្យ និងប្រយោគ", desc: "ពាក្យ ឬប្រយោគខ្មែរ និងអក្សរប្រៃត្រឹមត្រូវរបស់វា។" },
      { icon: "mdi:sigma", title: "និមិត្តសញ្ញាគណិតវិទ្យា និងវិទ្យាសាស្ត្រ", desc: "សញ្ញាគណិតវិទ្យា គីមីវិទ្យា ឬជីវវិទ្យា និងអក្សរប្រៃរបស់វា។ ឧ. = → .k (⠨⠅)។" },
      { icon: "mdi:file-document-multiple-outline", title: "ឯកសារគំរូ", desc: "ឯកសារខ្មែរដើម និងកំណែអក្សរប្រៃរបស់វា សៀវភៅណែនាំ ឬស្តង់ដារអក្សរប្រៃ (PDF, Word, TXT, BRF, រូបភាព ...)។" },
    ],
    sampleTitle: "គំរូទិន្នន័យដែលយើងប្រមូល",
    sampleHint:
      "ជួរពិតៗពីតារាងផ្គូផ្គងអក្សរប្រៃខ្មែររបស់វិទ្យាស្ថានជាតិអប់រំពិសេស សៀវភៅណែនាំរបស់អង្គការគ្រួសារថ្មី និងប្រយោគដែលបានបកប្រែ។ សូមផ្ញើទិន្នន័យរបស់អ្នកក្នុងទម្រង់ដូចគ្នា៖ អត្ថបទខ្មែរ និងអក្សរប្រៃរបស់វា។",
    sampleColumns: ["អត្ថបទខ្មែរ ឬសញ្ញា", "អក្សរប្រៃ (ដូចដែលវាយ)", "ចំណុចអក្សរប្រៃ", "ប្រភេទ", "ប្រភព"],
    groups: {
      consonant: "ព្យញ្ជនៈ",
      vowel: "ស្រៈនិស្ស័យ",
      independent: "ស្រៈពេញតួ",
      final: "សញ្ញាចុងពាក្យ",
      symbol: "និមិត្តសញ្ញា",
      word: "ពាក្យ",
      sentence: "ប្រយោគ",
    },
    sources: {
      nise: "តារាងផ្គូផ្គង NISE",
      math: "សៀវភៅគ្រួសារថ្មី គណិតវិទ្យា ទំ.២១",
      chemistry: "សៀវភៅគ្រួសារថ្មី គីមីវិទ្យា ទំ.៤០",
      sentence: "ប្រយោគបកប្រែ",
    },
    downloadTemplate: "ទាញយកគំរូ CSV (មានជួរគំរូទាំងនេះ)",
    howTitle: "របៀបដំណើរការ",
    how: [
      "ព័ត៌មានរបស់អ្នកគឺស្រេចចិត្ត — យើងប្រើវាដើម្បីទទួលស្គាល់ការចូលរួមរបស់អ្នក និងទាក់ទងវិញ ប្រសិនបើមានសំណួរ។",
      "បន្ថែមអត្ថបទខ្មែរ និងអក្សរប្រៃរបស់វា ម្តងមួយជួរ ឬនាំចូលឯកសារ CSV ដូចគំរូខាងលើ។",
      "ភ្ជាប់ឯកសារគំរូ (ប្រសិនបើមាន) ហើយចុចផ្ញើ។ អ្នកនឹងទទួលបានលេខយោងមួយ។",
      "ក្រុមបច្ចេកទេសរបស់យើងពិនិត្យ ហើយធ្វើបច្ចុប្បន្នភាពប្រព័ន្ធ។",
    ],
    tipsTitle: "គន្លឹះសម្រាប់ការចូលរួមល្អ",
    tips: [
      "អក្សរប្រៃ៖ វាយដោយគ្រាប់ចុច SimBraille / Braille ASCII (ឧ. ,g សម្រាប់ ⠠⠛) ឬបិទភ្ជាប់ចំណុចអក្សរប្រៃ Unicode (⠠⠛) — បានទាំងពីរ។ ចំណុចដែលបង្ហាញនៅក្រោមប្រអប់ គឺជាអ្វីដែលយើងនឹងទទួល។",
      "មួយជួរ សម្រាប់តួអក្សរ សញ្ញា ពាក្យ ឬប្រយោគមួយ។",
      "ប្រសិនបើដឹង សូមបញ្ជាក់ប្រភព (សៀវភៅ ទំព័រ) — វាជួយយើងពិនិត្យបានលឿន។",
      "មានច្រើនជួរ? ទាញយកគំរូ CSV បំពេញក្នុង Excel ឬ Google Sheets ហើយរក្សាទុកជា «CSV UTF-8» ដើម្បីកុំឱ្យអក្សរខ្មែរខូច។ ក្នុង Excel សូមកំណត់ជួរឈរអក្សរប្រៃជាទម្រង់ Text ជាមុន បើមិនដូច្នោះទេ កូដដែលចាប់ផ្តើមដោយ = + - @ នឹងក្លាយជារូបមន្ត។",
      "ឯកសារ៖ ពេលផ្ញើឯកសារដើម និងកំណែអក្សរប្រៃរបស់វា សូមដាក់ឈ្មោះឯកសារទាំងពីរដូចគ្នា (ឧ. lesson1.docx និង lesson1.brf)។",
      "សូមផ្ញើតែឯកសារដែលអ្នកមានសិទ្ធិចែករំលែកប៉ុណ្ណោះ។ សូមកុំដាក់ព័ត៌មានផ្ទាល់ខ្លួនរបស់សិស្ស។",
    ],
    aboutYou: "១. ព័ត៌មានអំពីអ្នក (ស្រេចចិត្ត)",
    name: "ឈ្មោះ",
    organization: "ស្ថាប័ន / អង្គការ",
    contact: "វិធីទាក់ទងអ្នក (ទូរស័ព្ទ ឬ Telegram)",
    mappings: "២. អត្ថបទខ្មែរ និងអក្សរប្រៃ",
    mappingsHint: "មួយជួរ = តួអក្សរ សញ្ញា ពាក្យ ឬប្រយោគមួយ និងអក្សរប្រៃរបស់វា។ ទុកផ្នែកនេះទទេ ប្រសិនបើអ្នកផ្ញើតែឯកសារ។",
    textLabel: "អត្ថបទខ្មែរ ឬសញ្ញា",
    braille: "អក្សរប្រៃ (ASCII ឬចំណុច)",
    source: "ប្រភព (ស្រេចចិត្ត៖ សៀវភៅ ទំព័រ)",
    row: (n) => `ជួរទី ${n}`,
    removeRow: "លុបជួរ",
    addRow: "បន្ថែមជួរ",
    importCsv: "នាំចូល CSV",
    imported: (n) => `បាននាំចូល ${n} ជួរ។`,
    importNone: "រកមិនឃើញជួរណាមួយក្នុងឯកសារនេះទេ។ សូមពិនិត្យថាវាប្រើជួរឈរតាមគំរូ (text, braille, source)។",
    dots: "ចំណុច៖",
    legendTitle: "តារាងគ្រាប់ចុច Braille ASCII → ក្រឡាប្រៃ",
    rowMissing: "សូមបំពេញទាំងអត្ថបទខ្មែរ និងអក្សរប្រៃ",
    documents: "៣. ឯកសារគំរូ",
    filesHint: `រហូតដល់ ${MAX_FILES} ឯកសារ ម្នាក់ៗមិនលើស ${MAX_FILE_MB} MB៖ PDF, Word, ODT, RTF, TXT, BRF/BRL, CSV, Excel, JSON, PNG/JPG។`,
    chooseFiles: "ជ្រើសរើសឯកសារ",
    category: "ប្រភេទ",
    categories: {
      original: "ឯកសារខ្មែរដើម",
      braille: "កំណែអក្សរប្រៃ",
      handbook: "សៀវភៅណែនាំ / ស្តង់ដារ",
      other: "ផ្សេងៗ",
    },
    removeFile: "ដកឯកសារចេញ",
    send: "៤. ផ្ញើ",
    notes: "មានអ្វីផ្សេងទៀតដែលយើងគួរដឹងទេ? (ស្រេចចិត្ត)",
    notesPlaceholder: "ឧ. ស្តង់ដារអក្សរប្រៃដែលអ្នកប្រើ កម្រិតថ្នាក់នៃឯកសារ ...",
    consent: "ខ្ញុំមានសិទ្ធិចែករំលែកឯកសារទាំងនេះ ហើយខ្ញុំអនុញ្ញាតឱ្យ IDRI ប្រើវាក្នុងប្រព័ន្ធបកប្រែអក្សរប្រៃខ្មែរ។",
    summary: (rows, files) => `នឹងផ្ញើ ${rows} ជួរ និង ${files} ឯកសារ។`,
    submit: "ផ្ញើការចូលរួម",
    sending: "កំពុងផ្ញើ...",
    successTitle: "សូមអរគុណចំពោះការចូលរួមរបស់អ្នក!",
    successText: "សូមរក្សាទុកលេខយោងនេះ។ ក្រុមបច្ចេកទេសរបស់យើងនឹងពិនិត្យការចូលរួមរបស់អ្នក។",
    reference: "លេខយោង",
    sendAnother: "ផ្ញើការចូលរួមមួយទៀត",
    errors: {
      no_consent: "សូមធីកប្រអប់ ដើម្បីបញ្ជាក់ថាអ្នកអាចចែករំលែកឯកសារនេះ។",
      empty: "សូមបន្ថែមយ៉ាងហោចណាស់មួយជួរ ឬឯកសារមួយ។",
      invalid_entries: (d) => `សូមកែជួរទី៖ ${d.rows.join(", ")} (ត្រូវការទាំងអត្ថបទខ្មែរ និងអក្សរប្រៃ — អក្សរប្រៃត្រូវជា Braille ASCII ឬចំណុច)`,
      too_many_entries: (d) => `យ៉ាងច្រើនបំផុត ${d.max} ជួរក្នុងមួយការចូលរួម។`,
      too_many_files: () => `យ៉ាងច្រើនបំផុត ${MAX_FILES} ឯកសារក្នុងមួយការចូលរួម។`,
      file_type: (d) => `មិនទទួលយកប្រភេទឯកសារនេះទេ៖ ${d.file}`,
      file_too_large: (d) => `${d.file} ធំជាង ${MAX_FILE_MB} MB។`,
      too_large: "ឯកសាររួមគ្នាធំពេក។ សូមផ្ញើវាជាច្រើនដង។",
      rate_limited: "អ្នកបានផ្ញើច្រើនពេកក្នុងពេលខ្លី។ សូមព្យាយាមម្តងទៀតបន្តិចក្រោយ។",
      storage_full: "យើងមិនអាចទទួលសារបានឥឡូវនេះទេ។ សូមព្យាយាមម្តងទៀតពេលក្រោយ។",
      server: "មានបញ្ហានៅខាងយើង។ សូមព្យាយាមម្តងទៀតពេលក្រោយ។",
      network: "មិនអាចភ្ជាប់ទៅម៉ាស៊ីនមេបានទេ។ សូមពិនិត្យអ៊ីនធឺណិត ហើយព្យាយាមម្តងទៀត។",
    },
  },
  en: {
    title: "Contribute Braille resources",
    intro:
      "If your institute has Khmer text with its Braille (letters, signs, words or sentences) or sample documents, send them to us here. You only need to send the Khmer text and its Braille — our technical team checks everything and updates the translation system. You do not need to edit any dictionary.",
    shareTitle: "What you can share",
    share: [
      { icon: "mdi:alphabet-latin", title: "Khmer letters & signs", desc: "A Khmer letter, vowel or sign and its Braille. e.g. ក → g (⠛)." },
      { icon: "mdi:text-box-outline", title: "Words & sentences", desc: "A Khmer word or sentence and its correct Braille." },
      { icon: "mdi:sigma", title: "Math & science symbols", desc: "A math, chemistry or biology symbol and its Braille. e.g. = → .k (⠨⠅)." },
      { icon: "mdi:file-document-multiple-outline", title: "Sample documents", desc: "An original Khmer document with its Braille version, handbooks or Braille standards (PDF, Word, TXT, BRF, images ...)." },
    ],
    sampleTitle: "A sample of the data we collect",
    sampleHint:
      "Real rows from NISE's Khmer Braille mapping, the Krousar Thmey handbook, and translated sentences. Send your data in the same form: the Khmer text and its Braille.",
    sampleColumns: ["Khmer text or sign", "Braille (as typed)", "Braille dots", "Kind", "Source"],
    groups: {
      consonant: "Consonant",
      vowel: "Dependent vowel",
      independent: "Independent vowel",
      final: "Final sign",
      symbol: "Symbol",
      word: "Word",
      sentence: "Sentence",
    },
    sources: {
      nise: "NISE mapping table",
      math: "Krousar Thmey handbook, math p.21",
      chemistry: "Krousar Thmey handbook, chemistry p.40",
      sentence: "Translated sentence",
    },
    downloadTemplate: "Download CSV template (with these sample rows)",
    howTitle: "How it works",
    how: [
      "Your details are optional. We use them to credit you, and to reach you if we have questions.",
      "Add the Khmer text and its Braille one row at a time, or import a CSV file like the sample above.",
      "Attach sample documents (if any) and send. You will get a reference number.",
      "Our technical team checks it and updates the system.",
    ],
    tipsTitle: "Tips for a good contribution",
    tips: [
      "Braille: type it with SimBraille / Braille ASCII keys (e.g. ,g for ⠠⠛) or paste Unicode Braille dots (⠠⠛) — both work. The dots shown under the box are what we will receive.",
      "One row for each letter, sign, word or sentence.",
      "If you know it, give the source (book, page) — it helps us check quickly.",
      "Many rows? Download the CSV template, fill it in with Excel or Google Sheets, and save as “CSV UTF-8” so Khmer letters stay correct. In Excel, set the Braille column to Text format first, otherwise codes starting with = + - @ turn into formulas.",
      "Documents: when you send an original and its Braille version, give the two files the same name (e.g. lesson1.docx and lesson1.brf).",
      "Only send material you have the right to share. Do not include students' personal information.",
    ],
    aboutYou: "1. About you (optional)",
    name: "Name",
    organization: "Institute / organization",
    contact: "How to reach you (phone or Telegram)",
    mappings: "2. Khmer text and Braille",
    mappingsHint: "One row = one letter, sign, word or sentence and its Braille. Leave this empty if you are only sending documents.",
    textLabel: "Khmer text or sign",
    braille: "Braille (ASCII or dots)",
    source: "Source (optional: book, page)",
    row: (n) => `Row ${n}`,
    removeRow: "Remove row",
    addRow: "Add row",
    importCsv: "Import CSV",
    imported: (n) => `${n} rows imported.`,
    importNone: "No rows found in this file. Check that it uses the template columns (text, braille, source).",
    dots: "Dots:",
    legendTitle: "Braille ASCII key → cell table",
    rowMissing: "Fill in both the Khmer text and its Braille",
    documents: "3. Sample documents",
    filesHint: `Up to ${MAX_FILES} files, ${MAX_FILE_MB} MB each: PDF, Word, ODT, RTF, TXT, BRF/BRL, CSV, Excel, JSON, PNG/JPG.`,
    chooseFiles: "Choose files",
    category: "Category",
    categories: {
      original: "Original Khmer document",
      braille: "Braille version",
      handbook: "Handbook / standard",
      other: "Other",
    },
    removeFile: "Remove file",
    send: "4. Send",
    notes: "Anything else we should know? (optional)",
    notesPlaceholder: "e.g. which Braille standard you follow, which grade the documents are for ...",
    consent: "I have the right to share this material, and I allow IDRI to use it in the Khmer Braille translation system.",
    summary: (rows, files) => `${rows} rows and ${files} files will be sent.`,
    submit: "Send contribution",
    sending: "Sending...",
    successTitle: "Thank you for your contribution!",
    successText: "Please keep this reference number. Our technical team will review your contribution.",
    reference: "Reference number",
    sendAnother: "Send another contribution",
    errors: {
      no_consent: "Please tick the box to confirm you may share this material.",
      empty: "Add at least one row or one document.",
      invalid_entries: (d) => `Please fix rows: ${d.rows.join(", ")} (each needs the Khmer text and its Braille, typed as Braille ASCII or dots)`,
      too_many_entries: (d) => `At most ${d.max} rows per contribution.`,
      too_many_files: () => `At most ${MAX_FILES} files per contribution.`,
      file_type: (d) => `This file type is not accepted: ${d.file}`,
      file_too_large: (d) => `${d.file} is larger than ${MAX_FILE_MB} MB.`,
      too_large: "The files are too large together. Please send them in several contributions.",
      rate_limited: "You have sent a lot in a short time. Please try again a little later.",
      storage_full: "We cannot accept this right now. Please try again later.",
      server: "Something went wrong on our side. Please try again later.",
      network: "Could not reach the server. Check your internet connection and try again.",
    },
  },
};

let nextRowId = 1;
const emptyRow = (fields = {}) => ({ id: nextRowId++, text: "", braille: "", source: "", ...fields });
const isFilled = (r) => [r.text, r.braille, r.source].some((v) => v.trim());
const isComplete = (r) => r.text.trim() && r.braille.trim();
const emptyContact = { name: "", organization: "", contact: "", notes: "", consent: false, website: "" };

/** Minimal CSV reader: quoted cells, "" escapes, commas and newlines inside quotes. */
const parseCsv = (text) => {
  const rows = [];
  let row = [], cell = "", quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") { row.push(cell); cell = ""; }
    else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(cell); rows.push(row); row = []; cell = "";
    } else cell += ch;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows;
};

const guessCategory = (name) => {
  const ext = name.slice(name.lastIndexOf(".")).toLowerCase();
  if (ext === ".brf" || ext === ".brl") return "braille";
  if ([".csv", ".xlsx", ".xls", ".json"].includes(ext)) return "other";
  return "original";
};

const Section = ({ title, hint, children }) => (
  <section className="bg-white border rounded-xl shadow-sm p-5 md:p-6 mt-6">
    <h2 className="font-bold text-BlueDark text-lg md:text-xl">{title}</h2>
    {hint && <p className="text-sm text-gray-500 mt-1">{hint}</p>}
    <div className="mt-4">{children}</div>
  </section>
);

const Contribute = () => {
  const { interfaceLang } = appStore();
  const c = content[interfaceLang] || content.km;

  const [contact, setContact] = useState(emptyContact);
  const [rows, setRows] = useState(() => [emptyRow()]);
  const [files, setFiles] = useState([]);
  const [importMsg, setImportMsg] = useState("");
  const [fileError, setFileError] = useState(null);
  const [error, setError] = useState(null);
  const [sending, setSending] = useState(false);
  const [doneId, setDoneId] = useState(null);
  const csvInput = useRef(null);
  const fileInput = useRef(null);

  const filledRows = rows.filter(isFilled);

  // Any edit hides the last submit error, so it never describes an old state.
  const updateContact = (field) => (e) => {
    setContact({ ...contact, [field]: field === "consent" ? e.target.checked : e.target.value });
    setError(null);
  };
  const updateRow = (id, field, value) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
    setError(null);
  };
  const removeRow = (id) =>
    setRows((prev) => (prev.length > 1 ? prev.filter((r) => r.id !== id) : [emptyRow()]));

  const importCsv = (e) => {
    const file = e.target.files[0];
    e.target.value = "";
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const csv = String(reader.result).replace(/^﻿/, "");
      const lines = parseCsv(csv).filter((cells) => cells.some((v) => v.trim()));
      // Old template: type, text, braille, kind, meaning, source
      const oldFormat = lines.length > 0 && lines[0][0].trim().toLowerCase() === "type";
      const imported = lines
        .filter((cells) => !cells[0].trim().startsWith("#") && !["type", "text"].includes(cells[0].trim().toLowerCase()))
        .map((cells) => {
          const v = cells.map((x) => x.trim());
          return oldFormat
            ? emptyRow({ text: v[1] || "", braille: v[2] || "", source: v[5] || "" })
            : emptyRow({ text: v[0] || "", braille: v[1] || "", source: v[2] || "" });
        });
      if (!imported.length) {
        setImportMsg(c.importNone);
        return;
      }
      setRows((prev) => [...prev.filter(isFilled), ...imported]);
      setImportMsg(c.imported(imported.length));
    };
    reader.readAsText(file, "utf-8");
  };

  const downloadTemplate = () =>
    saveAs(new Blob([BOM + CSV_TEMPLATE], { type: "text/csv;charset=utf-8" }), "braille-contribution-template.csv");

  const addFiles = (e) => {
    const chosen = Array.from(e.target.files);
    e.target.value = "";
    setFileError(null);
    const accepted = [];
    for (const file of chosen) {
      const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
      if (!ACCEPTED.includes(ext)) {
        setFileError({ code: "file_type", file: file.name });
      } else if (file.size > MAX_FILE_MB * 1024 * 1024) {
        setFileError({ code: "file_too_large", file: file.name });
      } else {
        accepted.push({ id: nextRowId++, file, category: guessCategory(file.name) });
      }
    }
    const all = [...files, ...accepted];
    if (all.length > MAX_FILES) setFileError({ code: "too_many_files" });
    setFiles(all.slice(0, MAX_FILES));
  };

  const message = (err) => {
    if (!err) return "";
    const msg = c.errors[err.code] || c.errors.server;
    return typeof msg === "function" ? msg(err) : msg;
  };

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!contact.consent) {
      setError({ code: "no_consent" });
      return;
    }
    if (!filledRows.length && !files.length) {
      setError({ code: "empty" });
      return;
    }
    const badRows = rows.map((r, i) => (isFilled(r) && !isComplete(r) ? i + 1 : null)).filter(Boolean);
    if (badRows.length) {
      setError({ code: "invalid_entries", rows: badRows });
      return;
    }

    const form = new FormData();
    ["name", "organization", "contact", "notes", "website"].forEach((k) => form.append(k, contact[k]));
    form.append("consent", "true");
    form.append("lang", interfaceLang);
    // No type: the server guesses it, the technical team checks it when reviewing
    form.append("entries", JSON.stringify(filledRows.map(({ text, braille, source }) => ({ text, braille, source }))));
    form.append("file_categories", JSON.stringify(files.map((f) => f.category)));
    files.forEach((f) => form.append("files", f.file));

    setSending(true);
    try {
      const res = await axios.post(`${FORMS_API_URL}/contribute`, form);
      setDoneId(res.data.id);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      const data = err.response?.data;
      if (!err.response) setError({ code: "network" });
      else if (data?.error === "invalid_entries") {
        // server rows count only the filled rows; map back to the rows on screen
        setError({ code: "invalid_entries", rows: data.rows.map((n) => rows.indexOf(filledRows[n - 1]) + 1) });
      } else setError({ code: data?.error || "server", ...data });
    } finally {
      setSending(false);
    }
  };

  const reset = () => {
    setContact(emptyContact);
    setRows([emptyRow()]);
    setFiles([]);
    setError(null);
    setImportMsg("");
    setDoneId(null);
  };

  if (doneId) {
    return (
      <div className="lg:mt-24 mt-20 pb-16 px-4">
        <div className="max-w-2xl mx-auto bg-white border rounded-xl shadow-md p-8 text-center">
          <Icon icon="mdi:check-decagram" className="text-6xl text-MainSucess mx-auto" aria-hidden="true" />
          <h1 className="font-bold text-BlueDark text-xl md:text-2xl mt-4">{c.successTitle}</h1>
          <p className="text-gray-600 mt-3">{c.successText}</p>
          <p className="mt-6 text-sm text-gray-500">{c.reference}</p>
          <p className="font-mono font-bold text-lg md:text-xl text-BlueDark break-all">{doneId}</p>
          <button
            type="button"
            onClick={reset}
            className="mt-8 border-2 border-BlueDark text-BlueDark font-bold rounded-full px-5 py-2 hover:bg-BlueDark hover:text-white transition-colors"
          >
            {c.sendAnother}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="lg:mt-24 mt-20 pb-16">
      <div className="lg:mx-24 md:mx-14 mx-4">
        {/* Header */}
        <div className="text-center">
          <h1 className="font-bold text-BlueDark text-xl md:text-2xl">{c.title}</h1>
          <p className="text-gray-600 text-base md:text-lg mt-3 max-w-4xl mx-auto">{c.intro}</p>
        </div>

        {/* What you can share */}
        <h2 className="font-bold text-BlueDark text-lg md:text-xl mt-10 mb-4">{c.shareTitle}</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {c.share.map((item) => (
            <div key={item.title} className="bg-white border rounded-xl shadow-sm p-5">
              <Icon icon={item.icon} className="text-3xl text-BlueDark" aria-hidden="true" />
              <h3 className="font-bold mt-2">{item.title}</h3>
              <p className="text-sm md:text-base text-gray-600 mt-1">{item.desc}</p>
            </div>
          ))}
        </div>

        {/* Sample of the data */}
        <section className="mt-10" aria-labelledby="sample-title">
          <h2 id="sample-title" className="font-bold text-BlueDark text-lg md:text-xl">{c.sampleTitle}</h2>
          <p className="text-gray-600 mt-1 max-w-4xl">{c.sampleHint}</p>
          <div className="mt-4 overflow-x-auto rounded-xl border bg-white shadow-sm">
            <table className="w-full text-left text-sm md:text-base">
              <thead className="bg-blue-50 text-BlueDark">
                <tr>
                  {c.sampleColumns.map((col) => (
                    <th key={col} scope="col" className="px-3 py-2 font-bold whitespace-nowrap">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {SAMPLE.map((s) => (
                  <tr key={s.text} className="border-t">
                    <td className="px-3 py-2 text-base md:text-lg">{s.text}</td>
                    <td className="px-3 py-2 font-mono whitespace-nowrap">{s.braille}</td>
                    <td className="px-3 py-2 font-braille text-xl whitespace-nowrap" aria-label={asciiToBraille(s.braille)}>
                      {asciiToBraille(s.braille)}
                    </td>
                    <td className="px-3 py-2 text-gray-600 whitespace-nowrap">{c.groups[s.group]}</td>
                    <td className="px-3 py-2 text-gray-500">{c.sources[s.source]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button
            type="button"
            onClick={downloadTemplate}
            className="mt-3 inline-flex items-center gap-2 border border-BlueDark text-BlueDark rounded-md px-3 py-2 text-sm font-bold hover:bg-blue-50"
          >
            <Icon icon="mdi:file-download-outline" className="text-lg" aria-hidden="true" />
            {c.downloadTemplate}
          </button>
        </section>

        {/* How it works + tips */}
        <div className="grid md:grid-cols-2 gap-6 mt-10">
          <div>
            <h2 className="font-bold text-BlueDark text-lg md:text-xl mb-4">{c.howTitle}</h2>
            <ol className="space-y-3">
              {c.how.map((step, i) => (
                <li key={i} className="flex gap-3">
                  <span className="w-7 h-7 flex items-center justify-center rounded-full bg-BlueDark text-white text-sm font-bold shrink-0">
                    {i + 1}
                  </span>
                  <span className="text-base">{step}</span>
                </li>
              ))}
            </ol>
          </div>
          <div>
            <h2 className="font-bold text-BlueDark text-lg md:text-xl mb-4">{c.tipsTitle}</h2>
            <ul className="space-y-3">
              {c.tips.map((tip, i) => (
                <li key={i} className="flex gap-2">
                  <Icon icon="mdi:lightbulb-on-outline" className="text-xl text-amber-500 shrink-0 mt-0.5" aria-hidden="true" />
                  <span className="text-base">{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {!FORMS_OPEN && <FormsClosedNotice />}

        <form onSubmit={submit} noValidate className="mt-6">
          <fieldset disabled={!FORMS_OPEN} className="min-w-0 disabled:opacity-60">
          {/* 1. About you */}
          <Section title={c.aboutYou}>
            <div className="grid md:grid-cols-2 gap-4">
              <Field label={c.name}>
                <input className={inputClass} value={contact.name} onChange={updateContact("name")} autoComplete="name" />
              </Field>
              <Field label={c.organization}>
                <input className={inputClass} value={contact.organization} onChange={updateContact("organization")} autoComplete="organization" />
              </Field>
              <Field label={c.contact}>
                <input className={inputClass} value={contact.contact} onChange={updateContact("contact")} maxLength={200} />
              </Field>
            </div>
            {/* Spam trap: hidden from people, bots fill it in */}
            <input
              type="text"
              name="website"
              value={contact.website}
              onChange={updateContact("website")}
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              className="hidden"
            />
          </Section>

          {/* 2. Khmer text and Braille */}
          <Section title={c.mappings} hint={c.mappingsHint}>
            <div className="flex flex-wrap gap-2 mb-4">
              <button
                type="button"
                onClick={() => csvInput.current.click()}
                className="inline-flex items-center gap-2 border border-BlueDark text-BlueDark rounded-md px-3 py-2 text-sm font-bold hover:bg-blue-50"
              >
                <Icon icon="mdi:file-upload-outline" className="text-lg" aria-hidden="true" />
                {c.importCsv}
              </button>
              <button
                type="button"
                onClick={downloadTemplate}
                className="inline-flex items-center gap-2 border border-gray-300 text-gray-700 rounded-md px-3 py-2 text-sm font-bold hover:bg-gray-50"
              >
                <Icon icon="mdi:file-download-outline" className="text-lg" aria-hidden="true" />
                {c.downloadTemplate}
              </button>
              <input ref={csvInput} type="file" accept=".csv,text/csv" onChange={importCsv} className="hidden" />
            </div>
            {importMsg && <p className="text-sm text-gray-600 mb-3" role="status">{importMsg}</p>}

            <div className="space-y-4">
              {rows.map((row, i) => (
                <div key={row.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-bold text-sm text-gray-500">{c.row(i + 1)}</span>
                    <button
                      type="button"
                      onClick={() => removeRow(row.id)}
                      aria-label={`${c.removeRow} ${i + 1}`}
                      title={c.removeRow}
                      className="p-1 rounded text-gray-500 hover:text-red-600 hover:bg-red-50"
                    >
                      <Icon icon="mdi:trash-can-outline" className="text-xl" aria-hidden="true" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                    <div className="md:col-span-4">
                      <Field label={c.textLabel}>
                        <input className={inputClass} value={row.text} onChange={(e) => updateRow(row.id, "text", e.target.value)} />
                      </Field>
                    </div>
                    <div className="md:col-span-5">
                      <Field label={c.braille}>
                        <input
                          className={`${inputClass} font-mono`}
                          value={row.braille}
                          onChange={(e) => updateRow(row.id, "braille", e.target.value)}
                          spellCheck={false}
                          autoCapitalize="off"
                        />
                      </Field>
                      {row.braille.trim() && (
                        <p className="text-sm text-gray-600 mt-1">
                          {c.dots} <span className="font-braille text-xl tracking-wider">{asciiToBraille(row.braille)}</span>
                        </p>
                      )}
                    </div>
                    <div className="md:col-span-3">
                      <Field label={c.source}>
                        <input className={inputClass} value={row.source} onChange={(e) => updateRow(row.id, "source", e.target.value)} />
                      </Field>
                    </div>
                  </div>
                  {isFilled(row) && !isComplete(row) && (
                    <p className="mt-2 flex items-start gap-1.5 text-sm text-amber-700">
                      <Icon icon="mdi:alert-outline" className="text-lg shrink-0" aria-hidden="true" />
                      <span>{c.rowMissing}</span>
                    </p>
                  )}
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setRows((prev) => [...prev, emptyRow()])}
              className="mt-4 inline-flex items-center gap-2 bg-BlueDark text-white rounded-md px-4 py-2 text-sm font-bold hover:opacity-90"
            >
              <Icon icon="mdi:plus" className="text-lg" aria-hidden="true" />
              {c.addRow}
            </button>

            <details className="mt-5 text-sm">
              <summary className="cursor-pointer font-bold text-BlueDark">{c.legendTitle}</summary>
              <div className="grid grid-cols-4 sm:grid-cols-8 md:grid-cols-12 gap-2 mt-3">
                {BRAILLE_ASCII_LEGEND.map(([key, cell]) => (
                  <div key={key} className="border rounded bg-white text-center py-1">
                    <div className="font-mono font-bold">{key}</div>
                    <div className="font-braille text-xl">{cell}</div>
                  </div>
                ))}
              </div>
            </details>
          </Section>

          {/* 3. Documents */}
          <Section title={c.documents} hint={c.filesHint}>
            <button
              type="button"
              onClick={() => fileInput.current.click()}
              disabled={files.length >= MAX_FILES}
              className="inline-flex items-center gap-2 border border-BlueDark text-BlueDark rounded-md px-3 py-2 text-sm font-bold hover:bg-blue-50 disabled:opacity-50"
            >
              <Icon icon="mdi:paperclip" className="text-lg" aria-hidden="true" />
              {c.chooseFiles}
            </button>
            <input ref={fileInput} type="file" multiple accept={ACCEPTED.join(",")} onChange={addFiles} className="hidden" />
            {fileError && <p className="text-sm text-red-600 mt-2" role="alert">{message(fileError)}</p>}
            {files.length > 0 && (
              <ul className="mt-4 space-y-2">
                {files.map((f) => (
                  <li key={f.id} className="flex flex-col sm:flex-row sm:items-center gap-2 border rounded-lg p-3 bg-gray-50">
                    <span className="flex-1 min-w-0 break-all text-sm">
                      {f.file.name} <span className="text-gray-500">({(f.file.size / 1024 / 1024).toFixed(1)} MB)</span>
                    </span>
                    <label className="flex items-center gap-2 text-sm">
                      <span className="text-gray-600">{c.category}</span>
                      <select
                        className="border border-gray-300 rounded-md px-2 py-1 bg-white"
                        value={f.category}
                        onChange={(e) => setFiles((prev) => prev.map((x) => (x.id === f.id ? { ...x, category: e.target.value } : x)))}
                      >
                        {FILE_CATEGORIES.map((cat) => (
                          <option key={cat} value={cat}>{c.categories[cat]}</option>
                        ))}
                      </select>
                    </label>
                    <button
                      type="button"
                      onClick={() => setFiles((prev) => prev.filter((x) => x.id !== f.id))}
                      aria-label={`${c.removeFile}: ${f.file.name}`}
                      title={c.removeFile}
                      className="self-end sm:self-auto p-1 rounded text-gray-500 hover:text-red-600 hover:bg-red-50"
                    >
                      <Icon icon="mdi:close" className="text-xl" aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          {/* 4. Send */}
          <Section title={c.send}>
            <Field label={c.notes}>
              <textarea
                className={`${inputClass} min-h-[100px]`}
                value={contact.notes}
                onChange={updateContact("notes")}
                placeholder={c.notesPlaceholder}
              />
            </Field>
            <label className="flex items-start gap-3 mt-4 cursor-pointer">
              <input type="checkbox" checked={contact.consent} onChange={updateContact("consent")} className="mt-1 w-5 h-5 shrink-0" />
              <span className="text-base">
                {c.consent}
                <span className="text-red-500"> *</span>
              </span>
            </label>
            <p className="text-sm text-gray-500 mt-4">{c.summary(filledRows.length, files.length)}</p>
            {error && <p className="text-red-600 mt-3" role="alert">{message(error)}</p>}
            <button
              type="submit"
              disabled={sending}
              className="mt-4 inline-flex items-center gap-2 bg-BlueDark text-white font-bold rounded-full px-6 py-3 hover:opacity-90 disabled:opacity-60"
            >
              <Icon icon={sending ? "mdi:loading" : "mdi:send"} className={`text-xl ${sending ? "animate-spin" : ""}`} aria-hidden="true" />
              {sending ? c.sending : c.submit}
            </button>
          </Section>
          </fieldset>
        </form>
      </div>
    </div>
  );
};

export default Contribute;
