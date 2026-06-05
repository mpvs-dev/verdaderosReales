import { createContext, useContext, useState, useCallback } from "react";
import es from "./es.json";
import en from "./en.json";

const LOCALES = { es, en };
const STORAGE_KEY = "vr_lang";

// Cache de preguntas ya cargadas: { "es:genericas": [...], "en:genericas": [...] }
const questionsCache = {};

/**
 * Carga las preguntas de una o varias categorías para un idioma.
 * @param {string}   lang        - "es" | "en"
 * @param {string[]} categoryIds - categorías seleccionadas, ej: ["genericas", "deportes"]
 * @returns {Promise<object[]>}  - array mezclado de preguntas de todas las categorías pedidas
 */
export async function loadQuestions(lang, categoryIds = ["genericas"]) {
  const key = lang in LOCALES ? lang : "es";

  // Importar el módulo completo una sola vez por idioma
  const moduleKey = `module:${key}`;
  if (!questionsCache[moduleKey]) {
    const mod = key === "en"
      ? await import("../assets/questions_en.json")
      : await import("../assets/questions_es.json");
    questionsCache[moduleKey] = mod.default;
  }

  const allData = questionsCache[moduleKey];

  // Combinar las categorías solicitadas que existan en el JSON
  const combined = categoryIds.flatMap((catId) => {
    const cacheKey = `${key}:${catId}`;
    if (!questionsCache[cacheKey]) {
      questionsCache[cacheKey] = allData[catId] ?? [];
    }
    return questionsCache[cacheKey];
  });

  return combined;
}

// Mantener QUESTIONS vacío por compatibilidad con imports legacy
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

  const setLang = useCallback((newLang) => {
    if (!LOCALES[newLang]) return;
    setLangState(newLang);
    try { localStorage.setItem(STORAGE_KEY, newLang); } catch (_) {}
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
        vars[k] !== undefined ? String(vars[k]) : `{${k}}`
      );
    },
    [lang]
  );

  return (
    <I18nContext.Provider value={{ lang, setLang, t, availableLangs: Object.keys(LOCALES) }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside <I18nProvider>");
  return ctx;
}
