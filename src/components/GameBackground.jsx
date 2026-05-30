import { useEffect, useState } from "react";

import DEFAULT_BG from "../assets/game-background.png";

const OVERLAY_OPACITY = 0.75;

export default function GameBackground({ children, imageSrc, className = "" }) {
  const src = imageSrc || DEFAULT_BG;
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const img = new Image();
    img.src = src;
    img.onload = () => setLoaded(true);
  }, [src]);

  return (
    <div
      className={`game-bg ${className}`}
      style={{ position: "relative", minHeight: "100vh" }}
    >
      {/* Background layer */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 0,
          transition: "opacity 0.6s ease",
          opacity: loaded ? 1 : 0,
        }}
      >
        {/* Imagen */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `url(${src})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
        />
        {/* Overlay para legibilidad */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `rgba(10, 5, 30, ${OVERLAY_OPACITY})`,
          }}
        />
        {/* Viñeta sutil */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.4) 100%)",
          }}
        />
      </div>

      {/* Fallback mientras carga */}
      {!loaded && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 0,
            background:
              "linear-gradient(155deg, #4C1D95 0%, #1E1B4B 60%, #0F0A2E 100%)",
          }}
        />
      )}

      {/* Content */}
      <div style={{ position: "relative", zIndex: 1 }}>{children}</div>
    </div>
  );
}
