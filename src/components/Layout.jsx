import { useEffect, useState } from "react";
import { getAvatar } from "../assets/avatars.js";
import ExitButton from "./ExitButton.jsx";

/*
  GameBackground — lobby + partida (no menú)

  Cómo cambiar la imagen:
    A) Reemplaza /src/assets/game-background.png  ← más fácil
    B) Edita --bg-game en game.css
    C) Pasa prop imageSrc="..." al componente

  OVERLAY_OPACITY: 0 = sin oscurecer | 1 = negro total
*/
const OVERLAY_OPACITY = 0.58;

import DEFAULT_BG from "../assets/game-background.png";

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
export function AdBanner({ slot = "bottom" }) {
  return (
    <div className="ad-wrap" style={{ paddingBottom: slot === "bottom" ? 10 : 0 }}>
      <div className="ad-banner">
        {/* Coloca aquí tu código de publicidad */}
        <span>Publicidad</span>
      </div>
    </div>
  );
}

/* ─── Avatar ────────────────────────────────────────────────────────────── */
export function Avatar({ index, avatar: avatarProp, size = "md", crown = false, pulse = false, style: extraStyle = {} }) {
  const av = avatarProp ?? getAvatar(index ?? 0);
  return (
    <div style={{ position: "relative", display: "inline-flex", flexShrink: 0, ...extraStyle }}>
      <div
        className={`avatar avatar-${size} ${pulse ? "anim-float" : ""}`}
        style={{ background: av.bg }}
      >
        {av.img
          ? <img src={av.img} alt={av.name ?? "avatar"} />
          : <span style={{ lineHeight: 1 }}>{av.emoji}</span>}
      </div>
      {crown && (
        <span style={{
          position: "absolute",
          top: size === "lg" ? -12 : -9,
          left: "50%", transform: "translateX(-50%)",
          fontSize: size === "lg" ? 20 : 14, lineHeight: 1,
          filter: "drop-shadow(0 2px 3px rgba(0,0,0,0.4))",
        }}>👑</span>
      )}
    </div>
  );
}

/* ─── ScreenWrapper ─────────────────────────────────────────────────────────
   withBg    → aplica GameBackground (lobby + partida)
   onExit    → si se pasa, muestra el botón flotante de salida
   exitLabel → texto personalizado del botón (opcional)
   ─────────────────────────────────────────────────────────────────────────── */
export function ScreenWrapper({ children, withBg = false, onExit, exitLabel }) {
  const content = (
    <div className="screen">
      {onExit && <ExitButton onConfirm={onExit} label={exitLabel} />}
      <AdBanner slot="top" />
      <div className="screen-inner">{children}</div>
      <AdBanner slot="bottom" />
    </div>
  );
  return withBg ? <GameBackground>{content}</GameBackground> : content;
}
