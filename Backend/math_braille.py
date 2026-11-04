"""
Math (equation) -> 6-dot Braille, following the Krousar Thmey math PDFs.

Pipeline (same idea as Khmer text):
    equation text  --(rules + math_symbols.json)-->  Braille ASCII (SimBraille)
                   --(english_to_braille_dictionary.json)-->  6-dot Unicode cells

Equations are marked in the input text with ⟦ ... ⟧ (the frontend's equation
tools insert these).  Inside an equation the input uses a small linear format
close to MS Word's "UnicodeMath" linear form:

    x^2        superscript           x_1, x_n     subscript
    a/b        fraction              (x+1)/(x-1)  parentheses group an operand
    √(x)       square root           √(n&x)       n-th root, ∛(x), ∜(x)
    ∫_a^b      integral with limits  ∑_(i=1)^n    sum (under/over form)
    lim_(x→a)  limit                 log_a x      log with base
    x̄  x⃗  x̂   bar / vector / hat (combining mark after a letter or a (group))
    (■(a&b@c&d))  matrix (& = next column, @ = next row)
    ⬚          empty placeholder (reported back, never printed)

Rules implemented, with the PDF page that shows them:
    * numeric indicator # at the start, after a space and after = (Fraction p.20-21)
    * digits in math are the lower cells (SimBraille 0-9)               (Exponent p.19)
    * capital letter ,x                                                   (all)
    * superscript ^, nested ^^, sub-in-sup ^; ... ; return to baseline "  (General p.26-30)
    * numeric subscript on a letter needs no indicator: x1               (Exponent p.19)
    * fraction ?a/b#, complex fraction ,?a,/b,#                           (Fraction p.20)
    * radical >x], n-th root <n>x], nested radical .>x.]                  (General p.24-25)
    * Σ and lim use the under/over form "base%under<over}                  (General p.31-33)
    * integral uses the script form !;a^b"                                (General p.36-37)
    * degree is written as a superscript ^.* ; °C -> ^.* ;,c              (Exponent p.19)
    * bar x: / "AB<:], vector "AB<$o], hat "ABC<.$[]                       (Fraction p.21-22, General p.35)
    * matrix rows @(... @) on separate lines, each entry with #           (Determinant p.22, General p.24)
"""

import json
import os
import re
import unicodedata

_DIR = os.path.dirname(os.path.abspath(__file__))

MATH_OPEN = "⟦"   # ⟦
MATH_CLOSE = "⟧"  # ⟧
PLACEHOLDER = "⬚"  # ⬚

with open(os.path.join(_DIR, "math_symbols.json"), encoding="utf-8") as _f:
    MATH_SYMBOLS = json.load(_f)["symbols"]

with open(os.path.join(_DIR, "english_to_braille_dictionary.json"), encoding="utf-8") as _f:
    ASCII_TO_CELL = dict(json.load(_f))
# SimBraille shows ~ as the same cell as ^ (the PDFs use both for superscript).
ASCII_TO_CELL.setdefault("~", "⠘")

# Symbols the PDFs do not cover but the existing Khmer dictionary already maps.
FALLBACK_SYMBOLS = {
    "<": {"code": '$"k', "kind": "rel"},
    ">": {"code": "$.1", "kind": "rel"},
}

FUNCTION_NAMES = sorted(
    ["arcsin", "arccos", "arctan", "sinh", "cosh", "tanh", "sin", "cos", "tan",
     "cot", "sec", "csc", "log", "ln", "lim", "exp", "max", "min", "det", "mod"],
    key=len, reverse=True,
)
COMBINING_ACCENTS = {"̄": "bar", "̅": "bar", "⃗": "vec", "̂": "hat",
                     "̶": "strike", "̵": "strike"}   # a̶: struck out (Biology p.46)
STRIKES = "̶̵"
ROOT_CHARS = {"√": None, "∛": "3", "∜": "4"}   # √ ∛ ∜
PRIMES = {"'", "′", "″"}
GROUP_CODES = {"(": ("(", ")"), "[": ("@(", "@)"), "{": (".(", ".)"),
               "|": ("\\", "\\"), "‖": ("\\\\", "\\\\")}
CLOSERS = {"(": ")", "[": "]", "{": "}", "|": "|", "‖": "‖"}
UNDER_OVER_SYMBOLS = {"∑", "Σ"}  # ∑ Σ
OVER_OP, UNDER_OP = "┴", "┬"     # UnicodeMath over-script / under-script operators
ARROWS = {"→", "⇌"}              # a reaction condition can be written above these
STATES = {"g", "l", "s", "aq"}   # chemistry states (g) (l) (s) (aq)
SUPERSCRIPTS = dict(zip("⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻⁼⁽⁾ⁿⁱ", "0123456789+-=()ni"))
SUBSCRIPTS = dict(zip("₀₁₂₃₄₅₆₇₈₉₊₋₌₍₎ₐₑₒₓₙ", "0123456789+-=()aeoxn"))


def _normalize_scripts(expr):
    """H₂O -> H_(2)O and Cu²⁺ -> Cu^(2+), so pasted chemistry works too."""
    out, i = [], 0
    while i < len(expr):
        for table, op in ((SUPERSCRIPTS, "^"), (SUBSCRIPTS, "_")):
            if expr[i] in table:
                j = i
                while j < len(expr) and expr[j] in table:
                    j += 1
                out.append(op + "(" + "".join(table[c] for c in expr[i:j]) + ")")
                i = j
                break
        else:
            out.append(expr[i])
            i += 1
    return "".join(out)


def _normalize_strikes(expr):
    """a̶,̶ ̶b̶ (a stroke on every character, as pasted) -> (a, b)̶ : one struck group."""
    out, i, n = [], 0, len(expr)
    while i < n:
        j, run = i, []
        while j + 1 < n and expr[j] != ")" and expr[j + 1] in STRIKES:
            run.append(expr[j])
            j += 2
        if len(run) > 1:
            out.append("(" + "".join(run).strip() + ")" + STRIKES[0])
            i = j
        else:
            out.append(expr[i])
            i += 1
    return "".join(out)


# --------------------------------------------------------------------------
# Tokenizer
# --------------------------------------------------------------------------
def tokenize(expr):
    """Tokens, plus the indexes of tokens typed after a space (see _Parser.parse_seq)."""
    expr = _normalize_strikes(_normalize_scripts(expr))
    toks, gaps = [], set()
    i, n = 0, len(expr)
    while i < n:
        c = expr[i]
        if c.isspace() or c in "⁡⁢​":    # spaces / invisible function/times
            if c.isspace():
                gaps.add(len(toks))
            i += 1
            continue
        if c.isdigit():
            j = i + 1
            while j < n and (expr[j].isdigit() or
                             (expr[j] in ".," and j + 1 < n and expr[j + 1].isdigit())):
                j += 1
            toks.append(("num", expr[i:j]))
            i = j
            continue
        if c.isascii() and c.isalpha():
            for name in FUNCTION_NAMES:
                if expr.startswith(name, i):
                    toks.append(("func", name))
                    i += len(name)
                    break
            else:
                # A capital + one lower-case letter is one element symbol (Cu, Na, Cl).
                # Same Braille as two letters (,c + u = ,cu), but scripts and marks
                # placed after it then belong to the whole symbol.
                if c.isupper() and i + 1 < n and expr[i + 1].isascii() and expr[i + 1].islower() \
                        and not any(expr.startswith(f, i + 1) for f in FUNCTION_NAMES):
                    toks.append(("var", expr[i:i + 2]))
                    i += 2
                else:
                    toks.append(("var", c))
                    i += 1
            continue
        if "\u1780" <= c <= "\u17FF":                 # Khmer words inside an equation
            j = i
            while j < n and ("\u1780" <= expr[j] <= "\u17FF" or expr[j] == "\u200b"):
                j += 1
            toks.append(("khmer", expr[i:j]))
            i = j
            continue
        if c in "^_/&@" or c in (OVER_OP, UNDER_OP):
            toks.append(("op", c))
        elif c in "([{":
            toks.append(("open", c))
        elif c in ")]}":
            toks.append(("close", c))
        elif c in "|‖":
            toks.append(("bar", c))
        elif c in ROOT_CHARS:
            toks.append(("root", c))
        elif c == "■":                           # ■ matrix
            toks.append(("matrix", c))
        elif c in COMBINING_ACCENTS:
            toks.append(("accent", COMBINING_ACCENTS[c]))
        elif c == PLACEHOLDER:
            toks.append(("ph", c))
        elif c == "℃":                           # ℃
            toks.append(("sym", "°"))
            toks.append(("var", "C"))
        else:
            toks.append(("sym", c))
        i += 1
    return toks, gaps


# --------------------------------------------------------------------------
# Parser -> small AST of dicts
# --------------------------------------------------------------------------
class _Parser:
    def __init__(self, toks, gaps=()):
        self.t = toks
        self.gaps = gaps         # indexes of tokens typed after a space
        self.i = 0

    def peek(self, kind=None, value=None, k=0):
        if self.i + k >= len(self.t):
            return None
        tok = self.t[self.i + k]
        if kind is not None and tok[0] != kind:
            return None
        if value is not None and tok[1] != value:
            return None
        return tok

    def take(self):
        tok = self.t[self.i]
        self.i += 1
        return tok

    def at_stop(self, stops):
        tok = self.peek()
        return tok is None or tok in stops

    def parse_seq(self, stops=()):
        # Spaces are ignored, except where print separates items with them
        # (Biology p.46): between two terms (AA 2Aa aa, A B C), after a comma
        # (a, b, c) and on both sides of a cross (Aa × Aa).
        items = []
        space_after_cross = False
        while not self.at_stop(stops):
            start = self.i
            term = self.parse_term(stops)
            spaced = start in self.gaps and items
            if spaced and ((_is_word(items[-1]) and _is_word(term))
                           or (items[-1] == {"t": "sym", "v": ","})
                           or (_is_cross(term) and _is_word(items[-1]) and self.i in self.gaps)
                           or (space_after_cross and _is_word(term))):
                items.append({"t": "space"})
            space_after_cross = bool(spaced) and _is_cross(term) and self.i in self.gaps
            items.append(term)
            while self.peek("op", "/"):
                self.take()
                # numerator: the run of operands just before "/" (5x, 2π, dy)
                k = len(items)
                while k > 0 and _is_operand(items[k - 1]):
                    k -= 1
                num = items[k:] or [{"t": "ph"}]
                del items[k:]
                # denominator: the run of operands just after "/"
                den = [self.parse_term(stops)]
                while (not self.at_stop(stops) and not self.peek("op", "/")
                       and self._next_is_operand()):
                    den.append(self.parse_term(stops))
                items.append({"t": "frac", "num": _as_operand(num), "den": _as_operand(den)})
        return {"t": "seq", "items": items}

    def _next_is_operand(self):
        tok = self.peek()
        if tok is None:
            return False
        kind, val = tok
        if kind == "sym":
            return _is_letterlike_sym(val)
        return kind in ("num", "var", "open", "root", "ph", "bar", "matrix")

    def parse_term(self, stops=()):
        # Prescripts (isotopes): _(29)^(63)Cu  ->  ^63";29",cu   (Chemistry p.40)
        if self.peek("op", "^") or self.peek("op", "_"):
            pre_sub = pre_sup = None
            while self.peek("op", "^") or self.peek("op", "_"):
                op = self.take()[1]
                operand = self.parse_operand(stops)
                if op == "^":
                    pre_sup = operand
                else:
                    pre_sub = operand
            base = self.parse_term(stops)
            return {"t": "prescript", "base": base, "sub": pre_sub, "sup": pre_sup}
        atom = self.parse_atom(stops)
        while self.peek("sym") and self.peek()[1] in PRIMES:
            atom = {"t": "seq", "items": [atom, {"t": "sym", "v": self.take()[1]}], "primed": True}
        while self.peek("accent"):
            atom = {"t": "accent", "kind": self.take()[1], "body": _strip(atom)}
        sub = sup = None
        while self.peek("op", "^") or self.peek("op", "_"):
            op = self.take()[1]
            operand = self.parse_operand(stops)
            if op == "^":
                sup = operand
            else:
                sub = operand
        if sub is not None or sup is not None:
            atom = {"t": "script", "base": atom, "sub": sub, "sup": sup}
        while self.peek("op", OVER_OP) or self.peek("op", UNDER_OP):   # ┴ over, ┬ under
            where = "over" if self.take()[1] == OVER_OP else "under"
            atom = {"t": "overunder", "base": atom, "where": where, "mod": self.parse_operand(stops)}
        if self.peek("sym", "°"):                          # degree
            self.take()
            unit = None
            if self.peek("var") and self.peek()[1] in "CFcf":
                unit = self.take()[1]
            atom = {"t": "degree", "base": atom, "unit": unit}
        return atom

    def parse_operand(self, stops=()):
        if self.peek("open", "("):
            return _strip(self.parse_atom(stops))
        if self.peek("sym") and self.peek()[1] in ("-", "−", "+"):
            sign = {"t": "sym", "v": self.take()[1]}
            nxt = self.peek()
            # a lone sign is a charge: e^-, Ag^+
            if nxt is None or nxt in stops or not (nxt[0] in ("num", "var", "open", "root", "ph")
                                                   or (nxt[0] == "sym" and _is_letterlike_sym(nxt[1]))):
                return sign
            return {"t": "seq", "items": [sign, self.parse_atom(stops)]}
        return self.parse_atom(stops)

    def parse_group_body(self, closer):
        body = self.parse_seq(stops=(("close", closer), ("bar", closer)))
        if self.peek() is not None and self.peek()[1] == closer:
            self.take()
        return body

    def parse_atom(self, stops=()):
        tok = self.peek()
        if tok is None:
            return {"t": "ph"}
        kind, val = tok
        if tok in stops:                     # nothing before a stop -> empty
            return {"t": "seq", "items": []}
        self.take()
        if kind == "num":
            return {"t": "num", "v": val}
        if kind == "var":
            return {"t": "var", "v": val}
        if kind == "func":
            return {"t": "func", "v": val}
        if kind == "khmer":
            return {"t": "khmer", "v": val}
        if kind == "ph":
            return {"t": "ph"}
        if kind == "open":
            closer = CLOSERS[val]
            if self.peek("matrix"):
                self.take()
                mat = self.parse_matrix()
                if self.peek("close", closer):
                    self.take()
                return {"t": "group", "open": val, "body": mat}
            return {"t": "group", "open": val, "body": self.parse_group_body(closer)}
        if kind == "bar":
            if self.peek("matrix"):
                self.take()
                mat = self.parse_matrix()
                if self.peek("bar", val):
                    self.take()
                return {"t": "group", "open": val, "body": mat}
            return {"t": "group", "open": val, "body": self.parse_group_body(val)}
        if kind == "root":
            index = ROOT_CHARS[val]
            index_node = {"t": "num", "v": index} if index else None
            if self.peek("open", "("):
                self.take()
                body = self.parse_seq(stops=(("close", ")"), ("op", "&")))
                if self.peek("op", "&"):
                    self.take()
                    index_node = body
                    body = self.parse_seq(stops=(("close", ")"),))
                if self.peek("close", ")"):
                    self.take()
            else:
                body = self.parse_atom(stops)
            return {"t": "root", "index": index_node, "body": body}
        if kind == "matrix":
            return self.parse_matrix()
        # sym, stray close/op/accent: keep as a symbol so nothing is lost silently
        return {"t": "sym", "v": val}

    def parse_matrix(self):
        rows, row = [], []
        if not self.peek("open", "("):
            return {"t": "matrix", "rows": rows}
        self.take()
        stops = (("op", "&"), ("op", "@"), ("close", ")"))
        while True:
            row.append(self.parse_seq(stops))
            tok = self.peek()
            if tok == ("op", "&"):
                self.take()
            elif tok == ("op", "@"):
                self.take()
                rows.append(row)
                row = []
            else:
                if tok == ("close", ")"):
                    self.take()
                rows.append(row)
                break
        return {"t": "matrix", "rows": rows}


def _is_letterlike_sym(ch):
    return "GREEK" in unicodedata.name(ch, "") or ch in ("\u221E", PLACEHOLDER)


def _is_word(node):
    """A term that a typed space keeps apart from the next one: AA 2Aa aa, A B C."""
    t = node.get("t")
    if t in ("var", "num", "group", "accent"):
        return True
    if t == "sym":
        return _is_letterlike_sym(node["v"])
    if t == "script":
        return _is_word(node["base"])
    return t == "seq" and bool(node.get("primed"))


def _is_cross(node):
    return node == {"t": "sym", "v": "×"}


def _is_operand(node):
    """True for things that join into one fraction operand (5x, 2π, dy ...)."""
    t = node.get("t")
    if t == "space":
        return False
    if t == "sym":
        return _is_letterlike_sym(node["v"])
    if t == "func":
        return False
    if t == "script" and node["base"].get("t") == "func":
        return False
    return True


def _as_operand(items):
    if len(items) == 1:
        return _strip(items[0])
    return {"t": "seq", "items": items}


def _strip(node):
    """Parentheses that only group an operand are not written in Braille."""
    if node.get("t") == "group" and node.get("open") == "(" and node["body"].get("t") == "seq":
        items = node["body"]["items"]
        return items[0] if len(items) == 1 else node["body"]
    return node


def _frac_depth(node):
    t = node.get("t")
    if t == "frac":
        return 1 + max(_frac_depth(node["num"]), _frac_depth(node["den"]))
    if t in ("seq",):
        return max([_frac_depth(x) for x in node["items"]] or [0])
    if t in ("group",):
        return _frac_depth(node["body"])
    if t == "script":
        return _frac_depth(node["base"])
    return 0


def _is_func_term(node):
    if node.get("t") == "func":
        return True
    return node.get("t") == "script" and node["base"].get("t") == "func"


# --------------------------------------------------------------------------
# Emitter -> Braille ASCII
# --------------------------------------------------------------------------
class _Emitter:
    def __init__(self, unmapped, in_under=False):
        self.out = []
        self.level = ""          # "" baseline, "^" superscript, ";" subscript, "^^" ...
        self.need_num = not in_under
        self.unmapped = unmapped
        self.in_under = in_under
        self.radical_depth = 0

    def text(self):
        return re.sub(r" {2,}", " ", "".join(self.out)).strip(" ")

    def _ends_with_space(self):
        return bool(self.out) and self.out[-1].endswith((" ", "\n"))

    def space(self):
        if self.out and not self._ends_with_space():
            self.out.append(" ")
        self.level = ""
        self.need_num = True

    def put(self, s, level):
        if not s:
            return
        if level != self.level:
            if level == "":
                if not self._ends_with_space() and self.out:
                    self.out.append('"')
            else:
                self.out.append(level)
            self.level = level
        self.out.append(s)
        self.need_num = False

    def put_num(self, digits, level):
        digits = digits.replace(",", ".")
        prefix = "#" if (self.need_num and level == "") else ""
        self.put(prefix + digits, level)

    # ------------------------------------------------------------------
    def emit(self, node, level=""):
        getattr(self, "_e_" + node["t"])(node, level)

    def _e_seq(self, node, level):
        items = node["items"]
        for idx, item in enumerate(items):
            self.emit(item, level)
            if _is_func_term(item) and idx + 1 < len(items):
                nxt = items[idx + 1]
                if not (nxt.get("t") == "group" and nxt.get("open") == "("):
                    self.space()

    def _e_num(self, node, level):
        self.put_num(node["v"], level)

    def _e_space(self, node, level):
        self.space()

    def _e_var(self, node, level):
        v = node["v"]
        self.put("".join("," + ch.lower() if ch.isupper() else ch for ch in v), level)

    def _e_khmer(self, node, level):
        # Khmer inside an equation (e.g. a condition over an arrow): Khmer dictionary step
        from KhmerToBrailleLogic import khmer_to_braille   # lazy: avoids a circular import
        cells = khmer_to_braille(node["v"], self.unmapped)
        self.put(cells_to_ascii(cells), level)

    def _e_prescript(self, node, level):
        for part, mark in ((node["sup"], "^"), (node["sub"], ";")):
            if part is not None:
                self.emit(part, level + mark)
                self.out.append('"' if level == "" else level)   # back to the base line
                self.level = level
        self.emit(node["base"], level)

    def _e_overunder(self, node, level):
        base, mod = node["base"], node["mod"]
        if base.get("t") == "sym" and base["v"] in ARROWS and node["where"] == "over":
            # condition written above a reaction arrow: label%arrow   (Chemistry p.40)
            self.space()
            self.emit(mod, "")
            self.put("%" + self._lookup(base["v"])["code"], "")
            self.space()
            return
        sub = _Emitter(self.unmapped, in_under=True)
        sub.emit(mod)
        self.put('"', level)
        self.need_num = False
        self.emit(base, level)
        self.put(("<" if node["where"] == "over" else "%") + sub.text() + "]", level)

    def _e_func(self, node, level):
        self.put(node["v"], level)

    def _e_ph(self, node, level):
        self.unmapped.add(PLACEHOLDER)

    def _lookup(self, ch):
        return MATH_SYMBOLS.get(ch) or FALLBACK_SYMBOLS.get(ch)

    def _e_sym(self, node, level):
        ch = node["v"]
        entry = self._lookup(ch)
        if entry is None:
            self.unmapped.add(ch)
            return
        code, kind = entry["code"], entry["kind"]
        if ch == "→" and self.in_under:          # → inside lim is the short arrow
            code = "$o"
        if kind == "rel":
            if self.in_under:
                self.put(code, level)
                self.need_num = True
            else:
                self.space()
                self.put(code, "")
                self.space()
        elif kind == "reset":
            self.put(code, level)
            self.need_num = True
        elif kind == "shape":
            self.put(code, level)
            self.space()
        elif kind == "sup":
            self.put(code, level + "^")
        else:
            self.put(code, level)

    def _e_group(self, node, level):
        opener = node["open"]
        open_code, close_code = GROUP_CODES[opener]
        body = node["body"]
        if body.get("t") == "matrix":
            if opener in "([{":
                open_code, close_code = "@(", "@)"
            self._e_matrix(body, level, open_code, close_code)
            return
        self.put(open_code, level)
        self.emit(body, level)
        self.put(close_code, level)

    def _e_matrix(self, node, level, open_code="", close_code=""):
        for r, row in enumerate(node["rows"]):
            if r > 0:
                self.out.append("\n")
                self.level = ""
            if open_code:
                self.put(open_code, level)
            self.need_num = True
            for c, cell in enumerate(row):
                if c > 0:
                    self.space()
                self.emit(cell, level)
            if close_code:
                self.put(close_code, level)

    def _e_frac(self, node, level):
        commas = "," * (_frac_depth(node) - 1)
        self.put(commas + "?", level)
        self.emit(node["num"], level)
        self.put(commas + "/", level)
        self.emit(node["den"], level)
        self.put(commas + "#", level)

    def _e_root(self, node, level):
        dots = "." * self.radical_depth
        if node["index"] is not None:
            self.put(dots + "<", level)
            self.emit(node["index"], level)
            self.put(">", level)
        else:
            self.put(dots + ">", level)
        self.radical_depth += 1
        self.emit(node["body"], level)
        self.radical_depth -= 1
        self.put(dots + "]", level)

    def _under_over(self, base, under, over, level):
        self.put('"', level)
        self.emit(base, level)
        if under is not None:
            sub = _Emitter(self.unmapped, in_under=True)
            sub.emit(under)
            self.put("%" + sub.text(), level)
        if over is not None:
            sup = _Emitter(self.unmapped, in_under=True)
            sup.emit(over)
            self.put("<" + sup.text(), level)
        self.put("}", level)

    def _e_script(self, node, level):
        base, sub, sup = node["base"], node["sub"], node["sup"]
        if base.get("t") == "func" and base["v"] == "lim" and sub is not None:
            self._under_over(base, sub, sup, level)
            return
        if base.get("t") == "sym" and base["v"] in UNDER_OVER_SYMBOLS:
            self._under_over(base, sub, sup, level)
            return
        self.emit(base, level)
        if (sub is not None and sub.get("t") == "group" and sub.get("open") == "("
                and "".join(i.get("v", "?") for i in sub["body"]["items"]) in STATES):
            # chemistry state: HCl_((g)) -> ,h,cl%(g)]   (Chemistry p.44)
            self.put("%(" + "".join(i["v"] for i in sub["body"]["items"]) + ")]", level)
            sub = None
        if sub is not None:
            letter = lambda n: n.get("t") == "var" or (n.get("t") == "sym" and _is_letterlike_sym(n["v"]))
            simple_base = letter(base) or (base.get("primed") and letter(base["items"][0]))
            if level == "" and simple_base and sub.get("t") == "num":
                self.out.append(sub["v"])        # x1: numeric subscript, no indicator
                self.need_num = False
            else:
                self.emit(sub, level + ";")
        if sup is not None:
            self.emit(sup, level + "^")

    def _e_degree(self, node, level):
        self.emit(node["base"], level)
        self.put(".*", level + "^")
        if node["unit"]:
            self.space()
            self.put(";," + node["unit"].lower(), "")

    def _e_accent(self, node, level):
        kind, body = node["kind"], node["body"]
        if kind == "strike":
            # struck out (simplified): a̶ -> [a], (A, B, C)̶ -> [,a, ,b, ,c]   (Biology p.46)
            self.put("[", level)
            self.need_num = True
            self.emit(body, level)
            self.put("]", level)
            return
        if kind == "bar" and body.get("t") == "var":
            self.emit(body, level)
            self.put(":", level)
            return
        close = {"bar": "<:]", "vec": "<$o]", "hat": "<.$[]"}[kind]
        self.put('"', level)
        self.need_num = False
        self.emit(body, level)
        self.put(close, level)


# --------------------------------------------------------------------------
# Chemistry drawings: Lewis structures and structural formulas  (Chemistry p.40-45)
# --------------------------------------------------------------------------
# A drawing is an equation written over several lines, as in print:
#
#     ⟦                       ,h
#       H                      _
#       |          ->     ,h31 ,c 31,h
#     H— C —H                  _
#       |                     ,h
#       H
#     ⟧
#
# Each print line gives one Braille line. Things on the same print column stay
# on the same Braille column, and a space typed between two things gives a blank
# cell. Codes are the handbook's table (p.44-45):
#
#   on an atom's line:  · left of the atom ⠐ (5), right of it ⠂ (2)   | left ⠸ (456), right ⠇ (123)
#                       / \ beside the atom: the same bars   ∷ or :: ⠶ (2356)   ⋮⋮ ⠸⠇ (456,123)
#                       — ⠒⠂  = ⠶⠆  ≡ ⠿⠇ (bonds)   (··) shared pair ⠯ .. ⠽ (p.41 ex.5)
#   above / below:      · ⠠ (6) / ⠈ (4)   — bar ⠤⠄ (36,3) / ⠉⠁ (14,1)   | bond ⠸ (456)   : ⠨ (46, p.42 ex.8)
#   anywhere else:      ⋰ ⠊ (24)  ⋱ ⠑ (15) (slanted pair)   / ⠠⠊ (6,24)  \ ⠑⠄ (15,3) (slanted lines)
#   a last line ⏟      the brace under the drawing: "⠐ main line ⠩⠨⠾⠻" (p.41-42, ex. 4, 8, 10-14)
#
# A dot or bar above or below an atom is centred on the atom (rounded left):
# ,h and ,c -> first cell, ,na and ,cl -> second cell (p.40-41).
ELECTRON_DOTS = "·•∙◦∘°"
DRAW_BONDS = {"—": "31", "-": "31", "–": "31", "─": "31", "−": "31",
              "═": "72", "=": "72", "≡": "=l", "☰": "=l"}
DRAW_PAIRS = {"∷": "7", "::": "7", ":": "7", "⋮⋮": "_l", "⁝⁝": "_l", "⋮": "_l", "⁝": "_l"}
DRAW_BARS = "—–─-_‾¯"
BRACES = "⏟︸"
DRAW_BRACE = ('"', "%.)]")
# Marks that only have a code inside a drawing (for the website's "has a Braille code" list)
DRAWING_MARKS = {"◦": '" 1 , @', "·": '" 1 , @', "|": "_ l", "/": "_ ,i", "\\": "l e'",
                 "⋰": "i", "⋱": "e", "∷": "7", "⋮": "_l", "⏟": '" %.)]', "—": "31 -' ca"}


def is_drawing(expr):
    """A drawing has two or more lines (the equation tools start one with a line break)."""
    return len([line for line in expr.split("\n") if line.strip()]) >= 2 or expr.startswith("\n")


def _drawing_tokens(line):
    """Split one print line into (column, kind, text) items; kind: atom, dots, bar, pair, bond, mark, other."""
    items, i, n = [], 0, len(line)
    while i < n:
        c = line[i]
        if c.isspace():
            i += 1
            continue
        m = re.match(r"\([" + ELECTRON_DOTS + r".]+\)", line[i:])
        if m:                                                     # (··) shared pair
            items.append((i, "shared", m.group()))
            i += len(m.group())
            continue
        if c.isalpha() and c.isascii() or c in "₀₁₂₃₄₅₆₇₈₉⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻":
            j = i
            while j < n and (line[j].isascii() and line[j].isalnum() or line[j] in "₀₁₂₃₄₅₆₇₈₉⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻"):
                j += 1
            items.append((i, "atom", line[i:j]))
            i = j
            continue
        for text, kind in [(p, "pair") for p in sorted(DRAW_PAIRS, key=len, reverse=True)] + [(b, "bond") for b in DRAW_BONDS]:
            if line.startswith(text, i):
                j = i + len(text)
                while kind == "bond" and j < n and line[j] == c:       # —— is one bond
                    j += 1
                items.append((i, kind, line[i:j]))
                i = j
                break
        else:
            if c in ELECTRON_DOTS or c == ".":
                items.append((i, "dot", c))
            elif c in "|/\\⋰⋱" or c in BRACES:
                items.append((i, "mark", c))
            else:
                items.append((i, "other", c))
            i += 1
    return items


def _atom_covering(rows, row, col, step):
    """The atom on the nearest line above (step -1) or below (step 1) at col (or one column beside it)."""
    r = row + step
    while 0 <= r < len(rows):
        atoms = [t for t in rows[r] if t["kind"] == "atom"]
        if atoms:
            for slack in (0, 1):
                for t in atoms:
                    if t["col"] - slack <= col < t["col"] + len(t["text"]) + slack:
                        return t
            return None
        r += step
    return None


def drawing_to_ascii(expr, unmapped=None):
    """A chemistry drawing over several lines -> Braille ASCII lines with the same layout."""
    if unmapped is None:
        unmapped = set()
    lines = [line.rstrip() for line in expr.split("\n")]
    lines = [line for line in lines if line.strip()]
    brace = bool(lines) and all(ch in BRACES for ch in lines[-1].strip())
    if brace:
        lines = lines[:-1]
    rows = []
    for line in lines:
        rows.append([{"col": col, "pcol": col, "kind": kind, "text": text} for col, kind, text in _drawing_tokens(line)])

    # 1. Braille text of every item
    for r, row in enumerate(rows):
        on_atom_line = any(t["kind"] == "atom" for t in row)
        for k, t in enumerate(row):
            kind, text, t["off"] = t["kind"], t["text"], 0
            atom_before = any(x["kind"] == "atom" for x in row[:k])
            if kind == "atom":
                t["code"] = math_to_ascii(text, unmapped)
            elif kind == "shared":
                t["code"] = "&" + "1" * (len(text) - 2) + "y"
            elif kind == "bond" and on_atom_line:
                t["code"] = DRAW_BONDS[text[0]]
            elif kind == "pair" and on_atom_line:
                t["code"] = DRAW_PAIRS[text]
            elif kind == "dot" and on_atom_line:
                t["code"] = ("1" if atom_before else '"') * len(text)
            elif kind == "mark" and text in "|/\\" and on_atom_line:
                t["code"] = "l" if atom_before else "_"
            elif kind == "mark" and text in "⋰⋱":
                t["code"] = "i" if text == "⋰" else "e"
            elif kind == "mark" and text in "/\\":
                t["code"] = ",i" if text == "/" else "e'"
            elif kind in ("dot", "bond", "pair", "mark") and text not in BRACES:
                # above or below an atom: snap onto that atom's column
                below = _atom_covering(rows, r, t["col"], 1)        # the atom under this mark
                above = _atom_covering(rows, r, t["col"], -1)
                atom = below or above
                vertical = kind == "pair" or text == "|"
                if vertical:
                    t["code"] = "_" if text == "|" else "."
                elif kind == "dot":
                    t["code"] = "," if below else "@"
                elif text[0] in DRAW_BARS:
                    t["code"] = "-'" if below else "ca"
                else:
                    t["code"] = math_to_ascii(text, unmapped)
                if atom is not None:
                    t["col"] = atom["col"]
                    width = len(atom["code"]) if "code" in atom else len(math_to_ascii(atom["text"]))
                    if vertical:
                        t["off"] = 1 if atom["text"][:1].isupper() else 0      # the letter, not the capital sign
                    else:
                        t["off"] = max(0, (width - len(t["code"])) // 2)
            else:
                t["code"] = math_to_ascii(text, unmapped)

    # 2. The brace goes around the line with the most atoms
    main = max(range(len(rows)), key=lambda r: (sum(t["kind"] == "atom" for t in rows[r]), len(rows[r])), default=None)
    if brace and main is not None and rows[main]:
        rows[main][-1]["code"] += DRAW_BRACE[1]

    # 3. Braille column of every print column: the smallest one that keeps each
    #    line's items apart (a blank cell where print has a space)
    width = max((t["col"] for row in rows for t in row), default=0) + 2
    least = [0] * width
    after = [[] for _ in range(width)]
    for r, row in enumerate(rows):
        row.sort(key=lambda t: t["col"])
        if brace and r == main and row:
            least[row[0]["col"]] = max(least[row[0]["col"]], 1 - row[0]["off"])
        for a, b in zip(row, row[1:]):
            if b["col"] <= a["col"]:
                continue
            a_end = a["pcol"] + len(a["text"])
            gap = 1 if b["pcol"] > a_end and not lines[r][a_end:b["pcol"]].strip() else 0
            after[a["col"]].append((b["col"], a["off"] + len(a["code"]) + gap - b["off"]))
    col_at = [0] * width
    for x in range(width):
        col_at[x] = max(least[x], col_at[x - 1] if x else 0, col_at[x])
        for y, delta in after[x]:
            col_at[y] = max(col_at[y], col_at[x] + delta)

    out = []
    for r, row in enumerate(rows):
        cells = []
        for t in row:
            start = col_at[t["col"]] + t["off"]
            if brace and r == main and t is row[0]:
                start -= 1
                code = DRAW_BRACE[0] + t["code"]
            else:
                code = t["code"]
            cells.extend(" " * (start - len(cells)))
            cells[start:start + len(code)] = code
        out.append("".join(cells).rstrip())
    return "\n".join(out)


# --------------------------------------------------------------------------
# Chemical formulas typed as plain text: H2O -> ,h2,o like ⟦H2O⟧  (Chemistry p.40)
# --------------------------------------------------------------------------
ELEMENTS = set("""H He Li Be B C N O F Ne Na Mg Al Si P S Cl Ar K Ca Sc Ti V Cr Mn Fe Co Ni Cu Zn
    Ga Ge As Se Br Kr Rb Sr Y Zr Nb Mo Tc Ru Rh Pd Ag Cd In Sn Sb Te I Xe Cs Ba La Ce Pr Nd Pm Sm
    Eu Gd Tb Dy Ho Er Tm Yb Lu Hf Ta W Re Os Ir Pt Au Hg Tl Pb Bi Po At Rn Fr Ra Ac Th Pa U Np Pu
    Am Cm Bk Cf Es Fm Md No Lr Rf Db Sg Bh Hs Mt Ds Rg Cn Nh Fl Mc Lv Ts Og""".split())
DIATOMIC = {"H2", "N2", "O2", "F2", "Cl2", "Br2", "I2", "O3"}
_FORMULA_RE = re.compile(
    r"(?<![A-Za-z0-9_.])([0-9]*)((?:[A-Z][a-z]?[0-9₀-₉]*|\((?:[A-Z][a-z]?[0-9₀-₉]*)+\)[0-9₀-₉]*)+)"
    r"([⁰¹²³⁴⁵⁶⁷⁸⁹]*[⁺⁻]?)(?![A-Za-z0-9])")


def _is_formula(m):
    body, charge = m.group(2), m.group(3)
    if not all(sym in ELEMENTS for sym in re.findall(r"[A-Z][a-z]?", body)):
        return False
    if charge or re.search("[₀-₉]", body):
        return True
    # a number after an element: two elements or more (H2O, NH4Cl), or O2, Cl2 ...
    # (one element and a number, such as B12 or U2, is left as plain text)
    return bool(re.search(r"[A-Za-z)][0-9]", body)) and (len(re.findall(r"[A-Z]", body)) >= 2 or body in DIATOMIC)


def mark_formulas(text):
    """Put chemical formulas typed outside ⟦ ⟧ (H2O, H₂SO₄, Cu²⁺) inside ⟦ ⟧, so their numbers are subscripts."""
    parts = []
    for is_math, chunk in split_math_segments(text):
        if is_math:
            parts.append(MATH_OPEN + chunk + MATH_CLOSE)
        else:
            parts.append(_FORMULA_RE.sub(lambda m: MATH_OPEN + m.group() + MATH_CLOSE if _is_formula(m) else m.group(), chunk))
    return "".join(parts)


# --------------------------------------------------------------------------
# Public API
# --------------------------------------------------------------------------
def math_to_ascii(expr, unmapped=None):
    """Equation text (without ⟦ ⟧) -> Braille ASCII following the PDF rules."""
    if unmapped is None:
        unmapped = set()
    if is_drawing(expr):
        return drawing_to_ascii(expr, unmapped)
    tree = _Parser(*tokenize(expr)).parse_seq()
    emitter = _Emitter(unmapped)
    emitter.emit(tree)
    return emitter.text()


# 6-dot cell -> Braille ASCII (first, lower-case key of each cell)
_CELL_TO_ASCII = {}
for _key, _cell in ASCII_TO_CELL.items():
    if len(_key) == 1 and len(_cell) == 1 and not _key.isupper():
        _CELL_TO_ASCII.setdefault(_cell, _key)


def cells_to_ascii(cells):
    return "".join(_CELL_TO_ASCII.get(c, "") for c in cells)


def ascii_to_cells(ascii_text):
    """Braille ASCII -> 6-dot Unicode Braille (english_to_braille_dictionary.json)."""
    out = []
    for ch in ascii_text:
        if ch == "\n":
            out.append("\n")
        else:
            out.append(ASCII_TO_CELL.get(ch.lower(), ASCII_TO_CELL.get(ch, "")))
    return "".join(out)


def math_to_braille(expr, unmapped=None):
    return ascii_to_cells(math_to_ascii(expr, unmapped))


def split_math_segments(text):
    """Split text into [(is_math, chunk), ...] using ⟦ ⟧ as equation markers."""
    parts = []
    pos = 0
    while True:
        start = text.find(MATH_OPEN, pos)
        if start < 0:
            if pos < len(text):
                parts.append((False, text[pos:]))
            break
        if start > pos:
            parts.append((False, text[pos:start]))
        end = text.find(MATH_CLOSE, start + 1)
        if end < 0:
            parts.append((True, text[start + 1:]))
            break
        parts.append((True, text[start + 1:end]))
        pos = end + 1
    return parts
