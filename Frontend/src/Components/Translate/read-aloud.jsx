import React, { useEffect, useRef, useState } from "react";
import { Icon } from "@iconify/react";

/**
 * Reads English text aloud with the browser's own speech engine (Web Speech
 * API): free, no key, no server, and the text is read on the user's device.
 * Browsers bring natural neural voices: Edge has "Microsoft ... Online
 * (Natural)", Chrome has "Google US English", Safari/iOS has Siri voices,
 * Android has Google's voices. The most natural English voice is picked
 * first; the user can choose another one.
 * Khmer has no voice in most browsers yet, so this is shown for English only.
 */

const VOICE_KEY = "braille.readAloud.voice";

// Higher = sounds more natural (names used by Edge, Chrome, Safari, Android)
const voiceScore = (v) =>
  (/natural/i.test(v.name) ? 8 : 0) +
  (/neural|premium|enhanced|siri/i.test(v.name) ? 5 : 0) +
  (/online|google/i.test(v.name) ? 3 : 0) +
  (!v.localService ? 1 : 0) +
  (/^en[-_]US/i.test(v.lang) ? 1 : 0);

// Long text in one utterance is cut off by some browsers (Chrome stops after
// about 15 seconds), so read it sentence by sentence, at most ~220 characters each
const splitText = (text) => {
  const parts = [];
  for (const sentence of text.replace(/\s+/g, " ").match(/[^.!?;:\n]+[.!?;:]*\s*/g) || []) {
    if (sentence.length <= 220) parts.push(sentence.trim());
    else parts.push(...(sentence.match(/.{1,220}(\s|$)/g) || [sentence]).map((s) => s.trim()));
  }
  return parts.filter(Boolean);
};

const readStored = () => {
  try {
    return localStorage.getItem(VOICE_KEY) || "";
  } catch {
    return "";
  }
};

const ReadAloud = ({ text, t }) => {
  const supported = typeof window !== "undefined" && "speechSynthesis" in window;
  const [voices, setVoices] = useState([]);
  const [voiceName, setVoiceName] = useState(readStored);
  const [rate, setRate] = useState(1);
  const [state, setState] = useState("idle"); // idle | playing | paused
  const queue = useRef([]);

  useEffect(() => {
    if (!supported) return undefined;
    const load = () => {
      const english = window.speechSynthesis
        .getVoices()
        .filter((v) => /^en([-_]|$)/i.test(v.lang))
        .sort((a, b) => voiceScore(b) - voiceScore(a) || a.name.localeCompare(b.name));
      setVoices(english);
    };
    load();
    window.speechSynthesis.addEventListener("voiceschanged", load);
    return () => window.speechSynthesis.removeEventListener("voiceschanged", load);
  }, [supported]);

  // Stop when the text changes or the page is left
  useEffect(() => {
    if (!supported) return undefined;
    return () => {
      queue.current = [];
      window.speechSynthesis.cancel();
      setState("idle");
    };
  }, [text, supported]);

  if (!supported) {
    return <p className="mt-3 text-sm text-gray-500">{t.listenUnsupported}</p>;
  }

  const voice = voices.find((v) => v.name === voiceName) || voices[0];

  const speakNext = () => {
    const part = queue.current.shift();
    if (!part) {
      setState("idle");
      return;
    }
    const u = new SpeechSynthesisUtterance(part);
    if (voice) u.voice = voice;
    u.lang = voice?.lang || "en-US";
    u.rate = rate;
    u.onend = speakNext;
    u.onerror = (e) => {
      if (e.error !== "interrupted" && e.error !== "canceled") setState("idle");
    };
    window.speechSynthesis.speak(u);
  };

  const play = () => {
    if (state === "paused") {
      window.speechSynthesis.resume();
      setState("playing");
      return;
    }
    window.speechSynthesis.cancel();
    queue.current = splitText(text);
    setState("playing");
    speakNext();
  };

  const pause = () => {
    window.speechSynthesis.pause();
    setState("paused");
  };

  const stop = () => {
    queue.current = [];
    window.speechSynthesis.cancel();
    setState("idle");
  };

  const chooseVoice = (name) => {
    setVoiceName(name);
    try {
      localStorage.setItem(VOICE_KEY, name);
    } catch {
      /* private window: the choice is kept for this visit only */
    }
    if (state !== "idle") stop();
  };

  const button = "inline-flex items-center gap-1.5 rounded-full px-4 py-2 font-bold border-2 border-BlueDark";

  return (
    <div className="mt-3 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm md:text-base" role="group" aria-label={t.listenTitle}>
      <p className="font-bold text-BlueDark flex items-center gap-2">
        <Icon icon="mdi:volume-high" className="text-xl" aria-hidden="true" />
        {t.listenTitle}
      </p>
      <div className="flex flex-wrap items-center gap-2 mt-2">
        {state === "playing" ? (
          <button type="button" onClick={pause} className={`${button} bg-BlueDark text-white`}>
            <Icon icon="mdi:pause" aria-hidden="true" /> {t.listenPause}
          </button>
        ) : (
          <button type="button" onClick={play} className={`${button} bg-BlueDark text-white`}>
            <Icon icon="mdi:play" aria-hidden="true" /> {state === "paused" ? t.listenResume : t.listenPlay}
          </button>
        )}
        <button type="button" onClick={stop} disabled={state === "idle"} className={`${button} text-BlueDark bg-white disabled:opacity-40`}>
          <Icon icon="mdi:stop" aria-hidden="true" /> {t.listenStop}
        </button>
        <label className="flex items-center gap-1.5">
          <span className="text-gray-700">{t.listenVoice}</span>
          <select
            value={voice?.name || ""}
            onChange={(e) => chooseVoice(e.target.value)}
            className="border border-gray-300 rounded px-2 py-1.5 bg-white max-w-[16rem]"
          >
            {voices.length === 0 && <option value="">{t.listenDefaultVoice}</option>}
            {voices.map((v) => (
              <option key={v.name} value={v.name}>
                {v.name} ({v.lang})
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-1.5">
          <span className="text-gray-700">{t.listenSpeed}</span>
          <select
            value={rate}
            onChange={(e) => {
              setRate(Number(e.target.value));
              if (state !== "idle") stop();
            }}
            className="border border-gray-300 rounded px-2 py-1.5 bg-white"
          >
            {[0.75, 1, 1.25, 1.5].map((r) => (
              <option key={r} value={r}>
                {r}×
              </option>
            ))}
          </select>
        </label>
      </div>
      <p className="text-gray-600 mt-2">{t.listenHint}</p>
    </div>
  );
};

export default ReadAloud;
