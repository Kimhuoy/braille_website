import React, { useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { Icon } from "@iconify/react";
import appStore from "../../store/app";
import { FORMS_API_URL, FORMS_OPEN } from "../../config/forms";
import { Field, inputClass } from "../Form/form-field";
import FormsClosedNotice from "../Form/forms-closed-notice";

// Same values and limit as Backend/feedback.py
const CATEGORIES = [
  { key: "suggestion", icon: "mdi:lightbulb-on-outline" },
  { key: "problem", icon: "mdi:bug-outline" },
  { key: "translation", icon: "mdi:translate" },
  { key: "other", icon: "mdi:dots-horizontal-circle-outline" },
];
const MAX_MESSAGE = 5000;

// Page content per interface language.
const content = {
  km: {
    title: "បញ្ចេញមតិ",
    intro: "មតិរបស់អ្នកជួយយើងកែលម្អគេហទំព័រនេះ។ សូមប្រាប់យើងពីបញ្ហាដែលអ្នកជួបប្រទះ ការបកប្រែដែលមិនត្រឹមត្រូវ ឬគំនិតថ្មីៗ។",
    category: "មតិរបស់អ្នកទាក់ទងនឹងអ្វី?",
    categories: {
      suggestion: "សំណូមពរ / គំនិត",
      problem: "មានអ្វីមួយមិនដំណើរការ",
      translation: "ការបកប្រែមិនត្រឹមត្រូវ",
      other: "ផ្សេងៗ",
    },
    message: "សាររបស់អ្នក",
    messagePlaceholder: "សូមរៀបរាប់ពីអ្វីដែលបានកើតឡើង ឬអ្វីដែលអ្នកចង់បាន...",
    sampleText: "អត្ថបទដែលអ្នកកំពុងបកប្រែ (ស្រេចចិត្ត)",
    sampleHint: "បិទភ្ជាប់អត្ថបទខ្មែរ ដើម្បីឱ្យយើងអាចពិនិត្យបញ្ហាឡើងវិញ។ ដើម្បីផ្ញើអក្សរប្រៃត្រឹមត្រូវនៃពាក្យជាច្រើន សូមប្រើទំព័រ",
    contributeLink: "ចូលរួមចែករំលែក",
    name: "ឈ្មោះ (ស្រេចចិត្ត)",
    contact: "វិធីទាក់ទងអ្នក (ស្រេចចិត្ត — ប្រសិនបើអ្នកចង់បានការឆ្លើយតប៖ ទូរស័ព្ទ ឬ Telegram)",
    submit: "ផ្ញើមតិ",
    sending: "កំពុងផ្ញើ...",
    successTitle: "សូមអរគុណចំពោះមតិរបស់អ្នក!",
    successText: "យើងអានរាល់សារទាំងអស់។ ប្រសិនបើអ្នកបានទុកវិធីទាក់ទង យើងអាចនឹងទាក់ទងអ្នកវិញ។",
    reference: "លេខយោង",
    sendAnother: "ផ្ញើសារមួយទៀត",
    backHome: "ត្រឡប់ទៅទំព័របកប្រែ",
    errors: {
      missing_message: "សូមសរសេរសាររបស់អ្នក។",
      rate_limited: "អ្នកបានផ្ញើច្រើនពេកក្នុងពេលខ្លី។ សូមព្យាយាមម្តងទៀតបន្តិចក្រោយ។",
      storage_full: "យើងមិនអាចទទួលសារបានឥឡូវនេះទេ។ សូមព្យាយាមម្តងទៀតពេលក្រោយ។",
      server: "មានបញ្ហានៅខាងយើង។ សូមព្យាយាមម្តងទៀតពេលក្រោយ។",
      network: "មិនអាចភ្ជាប់ទៅម៉ាស៊ីនមេបានទេ។ សូមពិនិត្យអ៊ីនធឺណិត ហើយព្យាយាមម្តងទៀត។",
    },
  },
  en: {
    title: "Send us feedback",
    intro: "Your feedback helps us improve this website. Tell us about a problem, a wrong translation, or an idea.",
    category: "What is it about?",
    categories: {
      suggestion: "Suggestion / idea",
      problem: "Something does not work",
      translation: "Wrong translation",
      other: "Other",
    },
    message: "Your message",
    messagePlaceholder: "Describe what happened or what you would like...",
    sampleText: "Text you were translating (optional)",
    sampleHint: "Paste the Khmer text so we can reproduce the problem. To send the correct Braille for many words, use the page",
    contributeLink: "Contribute",
    name: "Name (optional)",
    contact: "How to reach you (optional — if you would like a reply: phone or Telegram)",
    submit: "Send feedback",
    sending: "Sending...",
    successTitle: "Thank you for your feedback!",
    successText: "We read every message. If you told us how to reach you, we may contact you.",
    reference: "Reference number",
    sendAnother: "Send another message",
    backHome: "Back to the translator",
    errors: {
      missing_message: "Please write a message.",
      rate_limited: "You have sent a lot in a short time. Please try again a little later.",
      storage_full: "We cannot accept this right now. Please try again later.",
      server: "Something went wrong on our side. Please try again later.",
      network: "Could not reach the server. Check your internet connection and try again.",
    },
  },
};

const emptyForm = { category: "suggestion", message: "", sample_text: "", name: "", contact: "", website: "" };

const Feedback = () => {
  const { interfaceLang } = appStore();
  const c = content[interfaceLang] || content.km;

  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState(null);
  const [sending, setSending] = useState(false);
  const [doneId, setDoneId] = useState(null);

  const update = (field) => (e) => {
    setForm({ ...form, [field]: e.target.value });
    setError(null);
  };

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!form.message.trim()) {
      setError("missing_message");
      return;
    }
    setSending(true);
    try {
      const res = await axios.post(`${FORMS_API_URL}/feedback`, {
        ...form,
        sample_text: form.category === "translation" ? form.sample_text : "",
        lang: interfaceLang,
      });
      setDoneId(res.data.id);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError(err.response ? err.response.data?.error || "server" : "network");
    } finally {
      setSending(false);
    }
  };

  if (doneId) {
    return (
      <div className="lg:mt-24 mt-20 pb-16 px-4">
        <div className="max-w-2xl mx-auto bg-white border rounded-xl shadow-md p-8 text-center">
          <Icon icon="mdi:check-decagram" className="text-6xl text-MainSucess mx-auto" aria-hidden="true" />
          <h1 className="font-bold text-BlueDark text-xl md:text-2xl mt-4">{c.successTitle}</h1>
          <p className="text-gray-600 mt-3">{c.successText}</p>
          <p className="mt-6 text-sm text-gray-500">{c.reference}</p>
          <p className="font-mono font-bold text-lg md:text-xl text-BlueDark break-all">{doneId}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={() => { setForm(emptyForm); setDoneId(null); }}
              className="border-2 border-BlueDark text-BlueDark font-bold rounded-full px-5 py-2 hover:bg-BlueDark hover:text-white transition-colors"
            >
              {c.sendAnother}
            </button>
            <Link to="/" className="bg-BlueDark text-white font-bold rounded-full px-5 py-2 hover:opacity-90">
              {c.backHome}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="lg:mt-24 mt-20 pb-16 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center">
          <h1 className="font-bold text-BlueDark text-xl md:text-2xl">{c.title}</h1>
          <p className="text-gray-600 text-base md:text-lg mt-3">{c.intro}</p>
        </div>

        {!FORMS_OPEN && <FormsClosedNotice />}

        <form onSubmit={submit} noValidate className="bg-white border rounded-xl shadow-sm p-5 md:p-6 mt-8">
          <fieldset disabled={!FORMS_OPEN} className="space-y-5 min-w-0 disabled:opacity-60">
          <fieldset>
            <legend className="block text-sm font-bold text-gray-700 mb-2">{c.category}</legend>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {CATEGORIES.map(({ key, icon }) => (
                <label
                  key={key}
                  className={`flex items-center gap-3 border rounded-lg px-3 py-2.5 cursor-pointer transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-BlueDark ${
                    form.category === key ? "border-BlueDark bg-blue-50" : "border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <input
                    type="radio"
                    name="category"
                    value={key}
                    checked={form.category === key}
                    onChange={update("category")}
                    className="sr-only"
                  />
                  <Icon icon={icon} className="text-2xl text-BlueDark shrink-0" aria-hidden="true" />
                  <span className="text-base">{c.categories[key]}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <Field label={c.message} required>
            <textarea
              className={`${inputClass} min-h-[140px]`}
              value={form.message}
              onChange={update("message")}
              placeholder={c.messagePlaceholder}
              maxLength={MAX_MESSAGE}
            />
            <span className="block text-right text-xs text-gray-400 mt-1">
              {form.message.length} / {MAX_MESSAGE}
            </span>
          </Field>

          {form.category === "translation" && (
            <div>
              <Field label={c.sampleText}>
                <textarea className={`${inputClass} min-h-[90px]`} value={form.sample_text} onChange={update("sample_text")} />
              </Field>
              <p className="text-sm text-gray-500 mt-1">
                {c.sampleHint}{" "}
                <Link to="/contribute" className="text-BlueDark font-bold underline">{c.contributeLink}</Link>
              </p>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-4">
            <Field label={c.name}>
              <input className={inputClass} value={form.name} onChange={update("name")} autoComplete="name" />
            </Field>
            <Field label={c.contact}>
              <input className={inputClass} value={form.contact} onChange={update("contact")} maxLength={200} />
            </Field>
          </div>

          {/* Spam trap: hidden from people, bots fill it in */}
          <input
            type="text"
            name="website"
            value={form.website}
            onChange={update("website")}
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            className="hidden"
          />

          {error && <p className="text-red-600" role="alert">{c.errors[error] || c.errors.server}</p>}
          <button
            type="submit"
            disabled={sending}
            className="inline-flex items-center gap-2 bg-BlueDark text-white font-bold rounded-full px-6 py-3 hover:opacity-90 disabled:opacity-60"
          >
            <Icon icon={sending ? "mdi:loading" : "mdi:send"} className={`text-xl ${sending ? "animate-spin" : ""}`} aria-hidden="true" />
            {sending ? c.sending : c.submit}
          </button>
          </fieldset>
        </form>
      </div>
    </div>
  );
};

export default Feedback;
