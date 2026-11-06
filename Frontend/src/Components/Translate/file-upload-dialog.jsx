import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { Icon } from "@iconify/react";
import appStore from "../../store/app";
import { useT } from "../../i18n";
import { buildApiUrl } from "../../config/api";
import pdfIcon from "../../assets/pdf-icon.png";
import textIcon from "../../assets/text-icon.png";
import wordIcon from "../../assets/word-icon.png";

// Same file types as Backend/FileFormat.py read_upload()
const ACCEPT = ".docx,.txt,.pdf";
const ACCEPT_BRAILLE = ".brf,.brl,.pef,.txt,.docx,.pdf";
// Same as MAX_UPLOAD_MB in Backend/FileFormat.py: refuse bigger files before uploading them
const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;

// File icon for a Braille extension: a page with a 6-dot cell and the extension name
const BRAILLE_ICON_DOTS = [[13, 14], [13, 21], [13, 28], [22, 14], [22, 21], [22, 28]];
const BrailleFileIcon = ({ ext, dots, color }) => (
  <svg viewBox="0 0 40 48" className="h-12 md:h-14 w-auto" aria-hidden="true">
    <path d="M5 1h21l11 11v33a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2z" fill={color} />
    <path d="M26 1v9a2 2 0 0 0 2 2h9z" fill="#ffffff" fillOpacity="0.45" />
    {BRAILLE_ICON_DOTS.map(([cx, cy], i) => (
      <circle key={i} cx={cx} cy={cy} r="2.6" fill="#ffffff" fillOpacity={dots.includes(i + 1) ? 1 : 0.25} />
    ))}
    <text x="20" y="42" textAnchor="middle" fontSize="9" fontWeight="700" fontFamily="Arial, sans-serif" fill="#ffffff">
      {ext}
    </text>
  </svg>
);
const BRAILLE_ICONS = [
  { ext: "BRF", dots: [1, 2], color: "#15274b" },          // ⠃ b
  { ext: "BRL", dots: [1, 2, 3], color: "#2563eb" },       // ⠇ l
  { ext: "PEF", dots: [1, 2, 3, 4], color: "#0f766e" },    // ⠏ p
];

/**
 * "Choose file" window for step 1. Fixed in the middle of the screen (it used
 * to be placed at the top of the page and was cut off under the header), and
 * stays open while the file is read so errors can be shown.
 */
const FileUploadDialog = ({ braille, onClose }) => {
  const { interfaceLang, brailleType, setBrailleType, setResultFileText, setResultFileBraille } = appStore();
  const t = useT(interfaceLang).upload;
  const [status, setStatus] = useState(null); // { busy, pdf } or { error }
  const [dragging, setDragging] = useState(false);
  const dialogRef = useRef(null);
  const busy = Boolean(status?.busy);

  useEffect(() => {
    dialogRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape" && !busy) onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [busy, onClose]);

  const upload = async (file) => {
    if (!file || busy) return;
    if (file.size > MAX_UPLOAD_BYTES) {
      setStatus({ error: "file_too_large" });
      return;
    }
    setStatus({ busy: true, pdf: file.name.toLowerCase().endsWith(".pdf") });
    const form = new FormData();
    form.append("file", file);
    form.append("braille_type", brailleType);
    try {
      const res = await axios.post(buildApiUrl(braille ? "/updatebraille" : "/updateTextFile"), form);
      if (braille) {
        // .brf files are English Braille only (the server reads them as English)
        if (res.data.braille_type === "english" && brailleType !== "english") setBrailleType("english");
        setResultFileBraille({ resultDataBraille: res.data.result, dataInFileBraille: res.data.uploaded });
      } else {
        setResultFileText({ resultDataText: res.data.result, dataInFileText: res.data.uploaded });
      }
      onClose();
    } catch (err) {
      setStatus({ error: err.response ? err.response.data?.error || "server" : "network" });
    }
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    upload(e.dataTransfer.files[0]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 font-KohSantepheap">
      <div className="absolute inset-0 bg-black/40" onClick={busy ? undefined : onClose} aria-hidden="true" />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="upload-title"
        tabIndex={-1}
        className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto bg-white rounded-xl shadow-xl p-5 md:p-6 focus:outline-none"
      >
        <div className="flex items-start justify-between gap-3">
          <h2 id="upload-title" className="font-bold text-BlueDark text-lg md:text-xl">
            {braille ? t.titleBraille : brailleType === "english" ? t.titleEnglish : t.title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            aria-label={t.close}
            title={t.close}
            className="p-1 rounded-full text-gray-500 hover:bg-gray-100 disabled:opacity-40"
          >
            <Icon icon="material-symbols:close" className="text-2xl" aria-hidden="true" />
          </button>
        </div>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={`mt-4 rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
            dragging ? "border-BlueDark bg-blue-50" : "border-gray-300 bg-gray-50"
          }`}
        >
          <div className="flex justify-center gap-4 h-12 md:h-14" aria-hidden="true">
            {braille ? (
              BRAILLE_ICONS.map((icon) => <BrailleFileIcon key={icon.ext} {...icon} />)
            ) : (
              <>
                <img src={wordIcon} alt="" />
                <img src={textIcon} alt="" />
                <img src={pdfIcon} alt="" className="opacity-60" />
              </>
            )}
          </div>
          <p className="font-bold text-BlueDark mt-3">{t.dropHint}</p>
          <p className="text-gray-500 my-2">{t.or}</p>
          <label
            className={`inline-block px-6 py-2.5 rounded-lg bg-BlueDark text-white font-bold ${
              busy ? "opacity-60 cursor-wait" : "cursor-pointer hover:opacity-90"
            }`}
          >
            {t.chooseFile}
            <input
              type="file"
              accept={braille ? ACCEPT_BRAILLE : ACCEPT}
              className="sr-only"
              disabled={busy}
              onChange={(e) => {
                upload(e.target.files[0]);
                e.target.value = "";
              }}
            />
          </label>
          <p className="text-sm text-gray-500 mt-3">{braille ? t.formatsBraille : t.formats}</p>
          <p className="text-sm text-gray-500 mt-1">{t.limits}</p>
        </div>

        {busy && (
          <p className="mt-4 flex items-center gap-2 text-BlueDark" role="status">
            <Icon icon="mdi:loading" className="text-xl animate-spin shrink-0" aria-hidden="true" />
            {status.pdf && !braille ? t.readingPdf : t.reading}
          </p>
        )}
        {status?.error && (
          <p className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-red-700" role="alert">
            {t.errors[status.error] || t.errors.server}
          </p>
        )}

        {braille ? (
          <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm md:text-base text-gray-800">
            <p className="flex items-center gap-2 font-bold text-BlueDark">
              <Icon icon="material-symbols:info-outline" className="text-lg shrink-0" aria-hidden="true" />
              {t.brailleNoteTitle}
            </p>
            <p className="mt-1">{t.brailleNote}</p>
          </div>
        ) : (
          <div className="mt-4 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm md:text-base text-amber-900">
            <p className="flex items-center gap-2 font-bold">
              <Icon icon="material-symbols:warning-outline" className="text-lg shrink-0" aria-hidden="true" />
              {t.pdfNoteTitle}
            </p>
            <p className="mt-1">{t.pdfNote}</p>
          </div>
        )}
        <p className="text-sm text-gray-500 mt-3">{t.docTip}</p>
      </div>
    </div>
  );
};

export default FileUploadDialog;
