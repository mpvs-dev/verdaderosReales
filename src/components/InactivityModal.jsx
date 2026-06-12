import { Clock, X } from "lucide-react";
import { INACTIVITY_MS } from "../constants/game";

export default function InactivityModal({ visible, onClose, onEndRoom }) {
  if (!visible) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 60,
        background: "rgba(0,0,0,0.75)",
        backdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      <div
        className="anim-pop"
        style={{
          width: "100%",
          maxWidth: 340,
          background: "#16082e",
          border: "1.5px solid rgba(245,158,11,0.35)",
          borderRadius: 20,
          padding: 22,
          display: "flex",
          flexDirection: "column",
          gap: 16,
          boxShadow: "0 20px 50px rgba(0,0,0,0.6)",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: "rgba(245,158,11,0.15)",
              border: "1.5px solid rgba(245,158,11,0.35)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Clock size={18} color="#F59E0B" />
          </div>
          <span style={{ fontSize: 17, fontWeight: 800, color: "#fff" }}>
            Sala inactiva
          </span>
        </div>

        {/* Mensaje */}
        <p
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: "rgba(255,255,255,0.55)",
            lineHeight: 1.5,
          }}
        >
          Llevas {INACTIVITY_MS} minutos sin actividad en la sala. ¿Quieres
          cerrarla o seguir esperando?
        </p>

        {/* Acciones */}
        <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
          <button
            className="btn btn-ghost"
            onClick={onClose}
            style={{ fontSize: 14 }}
          >
            Seguir esperando
          </button>
          <button
            className="btn btn-red"
            onClick={onEndRoom}
            style={{ fontSize: 15 }}
          >
            <X size={16} /> Cerrar sala
          </button>
        </div>
      </div>
    </div>
  );
}
