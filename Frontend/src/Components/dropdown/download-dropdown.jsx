import axios from "axios";
import { Icon } from "@iconify/react";
import appStore from "../../store/app";
import { useT } from "../../i18n";
import textIcon from "../../assets/text-icon.png";
import wordIcon from "../../assets/word-icon.png";
import { buildApiUrl } from "../../config/api";
import { brailleToAscii } from "../../data/braille-ascii";

// Renders the three download options as an always-visible, inline list
// (matching the new design) instead of a hidden dropdown menu.
// Every handler below is unchanged from the original implementation.
const IconButtonWithDropdown = ({ switchLang }) => {
  const { resultTextAndBraille, setShowSnackbar, setMessage, interfaceLang } =
    appStore();
  const t = useT(interfaceLang).translate;

  const hasResult = Boolean(resultTextAndBraille);

  const handleShowSnackbar = (msg) => {
    setMessage(msg);
    setShowSnackbar(true);
  };

  const downloadBlob = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadTextFile = () => {
    downloadBlob(
      new Blob([resultTextAndBraille], { type: "text/plain;charset=utf-8" }),
      "translated_braille.txt"
    );
  };

  const handleDownloadWordFile = () => {
    downloadBlob(
      new Blob([resultTextAndBraille], { type: "application/msword" }),
      "translated_braille.doc"
    );
  };

  // Braille ASCII (.brf) for Duxbury DBT and the SimBraille font.
  // Page = 42 cells x 25 lines, the page set-up found in Krousar Thmey's own
  // Duxbury file (Backend/uploads/*.dxb). Lines are broken at a space when
  // possible, pages are separated by a form feed, lines end with CR LF.
  const BRF_CELLS_PER_LINE = 42;
  const BRF_LINES_PER_PAGE = 25;
  const handleDownloadBrf = () => {
    const ascii = brailleToAscii(resultTextAndBraille).replace(/[^\x20-\x7E\n]/g, "");
    const lines = [];
    ascii.split("\n").forEach((raw) => {
      let rest = raw.replace(/ +$/, "");
      while (rest.length > BRF_CELLS_PER_LINE) {
        let cut = rest.lastIndexOf(" ", BRF_CELLS_PER_LINE);
        if (cut <= 0) cut = BRF_CELLS_PER_LINE;
        lines.push(rest.slice(0, cut).replace(/ +$/, ""));
        rest = rest.slice(cut).replace(/^ +/, "");
      }
      lines.push(rest);
    });
    const pages = [];
    for (let i = 0; i < lines.length; i += BRF_LINES_PER_PAGE) {
      pages.push(lines.slice(i, i + BRF_LINES_PER_PAGE).join("\r\n"));
    }
    const brf = pages.join("\r\n\f") + "\r\n";
    downloadBlob(new Blob([brf], { type: "text/plain;charset=us-ascii" }), "translated_braille.brf");
  };

  const handleDownloadGcode = async () => {
    const response = await axios.post(
      buildApiUrl("/gcode"),
      { braille: resultTextAndBraille },
      { responseType: "blob" }
    );

    downloadBlob(response.data, "khmer_braille.gcode");
  };

  const handleDownload = async (downloadHandler) => {
    if (!hasResult) return;
    try {
      await downloadHandler();
      handleShowSnackbar(t.downloadSuccess);
    } catch (error) {
      console.error("Download failed:", error);
      handleShowSnackbar(t.downloadFail);
    }
  };

  const rows = [
    {
      key: "txt",
      icon: <img src={textIcon} alt="" className="h-6 w-6" aria-hidden="true" />,
      label: t.downloadTxt,
      onClick: () => handleDownload(handleDownloadTextFile),
    },
    {
      key: "word",
      icon: <img src={wordIcon} alt="" className="h-6 w-6" aria-hidden="true" />,
      label: t.downloadWord,
      onClick: () => handleDownload(handleDownloadWordFile),
    },
  ];

  if (!switchLang) {
    rows.push({
      key: "brf",
      icon: <Icon icon="mdi:braille" className="h-6 w-6 text-BlueDark" aria-hidden="true" />,
      label: t.downloadBrf,
      onClick: () => handleDownload(handleDownloadBrf),
    });
    rows.push({
      key: "gcode",
      icon: (
        <Icon
          icon="material-symbols:code-rounded"
          className="h-6 w-6 text-BlueDark"
          aria-hidden="true"
        />
      ),
      label: t.downloadGcode,
      onClick: () => handleDownload(handleDownloadGcode),
    });
  }

  return (
    <div>
      <p className="font-bold text-BlueDark mb-2 text-base md:text-lg">
        {t.downloadLabel}
      </p>
      <div className="flex flex-col gap-2">
        {rows.map((row) => (
          <button
            key={row.key}
            type="button"
            onClick={row.onClick}
            disabled={!hasResult}
            aria-disabled={!hasResult}
            title={row.label}
            className={`flex items-center gap-3 w-full text-left px-4 py-3 rounded-lg border text-base md:text-lg transition-colors ${
              hasResult
                ? "border-BlueDark text-BlueDark bg-white hover:bg-blue-50 cursor-pointer"
                : "border-gray-200 text-gray-400 bg-gray-50 cursor-not-allowed"
            }`}
          >
            {row.icon}
            <span>{row.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default IconButtonWithDropdown;
