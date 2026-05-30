import { Play } from "lucide-react";
import Avatar from "./Avatar";
import GameBackground from "./GameBackground";
import { PLAYER_ROLE } from "../constants/game.js";
import { getEveryone } from "../utils/room.js";
import { assignAvatars } from "../assets/avatars.js";

export default function KingRevealScreen({
  currentRoom,
  playerRole,
  playerName,
  confirmKingAndStart,
}) {
  const king = currentRoom?.king;
  const isAdmin =
    playerRole === PLAYER_ROLE.ADMIN || playerRole === PLAYER_ROLE.ADMIN_KING;
  const isKing = king?.name === playerName;

  const everyone = getEveryone(currentRoom);
  const avatarMap = assignAvatars(everyone);
  const kingAvatar = avatarMap[king?.id];

  return (
    <GameBackground>
      <div className="screen" style={{ justifyContent: "center" }}>
        <div
          className="screen-content"
          style={{
            justifyContent: "center",
            alignItems: "center",
            textAlign: "center",
          }}
        >
          {/* Crown animation */}
          <div
            className="anim-float"
            style={{ fontSize: 60, marginBottom: -8 }}
          >
            👑
          </div>

          {/* King avatar */}
          <div
            className="anim-pop"
            style={{ display: "flex", justifyContent: "center" }}
          >
            <Avatar avatar={kingAvatar} size="lg" crown />
          </div>

          <div>
            <p
              style={{
                color: "rgba(255,255,255,0.55)",
                fontWeight: 800,
                fontSize: 12,
                letterSpacing: 2,
                textTransform: "uppercase",
                marginBottom: 6,
              }}
            >
              El Líder es
            </p>
            <h2
              className="text-display"
              style={{
                fontSize: 38,
                color: "#fff",
                textShadow: "0 5px 0 rgba(0,0,0,0.25)",
              }}
            >
              {king?.name}
            </h2>
          </div>

          {isKing ? (
            <div
              style={{
                background: "rgba(245,158,11,0.2)",
                border: "2px solid rgba(245,158,11,0.5)",
                borderRadius: 16,
                padding: "14px 20px",
                width: "100%",
              }}
            >
              <p style={{ color: "#FDE68A", fontWeight: 800, fontSize: 15 }}>
                ¡Eres el Líder! Las preguntas son sobre ti 👑
              </p>
            </div>
          ) : (
            <div
              style={{
                background: "rgba(255,255,255,0.1)",
                border: "1.5px solid rgba(255,255,255,0.2)",
                borderRadius: 16,
                padding: "14px 20px",
                width: "100%",
              }}
            >
              <p
                style={{
                  color: "rgba(255,255,255,0.8)",
                  fontWeight: 700,
                  fontSize: 14,
                }}
              >
                Las preguntas serán sobre{" "}
                <strong style={{ color: "#fff" }}>{king?.name}</strong>
              </p>
            </div>
          )}

          {isAdmin ? (
            <button
              className="btn btn-green"
              onClick={confirmKingAndStart}
              style={{ fontSize: 17, width: "100%" }}
            >
              <Play size={20} />
              Iniciar Partida
            </button>
          ) : (
            <p
              style={{
                color: "rgba(255,255,255,0.45)",
                fontWeight: 700,
                fontSize: 14,
              }}
            >
              Esperando que el administrador inicie...
            </p>
          )}
        </div>
      </div>
    </GameBackground>
  );
}
