import { useI18n } from "../i18n/i18nContext.jsx";

const FLAG = { es: "🇪🇸", en: "🇬🇧" };
const LABEL = { es: "Español", en: "English" };

export default function LanguageSwitcher() {
  const { lang, setLang, availableLangs } = useI18n();

  return (
    <select
      value={lang}
      onChange={(e) => setLang(e.target.value)}
      style={{
        background: "rgba(255,255,255,0.08)",
        border: "1.5px solid rgba(255,255,255,0.15)",
        borderRadius: "var(--r-md)",
        padding: "6px 10px",
        fontFamily: "var(--font-body)",
        fontWeight: 700,
        fontSize: 13,
        color: "rgba(255,255,255,0.65)",
        cursor: "pointer",
        outline: "none",
        appearance: "none",
        WebkitAppearance: "none",
        paddingRight: 28,
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='rgba(255,255,255,0.35)'/%3E%3C/svg%3E")`,
        backgroundRepeat: "no-repeat",
        backgroundPosition: "right 10px center",
      }}
    >
      {availableLangs.map((l) => (
        <option
          key={l}
          value={l}
          style={{ background: "#1a0a3e", color: "#fff" }}
        >
          {FLAG[l]} {LABEL[l]}
        </option>
      ))}
    </select>
  );
}
