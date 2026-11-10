import json
from flask import Flask, request, jsonify
from flask_cors import CORS
from gcc_segmentation import GCCSegmentation
from math_braille import MATH_SYMBOLS
import os
import re

app = Flask(__name__)
CORS(app)

# Global setup
segmenter = GCCSegmentation()

# Load dictionaries once
_HERE = os.path.dirname(os.path.abspath(__file__))

with open(os.path.join(_HERE, 'khmer_to_english_dictionary.json'), 'r', encoding='utf-8') as f:
    khmer_to_english_dictionary = json.load(f)

with open(os.path.join(_HERE, 'english_to_braille_dictionary.json'), 'r', encoding='utf-8') as f:
    english_to_braille_dictionary = json.load(f)

COENG = '្'
KHMER_DIGITS = set("០១២៣៤៥៦៧៨៩0123456789")   # Khmer and Arabic digits
RO = 'រ'
VOWEL_SIGNS = ['េ', 'ែ', 'ៃ', 'ើ']

def reorder_khmer_characters(word_list):
    """
    Change the khmer order of character in Khmer text for 
    +  ្រ​
    + vowel of េ  ែ​  ៃ ើ
    """
    reordered_words = []
    for word in word_list:
        chars = list(word)
        processed_chars = []
        processed_indices = set()

        # Find vowel sign and coeng+ro
        vowel_sign_index = next((i for i in range(len(chars)) if chars[i] in VOWEL_SIGNS), None)
        coeng_ro_indices = next(((i, i+1) for i in range(len(chars) - 1)
                                 if chars[i] == COENG and chars[i+1] == RO), None)

        # Condition 2: vowel + coeng ro
        if vowel_sign_index is not None and coeng_ro_indices:
            processed_chars.append(chars[vowel_sign_index])
            processed_indices.add(vowel_sign_index)
            processed_chars += [chars[i] for i in coeng_ro_indices]
            processed_indices.update(coeng_ro_indices)

        # Condition 1: only coeng ro
        elif coeng_ro_indices:
            processed_chars += [chars[i] for i in coeng_ro_indices]
            processed_indices.update(coeng_ro_indices)

        # Condition 3: only vowel — move to front
        elif vowel_sign_index is not None:
            processed_chars.append(chars[vowel_sign_index])
            processed_indices.add(vowel_sign_index)

        # Add remaining unprocessed characters
        for i, char in enumerate(chars):
            if i not in processed_indices:
                processed_chars.append(char)

        reordered_words.append("".join(processed_chars))
    return reordered_words


# Characters that are allowed to produce no Braille (zero-width marks, etc.)
SILENT_CHARS = {'', '\u200b', '\u200c', '\u200d', '\ufeff'}
# ASCII marks that mean something different in ordinary text (10:30, a~b, a|b):
# they use their math code only inside an equation ⟦ ⟧.
MATH_ONLY_IN_EQUATIONS = {':', '~', '|', '—'}   # — is also Khmer/English punctuation


def khmer_to_braille(khmer_sentence, unmapped=None):
    """
    Khmer text -> Braille in two dictionary steps:
      1. khmer_to_english_dictionary.json (Khmer) or math_symbols.json (math
         symbols from the PDFs) -> Braille ASCII
      2. english_to_braille_dictionary.json -> 6-dot Unicode Braille
    Characters with no entry in either dictionary are added to `unmapped`
    (instead of disappearing silently) so the website can tell the user.
    """
    segments = segmenter.seg_gcc(khmer_sentence)
    khmer_text = []
    skip = 0
    
    for i in range(len(segments)):
        if skip:
            skip -= 1
            continue
        token = segments[i]

        # Case 0.5: Float split into two tokens like ['13', '.45']
        if (
            i + 1 < len(segments)
            and segments[i].isdigit()
            and segments[i + 1].startswith('.')
            and segments[i + 1][1:].isdigit()
        ):
            khmer_text.append(f"#{segments[i]}{segments[i + 1]}")
            skip = 1
            continue

        # Case: Number formatting
        if token.isnumeric() and token not in ['⑤', '🅐']:
            khmer_text.append(f"#{token}")
            continue

        # Case: a word in capitals (VIP, ADN): double capital sign ,,vip (Biology p.46).
        # It used to require an English dictionary word, so ADN or VIP got ,a,d,n.
        if token.isascii() and token.isalpha() and token.isupper() and len(token) >= 2:
            khmer_text.append(",,{}".format(token.lower()))
            continue
        
        if '"' in token:
            for ch in token:
                if ch == '"':
                    khmer_text.append('"')
                else:
                    khmer_text.append(ch)
            continue

        # Case: Word with some uppercase letters (English only; Greek capitals
        # such as Σ Δ carry their own capital sign in math_symbols.json)
        eng_word = ''.join(["," + c.lower() if (c.isascii() and c.isupper()) else c for c in token])
        khmer_text.append(eng_word)
            

    khmer_text = reorder_khmer_characters(khmer_text)

    english_text = ''
    braille_text = ''
    combos = [
        ('ោ', 'ះ', 'ោះ'),
        ('ុ', 'ះ', 'ុះ'),
        ('េ', 'ះ', 'េះ'),
        ('ំ', 'ុ', 'ុំ'),
        ('ា', 'ំ', 'ាំ'),
        # ('Ǝ', "'", 'Ǝ|')
    ]
    quote_open = False
    for kcc in khmer_text:    
        chars = list(kcc)
        for a, b, combo in combos:
            if a in chars and b in chars:
                # The combination takes the place of its last part. It used to go at the
                # very end, so a sign after it moved in front of it (ចំណាំ៖ -> ចំណ៖ាំ).
                ia, ib = chars.index(a), chars.index(b)
                last = max(ia, ib)
                chars = [ch for k, ch in enumerate(chars) if k not in (ia, ib)]
                chars.insert(last - 1, combo)
        
        prev = ""
        for c in chars:
            # a number inside a word (ទី២, ឆ្នាំ២០២៥) needs its number sign too, or it reads as letters
            if c in KHMER_DIGITS and prev not in KHMER_DIGITS and prev != "#":
                english_text += "#"
            prev = c
            c = "v" if c == COENG else c
            if c in khmer_to_english_dictionary:
                english_text += khmer_to_english_dictionary[c]
            elif c in MATH_SYMBOLS and c not in MATH_ONLY_IN_EQUATIONS:
                english_text += MATH_SYMBOLS[c]["code"]
            elif unmapped is not None and c not in SILENT_CHARS:
                unmapped.add(c)
    for e in english_text:
        braille_text += english_to_braille_dictionary.get(e, '')
    return braille_text

@app.route('/translationKhmer', methods=['POST'])
def translate_khmer_to_braille():
    data = request.get_json()
    text = data.get('text', '')
    khmer_words = segmenter.seg_gcc(text)
    braille_result = khmer_to_braille(khmer_words)
    return jsonify({'braille': braille_result})

if __name__ == '__main__':
    # Debug mode lets anyone who reaches it run code, so it is off unless asked for (as in main.py)
    app.run(debug=os.environ.get("FLASK_DEBUG") == "1")



