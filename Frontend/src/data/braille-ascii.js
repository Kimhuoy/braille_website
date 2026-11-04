// Braille ASCII <-> 6-dot Unicode Braille.
//
// Same 64 cells as Backend/english_to_braille_dictionary.json, which follows
// the SimBraille font (North-American Braille ASCII) used in the Krousar
// Thmey PDFs: typing these keys in a document set to SimBraille shows the
// same dots that this table produces.

const PAIRS = [
  [" ", "⠀"], ["a", "⠁"], ["1", "⠂"], ["b", "⠃"], ["'", "⠄"], ["k", "⠅"],
  ["2", "⠆"], ["l", "⠇"], ["@", "⠈"], ["c", "⠉"], ["i", "⠊"], ["f", "⠋"],
  ["/", "⠌"], ["m", "⠍"], ["s", "⠎"], ["p", "⠏"], ['"', "⠐"], ["e", "⠑"],
  ["3", "⠒"], ["h", "⠓"], ["9", "⠔"], ["o", "⠕"], ["6", "⠖"], ["r", "⠗"],
  ["^", "⠘"], ["d", "⠙"], ["j", "⠚"], ["g", "⠛"], [">", "⠜"], ["n", "⠝"],
  ["t", "⠞"], ["q", "⠟"], [",", "⠠"], ["*", "⠡"], ["5", "⠢"], ["<", "⠣"],
  ["-", "⠤"], ["u", "⠥"], ["8", "⠦"], ["v", "⠧"], [".", "⠨"], ["%", "⠩"],
  ["[", "⠪"], ["$", "⠫"], ["+", "⠬"], ["x", "⠭"], ["!", "⠮"], ["&", "⠯"],
  [";", "⠰"], [":", "⠱"], ["4", "⠲"], ["\\", "⠳"], ["0", "⠴"], ["z", "⠵"],
  ["7", "⠶"], ["(", "⠷"], ["_", "⠸"], ["?", "⠹"], ["w", "⠺"], ["]", "⠻"],
  ["#", "⠼"], ["y", "⠽"], [")", "⠾"], ["=", "⠿"],
];

// Extra keys that SimBraille shows as an existing cell.
const ALIASES = { "`": "⠈", "{": "⠪", "}": "⠻", "|": "⠳", "~": "⠘" };

export const ASCII_TO_CELL = Object.fromEntries(PAIRS);
Object.assign(ASCII_TO_CELL, ALIASES);
export const CELL_TO_ASCII = Object.fromEntries(PAIRS.map(([a, c]) => [c, a]));

// For the on-screen legend (space excluded).
export const BRAILLE_ASCII_LEGEND = PAIRS.filter(([a]) => a !== " ");

/** Turn typed Braille ASCII into 6-dot cells (one key -> one cell). */
export const asciiToBraille = (text) =>
  text.replace(/[\x20-\x7E]/g, (ch) => ASCII_TO_CELL[ch.toLowerCase()] ?? ch);

/** Unicode Braille -> Braille ASCII (for .brf files and SimBraille users). */
export const brailleToAscii = (text) =>
  Array.from(text)
    .map((ch) => CELL_TO_ASCII[ch] ?? ch)
    .join("");
