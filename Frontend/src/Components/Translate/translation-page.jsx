import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Icon } from "@iconify/react";
import axios from "axios";
import appStore from "../../store/app";
import IconButtonWithDropdown from "../dropdown/download-dropdown";
import SnackBar from "../dropdown/snack-bar";
import EquationRibbon from "../SymbolMathemathic/equation-ribbon";
import ReadAloud from "./read-aloud";
import { asciiToBraille, BRAILLE_ASCII_LEGEND } from "../../data/braille-ascii";
import { useT } from "../../i18n";
import { buildApiUrl } from "../../config/api";

// Same as MAX_CHARS in Backend/FileFormat.py (about 200 A4 pages of Khmer)
const MAX_CHARS = 300000;

const TranslationPage = () => {
  const {
    resultFileText,
    resultFileBraille,
    setResultTextDownload,
    setShowSnackbar,
    setMessage,
    setSwitchText,
    inputText,
    setInputText,
    inputBraille,
    setInputBraille,
    resultTextAndBraille,
    setResultTextAndBraille,
    switchLang,
    setSwitchLang,
    setIsPopupOpen,
    interfaceLang,
    brailleType,
    setBrailleType,
  } = appStore();

  // With English Braille chosen, the labels that say "Khmer" say "English".
  const baseT = useT(interfaceLang).translate;
  const t = brailleType === "english" ? { ...baseT, ...baseT.english } : baseT;
  // English words found inside Khmer Braille, with both readings (Braille -> text).
  const [brailleWords, setBrailleWords] = useState([]);
  const [brailleParts, setBrailleParts] = useState([]);
  const wordChoices = useRef({}); // the user's switches, kept while typing
  const composeResult = (parts, words) =>
    parts.map((p) => (p.text !== undefined ? p.text : words[p.word][words[p.word].use])).join("");
  const tSymbols = useT(interfaceLang).symbols;
  const [showSymbolPicker, setShowSymbolPicker] = useState(false);
  const [isEditingResult, setIsEditingResult] = useState(false);
  // Characters the backend could not map to Braille (reported, not dropped).
  const [unmapped, setUnmapped] = useState([]);
  // Symbols that have a Braille code in the backend dictionary (null = unknown).
  const [supportedSymbols, setSupportedSymbols] = useState(null);
  // Braille keyboard: typed Braille ASCII -> 6-dot cells (SimBraille codes).
  const [brailleKeyboard, setBrailleKeyboard] = useState(true);
  const inputRef = useRef(null);
  // Typing sends many requests; an older, slower answer must not overwrite a newer one.
  const latestRequest = useRef(0);
  const pendingSelection = useRef(null);

  // Restore the cursor after a controlled update (insertions, Braille keyboard).
  useLayoutEffect(() => {
    if (pendingSelection.current) {
      const { el, start, end } = pendingSelection.current;
      pendingSelection.current = null;
      el.focus();
      el.setSelectionRange(start, end);
    }
  });

  useEffect(() => {
    axios
      .get(buildApiUrl("/math-symbols"))
      .then((res) => setSupportedSymbols(new Set(Object.keys(res.data || {}))))
      .catch(() => setSupportedSymbols(null));
  }, []);

  // fetch data from backend of text to braille
  const handleSubmitTextToBraille = async () => {
    const requestId = ++latestRequest.current;
    try {
      const response = await axios.post(
        buildApiUrl("/text"),
        {
          text: inputText,
          braille_type: brailleType,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      if (response.status !== 200) {
        throw new Error("Network response was not ok");
      }
      if (requestId !== latestRequest.current) return;

      const resultDataText = response?.data?.result;

      setResultTextAndBraille(resultDataText);
      setUnmapped(response?.data?.unmapped || []);
      setResultTextDownload(resultTextAndBraille);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  // fetch data from backend of braille to text
  const handleSubmitBrailleToText = async () => {
    const requestId = ++latestRequest.current;
    try {
      const response = await axios.post(
        buildApiUrl("/braille"),
        {
          braille: inputBraille,
          braille_type: brailleType,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      if (response.status !== 200) {
        throw new Error("Network response was not ok");
      }
      if (requestId !== latestRequest.current) return;

      // English words inside Khmer Braille: keep the user's earlier switches
      const words = (response?.data?.words || []).map((w) => ({
        ...w,
        use: wordChoices.current[`${w.english}|${w.khmer}`] || w.use,
      }));
      const parts = response?.data?.parts || [{ text: response?.data?.result || "" }];
      setBrailleWords(words);
      setBrailleParts(parts);
      setResultTextAndBraille(composeResult(parts, words));
      setUnmapped([]);
      setResultTextDownload(resultTextAndBraille);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  // Translate after a short pause in typing: one request per change. Long
  // documents (up to 300,000 characters) wait a little longer, so typing in
  // them does not make the server translate the whole text on every key.
  useEffect(() => {
    const size = (switchLang ? inputBraille : inputText).length;
    const timer = setTimeout(
      switchLang ? handleSubmitBrailleToText : handleSubmitTextToBraille,
      size > 20000 ? 700 : 150
    );
    return () => clearTimeout(timer);
  }, [inputText, inputBraille, brailleType]); // eslint-disable-line react-hooks/exhaustive-deps

  // Click on a word chip: switch it between its English and Khmer reading.
  const toggleWord = (index) => {
    const words = brailleWords.map((w, i) =>
      i === index ? { ...w, use: w.use === "english" ? "khmer" : "english" } : w
    );
    const w = words[index];
    wordChoices.current[`${w.english}|${w.khmer}`] = w.use;
    setBrailleWords(words);
    setResultTextAndBraille(composeResult(brailleParts, words));
  };

  // switch the file text to file braille and verse visa
  useEffect(() => {
    if (
      resultFileText &&
      resultFileText.dataInFileText &&
      resultFileText.resultDataText
    ) {
      setInputText(resultFileText.dataInFileText);
      setResultTextAndBraille(resultFileText.resultDataText);
    }
    if (
      resultFileBraille &&
      resultFileBraille.dataInFileBraille &&
      resultFileBraille.resultDataBraille
    ) {
      setInputBraille(resultFileBraille.dataInFileBraille);
      setResultTextAndBraille(resultFileBraille.resultDataBraille);
    }
  }, [resultFileText, resultFileBraille, setInputText, setInputBraille, setResultTextAndBraille]);

  // for show snackbar alert
  const handleShowSnackbar = (SnackBarMessage) => {
    setMessage(SnackBarMessage);
    setShowSnackbar(true);
  };

  // for switch from text to braille and verse visa for showing the result
  const handleSwitchLang = () => {
    if (inputText && resultTextAndBraille) {
      if (switchLang) {
        setInputText(resultTextAndBraille);
      }
    }
    if (inputBraille && resultTextAndBraille) {
      if (!switchLang) {
        {
          setInputBraille(resultTextAndBraille);
          setInputText(inputBraille);
        }
      }
    }
  };

  const currentInputValue = switchLang ? inputBraille : inputText;
  const hasInput = Boolean(currentInputValue);
  const hasResult = Boolean(resultTextAndBraille);

  const handleClearAll = () => {
    setInputText("");
    setInputBraille("");
    setResultTextAndBraille("");
    setUnmapped([]);
  };

  // Insert at the cursor like Word: structures go inside an equation ⟦ ⟧,
  // selected text fills the first ⬚, and the first ⬚ is selected afterwards.
  const insertAtCursor = (text, { wrapMath = false } = {}) => {
    const el = inputRef.current;
    const value = inputText;
    const start = el ? el.selectionStart : value.length;
    const end = el ? el.selectionEnd : value.length;
    const before = value.slice(0, start);
    const insideEquation = before.lastIndexOf("⟦") > before.lastIndexOf("⟧");
    let piece = text;
    const selected = value.slice(start, end);
    if (selected && piece.includes("⬚")) piece = piece.replace("⬚", selected);
    const wrapped = wrapMath && !insideEquation;
    if (wrapped) piece = `⟦${piece}⟧`;
    const next = value.slice(0, start) + piece + value.slice(end);
    setInputText(next);
    setInputBraille(next);
    if (el) {
      const ph = next.indexOf("⬚", start);
      if (ph >= 0 && ph < start + piece.length) {
        pendingSelection.current = { el, start: ph, end: ph + 1 };
      } else {
        const caret = start + piece.length - (wrapped ? 1 : 0);
        pendingSelection.current = { el, start: caret, end: caret };
      }
    }
  };

  // Tab / Shift+Tab jump between empty boxes ⬚ (only when there is one,
  // so Tab still moves focus normally otherwise).
  const handleInputKeyDown = (e) => {
    if (e.key !== "Tab" || switchLang) return;
    const el = e.currentTarget;
    const value = el.value;
    if (!value.includes("⬚")) return;
    e.preventDefault();
    let pos = e.shiftKey
      ? value.lastIndexOf("⬚", el.selectionStart - 1)
      : value.indexOf("⬚", el.selectionEnd);
    if (pos < 0) pos = e.shiftKey ? value.lastIndexOf("⬚") : value.indexOf("⬚");
    el.setSelectionRange(pos, pos + 1);
  };

  // Braille keyboard: replace typed Braille ASCII by cells, keep the cursor.
  const applyBrailleKeyboard = (e) => {
    const el = e.target;
    const converted = asciiToBraille(el.value);
    if (converted !== el.value) {
      pendingSelection.current = { el, start: el.selectionStart, end: el.selectionEnd };
    }
    return converted;
  };

  const placeholderLeft = unmapped.includes("⬚");
  const unmappedChars = unmapped.filter((c) => c !== "⬚");
  const resultIsBraille = !switchLang;

  const openFileUpload = () => {
    setSwitchText(switchLang);
    setIsPopupOpen(true);
  };

  return (
    <div className="w-[90%] sm:w-[88%] lg:w-[85%] max-w-[1600px] mx-auto pb-16">
      {/* Title + direction switch */}
      <div className="text-center mb-6">
        <h1 className="font-bold font-KohSantepheap text-BlueDark text-xl md:text-2xl lg:text-3xl">
          {t.systemTitle}
        </h1>
        <p className="font-bold text-BlueDark mt-2 text-base md:text-lg">
          {switchLang ? t.titleBrailleToText : t.titleTextToBraille}
        </p>
        <p className="text-gray-600 mt-1 text-base md:text-lg">{t.subtitle}</p>

        <button
          type="button"
          title={t.swapTooltip}
          aria-label={t.swapTooltip}
          onClick={() => {
            setSwitchLang(!switchLang);
            setSwitchText(true);
            handleSwitchLang();
          }}
          className="button-beat mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full border border-BlueDark text-BlueDark font-bold text-base md:text-lg hover:bg-blue-50 transition-colors"
        >
          <span>{switchLang ? t.langBraille : t.langKhmer}</span>
          <Icon icon="fluent:arrow-swap-20-filled" className="text-lg" aria-hidden="true" />
          <span>{switchLang ? t.langKhmer : t.langBraille}</span>
        </button>
      </div>

      {/* Braille type: Khmer Braille or English Braille */}
      <div className="flex flex-col items-center mb-6 -mt-2">
        <div role="group" aria-label={t.brailleTypeLabel} className="flex flex-wrap items-center justify-center gap-2">
          <span className="font-bold text-gray-700 text-sm md:text-base">{t.brailleTypeLabel}:</span>
          <div className="inline-flex rounded-full border border-BlueDark overflow-hidden">
            {[
              ["khmer", t.brailleTypeKhmer],
              ["english", t.brailleTypeEnglish],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                aria-pressed={brailleType === value}
                onClick={() => {
                  setBrailleType(value);
                  setBrailleWords([]);
                }}
                className={`px-3 md:px-4 py-1.5 text-sm md:text-base font-bold transition-colors ${
                  brailleType === value ? "bg-BlueDark text-white" : "bg-white text-BlueDark hover:bg-blue-50"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <p className="text-sm text-gray-500 mt-2 max-w-2xl text-center">{t.brailleTypeHint}</p>
      </div>

      {/* Step indicator */}
      <ol className="flex items-center justify-center gap-2 md:gap-4 mb-8 text-sm md:text-base font-bold text-BlueDark" aria-label="Steps">
        {[t.step1, t.step2, t.step3].map((label, i) => (
          <li key={i} className="flex items-center gap-2">
            <span
              className={`w-6 h-6 md:w-7 md:h-7 flex items-center justify-center rounded-full border-2 ${
                (i === 0 && hasInput) || (i === 1 && hasInput) || (i === 2 && hasResult)
                  ? "bg-BlueDark text-white border-BlueDark"
                  : "border-BlueDark text-BlueDark"
              }`}
            >
              {i + 1}
            </span>
            <span className="hidden sm:inline">{label}</span>
            {i < 2 && <span className="w-4 md:w-8 h-px bg-gray-300 ml-1"></span>}
          </li>
        ))}
      </ol>

      {/* Card 1: input */}
      <section className="bg-white border border-BlueDark rounded-xl p-4 md:p-6 mb-4" aria-labelledby="card1-heading">
        <h2 id="card1-heading" className="flex items-center gap-2 font-bold text-BlueDark text-base md:text-lg mb-4">
          <span className="w-6 h-6 flex items-center justify-center rounded-full bg-BlueDark text-white text-sm">1</span>
          {switchLang ? t.card1HeadingBraille : t.card1HeadingText}
        </h2>

        {/* Math / Chemistry / Biology symbol picker — sits above the input so it
            never pushes the convert/result cards further down the page once
            opened. Only relevant when composing Khmer text to be translated
            (not when browsing a Braille result). */}
        {!switchLang && (
          <div className="mb-4">
            <button
              type="button"
              onClick={() => setShowSymbolPicker((v) => !v)}
              aria-expanded={showSymbolPicker}
              className="flex items-center gap-2 text-base md:text-lg font-bold text-BlueDark hover:underline"
            >
              <Icon icon="tabler:math-symbols" className="text-lg" aria-hidden="true" />
              {showSymbolPicker ? tSymbols.toggleHide : tSymbols.toggleShow}
              <Icon
                icon={showSymbolPicker ? "mdi:chevron-up" : "mdi:chevron-down"}
                className="text-lg"
                aria-hidden="true"
              />
            </button>
            {showSymbolPicker && (
              <div className="mt-3">
                <EquationRibbon
                  onInsert={insertAtCursor}
                  supported={supportedSymbols}
                  interfaceLang={interfaceLang}
                />
                <p className="text-sm text-gray-600 mt-2">{tSymbols.equationHint}</p>
              </div>
            )}
          </div>
        )}

        <label htmlFor="translation-input" className="block font-bold text-base md:text-lg text-gray-700 mb-2">
          {switchLang ? t.inputLabelBraille : t.inputLabelText}
        </label>
        <div className="relative">
          <textarea
            id="translation-input"
            ref={inputRef}
            placeholder={switchLang ? t.inputPlaceholderBraille : t.inputPlaceholderText}
            value={currentInputValue}
            aria-describedby="translation-input-count"
            onKeyDown={handleInputKeyDown}
            onChange={(e) => {
              const value = switchLang && brailleKeyboard ? applyBrailleKeyboard(e) : e.target.value;
              setInputText(value);
              setInputBraille(value); // translated by the effect above, after a short pause
            }}
            maxLength={MAX_CHARS}
            className={`w-full rounded-lg h-72 md:h-96 p-3 pr-12 border border-gray-300 resize-y focus:outline-none focus:border-BlueDark transition duration-200 ${
              switchLang
                ? "font-braille text-lg md:text-xl leading-relaxed tracking-wide"
                : "text-base md:text-lg"
            }`}
          />
          {hasInput && (
            <button
              type="button"
              title={t.clearAll}
              aria-label={t.clearAll}
              onClick={handleClearAll}
              className="button-beat absolute top-2 right-2 p-1.5 rounded-full hover:bg-gray-100"
            >
              <Icon icon="material-symbols:close" className="text-xl text-gray-500" aria-hidden="true" />
            </button>
          )}
        </div>
        <p id="translation-input-count" className="text-sm md:text-base text-gray-500 mt-2">
          {t.charCount(currentInputValue.length)}
        </p>
        {switchLang && (
          <label className="mt-2 flex items-center gap-2 text-sm md:text-base text-gray-700">
            <input
              type="checkbox"
              checked={brailleKeyboard}
              onChange={(e) => setBrailleKeyboard(e.target.checked)}
              className="w-4 h-4"
            />
            <span className="font-bold">{t.brailleKeyboard}</span>
            <span className="text-gray-500">— {t.brailleKeyboardHint}</span>
          </label>
        )}

        <div className="flex items-center gap-3 my-4">
          <div className="flex-grow border-t border-gray-200"></div>
          <span className="text-sm md:text-base text-gray-500">{t.orDivider}</span>
          <div className="flex-grow border-t border-gray-200"></div>
        </div>

        <p className="text-sm md:text-base text-gray-500 mb-2">
          {switchLang ? t.acceptedFormatsBraille : t.acceptedFormats}
          <br />
          {t.limits}
        </p>
        {!switchLang && (
          <p className="flex items-start gap-1.5 text-sm md:text-base text-amber-800 -mt-1 mb-2">
            <Icon icon="material-symbols:warning-outline" className="text-lg shrink-0 mt-0.5" aria-hidden="true" />
            {t.pdfHint}
          </p>
        )}
        <button
          type="button"
          onClick={openFileUpload}
          className="w-full md:w-auto px-5 py-2.5 rounded-lg border border-BlueDark text-BlueDark font-bold text-base md:text-lg hover:bg-blue-50 transition-colors"
        >
          {t.chooseFile}
        </button>
      </section>

      {/* Card 2: convert — automatic; this card is a live status indicator, not a button */}
      <section className="bg-white border border-BlueDark rounded-xl px-4 py-2.5 md:px-6 mb-4" aria-labelledby="card2-heading">
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5">
        <h2 id="card2-heading" className="flex items-center gap-2 font-bold text-BlueDark text-base md:text-lg">
          <span className="w-6 h-6 flex items-center justify-center rounded-full bg-BlueDark text-white text-sm">2</span>
          {switchLang ? t.card2HeadingBraille : t.card2Heading}
        </h2>
        <div
          className={`px-3 py-1 rounded-full font-bold text-sm md:text-base flex items-center gap-1.5 ${
            hasResult
              ? "bg-green-50 text-green-700"
              : hasInput
              ? "bg-blue-50 text-BlueDark"
              : "bg-gray-100 text-gray-400"
          }`}
          role="status"
          aria-live="polite"
        >
          {hasInput && !hasResult && (
            <Icon icon="eos-icons:loading" className="text-xl animate-spin" aria-hidden="true" />
          )}
          {hasResult
            ? t.convertHelperReady
            : hasInput
            ? t.translatingStatus
            : switchLang
            ? t.convertHelperEmptyBraille
            : t.convertHelperEmpty}
        </div>
        </div>
        {(unmappedChars.length > 0 || placeholderLeft) && (
          <div className="mt-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm md:text-base text-amber-900" role="alert">
            {unmappedChars.length > 0 && (
              <p className="flex flex-wrap items-center gap-2">
                <Icon icon="material-symbols:warning-outline" className="text-lg shrink-0" aria-hidden="true" />
                <span>{t.unmappedTitle}</span>
                {unmappedChars.map((c) => (
                  <span key={c} className="px-2 py-0.5 rounded bg-white border border-amber-300 font-bold text-lg">
                    {c}
                  </span>
                ))}
              </p>
            )}
            {placeholderLeft && <p className="mt-1">{t.unmappedPlaceholder}</p>}
          </div>
        )}
      </section>

      {/* Card 3: result + download */}
      <section className="bg-white border border-BlueDark rounded-xl p-4 md:p-6" aria-labelledby="card3-heading">
        <h2 id="card3-heading" className="flex items-center gap-2 font-bold text-BlueDark text-base md:text-lg mb-4">
          <span className="w-6 h-6 flex items-center justify-center rounded-full bg-BlueDark text-white text-sm">3</span>
          {t.card3Heading}
        </h2>

        <div className="flex items-start justify-between gap-2 mb-1">
          <label htmlFor="translation-result" className="block font-bold text-base md:text-lg text-gray-700">
            {switchLang ? t.resultLabelBraille : t.resultLabelText}
          </label>
          <div className="flex items-start gap-2">
          {hasResult && (
            <button
              type="button"
              onClick={() => setIsEditingResult((v) => !v)}
              aria-pressed={isEditingResult}
              className={`button-beat shrink-0 flex items-center gap-1 px-3 py-1 rounded-full text-sm md:text-base font-bold border transition-colors ${
                isEditingResult
                  ? "bg-BlueDark text-white border-BlueDark"
                  : "bg-white text-BlueDark border-BlueDark hover:bg-blue-50"
              }`}
            >
              <Icon
                icon={isEditingResult ? "material-symbols:check" : "material-symbols:edit-outline"}
                className="text-base"
                aria-hidden="true"
              />
              {isEditingResult ? t.doneEditingButton : t.editButton}
            </button>
          )}
          </div>
        </div>
        <p className="text-sm md:text-base text-gray-500 mb-2">{t.editableHint}</p>

        {isEditingResult && resultIsBraille && (
          <div className="mb-3 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm md:text-base text-gray-800">
            <label className="flex flex-wrap items-center gap-2">
              <input
                type="checkbox"
                checked={brailleKeyboard}
                onChange={(e) => setBrailleKeyboard(e.target.checked)}
                className="w-4 h-4"
              />
              <span className="font-bold text-BlueDark">{t.brailleKeyboard}</span>
              <span className="text-gray-600">— {t.brailleKeyboardHint}</span>
            </label>
            <details className="mt-2" open>
              <summary className="cursor-pointer font-bold text-BlueDark">{t.editHelpTitle}</summary>
              <p className="font-bold mt-3">{t.editHelpWebTitle}</p>
              <ol className="list-decimal ml-5 mt-1 space-y-1">
                {t.editHelpWebSteps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
              <p className="font-bold mt-3">{t.editHelpComputerTitle}</p>
              <ul className="list-disc ml-5 mt-1 space-y-1">
                <li>{t.editHelpDocx}</li>
                <li>{t.editHelpBrf}</li>
              </ul>
              <details className="mt-2">
                <summary className="cursor-pointer font-bold text-BlueDark">{t.editHelpLegend}</summary>
                <div className="mt-2 grid grid-cols-4 sm:grid-cols-8 md:grid-cols-11 gap-1" role="list">
                  {BRAILLE_ASCII_LEGEND.map(([key, cell]) => (
                    <span
                      key={key}
                      role="listitem"
                      className="flex items-center justify-between gap-1 rounded border border-gray-200 bg-white px-1.5 py-0.5"
                    >
                      <kbd className="font-mono text-sm">{key}</kbd>
                      <span className="font-braille text-lg" aria-hidden="true">{cell}</span>
                    </span>
                  ))}
                </div>
              </details>
            </details>
          </div>
        )}

        <div className="relative">
          <textarea
            id="translation-result"
            placeholder={switchLang ? t.resultPlaceholderBraille : t.resultPlaceholderText}
            value={resultTextAndBraille}
            readOnly={!isEditingResult}
            onChange={(e) =>
              setResultTextAndBraille(
                resultIsBraille && brailleKeyboard ? applyBrailleKeyboard(e) : e.target.value
              )
            }
            className={`w-full rounded-lg h-72 md:h-96 p-3 pr-12 border resize-y focus:outline-none transition duration-200 ${
              isEditingResult
                ? "border-BlueDark bg-white focus:border-BlueDark"
                : "border-gray-300 bg-gray-50"
            } ${
              !switchLang
                ? "font-braille text-lg md:text-xl leading-relaxed tracking-wide"
                : "text-base md:text-lg"
            }`}
          />
          {hasResult && (
            <button
              type="button"
              title={t.copyTooltip}
              aria-label={t.copyTooltip}
              onClick={() => {
                navigator.clipboard.writeText(resultTextAndBraille);
                handleShowSnackbar(t.copySuccess);
              }}
              className="button-beat absolute top-2 right-2 p-1.5 rounded-full hover:bg-gray-100"
            >
              <Icon icon="material-symbols:copy-all-outline" className="text-xl text-gray-500" aria-hidden="true" />
            </button>
          )}
        </div>

        {/* English Braille -> English: listen to the result (no Khmer voice in browsers yet) */}
        {switchLang && brailleType === "english" && hasResult && <ReadAloud text={resultTextAndBraille} t={t} />}

        {/* English words found inside Khmer Braille: click to switch English <-> Khmer */}
        {switchLang && brailleType === "khmer" && brailleWords.length > 0 && (
          <div className="mt-3 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm md:text-base">
            <p className="font-bold text-BlueDark">{t.wordsTitle}</p>
            <p className="text-gray-700 mt-1">{t.wordsHint}</p>
            <ul className="flex flex-wrap gap-2 mt-2">
              {brailleWords.map((w, i) => (
                <li key={i}>
                  <button
                    type="button"
                    onClick={() => toggleWord(i)}
                    aria-pressed={w.use === "english"}
                    title={w.certain ? undefined : t.wordUnsure}
                    className={`flex items-center gap-1.5 rounded-full border px-3 py-1 ${
                      w.use === "english" ? "border-BlueDark bg-white" : "border-gray-300 bg-gray-100"
                    } hover:border-BlueDark`}
                  >
                    {!w.certain && (
                      <span className="text-amber-700 font-bold" aria-label={t.wordUnsure}>?</span>
                    )}
                    <span className={w.use === "english" ? "font-bold text-BlueDark" : "text-gray-500 line-through"}>
                      {w.english}
                    </span>
                    <Icon icon="fluent:arrow-swap-20-filled" className="text-gray-400" aria-hidden="true" />
                    <span className={w.use === "khmer" ? "font-bold text-BlueDark" : "text-gray-500 line-through"}>
                      {w.khmer}
                    </span>
                    <span className="sr-only">
                      {w.use === "english" ? t.wordEnglish : t.wordKhmer}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-5">
          <IconButtonWithDropdown switchLang={switchLang} />
        </div>
      </section>

      <SnackBar />
    </div>
  );
};

export default TranslationPage;
