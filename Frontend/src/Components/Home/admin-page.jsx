import { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import { Icon } from "@iconify/react";
import appStore from "../../store/app";
import { Field, inputClass } from "../Form/form-field";

// The team's inbox for feedback and contributions (Backend/admin.py). It is not linked
// from the menus: open /admin and enter the password set on the server (ADMIN_PASSWORD).
// Always the same address as the page, never VITE_API_BASE_URL: the sign-in cookie only
// works on the exact host that set it. The header is the protection against other websites.
const API = "/api/admin";
const api = axios.create({ baseURL: API, headers: { "X-Requested-With": "braille-admin" } });

const STATUSES = ["new", "read", "done"];
const LOW_DISK_GB = 5;

const content = {
  km: {
    title: "ប្រអប់សារ",
    password: "ពាក្យសម្ងាត់",
    signIn: "ចូល",
    signOut: "ចាកចេញ",
    notConfigured: "ទំព័រនេះបិទ។ សូមកំណត់ ADMIN_PASSWORD (យ៉ាងតិច ១២ តួអក្សរ) នៅលើម៉ាស៊ីនមេ។",
    wrongPassword: "ពាក្យសម្ងាត់មិនត្រឹមត្រូវ។",
    rateLimited: "ព្យាយាមច្រើនដងពេក។ សូមរង់ចាំបន្តិច ហើយព្យាយាមម្តងទៀត។",
    loadError: "មិនអាចផ្ទុកបានទេ។ សូមព្យាយាមម្តងទៀត។",
    all: "ទាំងអស់",
    feedback: "មតិ",
    contribution: "ការចូលរួម",
    show: "បង្ហាញ",
    anyStatus: "គ្រប់ស្ថានភាព",
    statuses: { new: "ថ្មី", read: "បានអាន", done: "រួចរាល់", merged: "បានបញ្ចូល" },
    categories: { suggestion: "សំណូមពរ", problem: "មានបញ្ហា", translation: "ការបកប្រែមិនត្រឹមត្រូវ", other: "ផ្សេងៗ" },
    empty: "មិនមានសារទេ។",
    pick: "ជ្រើសរើសសារមួយ ដើម្បីអាន។",
    summary: (rows, files) => `${rows} ជួរ · ${files} ឯកសារ`,
    anonymous: "មិនបញ្ជាក់ឈ្មោះ",
    from: "ពី",
    contact: "ទាក់ទង",
    none: "មិនបានផ្តល់",
    received: "ទទួលនៅ",
    reference: "លេខយោង",
    message: "សារ",
    sample: "អត្ថបទដែលកំពុងបកប្រែ",
    notes: "កំណត់ចំណាំ",
    rows: "ជួរ",
    text: "អត្ថបទ",
    braille: "អក្សរប្រៃ",
    status: "ស្ថានភាព",
    source: "ប្រភព",
    files: "ឯកសារ",
    fileWarning: "ឯកសារមកពីសាធារណៈជន។ សូមបើកវានៅលើកុំព្យូទ័រដែលមានកម្មវិធីកំចាត់មេរោគ។",
    setStatus: "កំណត់ស្ថានភាព",
    downloadAll: "ទាញយកទាំងអស់ (.zip)",
    exportAll: "បម្រុងទុកទាំងអស់ (.zip)",
    delete: "លុប",
    confirmDelete: "លុបសារនេះជាអចិន្ត្រៃយ៍?",
    notPersistent: "សារត្រូវបានរក្សាទុកក្នុង container ហើយនឹងបាត់នៅពេល deploy លើកក្រោយ។ សូមភ្ជាប់ volume ទៅ /data ។",
    lowDisk: (gb) => `ថាសនៅសល់តែ ${gb} GB។ ទម្រង់នឹងឈប់ទទួលសារនៅពេលនៅសល់តិចជាង 1 GB។`,
    clientsHidden: "Proxy លាក់អាសយដ្ឋានរបស់អ្នកទស្សនា ដូច្នេះដែនកំណត់ស្នើសុំត្រូវបានចែករំលែកគ្នា។ សូមមើល Backend/docs/security.md ។",
    telegramWaiting: (n) => `មាន ${n} មិនទាន់បានផ្ញើទៅ Telegram ទេ។ វានៅតែមាននៅទីនេះ។`,
    telegramResend: "ផ្ញើម្តងទៀត",
  },
  en: {
    title: "Inbox",
    password: "Password",
    signIn: "Sign in",
    signOut: "Sign out",
    notConfigured: "This page is closed. Set ADMIN_PASSWORD (at least 12 characters) on the server.",
    wrongPassword: "Wrong password.",
    rateLimited: "Too many attempts. Please wait a while and try again.",
    loadError: "Could not load. Please try again.",
    all: "All",
    feedback: "Feedback",
    contribution: "Contributions",
    show: "Show",
    anyStatus: "Any status",
    statuses: { new: "New", read: "Read", done: "Done", merged: "Merged" },
    categories: { suggestion: "Suggestion", problem: "Problem", translation: "Wrong translation", other: "Other" },
    empty: "Nothing here.",
    pick: "Choose a message to read it.",
    summary: (rows, files) => `${rows} rows · ${files} files`,
    anonymous: "No name given",
    from: "From",
    contact: "Contact",
    none: "Not given",
    received: "Received",
    reference: "Reference",
    message: "Message",
    sample: "Text being translated",
    notes: "Notes",
    rows: "Rows",
    text: "Text",
    braille: "Braille",
    status: "Status",
    source: "Source",
    files: "Files",
    fileWarning: "These files come from the public. Open them on a computer with antivirus software.",
    setStatus: "Set status",
    downloadAll: "Download everything (.zip)",
    exportAll: "Back up everything (.zip)",
    delete: "Delete",
    confirmDelete: "Delete this permanently?",
    notPersistent: "Records are stored inside the container and will be lost on the next deploy. Mount a volume at /data.",
    lowDisk: (gb) => `Only ${gb} GB of disk left. The forms stop accepting records below 1 GB.`,
    clientsHidden: "The proxy hides visitors' addresses, so they all share one rate limit. See Backend/docs/security.md.",
    telegramWaiting: (n) => `${n} not sent to Telegram yet. They are safe here.`,
    telegramResend: "Send again",
  },
};

const buttonClass = "inline-flex items-center gap-2 border-2 border-BlueDark text-BlueDark font-bold rounded-full px-4 py-1.5 hover:bg-BlueDark hover:text-white transition-colors";

const formatDate = (iso) => {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? iso : date.toLocaleString();
};

const SignIn = ({ c, onDone }) => {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      await api.post("/login", { password });
      onDone();
    } catch (err) {
      setError(err.response?.status === 429 ? c.rateLimited : err.response?.status === 401 ? c.wrongPassword : c.loadError);
    }
  };

  return (
    <form onSubmit={submit} className="max-w-sm mx-auto bg-white border rounded-xl shadow-sm p-6 mt-8 space-y-4">
      <Field label={c.password}>
        <input type="password" autoFocus autoComplete="current-password" className={inputClass}
          value={password} onChange={(e) => setPassword(e.target.value)} />
      </Field>
      {error && <p className="text-red-600" role="alert">{error}</p>}
      <button type="submit" className="bg-BlueDark text-white font-bold rounded-full px-6 py-2 hover:opacity-90">{c.signIn}</button>
    </form>
  );
};

const Detail = ({ c, item, onStatus, onDelete }) => {
  const heading = useRef(null);
  useEffect(() => { heading.current?.focus(); }, [item.id]);

  const base = `${API}/items/${item.kind}/${item.id}`;
  const notes = item.kind === "feedback" ? item.message : item.notes;
  const people = item.people;
  const who = [people.name, people.organization].filter(Boolean).join(" · ") || c.anonymous;

  return (
    <article className="bg-white border rounded-xl shadow-sm p-5 space-y-4 min-w-0">
      <h2 ref={heading} tabIndex={-1} className="font-bold text-BlueDark text-lg outline-none">
        {item.kind === "feedback" ? `${c.feedback}: ${c.categories[item.category] || item.category}` : c.contribution}
      </h2>
      <dl className="text-sm grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
        <dt className="font-bold">{c.from}</dt><dd className="break-words">{who}</dd>
        <dt className="font-bold">{c.contact}</dt><dd className="break-words">{people.contact || c.none}</dd>
        <dt className="font-bold">{c.received}</dt><dd>{formatDate(item.received_at)}</dd>
        <dt className="font-bold">{c.reference}</dt><dd className="font-mono break-all">{item.id}</dd>
      </dl>

      {notes && (
        <section>
          <h3 className="font-bold text-sm mb-1">{item.kind === "feedback" ? c.message : c.notes}</h3>
          <p className="whitespace-pre-wrap break-words">{notes}</p>
        </section>
      )}
      {item.sample_text && (
        <section>
          <h3 className="font-bold text-sm mb-1">{c.sample}</h3>
          <p className="whitespace-pre-wrap break-words bg-gray-50 rounded p-2">{item.sample_text}</p>
        </section>
      )}
      {item.entries?.length > 0 && (
        <section>
          <h3 className="font-bold text-sm mb-1">{c.rows} ({item.entries.length})</h3>
          <div className="overflow-x-auto">
            <table className="text-sm w-full border-collapse">
              <thead>
                <tr className="text-left border-b">
                  <th className="py-1 pr-3">#</th><th className="py-1 pr-3">{c.text}</th>
                  <th className="py-1 pr-3">{c.braille}</th><th className="py-1 pr-3">{c.status}</th>
                  <th className="py-1 pr-3">{c.source}</th>
                </tr>
              </thead>
              <tbody>
                {item.entries.map((entry, i) => (
                  <tr key={i} className="border-b last:border-0 align-top">
                    <td className="py-1 pr-3">{i + 1}</td><td className="py-1 pr-3">{entry.text}</td>
                    <td className="py-1 pr-3">{entry.braille_cells}</td><td className="py-1 pr-3">{entry.status_when_received}</td>
                    <td className="py-1 pr-3">{entry.source}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
      {item.files?.length > 0 && (
        <section>
          <h3 className="font-bold text-sm mb-1">{c.files} ({item.files.length})</h3>
          <p className="text-sm text-gray-600 mb-2">{c.fileWarning}</p>
          <ul className="space-y-1">
            {item.files.map((file, i) => (
              <li key={file.stored_as}>
                <a className="text-BlueDark underline break-all" href={`${base}/files/${i}`}>{file.original_name}</a>
                <span className="text-sm text-gray-500"> ({(file.size / 1048576).toFixed(1)} MB)</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="flex flex-wrap items-center gap-2 border-t pt-4">
        <div role="group" aria-label={c.setStatus} className="flex flex-wrap gap-2">
          {STATUSES.map((status) => (
            <button key={status} type="button" aria-pressed={item.status === status} onClick={() => onStatus(status)}
              className={`${buttonClass} ${item.status === status ? "bg-BlueDark !text-white" : ""}`}>
              {c.statuses[status]}
            </button>
          ))}
        </div>
        {item.kind === "contribution" && <a className={buttonClass} href={`${base}/download`}>{c.downloadAll}</a>}
        <button type="button" onClick={onDelete}
          className="inline-flex items-center gap-2 border-2 border-red-600 text-red-600 font-bold rounded-full px-4 py-1.5 hover:bg-red-600 hover:text-white transition-colors sm:ml-auto">
          <Icon icon="mdi:delete-outline" aria-hidden="true" /> {c.delete}
        </button>
      </div>
    </article>
  );
};

const Inbox = ({ c, onSignedOut }) => {
  const [items, setItems] = useState([]);
  const [system, setSystem] = useState(null);
  const [kind, setKind] = useState("all");
  const [status, setStatus] = useState("all");
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState(null);

  const guard = useCallback((err) => {
    if (err.response?.status === 401) onSignedOut();
    else setError(c.loadError);
  }, [c, onSignedOut]);

  const load = useCallback(async () => {
    try {
      const res = await api.get("/items");
      setItems(res.data.items);
      setSystem(res.data.system);
      setError(null);
    } catch (err) {
      guard(err);
    }
  }, [guard]);

  // load() sets state only after the request returns (after await), not synchronously
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, [load]);

  const changeStatus = async (item, value) => {
    try {
      await api.patch(`/items/${item.kind}/${item.id}`, { status: value });
      setSelected((current) => (current?.id === item.id ? { ...current, status: value } : current));
      setItems((list) => list.map((i) => (i.id === item.id ? { ...i, status: value } : i)));
    } catch (err) {
      guard(err);
    }
  };

  const open = async (summary) => {
    try {
      const res = await api.get(`/items/${summary.kind}/${summary.id}`);
      setSelected(res.data);
      if (summary.status === "new") changeStatus(res.data, "read");
    } catch (err) {
      guard(err);
    }
  };

  const remove = async (item) => {
    if (!window.confirm(c.confirmDelete)) return;
    try {
      await api.delete(`/items/${item.kind}/${item.id}`);
      setSelected(null);
      setItems((list) => list.filter((i) => i.id !== item.id));
    } catch (err) {
      guard(err);
    }
  };

  const resendToTelegram = async () => {
    try {
      await api.post("/telegram/resend");
      setTimeout(load, 3000);
    } catch (err) {
      guard(err);
    }
  };

  const signOut = async () => {
    await api.post("/logout").catch(() => {});
    onSignedOut();
  };

  const shown = items.filter((i) => (kind === "all" || i.kind === kind) && (status === "all" || i.status === status));
  const countNew = (k) => items.filter((i) => i.status === "new" && (k === "all" || i.kind === k)).length;
  const telegramWaiting = items.filter((i) => i.telegram === "failed" || i.telegram === "pending").length;
  const warnings = system ? [
    !system.persistent && c.notPersistent,
    system.free_gb < LOW_DISK_GB && c.lowDisk(system.free_gb),
    system.clients_hidden && c.clientsHidden,
  ].filter(Boolean) : [];

  return (
    <div className="mt-6">
      {warnings.map((warning) => (
        <p key={warning} className="bg-yellow-50 border border-yellow-400 rounded-lg p-3 mb-3 text-sm">{warning}</p>
      ))}
      {telegramWaiting > 0 && (
        <p className="bg-yellow-50 border border-yellow-400 rounded-lg p-3 mb-3 text-sm">
          {c.telegramWaiting(telegramWaiting)}{" "}
          <button type="button" className="underline font-bold" onClick={resendToTelegram}>{c.telegramResend}</button>
        </p>
      )}
      {error && <p className="text-red-600 mb-3" role="alert">{error}</p>}

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div role="group" aria-label={c.show} className="flex flex-wrap gap-2">
          {[["all", c.all], ["feedback", c.feedback], ["contribution", c.contribution]].map(([key, label]) => (
            <button key={key} type="button" aria-pressed={kind === key} onClick={() => setKind(key)}
              className={`${buttonClass} ${kind === key ? "bg-BlueDark !text-white" : ""}`}>
              {label}{countNew(key) > 0 && ` (${countNew(key)})`}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-sm">
          <span className="sr-only">{c.status}</span>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className={`${inputClass} !w-auto`}>
            <option value="all">{c.anyStatus}</option>
            {[...STATUSES, "merged"].map((s) => <option key={s} value={s}>{c.statuses[s]}</option>)}
          </select>
        </label>
        <div className="sm:ml-auto flex flex-wrap gap-2">
          <a className={buttonClass} href={`${API}/export`}>{c.exportAll}</a>
          <button type="button" className={buttonClass} onClick={signOut}>{c.signOut}</button>
        </div>
      </div>

      <div className="grid lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-4 items-start">
        <ul className="bg-white border rounded-xl shadow-sm divide-y overflow-hidden">
          {shown.length === 0 && <li className="p-4 text-gray-500">{c.empty}</li>}
          {shown.map((item) => (
            <li key={item.id}>
              <button type="button" onClick={() => open(item)} aria-current={selected?.id === item.id}
                className={`w-full text-left p-3 hover:bg-gray-50 ${selected?.id === item.id ? "bg-blue-50" : ""}`}>
                <span className="flex items-center gap-2 text-xs text-gray-500">
                  <span className={`rounded-full px-2 py-0.5 font-bold ${item.status === "new" ? "bg-BlueDark text-white" : "bg-gray-200 text-gray-700"}`}>
                    {c.statuses[item.status] || item.status}
                  </span>
                  {item.kind === "feedback" ? c.categories[item.category] || c.feedback : c.contribution}
                  <span className="ml-auto">{formatDate(item.received_at)}</span>
                </span>
                <span className={`block mt-1 truncate ${item.status === "new" ? "font-bold" : ""}`}>
                  {item.kind === "feedback" ? item.title : c.summary(item.rows, item.files)}
                </span>
                <span className="block text-sm text-gray-500 truncate">
                  {[item.name, item.organization].filter(Boolean).join(" · ") || c.anonymous}
                </span>
              </button>
            </li>
          ))}
        </ul>
        {selected
          ? <Detail c={c} item={selected} onStatus={(value) => changeStatus(selected, value)} onDelete={() => remove(selected)} />
          : <p className="text-gray-500 p-4 hidden lg:block">{c.pick}</p>}
      </div>
    </div>
  );
};

const Admin = () => {
  const { interfaceLang } = appStore();
  const c = content[interfaceLang] || content.km;
  const [session, setSession] = useState(null);

  const check = useCallback(() => {
    api.get("/session").then((res) => setSession(res.data)).catch(() => setSession({ failed: true }));
  }, []);
  useEffect(check, [check]);

  return (
    <div className="lg:mt-24 mt-20 pb-16 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="font-bold text-BlueDark text-xl md:text-2xl text-center">{c.title}</h1>
        {session?.failed && <p className="text-center text-red-600 mt-6" role="alert">{c.loadError}</p>}
        {session && !session.failed && !session.configured && <p className="text-center mt-6" role="alert">{c.notConfigured}</p>}
        {session?.configured && !session.logged_in && <SignIn c={c} onDone={check} />}
        {session?.logged_in && <Inbox c={c} onSignedOut={check} />}
      </div>
    </div>
  );
};

export default Admin;
