import { Crown, LogIn } from "lucide-react";
import { ScreenWrapper } from "./Layout.jsx";

export default function MenuScreen({ playerName, setPlayerName, roomCode, setRoomCode, createRoom, joinRoom, loading }) {
  return (
    <div className="screen" style={{
      background: "radial-gradient(ellipse at 30% 60%, #3B0764 0%, #1a0a3e 50%, #0f0520 100%)",
      minHeight: "100vh",
    }}>
      {/* Top ad */}
      <div style={{ width: "100%", maxWidth: 480, padding: "10px 16px 0" }}>
        <div className="ad-banner"><span>Publicidad</span></div>
      </div>

      <div className="screen-inner" style={{ justifyContent: "center", flex: 1 }}>

        {/* Logo */}
        <div style={{ textAlign: "center", paddingBottom: 8 }}>
          <div className="anim-float" style={{ fontSize: 52, display: "inline-block", marginBottom: 8 }}>
            👑
          </div>
          <h1 className="t-display" style={{ fontSize: 36, color: "#fff", textShadow: "0 4px 0 rgba(0,0,0,0.3)", marginBottom: 6 }}>
            Verdaderos <span style={{ color: "var(--c-gold)" }}>Reales</span>
          </h1>
          <p style={{ fontSize: 13, fontWeight: 700, color: "var(--c-w45)" }}>
            ¿Qué tan bien te conocen tus amigos?
          </p>
        </div>

        {/* Form */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div>
            <label className="t-label" style={{ display: "block", marginBottom: 6 }}>Tu nombre</label>
            <input
              className="input"
              type="text"
              placeholder="Escribe tu nombre..."
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              maxLength={20}
            />
          </div>

          <button
            className="btn btn-gold"
            onClick={createRoom}
            disabled={loading || !playerName.trim()}
          >
            <Crown size={17} />
            Crear Sala
          </button>

          <div className="divider">o únete con un código</div>

          <div>
            <label className="t-label" style={{ display: "block", marginBottom: 6 }}>Código de sala</label>
            <input
              className="input"
              type="text"
              placeholder="ABC12X"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              maxLength={6}
              style={{ letterSpacing: 5, textAlign: "center", fontSize: 20, fontFamily: "var(--font-display)" }}
            />
          </div>

          <button
            className="btn btn-ghost"
            onClick={joinRoom}
            disabled={loading || !playerName.trim() || !roomCode.trim()}
          >
            <LogIn size={17} />
            Unirse a la Sala
          </button>
        </div>
      </div>

      {/* Bottom ad */}
      <div style={{ width: "100%", maxWidth: 480, padding: "0 16px 16px" }}>
        <div className="ad-banner"><span>Publicidad</span></div>
      </div>
    </div>
  );
}
