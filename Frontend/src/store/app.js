import { create } from "zustand";

const appStore = create((set) => ({
  nav: false,
  setNav: (data) => set({ nav: data }),

  resultFileText: null,
  setResultFileText: (data) => set({ resultFileText: data }),

  resultFileBraille: null,
  setResultFileBraille: (data) => set({ resultFileBraille: data }),

  resultTextDownload: null,
  setResultTextDownload: (data) => set({ resultTextDownload: data }),

  message: null,
  setMessage: (data) => set({ message: data }),

  showSnackbar: false,
  setShowSnackbar: (data) => set({ showSnackbar: data }),

  onClose: () => {
    set((state) => ({ showSnackbar: state.setShowSnackbar(true) }));
  },

  resultBrailleTranslate: null,
  setResultBrailleTranslate: (data) => set({ resultBrailleTranslate: data }),

  switchText: false,
  setSwitchText: (data) => set({ switchText: data }),

  inputText: "",
  setInputText: (data) => set({ inputText: data }),

  inputBraille: "",
  setInputBraille: (data) => set({ inputBraille: data }),

  resultTextAndBraille: "",
  setResultTextAndBraille: (data) => set({ resultTextAndBraille: data }),

  switchLang: false,
  setSwitchLang: (data) => set({ switchLang: data }),

  // Which Braille: "khmer" (Khmer Braille, English words inside it too) or
  // "english" (English Braille, UEB uncontracted). Sent to the backend as braille_type.
  brailleType: "khmer",
  setBrailleType: (data) => set({ brailleType: data }),

  isPopupOpen: false,
  setIsPopupOpen: (data) => set({ isPopupOpen: data }),

  isVisible: false,
  setIsVisile: (data) => set({ isVisible: data }),

  isSmallScreen: window.innerWidth < 768,
  setIsSmallScreen: (data) => set({isSmallScreen: data}),

  // Interface (UI) language only — labels, buttons, headings.
  // Never used to change inputText / inputBraille / resultTextAndBraille.
  interfaceLang: "km",
  setInterfaceLang: (data) => set({ interfaceLang: data }),
}));

export default appStore;
