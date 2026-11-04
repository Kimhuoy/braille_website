import React, { useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "@iconify/react";
import { symbolCatalog, subjectOrder } from "../../data/symbol-catalog";
import { SUBJECT_TOOLS } from "../../data/equation-templates";
import { useT } from "../../i18n";

// Word-style "Equation" ribbon: Tools · Symbols · Structures.
//
// onInsert(text, { wrapMath }) is provided by the translation page and inserts
// at the cursor. Structures are wrapped in ⟦ ⟧ (an equation) when the cursor is
// not already inside one; single symbols are inserted as they are.
// `supported` is the set of symbols that have a Braille code in the backend
// dictionary (GET /math-symbols); null while unknown.

const symbolLabels = (() => {
  const map = {};
  Object.values(symbolCatalog).forEach((subject) =>
    subject.categories.forEach((cat) =>
      cat.items.forEach((it) => {
        if (it.label && !map[it.symbol]) map[it.symbol] = it.label;
      })
    )
  );
  return map;
})();

const SymbolButton = ({ symbol, supported, onInsert, t, size = "sm" }) => {
  // Letters and digits always translate; every other character needs a code.
  const known =
    !supported ||
    Array.from(symbol).every((ch) => supported.has(ch) || /[A-Za-z0-9⁰-⁹⁺⁻₀-₉₊₋]/.test(ch));
  const name = symbolLabels[symbol] ? `${symbol} ${symbolLabels[symbol]}` : symbol;
  return (
    <button
      type="button"
      onClick={() => onInsert(symbol, { wrapMath: false })}
      title={known ? name : `${name} — ${t.noBrailleYet}`}
      aria-label={known ? `${t.insertLabelPrefix} ${name}` : `${t.insertLabelPrefix} ${name}, ${t.noBrailleYet}`}
      className={`relative flex items-center justify-center rounded border bg-white text-BlueDark hover:bg-blue-50 hover:border-BlueDark transition-colors ${
        size === "sm" ? "h-8 min-w-[2rem] px-1 text-base" : "h-10 min-w-[2.5rem] px-1 text-lg"
      } ${known ? "border-gray-300" : "border-dashed border-amber-400"}`}
    >
      {symbol}
      {!known && (
        <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-amber-500" aria-hidden="true" />
      )}
    </button>
  );
};

// Group captions (Tools / Symbols / Structures) only on wide screens, where
// the ribbon is one Word-style row; on smaller screens they would only add height.
const RibbonGroup = ({ caption, children, className = "" }) => (
  <div className={`flex flex-col justify-between min-w-0 ${className}`}>
    <div className="flex-1 flex items-start min-w-0">{children}</div>
    <div className="hidden xl:block text-xs text-gray-500 text-center mt-1">{caption}</div>
  </div>
);

const EquationRibbon = ({ onInsert, supported, interfaceLang }) => {
  const t = useT(interfaceLang).symbols;
  const lang = interfaceLang === "en" ? "en" : "km";
  const [subjectKey, setSubjectKey] = useState("mathematics");
  const [openKey, setOpenKey] = useState(null); // "symbols" | structure key | null
  const [galleryCat, setGalleryCat] = useState("quick");
  const [query, setQuery] = useState("");
  const panelRef = useRef(null);
  const ribbonRef = useRef(null);

  // Close the drop-down with Escape or a click outside (like Word).
  useEffect(() => {
    if (!openKey) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") setOpenKey(null);
    };
    const onClick = (e) => {
      if (ribbonRef.current && !ribbonRef.current.contains(e.target)) setOpenKey(null);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [openKey]);

  // Move focus into the drop-down when it opens (keyboard / screen reader users).
  useEffect(() => {
    if (openKey && panelRef.current) {
      const first = panelRef.current.querySelector("button, select, input");
      if (first) first.focus();
    }
  }, [openKey]);

  const insertAndClose = (text, opts) => {
    onInsert(text, opts);
    setOpenKey(null);
  };

  // Tools of the selected subject tab (Biology has none yet -> "coming soon").
  const tools = SUBJECT_TOOLS[subjectKey];
  const QUICK = tools ? tools.quick : [];
  const GROUPS = tools ? tools.groups : [];
  const galleryCategories = useMemo(
    () => [
      {
        key: "quick",
        label: subjectKey === "chemistry" ? { km: "គីមីមូលដ្ឋាន", en: "Basic Chemistry" } : { km: "គណិតមូលដ្ឋាន", en: "Basic Math" },
        items: QUICK,
      },
      ...symbolCatalog[subjectKey].categories.map((c) => ({
        key: c.key,
        label: c.label,
        items: c.items.map((it) => it.symbol),
      })),
    ],
    [subjectKey]
  );
  const activeGallery = galleryCategories.find((c) => c.key === galleryCat) || galleryCategories[0];
  const gallerySymbols = useMemo(() => {
    const q = query.trim();
    if (!q) return activeGallery.items;
    return activeGallery.items.filter((s) => s.includes(q) || (symbolLabels[s] || "").includes(q));
  }, [activeGallery, query]);

  const openGroup = GROUPS.find((g) => g.key === openKey);

  return (
    <div ref={ribbonRef} className="relative border border-gray-200 rounded-lg bg-gray-50">
      {/* Subject tabs */}
      <div role="tablist" aria-label={t.subjectTabsLabel} className="flex gap-1 px-2 pt-2 border-b border-gray-200 overflow-x-auto">
        {subjectOrder.map((key) => {
          const isActive = key === subjectKey;
          return (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => {
                setSubjectKey(key);
                setOpenKey(null);
                setGalleryCat("quick");
              }}
              className={`shrink-0 whitespace-nowrap px-3 py-1.5 text-sm md:text-base font-bold rounded-t-md border-b-2 -mb-px ${
                isActive ? "border-BlueDark text-BlueDark bg-white" : "border-transparent text-gray-500 hover:text-BlueDark"
              }`}
            >
              {symbolCatalog[key].label[lang]}
            </button>
          );
        })}
      </div>

      {!tools ? (
        <p className="text-base text-gray-500 py-6 text-center">{t.comingSoon}</p>
      ) : (
        <div className="flex flex-col xl:flex-row gap-2 xl:gap-3 p-2">
          {/* Row 1 on small screens: Tools + Symbols side by side */}
          <div className="flex gap-2 xl:gap-3 min-w-0 xl:flex-1">
          {/* Tools */}
          <RibbonGroup caption={t.groupTools} className="shrink-0 border-r border-gray-200 pr-2 xl:pr-3">
            <button
              type="button"
              onClick={() => insertAndClose("⬚", { wrapMath: true })}
              title={t.newEquationHint}
              className="flex flex-col items-center justify-center gap-1 h-[4.25rem] w-16 xl:w-24 rounded hover:bg-blue-50 text-BlueDark"
            >
              <span className="text-2xl leading-none font-serif">π</span>
              <span className="text-xs xl:text-sm font-bold text-center leading-tight">{t.newEquation}</span>
            </button>
          </RibbonGroup>

          {/* Symbols */}
          <RibbonGroup caption={t.groupSymbols} className="flex-1 xl:border-r xl:border-gray-200 xl:pr-3">
            <div className="flex items-stretch gap-1 min-w-0">
              <div className="grid grid-rows-2 grid-flow-col gap-1 overflow-x-auto pb-1 max-w-full">
                {QUICK.map((s) => (
                  <SymbolButton key={s} symbol={s} supported={supported} onInsert={onInsert} t={t} />
                ))}
              </div>
              <button
                type="button"
                onClick={() => setOpenKey(openKey === "symbols" ? null : "symbols")}
                aria-expanded={openKey === "symbols"}
                aria-label={t.moreSymbols}
                title={t.moreSymbols}
                className={`shrink-0 w-7 rounded border flex items-center justify-center ${
                  openKey === "symbols" ? "bg-BlueDark text-white border-BlueDark" : "bg-white border-gray-300 text-BlueDark hover:bg-blue-50"
                }`}
              >
                <Icon icon="mdi:chevron-down" aria-hidden="true" />
              </button>
            </div>
          </RibbonGroup>
          </div>

          {/* Structures: one scrollable row on small screens, Word's block on wide ones */}
          <RibbonGroup caption={t.groupStructures} className="xl:max-w-[22rem] xl:shrink-0 border-t border-gray-200 pt-2 xl:border-t-0 xl:pt-0">
            <div className="flex flex-nowrap xl:flex-wrap gap-1 overflow-x-auto xl:overflow-visible pb-1 w-full">
              {GROUPS.map((g) => {
                const isOpen = openKey === g.key;
                return (
                  <button
                    key={g.key}
                    type="button"
                    onClick={() => setOpenKey(isOpen ? null : g.key)}
                    aria-expanded={isOpen}
                    aria-haspopup="true"
                    className={`shrink-0 flex flex-col items-center justify-between min-w-[4.25rem] px-1.5 py-1 rounded border ${
                      isOpen ? "bg-blue-100 border-BlueDark" : "border-transparent hover:bg-blue-50 hover:border-gray-300"
                    } text-BlueDark`}
                  >
                    <span
                      className="eq-preview text-lg h-9 flex items-center"
                      aria-hidden="true"
                      dangerouslySetInnerHTML={{ __html: g.icon }}
                    />
                    <span className="text-xs font-bold flex items-center gap-0.5 whitespace-nowrap">
                      {g.label[lang]}
                      <Icon icon="mdi:chevron-down" aria-hidden="true" />
                    </span>
                  </button>
                );
              })}
            </div>
          </RibbonGroup>
        </div>
      )}

      {/* Drop-down gallery (absolute, like Word's) */}
      {openKey && (
        <div
          ref={panelRef}
          role="dialog"
          aria-label={openKey === "symbols" ? t.groupSymbols : openGroup?.label[lang]}
          className="absolute z-30 left-0 right-0 top-full mt-1 bg-white border border-gray-300 rounded-lg shadow-xl p-3 max-h-[26rem] overflow-y-auto"
        >
          {openKey === "symbols" ? (
            <>
              <div className="flex flex-col sm:flex-row gap-2 mb-3">
                <select
                  value={galleryCat}
                  onChange={(e) => {
                    setGalleryCat(e.target.value);
                    setQuery("");
                  }}
                  aria-label={t.symbolCategory}
                  className="border border-gray-300 rounded px-2 py-1.5 text-base font-bold text-BlueDark"
                >
                  {galleryCategories.map((c) => (
                    <option key={c.key} value={c.key}>
                      {c.label[lang]}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t.searchPlaceholder}
                  aria-label={t.searchPlaceholder}
                  className="flex-1 border border-gray-300 rounded px-3 py-1.5 text-base"
                />
              </div>
              {gallerySymbols.length === 0 ? (
                <p className="text-base text-gray-500 py-4 text-center">{t.noResults}</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {gallerySymbols.map((s, i) => (
                    <SymbolButton
                      key={`${s}-${i}`}
                      symbol={s}
                      supported={supported}
                      onInsert={(text, opts) => insertAndClose(text, opts)}
                      t={t}
                      size="md"
                    />
                  ))}
                </div>
              )}
            </>
          ) : openGroup?.symbols ? (
            <>
              <h3 className="text-sm font-bold text-gray-600 mb-2">{openGroup.label[lang]}</h3>
              <div className="flex flex-wrap gap-1.5">
                {openGroup.symbols.map((s) => (
                  <SymbolButton
                    key={s}
                    symbol={s}
                    supported={supported}
                    onInsert={(text, opts) => insertAndClose(text, opts)}
                    t={t}
                    size="md"
                  />
                ))}
              </div>
            </>
          ) : (
            <>
              <h3 className="text-sm font-bold text-gray-600 mb-2">{openGroup?.label[lang]}</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                {openGroup?.items.map((item) => (
                  <button
                    key={item.insert}
                    type="button"
                    onClick={() => insertAndClose(item.insert, { wrapMath: true })}
                    title={`${item.label[lang]}  —  ${item.insert}`}
                    aria-label={`${item.label[lang]}: ${item.insert}`}
                    className="flex flex-col items-center gap-1 p-2 rounded border border-gray-200 hover:border-BlueDark hover:bg-blue-50 text-BlueDark"
                  >
                    <span
                      className="eq-preview text-xl min-h-[3.25rem] flex items-center"
                      aria-hidden="true"
                      dangerouslySetInnerHTML={{ __html: item.preview }}
                    />
                    <span className="text-xs text-gray-600 text-center">{item.label[lang]}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {supported && (
        <p className="flex items-center gap-1.5 text-xs md:text-sm text-gray-600 px-3 pb-2">
          <span className="inline-block w-2 h-2 rounded-full bg-amber-500" aria-hidden="true" />
          {t.legendNoBraille}
        </p>
      )}
    </div>
  );
};

export default EquationRibbon;
