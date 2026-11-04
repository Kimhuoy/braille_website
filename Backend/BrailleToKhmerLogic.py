
import json
import os

from flask import Flask
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# What the website writes (Khmer -> Braille). The reading tables below were
# typed separately and drifted from it: ោះ is written "!" but was read as "!",
# the exclamation mark is written "6" but was read as ោះ, and ុំ ("$") was
# missing. Where the two disagree, reading follows the writing dictionary.
with open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "khmer_to_english_dictionary.json"),
          encoding="utf-8") as _f:
    _WRITTEN_AS = json.load(_f)
_KHMER_DIGITS = set("០១២៣៤៥៦៧៨៩")
_READ_AS_OPTIONS = {}
for _text, _code in _WRITTEN_AS.items():
    if _text.isascii() and _text.isalnum() or _text in _KHMER_DIGITS:
        continue   # Latin letters and digits are read through number mode / English
    _READ_AS_OPTIONS.setdefault(_code, []).append(_text)


def _follow_written_codes(dictionary):
    """Make dictionary[code] one of the texts the website writes as `code`."""
    for code, options in _READ_AS_OPTIONS.items():
        if dictionary.get(code) not in options:
            dictionary[code] = options[0]

@app.route('/translateBraille', methods=['POST'])
def translateBrailleToKhmer(uploaded_braille):
    khmer = ['ក', 'ខ', 'គ', 'ឃ', 'ង', 'ង៉',  'ច', 'ឆ', 'ជ', 'ឈ', 'ញ','ញ៉', 'ដ', 'ឋ', 'ឌ', 'ឍ', 'ណ', 'ត', 'ថ', 'ទ', 'ធ', 'ន', 'ប៉','ប', 'ផ', 'ព', 'ភ', 'ម', 'ម៉', 'យ','យ៉', 'រ','រ៉', 'ល', 'វ','វ៉', 'ស', 'ហ', 'ឡ', 'អ','!', 'ា', 'ិ', 'ី', 'ឹ', 'ឺ', 'ុ', 'ូ', 'ួ', 'ើ', 'ឿ', 'ៀ', 'េ', 'ែ', 'ៃ', 'ោ', 'ៅ', 'ុំ', 'ំ', 'ាំ', 'ះ', 'ុះ', 'េះ', 'ោះ', 'ែះ', 'ើះ', 'ាះ', 'អ', 'អា', 'ឥ', 'ឦ', 'ឧ', 'ឩ', 'ឪ', 'ឫ', 'ឬ', 'ឭ', 'ឮ', 'ឯ', 'ឰ', 'ឱ','ឲ', 'ឳ', '-','៉', "៉ី","៉ិ","៉ឺ","៉ឹ","៉ើ",'៊', '៍', '់', '័', '៏', '៌', 'ៈ', 'ៗ',  '។ល។', '។', '>', '<', '?',  '=', '៕', '...', '្', '{', '}', '[', ']', '៖', '√', 'x',  ' ', '#', '.', '_','្រ','៕','«','»','ណ៍','យ៍','ន៍','ទ៍','ហ៍','វ៍','រ៍','ក៍','ធ៍','ត៍','ម៍','ថ៍','ម៌','ណ៌','ភ៌','គ៌','ប៌','ព៌','ទ៌',',']
    english = ['g', 'k', ',g', ',k', ']', ']@', 'j', '+', ',j', ',+', ',?',',?@', 'd', '-)', ',d', '0)', 'n', 't', ')', ',t', ',)', ',n', 'b@', 'b', 'p', '&', ',p', 'm', 'm@', ',y',',y@', 'r', 'r@', ',l', 'w','w@', 's', 'h', 'l', 'o','!', '*', '/', 'e', '[', '5', 'c', '3', '2', '%', 'q', '(', 'f', '<', 'i', ':', '_', '@s', 'y', 'z', 'a', 'x', 'u', '6', '<a', '%a', '*a', 'o', 'o*', ',/', 'ea', 'ca', ',3', '\\', ',x', 'xa', '?', '?a', '"', 'fa', ':a', ':a', '_c','-', '@', "@e", "@/", "@5", "@[", "@%",'-', '»', '9', '>', "'", '7', '^', '1','=,l=', '=', '$.1', '$"k', '8', '.k',  '=,', "'''", 'v', '.(', '.)', '@(', '@)', './', '@>', '/@>', ' ' , '#', '4', ',-','vr','=,','8','0' ,'n0',',y0',',n0',',t0','h0','w0','r0','g0',',)0','t0','m0',')0','m7','n7',',p7',',g7','b7','&7',',t7',',']
    number = ['0','1','2','3','4','5','6','7','8','9','០','១','២','៣','៤','៥','៦','៧','៨','៩','$','%','.']
    englishNum = ['j','a','b','c','d','e','f','g','h','i','j','a','b','c','d','e','f','g','h','i','$','@0','4']

    dictionaryKhmerEnglist = dict(zip(english, khmer))
    _follow_written_codes(dictionaryKhmerEnglist)
    dictionaryNumberEnglist = dict(zip(englishNum, number))
    
    # def handleKhmer():
    combined_dict_Kh = dictionaryKhmerEnglist.copy()
    combined_dict_Kh.update(  dictionaryNumberEnglist)
        # print('combined_dict: ',combined_dict)
        # return combined_dict_Kh
    
    # def handleNum():
    combined_dict_Num = dictionaryNumberEnglist.copy()
    combined_dict_Num.update(dictionaryKhmerEnglist)
        # print('combined_dict: ',combined_dict) 
        # return combined_dict_Num

    # def change_dict_key(d, old_key, new_key, default_value=None):
    #     d[new_key] = d.pop(old_key, default_value)
    # dictionary['\n'] = '\n'
    # dictionary['\t'] = '\t'
    # dictionary['\r'] = '\r'
    # dictionary['\u200b']= ' '
    # dictionary[' ']= ' '

    characterUnicodes = {'a': '\u2801', 'b': '\u2803', 'c': '\u2809', 'd': '\u2819', 'e': '\u2811', 'f': '\u280B', 'g': '\u281B', 'h': '\u2813',
                        'i': '\u280A', 'j': '\u281A', 'k': '\u2805', 'l': '\u2807', 'm': '\u280D', 'n': '\u281D', 'o': '\u2815', 'p': '\u280F',
                        'q': '\u281F', 'r': '\u2817', 's': '\u280E', 't': '\u281E', 'u': '\u2825', 'v': '\u2827', 'w': '\u283A', 'x': '\u282D',
                        'y': '\u283D', 'z': '\u2835', '%': '\u2829', '+': '\u282C', "=": "\u283F", "'": '\u2804', ',': '\u2820', '-': '\u2824',
                        '/': '\u280C', '!': '\u282E', '?': '\u2839', '$': '\u282B', ':': '\u2831', ';': '\u2830', '(': '\u2837', ')': '\u283E',
                        ' ': '\u2800', '@': '\u2808', '>': '\u281C', '<': '\u2823', '_': '\u2838', '#': '\u283C', '[': '\u282A', ']': '\u283B',
                        '"': '\u2810', '&': '\u282F', '^': '\u2818', '1': '\u2802', '2': '\u2806', '3': '\u2812', '4': '\u2832', '5': '\u2822',
                        '6': '\u2816', '7': '\u2836', '8': '\u2826', '9': '\u2814', '0': '\u2834', '.': '\u2828', '*': '\u2821', '[': '\u282A',
                        ']': '\u283B', '\\': '\u2833',',': '\u2820'}
    
    escapeCharacters = ['\n', '\r', '\t']
   
    def convertBrailleToEng(braille_input):
        
        # check all braille character 
        symbol_list1 = []
        symbols = " "
        for braille_unicode in braille_input:
            for symbol, braille in characterUnicodes.items():
                if braille == braille_unicode:
                    symbol_list1 += symbol
                    symbols += symbol
        

        # check the braille character with O sound of khmer character
        symbol_list_Osound = []
        character0sound = ['g','k','j','+','?','d','t',')','y','l','/','3','x','-','#','n','p']
        indexOsound = 0
        while indexOsound < len(symbol_list1):
            elementOsound = symbol_list1[indexOsound]

            if elementOsound == ',' and indexOsound + 1 < len(symbol_list1) and symbol_list1[indexOsound + 1] in character0sound:
                dataOsound = elementOsound + symbol_list1[indexOsound + 1]
                symbol_list_Osound.append(dataOsound)
                indexOsound += 2  # Skip the next element as it's already combined with ','
            else:
                symbol_list_Osound.append(elementOsound)
                indexOsound += 1

        symbol_list2 = symbol_list_Osound


        # check the character for finding character " ឋ "
        symbol_list_Osound = symbol_list2
        symbol_list_LetterThor = []
        characterThor = ['-','0']
        indexLetterThor = 0
        while indexLetterThor < len(symbol_list_Osound):
            elementLetterThor = symbol_list_Osound[indexLetterThor]
            
            if elementLetterThor in characterThor and indexLetterThor + 1 < len(symbol_list_Osound) and symbol_list_Osound[indexLetterThor + 1] == ')':
                dataLetterThor = elementLetterThor + symbol_list_Osound[indexLetterThor + 1]
                symbol_list_LetterThor.append(dataLetterThor)
                indexLetterThor += 2  # Skip the next element as it's already combined with ')'
            else:
                symbol_list_LetterThor.append(elementLetterThor)
                indexLetterThor += 1
        symbol_list3 = symbol_list_LetterThor


        # check the ៍ in the charaacter
        symbol_list_LetterThor = symbol_list3
        symbol_list_TonKheat = []
        characterA = ['n',',y',',n',',t','h','w','r','g',',)','t','m',')']
        indexTonKheat = 0
        while indexTonKheat < len(symbol_list_LetterThor):
            elementTonKheat= symbol_list_LetterThor[indexTonKheat]
            
            if elementTonKheat in characterA and indexTonKheat + 1 < len(symbol_list_LetterThor) and symbol_list_LetterThor[indexTonKheat + 1] == '0':
                dataTonKheat= elementTonKheat + symbol_list_LetterThor[indexTonKheat + 1]
                symbol_list_TonKheat.append(dataTonKheat)
                indexTonKheat += 2  # Skip the next element as it's already combined with 'a'
            else:
                symbol_list_TonKheat.append(elementTonKheat)
                indexTonKheat += 1
        symbol_list4 = symbol_list_TonKheat


        # check the ៌ (របាត) in the charaacter
        symbol_list_TonKheat = symbol_list4
        symbol_list_roBat= []
        characterA = ['m','n',',p',',g','b','&',',t']
        indexRoBat = 0
        while indexRoBat < len(symbol_list_TonKheat):
            elemenRobat = symbol_list_TonKheat[indexRoBat]
            
            if elemenRobat in characterA and indexRoBat + 1 < len(symbol_list_TonKheat) and symbol_list_TonKheat[indexRoBat + 1] == '7':
                dataRobat = elemenRobat + symbol_list_TonKheat[indexRoBat + 1]
                symbol_list_roBat.append(dataRobat)
                indexRoBat += 2 
            else:
                symbol_list_roBat.append(elemenRobat)
                indexRoBat += 1
        symbol_list5 = symbol_list_roBat

        
        # check the Bontok 2 of khmer character from braille character 
        symbol_list_roBat = symbol_list5
        symbol_list_2point = []
        character2point = [']', 'b', 'm', 'r', 'w', ',?',',y']
        index2point = 0
        while index2point < len(symbol_list_roBat):
            element2point = symbol_list_roBat[index2point]

            if element2point in character2point and index2point + 1 < len(symbol_list_roBat) and symbol_list_roBat[index2point + 1] == '@':
                data2point = element2point + symbol_list_roBat[index2point + 1]
                symbol_list_2point.append(data2point)
                index2point += 2  # Skip the next element as it's already combined with '@'
            else:
                symbol_list_2point.append(element2point)
                index2point += 1

        symbol_list6 = symbol_list_2point 


        # check the character with the last a 
        symbol_list_2point = symbol_list6
        symbol_list_lastA = []
        characterA = ['e', 'c', 'x', '?', 'f', ':']
        indexLastA = 0
        while indexLastA < len(symbol_list_2point):
            elementLastA = symbol_list_2point[indexLastA]
            
            if elementLastA in characterA and indexLastA + 1 < len(symbol_list_2point) and symbol_list_2point[indexLastA + 1] == 'a':
                dataLastA = elementLastA + symbol_list_2point[indexLastA + 1]
                symbol_list_lastA.append(dataLastA)
                indexLastA += 2  # Skip the next element as it's already combined with 'a'
            else:
                symbol_list_lastA.append(elementLastA)
                indexLastA += 1
        symbol_list7= symbol_list_lastA
        

        #  check the character that has first point infront '.'
        symbol_list_lastA = symbol_list7
        symbol_list_FirstPoint = []
        indexFirstPoint = 0
        while indexFirstPoint < len(symbol_list_lastA):
            elementFirstPoint = symbol_list_lastA[indexFirstPoint]

            if elementFirstPoint == "." and indexFirstPoint + 1 < len(symbol_list_lastA):
                dataFirstPoint = elementFirstPoint + symbol_list_lastA[indexFirstPoint + 1]
                symbol_list_FirstPoint.append(dataFirstPoint)
                indexFirstPoint += 2  # Skip the next element as it's already combined with '.'
            else:
                symbol_list_FirstPoint.append(elementFirstPoint)
                indexFirstPoint += 1

        symbol_list8 = symbol_list_FirstPoint


        #  check the character that has first @ infront '@'
        symbol_list_FirstPoint = symbol_list8
        symbol_list_FirstAt = []
        indexFirstAt = 0
        while indexFirstAt < len(symbol_list_FirstPoint):
            elementFirstAt = symbol_list_FirstPoint[indexFirstAt]

            if elementFirstAt == "@" and indexFirstAt + 1 < len(symbol_list_FirstPoint):
                dataFirstAt = elementFirstAt + symbol_list_FirstPoint[indexFirstAt + 1]
                symbol_list_FirstAt.append(dataFirstAt)
                indexFirstAt += 2  # Skip the next element as it's already combined with '@'
            else:
                symbol_list_FirstAt.append(elementFirstAt)
                indexFirstAt += 1

        symbol_list9 = symbol_list_FirstAt


        # check the character that has first slash in front '/'
        symbol_list_FirstAt = symbol_list9
        symbol_list_FirstSlash = []
        indexFirstSlash = 0
        while indexFirstSlash < len(symbol_list_FirstAt):
            elementFirstSlash = symbol_list_FirstAt[indexFirstSlash]

            if elementFirstSlash == "/" and indexFirstSlash + 1 < len(symbol_list_FirstAt) and symbol_list_FirstAt[indexFirstSlash + 1] == '@>':
                dataFirstSlash = elementFirstSlash + symbol_list_FirstAt[indexFirstSlash + 1]
                symbol_list_FirstSlash.append(dataFirstSlash)
                indexFirstSlash += 2  # Skip the next element as it's already combined with '/@>'
            else:
                symbol_list_FirstSlash.append(elementFirstSlash)
                indexFirstSlash += 1

        symbol_list10 = symbol_list_FirstSlash


        # check the character that has first underline in front '_'
        symbol_list_FirstSlash = symbol_list10
        symbol_list_LastC = []
        characterLastC = ['_']
        indexLastC = 0
        while indexLastC < len(symbol_list_FirstSlash):
            elementLastC = symbol_list_FirstSlash[indexLastC]

            if elementLastC in characterLastC and indexLastC + 1 < len(symbol_list_FirstSlash) and symbol_list_FirstSlash[indexLastC + 1] == 'c':
                dataLastC = elementLastC + symbol_list_FirstSlash[indexLastC + 1]
                symbol_list_LastC.append(dataLastC)
                indexLastC += 2  # Skip the next element as it's already combined with '/@>'
            else:
                symbol_list_LastC.append(elementLastC)
                indexLastC += 1

        symbol_list11 = symbol_list_LastC


        # check of "្រ"
        symbol_list_LastC = symbol_list11
        symbol_list_letterR = []
        characterR = ['v']
        indexLetterR = 0
        symbol_list_R = []
        indexR = 0
        while indexLetterR < len(symbol_list_LastC):
            elementLetterR = symbol_list_LastC[indexLetterR]
            
            if elementLetterR in characterR and indexLetterR + 1 < len(symbol_list_LastC) and symbol_list_LastC[indexLetterR + 1] == 'r':
                dataLetterR = elementLetterR + symbol_list_LastC[indexLetterR + 1]
                symbol_list_letterR.append(dataLetterR)
                indexLetterR += 2  
            else:
                symbol_list_letterR.append(elementLetterR)
                indexLetterR += 1
        # Swap "vr" with the next cell. This loop used to run only inside the
        # else above, so empty input, text without Braille or a trailing ្រ (⠧⠗)
        # left symbol_list12 unset and the server answered 500.
        while indexR < len(symbol_list_letterR):
            elementR = symbol_list_letterR[indexR]

            if elementR == 'vr' and indexR + 1 < len(symbol_list_letterR):
                nextElementVR = symbol_list_letterR[indexR + 1]
                # Swap the current element with the next one
                symbol_list_R.append(nextElementVR)
                indexR += 2
                # ្រ is written before the whole cluster (ស្ត្រ = ្រ ស ្ត), so it also moves
                # past each ្ + consonant: ស្ត្រ, not ស្រ្ត.
                while (indexR + 1 < len(symbol_list_letterR) and symbol_list_letterR[indexR] == 'v'
                       and 'ក' <= dictionaryKhmerEnglist.get(symbol_list_letterR[indexR + 1], ' ')[:1] <= 'អ'):
                    symbol_list_R.append(symbol_list_letterR[indexR])
                    symbol_list_R.append(symbol_list_letterR[indexR + 1])
                    indexR += 2
                symbol_list_R.append(elementR)
            else:
                symbol_list_R.append(elementR)
                indexR += 1
        symbol_list12 = symbol_list_R


        # check vowel of "ើ  េ ែ ៃ "
        symbol_list_R = symbol_list12
        symbol_list_vowel = []
        characterB = [ 'f','<', 'i', '%']
        numB = ['០','១','២','៣','៤','៥','៦','៧','៨','៩','#']
        indexVowel = 0
        symbol_list_vowel2 = []
        indexVowel2 = 0
        while indexVowel < len(symbol_list_R):
            elementVowel = symbol_list_R[indexVowel]
            
            if elementVowel in characterB and indexVowel + 1 < len(symbol_list_R):
                nextElement = symbol_list_R[indexVowel + 1]
                # Swap the current element with the next one
                symbol_list_vowel.append(nextElement)
                indexVowel += 2
                # The vowel is written before the whole cluster (ក្មេង = េ ក ្ម ង), so it
                # also moves past each ្ + consonant; it used to land after ក only (កេ្មង).
                while (indexVowel + 1 < len(symbol_list_R) and symbol_list_R[indexVowel] == 'v'
                       and 'ក' <= dictionaryKhmerEnglist.get(symbol_list_R[indexVowel + 1], ' ')[:1] <= 'អ'):
                    symbol_list_vowel.append(symbol_list_R[indexVowel])
                    symbol_list_vowel.append(symbol_list_R[indexVowel + 1])
                    indexVowel += 2
                symbol_list_vowel.append(elementVowel)

            else:
                symbol_list_vowel.append(elementVowel)
                indexVowel += 1

        # Same fix as above: run once after the loop, so symbol_list13 is always set.
        while indexVowel2 < len(symbol_list_vowel):
            elementVowel2 = symbol_list_vowel[indexVowel2]

            if elementVowel2 in characterB and  indexVowel2 + 1 < len(symbol_list_vowel) and symbol_list_vowel[indexVowel2 + 1] == 'vr':
                nextElement = symbol_list_vowel[indexVowel2 + 1]
                # Swap the current element with the next one
                symbol_list_vowel2.append(nextElement)
                symbol_list_vowel2.append(elementVowel2)
                indexVowel2 += 2

            else:
                symbol_list_vowel2.append(elementVowel2)
                indexVowel2 += 1
        symbol_list13 = symbol_list_vowel2


        # check the character of number that has # in front
        symbol_list_vowel2 = symbol_list13
        convertedText = ''
        indexNum = 0
        while indexNum < len(symbol_list_vowel2):
            if symbol_list_vowel2[indexNum] == "#":
                indexNum += 1  # Move to next after #
                while indexNum < len(symbol_list_vowel2) and symbol_list_vowel2[indexNum] != " ":
                    convertedText += dictionaryNumberEnglist.get(symbol_list_vowel2[indexNum], '[_]')
                    indexNum += 1
            else:
                convertedText += dictionaryKhmerEnglist.get(symbol_list_vowel2[indexNum], '[_]')
                indexNum += 1

        # symbol_list14 = symbol_list_CheckNum
        # print("symbol_list14: ", symbol_list14)

        # for eng in symbol_list14:
        #     convertedText += dictionaryNumberEnglist.get(eng, '[_]')
        return convertedText


    def khmer_seg(text1):
        list = []
        for j in text1:
            list.append(j)
        return list


    braille_result = convertBrailleToEng(uploaded_braille)
    return braille_result

if __name__ == '__main__':
    app.run(debug=True)


