import { useEffect, useState } from "react";
import { getAvatar } from "../assets/avatars.js";
import ExitButton from "./ExitButton.jsx";
import DEFAULT_BG from "../assets/game-background.png";

let bgLoaded = false;
const bgImage = new Image();
bgImage.onload = () => { bgLoaded = true; };
bgImage.src = DEFAULT_BG;
const OVERLAY_OPACITY = 0.58;

/* ─── GameBackground ────────────────────────────────────────────────────── */
export function GameBackground({ children, imageSrc }) {
  const src = imageSrc || DEFAULT_BG;
  const [loaded, setLoaded] = useState(src === DEFAULT_BG ? bgLoaded : false);

  useEffect(() => {
    if (loaded) return;

    if (src !== DEFAULT_BG) {
      const img = new Image();
      img.onload = () => setLoaded(true);
      img.src = src;
    } else {
      if (bgLoaded) setLoaded(true);
      else bgImage.addEventListener("load", () => setLoaded(true), { once: true });
    }
  }, [src, loaded]);

  return (
    <div
      className="game-bg"
      style={{ position: "relative", minHeight: "100vh" }}
    >
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 0,
          opacity: loaded ? 1 : 0,
          transition: "opacity 0.5s ease",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `url(${src})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `rgba(8,2,22,${OVERLAY_OPACITY})`,
          }}
        />
      </div>
      {!loaded && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 0,
            background:
              "radial-gradient(ellipse at 30% 60%, #3B0764 0%, #1a0a3e 50%, #0f0520 100%)",
          }}
        />
      )}
      <div style={{ position: "relative", zIndex: 1 }}>{children}</div>
    </div>
  );
}

/* ─── Credits ───────────────────────────────────────────────────────────── */
export function Credits({ LanguageSwitcherComponent }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 8,
        flexShrink: 0,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        {/* Ko-fi oficial */}
        <a
          href="https://ko-fi.com/A5N820C8X8"
          target="_blank"
          rel="noopener noreferrer"
          style={{ display: "inline-flex", lineHeight: 0, border: 0 }}
        >
          <img
            height="28"
            style={{
              border: "0px",
              height: "28px",
              borderRadius: 6,
              display: "block",
            }}
            src="https://storage.ko-fi.com/cdn/kofi3.png?v=6"
            alt="Buy Me a Coffee at ko-fi.com"
          />
        </a>

        {/* Separador */}
        <span style={{ color: "rgba(255,255,255,0.15)", fontSize: 12 }}>·</span>

        {/* Versión + licencia */}
        <a
          href="https://mpvs.online"
          target="_blank"
          rel="noopener noreferrer"
          // AGREGAMOS ESTOS DOS EVENTOS:
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          style={{
            fontSize: 10,
            fontWeight: 600,
            textDecoration: "none",
            transition: "all 0.2s ease",
            cursor: "pointer",
            color: isHovered
              ? "rgba(255, 255, 255, 0.8)"
              : "rgba(255, 255, 255, 0.18)",
          }}
        >
          © 2026 MPVs
        </a>

        {/* Separador */}
        <span style={{ color: "rgba(255,255,255,0.15)", fontSize: 12 }}>·</span>

        {/* Selector de idioma inyectado */}
        {LanguageSwitcherComponent}
      </div>
    </div>
  );
}

/* ─── Avatar ────────────────────────────────────────────────────────────── */
export function Avatar({
  index,
  avatar: avatarProp,
  size = "md",
  crown = false,
  pulse = false,
  style: extraStyle = {},
}) {
  const av = avatarProp ?? getAvatar(index ?? 0);
  return (
    <div
      style={{
        position: "relative",
        display: "inline-flex",
        flexShrink: 0,
        ...extraStyle,
      }}
    >
      <div
        className={`avatar avatar-${size} ${pulse ? "anim-float" : ""}`}
        style={{ background: av.bg }}
      >
        {av.img ? (
          <img src={av.img} alt={av.name ?? "avatar"} />
        ) : (
          <span style={{ lineHeight: 1 }}>{av.emoji}</span>
        )}
      </div>
      {crown && (
        <span
          style={{
            position: "absolute",
            top: size === "lg" ? -12 : -9,
            left: "50%",
            transform: "translateX(-50%)",
            fontSize: size === "lg" ? 20 : 14,
            lineHeight: 1,
            filter: "drop-shadow(0 2px 3px rgba(0,0,0,0.4))",
          }}
        >
          👑
        </span>
      )}
    </div>
  );
}

/* ─── ScreenWrapper ─────────────────────────────────────────────────────── */
export function ScreenWrapper({ children, withBg = false, onExit, exitLabel }) {
  const content = (
    <div
      style={{
        minHeight: "100vh",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      {onExit && <ExitButton onConfirm={onExit} label={exitLabel} />}

      {/* Contenido principal */}
      <div
        style={{
          flex: 1,
          width: "100%",
          maxWidth: 480,
          padding: "16px 16px 0",
          display: "flex",
          flexDirection: "column",
          gap: 14,
        }}
      >
        {children}
      </div>

      {/* Créditos (sin selector de idioma en pantallas de juego) */}
      <div
        style={{
          width: "100%",
          maxWidth: 480,
          padding: "12px 16px 20px",
          flexShrink: 0,
        }}
      >
        <Credits />
      </div>
    </div>
  );

  return withBg ? <GameBackground>{content}</GameBackground> : content;
}
