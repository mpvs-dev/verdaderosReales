import { useState } from "react";
import { Play, Settings, Users } from "lucide-react";
import { ScreenWrapper, Avatar } from "./Layout.jsx";
import GameConfigModal from "./GameConfigModal.jsx";
import { PLAYER_ROLE } from "../constants/game.js";
import { assignAvatars } from "../assets/avatars.js";
import { useTranslation } from "../i18n/useTranslation.js";

export default function LobbyScreen({ roomCode, playerRole, currentRoom, startGame, gameConfig, setGameConfig, updateRoomConfig, resetGame }) {
  const [showConfig, setShowConfig] = useState(false);
  const { t } = useTranslation();

  const isAdmin   = playerRole === PLAYER_ROLE.ADMIN;
  const aspirants = currentRoom?.aspirants || [];
  const everyone  = [currentRoom?.admin, ...aspirants].filter(Boolean);
  const avatarMap = assignAvatars(everyone);
  const cfg       = currentRoom?.config ?? gameConfig;

  async function handleConfigSave(newConfig) {
    setGameConfig(newConfig);
    await updateRoomConfig(newConfig);
    setShowConfig(false);
  }

  return (
    <ScreenWrapper withBg onExit={resetGame} exitLabel={t("lobby.exitLabel")}>
      {showConfig && (
        <GameConfigModal config={gameConfig} onClose={() => setShowConfig(false)} onSave={handleConfigSave} />
      )}

      {/* Room code */}
      <div className="room-code-box">
        <div className="t-label" style={{ marginBottom: 4 }}>{t("lobby.roomCodeLabel")}</div>
        <div className="room-code">{roomCode}</div>
      </div>

      {/* Admin row */}
      <div className="glass" style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <Avatar avatar={avatarMap[currentRoom?.admin?.id]} size="sm" crown />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="t-label">{t("lobby.adminLabel")}</div>
          <div style={{ fontWeight: 800, color: "#fff", fontSize: 15, marginTop: 2 }} className="truncate">
            {currentRoom?.admin?.name}
          </div>
        </div>
        {isAdmin && (
          <button className="btn btn-ghost btn-sm" style={{ width: "auto", gap: 5 }} onClick={() => setShowConfig(true)}>
            <Settings size={13} /> {t("lobby.configButton")}
          </button>
        )}
      </div>

      {/* Config summary */}
      <div className="glass-gold" style={{ display: "flex" }}>
        {[
          { val: cfg.rounds,                                                    label: t("lobby.rounds")         },
          { val: cfg.pointsPerAnswer,                                           label: t("lobby.pointsPerAnswer") },
          { val: cfg.mode === "custom" ? t("lobby.modeCustom") : t("lobby.modeGeneric"), label: t("lobby.mode"), small: true },
        ].map(({ val, label, small }, i, arr) => (
          <div key={label} style={{
            flex: 1, textAlign: "center",
            borderRight: i < arr.length - 1 ? "1px solid var(--c-gold-border)" : "none",
          }}>
            <div className="t-display" style={{ fontSize: small ? 14 : 22, color: "var(--c-gold)", paddingTop: small ? 3 : 0 }}>{val}</div>
            <div className="t-label" style={{ marginTop: 2 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Players */}
      <div className="glass">
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <Users size={14} color="var(--c-w45)" />
          <span className="t-label">{t("lobby.playersLabel")} ({aspirants.length})</span>
        </div>

        {aspirants.length === 0 ? (
          <p style={{ fontSize: 13, fontWeight: 700, color: "var(--c-w45)", textAlign: "center", padding: "8px 0" }}>
            {t("lobby.waitingPlayers")}
          </p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
            {aspirants.map((player, idx) => (
              <div key={player.id} className="anim-slide" style={{
                display: "flex", alignItems: "center", gap: 8,
                background: "rgba(255,255,255,0.06)", border: "1px solid var(--c-w12)",
                borderRadius: "var(--r-md)", padding: "9px 10px",
                animationDelay: `${idx * 50}ms`, minWidth: 0,
              }}>
                <Avatar avatar={avatarMap[player.id]} size="sm" />
                <div style={{ minWidth: 0 }}>
                  <div className="truncate" style={{ fontSize: 13, fontWeight: 800, color: "#fff" }}>{player.name}</div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "var(--c-w45)" }}>{t("lobby.playerRole")}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CTA */}
      {isAdmin ? (
        <button className="btn btn-green" onClick={startGame} disabled={!aspirants.length} style={{ fontSize: 16 }}>
          <Play size={18} /> {t("lobby.startGame")}
        </button>
      ) : (
        <p style={{ textAlign: "center", fontSize: 13, fontWeight: 700, color: "var(--c-w45)", padding: "4px 0" }}>
          {t("lobby.waitingAdmin")}
        </p>
      )}
    </ScreenWrapper>
  );
}
