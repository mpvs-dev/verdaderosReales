import Spinner from "./Spinner.jsx";

export default function ReconnectingOverlay({ visible }) {
  if (!visible) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9998,
        background: "rgba(8,2,22,0.85)",
        backdropFilter: "blur(8px)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
      }}
    >
      <div className="anim-float" style={{ fontSize: 48 }}>
        👑
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <Spinner size={20} color="#A78BFA" />
        <p
          style={{
            fontSize: 15,
            fontWeight: 800,
            color: "#fff",
          }}
        >
          Reconectando a la partida...
        </p>
      </div>

      <p
        style={{
          fontSize: 12,
          fontWeight: 700,
          color: "rgba(255,255,255,0.35)",
        }}
      >
        Espera un momento
      </p>
    </div>
  );
}
