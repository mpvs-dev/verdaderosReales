import { useEffect, useState } from "react";
import { getAvatar } from "../assets/avatars.js";
import ExitButton from "./ExitButton.jsx";
import { useTranslation } from "../i18n/useTranslation.js";
import DEFAULT_BG from "../assets/game-background.png";

const OVERLAY_OPACITY = 0.58;

/* ─── GameBackground ────────────────────────────────────────────────────── */
export function GameBackground({ children, imageSrc }) {
  const src = imageSrc || DEFAULT_BG;
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const img = new Image();
    img.src = src;
    img.onload = () => setLoaded(true);
  }, [src]);

  return (
    <div className="game-bg" style={{ position: "relative", minHeight: "100vh" }}>
      <div style={{
        position: "fixed", inset: 0, zIndex: 0,
        opacity: loaded ? 1 : 0, transition: "opacity 0.5s ease",
      }}>
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: `url(${src})`,
          backgroundSize: "cover", backgroundPosition: "center",
        }} />
        <div style={{ position: "absolute", inset: 0, background: `rgba(8,2,22,${OVERLAY_OPACITY})` }} />
      </div>
      {!loaded && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 0,
          background: "radial-gradient(ellipse at 30% 60%, #3B0764 0%, #1a0a3e 50%, #0f0520 100%)",
        }} />
      )}
      <div style={{ position: "relative", zIndex: 1 }}>{children}</div>
    </div>
  );
}

/* ─── AdBanner ──────────────────────────────────────────────────────────── */
export function AdBanner() {
  const { t } = useTranslation();
  return (
    <div style={{
      width: "100%",
      height: 52,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "rgba(255,255,255,0.05)",
      border: "1px dashed rgba(255,255,255,0.13)",
      borderRadius: 12,
      flexShrink: 0,
    }}>
      {/* Coloca aquí tu código de publicidad */}
      <span style={{
        fontSize: 9, fontWeight: 800, letterSpacing: 2,
        textTransform: "uppercase", color: "rgba(255,255,255,0.18)",
      }}>
        {t("common.advertisement")}
      </span>
    </div>
  );
}

/* ─── Credits ───────────────────────────────────────────────────────────── */
export function Credits() {
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 2,
      flexShrink: 0,
    }}>
      <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.25)", letterSpacing: 0.5 }}>
        Verdaderos Reales v1.2
      </span>
      <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.18)" }}>
        © 2026 Paul Diaz · BSL 1.1
      </span>
    </div>
  );
}

/* ─── Avatar ────────────────────────────────────────────────────────────── */
export function Avatar({ index, avatar: avatarProp, size = "md", crown = false, pulse = false, style: extraStyle = {} }) {
  const av = avatarProp ?? getAvatar(index ?? 0);
  return (
    <div style={{ position: "relative", display: "inline-flex", flexShrink: 0, ...extraStyle }}>
      <div className={`avatar avatar-${size} ${pulse ? "anim-float" : ""}`} style={{ background: av.bg }}>
        {av.img
          ? <img src={av.img} alt={av.name ?? "avatar"} />
          : <span style={{ lineHeight: 1 }}>{av.emoji}</span>}
      </div>
      {crown && (
        <span style={{
          position: "absolute", top: size === "lg" ? -12 : -9,
          left: "50%", transform: "translateX(-50%)",
          fontSize: size === "lg" ? 20 : 14, lineHeight: 1,
          filter: "drop-shadow(0 2px 3px rgba(0,0,0,0.4))",
        }}>👑</span>
      )}
    </div>
  );
}

/* ─── ScreenWrapper ─────────────────────────────────────────────────────── */
export function ScreenWrapper({ children, withBg = false, onExit, exitLabel }) {
  const content = (
    <div style={{
      minHeight: "100vh",
      width: "100%",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
    }}>
      {onExit && <ExitButton onConfirm={onExit} label={exitLabel} />}

      {/* AD — siempre arriba */}
      <div style={{
        width: "100%",
        maxWidth: 480,
        padding: "10px 16px 0",
        flexShrink: 0,
      }}>
        <AdBanner />
      </div>

      {/* Contenido principal — crece para ocupar espacio */}
      <div style={{
        flex: 1,
        width: "100%",
        maxWidth: 480,
        padding: "16px 16px 0",
        display: "flex",
        flexDirection: "column",
        gap: 14,
      }}>
        {children}
      </div>

      {/* Créditos — siempre abajo */}
      <div style={{
        width: "100%",
        maxWidth: 480,
        padding: "12px 16px 20px",
        flexShrink: 0,
      }}>
        <Credits />
      </div>
    </div>
  );

  return withBg ? <GameBackground>{content}</GameBackground> : content;
}
