/**
 * AdBanner — espacio publicitario.
 * slot: "top" | "bottom"
 * onDark: true cuando el fondo es oscuro (lobby/partida), false en menú
 */
export default function AdBanner({ slot = "bottom", onDark = false }) {
  return (
    <div
      className={`ad-banner ${onDark ? "" : "ad-banner-inner"}`}
      style={{ width: "100%", padding: "6px" }}
      aria-label="Espacio publicitario"
    >
      {/* Coloca aquí tu código de publicidad */}
      <span>Publicidad</span>
    </div>
  );
}
