import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import es from "./es.json";
import en from "./en.json";

const LOCALES = { es, en };
const STORAGE_KEY = "vr_lang";

const questionsCache = {};

async function preloadQuestions(lang) {
  const key = `module:${lang}`;
  if (questionsCache[key]) return;
  try {
    const mod =
      lang === "en"
        ? await import("../assets/questions_en.json")
        : await import("../assets/questions_es.json");
    questionsCache[key] = mod.default;
  } catch (err) {
    console.warn("preloadQuestions error:", err);
  }
}

export async function loadQuestions(lang, categoryIds = ["genericas"]) {
  const key = lang in LOCALES ? lang : "es";
  const moduleKey = `module:${key}`;

  if (!questionsCache[moduleKey]) {
    await preloadQuestions(key);
  }

  const allData = questionsCache[moduleKey] ?? {};

  const combined = categoryIds.flatMap((catId) => {
    const cacheKey = `${key}:${catId}`;
    if (!questionsCache[cacheKey]) {
      questionsCache[cacheKey] = allData[catId] ?? [];
    }
    return questionsCache[cacheKey];
  });

  const seen = new Set();
  const deduped = combined.filter((q) => {
    const id = String(q.id);
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });

  return deduped;
}

export const QUESTIONS = {};

function getInitialLang() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && LOCALES[saved]) return saved;
  } catch (_) {}
  const browser = navigator.language?.slice(0, 2).toLowerCase();
  return LOCALES[browser] ? browser : "es";
}

export const I18nContext = createContext(null);

export function I18nProvider({ children }) {
  const [lang, setLangState] = useState(getInitialLang);

  useEffect(() => {
    preloadQuestions(lang);
  }, [lang]);
  // ──────────────────────────────────────────────────────────────────

  const setLang = useCallback((newLang) => {
    if (!LOCALES[newLang]) return;
    setLangState(newLang);
    try {
      localStorage.setItem(STORAGE_KEY, newLang);
    } catch (_) {}
  }, []);

  const t = useCallback(
    (key, vars = {}) => {
      const parts = key.split(".");
      let value = LOCALES[lang];
      for (const part of parts) {
        value = value?.[part];
        if (value === undefined) {
          let fallback = LOCALES["es"];
          for (const p of parts) fallback = fallback?.[p];
          value = fallback ?? key;
          break;
        }
      }
      if (typeof value !== "string") return key;
      return value.replace(/\{(\w+)\}/g, (_, k) =>
        vars[k] !== undefined ? String(vars[k]) : `{${k}}`,
      );
    },
    [lang],
  );

  return (
    <I18nContext.Provider
      value={{
        lang,
        setLang,
        t,
        availableLangs: Object.keys(LOCALES),
      }}
    >
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside <I18nProvider>");
  return ctx;
}
