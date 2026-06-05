import { Crown, LogIn } from "lucide-react";
import LanguageSwitcher from "./LanguageSwitcher.jsx";
import { Credits } from "./Layout.jsx";
import { useTranslation } from "../i18n/useTranslation.js";

export default function MenuScreen({ playerName, setPlayerName, roomCode, setRoomCode, createRoom, joinRoom, loading }) {
  const { t } = useTranslation();

  return (
    <div style={{
      minHeight: "100vh",
      width: "100%",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      background: "radial-gradient(ellipse at 30% 60%, #3B0764 0%, #1a0a3e 50%, #0f0520 100%)",
    }}>
      {/* Contenido principal */}
      <div style={{
        flex: 1,
        width: "100%",
        maxWidth: 480,
        padding: "16px 16px 0",
        display: "flex",
        flexDirection: "column",
        gap: 10,
        justifyContent: "center",
      }}>
        {/* Logo */}
        <div style={{ textAlign: "center", paddingBottom: 8 }}>
          <div className="anim-float" style={{ fontSize: 52, display: "inline-block", marginBottom: 8 }}>👑</div>
          <h1 className="t-display" style={{ fontSize: 36, color: "#fff", textShadow: "0 4px 0 rgba(0,0,0,0.3)", marginBottom: 6 }}>
            {t("menu.title")} <span style={{ color: "var(--c-gold)" }}>{t("menu.titleAccent")}</span>
          </h1>
          <p style={{ fontSize: 13, fontWeight: 700, color: "var(--c-w45)" }}>{t("menu.subtitle")}</p>
        </div>

        {/* Form */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div>
            <label className="t-label" style={{ display: "block", marginBottom: 6 }}>{t("menu.nameLabel")}</label>
            <input className="input" type="text" placeholder={t("menu.namePlaceholder")}
              value={playerName} onChange={(e) => setPlayerName(e.target.value)} maxLength={20} />
          </div>

          <button className="btn btn-gold" onClick={createRoom} disabled={loading || !playerName.trim()}>
            <Crown size={17} />{t("menu.createRoom")}
          </button>

          <div className="divider">{t("menu.orJoinWith")}</div>

          <div>
            <label className="t-label" style={{ display: "block", marginBottom: 6 }}>{t("menu.roomCodeLabel")}</label>
            <input className="input" type="text" placeholder={t("menu.roomCodePlaceholder")}
              value={roomCode} onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              maxLength={6} style={{ letterSpacing: 5, textAlign: "center", fontSize: 20, fontFamily: "var(--font-display)" }} />
          </div>

          <button className="btn btn-ghost" onClick={joinRoom} disabled={loading || !playerName.trim() || !roomCode.trim()}>
            <LogIn size={17} />{t("menu.joinRoom")}
          </button>
        </div>
      </div>

      {/* Footer: ko-fi · versión · idioma en una sola línea */}
      <div style={{ width: "100%", maxWidth: 480, padding: "12px 16px 20px", flexShrink: 0 }}>
        <Credits LanguageSwitcherComponent={<LanguageSwitcher />} />
      </div>
    </div>
  );
}
