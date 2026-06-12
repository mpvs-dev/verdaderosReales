import { Users } from "lucide-react";

export default function EmptyRoomBanner({ visible }) {
  if (!visible) return null;

  return (
    <div
      className="anim-slide"
      style={{
        position: "fixed",
        bottom: 24,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 50,
        width: "calc(100% - 32px)",
        maxWidth: 400,
        background: "rgba(109,40,217,0.25)",
        border: "1.5px solid rgba(139,92,246,0.45)",
        borderRadius: "var(--r-lg)",
        padding: "12px 16px",
        display: "flex",
        alignItems: "center",
        gap: 12,
        backdropFilter: "blur(10px)",
        boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          background: "rgba(109,40,217,0.4)",
          border: "1.5px solid rgba(139,92,246,0.4)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Users size={18} color="#A78BFA" />
      </div>
      <div>
        <p
          style={{
            fontSize: 13,
            fontWeight: 800,
            color: "#fff",
            marginBottom: 2,
          }}
        >
          No hay jugadores en la sala
        </p>
        <p
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: "rgba(255,255,255,0.45)",
          }}
        >
          Comparte el código para que otros puedan unirse
        </p>
      </div>
    </div>
  );
}
