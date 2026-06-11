import { useState, useCallback } from "react";
import { Play, Settings, Users, Copy, Check, Zap, Star } from "lucide-react";
import { ScreenWrapper, Avatar } from "./Layout.jsx";
import GameConfigModal from "./GameConfigModal.jsx";
import { PLAYER_ROLE } from "../constants/game.js";
import { assignAvatars } from "../assets/avatars.js";
import { useTranslation } from "../i18n/useTranslation.js";
import useConfigChange from "../hooks/useConfigChange.js";

/* ─── RoomCodeBox ─────────────────────────────────────────────────────────── */
function RoomCodeBox({ roomCode, t }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(roomCode);
    } catch (_) {
      const el = document.createElement("textarea");
      el.value = roomCode;
      el.style.cssText = "position:fixed;opacity:0";
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [roomCode]);

  return (
    <div
      style={{
        background: "var(--c-gold-bg)",
        border: "1.5px solid var(--c-gold-border)",
        borderRadius: "var(--r-xl)",
        padding: "16px 18px",
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      <div
        className="t-label"
        style={{ color: "var(--c-gold)", textAlign: "center" }}
      >
        {t("lobby.roomCodeLabel")}
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 14,
        }}
      >
        <div style={{ display: "flex", gap: 6 }}>
          {roomCode.split("").map((char, i) => (
            <div
              key={i}
              style={{
                width: 38,
                height: 46,
                background: "rgba(245,158,11,0.15)",
                border: "2px solid rgba(245,158,11,0.35)",
                borderRadius: 10,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "var(--font-display)",
                fontSize: 24,
                color: "var(--c-gold)",
                boxShadow: "0 3px 0 rgba(146,64,14,0.4)",
                animation: `charPop 0.3s cubic-bezier(0.34,1.56,0.64,1) ${i * 55}ms both`,
              }}
            >
              {char}
            </div>
          ))}
        </div>

        <button
          onClick={handleCopy}
          title="Copiar código"
          style={{
            background: copied
              ? "rgba(16,185,129,0.2)"
              : "rgba(245,158,11,0.15)",
            border: `1.5px solid ${copied ? "rgba(16,185,129,0.45)" : "rgba(245,158,11,0.35)"}`,
            borderRadius: 12,
            padding: "10px 12px",
            cursor: "pointer",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 4,
            transition: "all 0.2s ease",
            flexShrink: 0,
          }}
        >
          {copied ? (
            <Check size={18} color="#10B981" />
          ) : (
            <Copy size={18} color="var(--c-gold)" />
          )}
          <span
            style={{
              fontSize: 9,
              fontWeight: 800,
              letterSpacing: 0.5,
              textTransform: "uppercase",
              color: copied ? "#10B981" : "var(--c-gold)",
              transition: "color 0.2s",
            }}
          >
            {copied ? "¡Listo!" : "Copiar"}
          </span>
        </button>
      </div>

      <p
        style={{
          textAlign: "center",
          fontSize: 11,
          fontWeight: 700,
          color: "rgba(245,158,11,0.55)",
        }}
      >
        Comparte este código con tus amigos
      </p>

      <style>{`
        @keyframes charPop {
          0%   { opacity:0; transform:scale(0.6) translateY(8px); }
          70%  { transform:scale(1.08) translateY(-2px); }
          100% { opacity:1; transform:scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}

/* ─── ConfigPills ─────────────────────────────────────────────────────────── */
function ConfigPills({ cfg, isAdmin, onOpenConfig, t, changedKeys }) {
  const isCustom = cfg.mode === "custom";
  const penaltyOn = cfg.penaltyEnabled;
  const customPts = cfg.customPointsEnabled;

  // Cada pill lleva su key de config asociada para saber si animarla
  const pills = [
    {
      label: `${cfg.rounds} rondas`,
      color: "gold",
      configKey: "rounds",
    },
    {
      label: isCustom ? "✏️ Custom" : "🎲 Genérico",
      color: "purple",
      configKey: "mode",
    },
    {
      label: customPts
        ? "Pts por pregunta"
        : `+${cfg.pointsPerAnswer} por acierto`,
      color: "purple",
      configKey: customPts ? "customPointsEnabled" : "pointsPerAnswer",
    },
    penaltyOn && {
      label: "⚡ Castigo activo",
      color: "red",
      configKey: "penaltyEnabled",
    },
  ].filter(Boolean);

  const pillStyle = (color) =>
    ({
      gold: {
        background: "rgba(245,158,11,0.12)",
        border: "1px solid rgba(245,158,11,0.28)",
        color: "var(--c-gold)",
      },
      purple: {
        background: "rgba(109,40,217,0.2)",
        border: "1px solid rgba(139,92,246,0.32)",
        color: "#C4B5FD",
      },
      red: {
        background: "rgba(239,68,68,0.12)",
        border: "1px solid rgba(239,68,68,0.28)",
        color: "#FCA5A5",
      },
    })[color];

  return (
    <>
      {/* Estilos de animación inline — solo se inyectan una vez */}
      <style>{`
        @keyframes pillPop {
          0%   { transform: scale(1); }
          30%  { transform: scale(1.18); }
          60%  { transform: scale(0.95); }
          100% { transform: scale(1); }
        }
        @keyframes pillGlow {
          0%, 100% { box-shadow: none; }
          50%      { box-shadow: 0 0 8px 2px rgba(245,158,11,0.55); }
        }
        .pill-changed {
          animation: pillPop 0.35s cubic-bezier(0.34,1.56,0.64,1) both,
                     pillGlow 0.9s ease 0.1s;
        }
      `}</style>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
        }}
      >
        {/* Pills */}
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap", flex: 1 }}>
          {pills.map((p, i) => {
            const changed = changedKeys.has(p.configKey);
            return (
              <span
                key={i}
                className={changed ? "pill-changed" : ""}
                style={{
                  ...pillStyle(p.color),
                  borderRadius: 999,
                  padding: "4px 9px",
                  fontSize: 11,
                  fontWeight: 800,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  whiteSpace: "nowrap",
                  position: "relative",
                  transition: "border-color 0.2s",
                  // borde más brillante mientras está animando
                  ...(changed &&
                    p.color === "gold" && {
                      border: "1px solid rgba(245,158,11,0.7)",
                    }),
                  ...(changed &&
                    p.color === "purple" && {
                      border: "1px solid rgba(139,92,246,0.7)",
                    }),
                  ...(changed &&
                    p.color === "red" && {
                      border: "1px solid rgba(239,68,68,0.7)",
                    }),
                }}
              >
                {/* Punto indicador de cambio */}
                {changed && (
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background:
                        p.color === "gold"
                          ? "var(--c-gold)"
                          : p.color === "red"
                            ? "#EF4444"
                            : "#A78BFA",
                      flexShrink: 0,
                      boxShadow: "0 0 4px currentColor",
                    }}
                  />
                )}
                {p.label}
              </span>
            );
          })}
        </div>

        {/* Botón config solo para admin */}
        {isAdmin && (
          <button
            className="btn btn-ghost btn-sm"
            style={{
              width: "auto",
              gap: 5,
              fontSize: 11,
              padding: "5px 10px",
              flexShrink: 0,
            }}
            onClick={onOpenConfig}
          >
            <Settings size={11} /> {t("lobby.configButton")}
          </button>
        )}
      </div>
    </>
  );
}

/* ─── LobbyScreen ─────────────────────────────────────────────────────────── */
export default function LobbyScreen({
  roomCode,
  playerRole,
  currentRoom,
  startGame,
  gameConfig,
  setGameConfig,
  updateRoomConfig,
  resetGame,
}) {
  const [showConfig, setShowConfig] = useState(false);
  const { t } = useTranslation();

  const isAdmin = playerRole === PLAYER_ROLE.ADMIN;
  const aspirants = currentRoom?.aspirants || [];
  const everyone = [currentRoom?.admin, ...aspirants].filter(Boolean);
  const avatarMap = assignAvatars(everyone);
  const cfg = currentRoom?.config ?? gameConfig;

  const changedKeys = useConfigChange(cfg);

  async function handleConfigSave(newConfig) {
    setGameConfig(newConfig);
    await updateRoomConfig(newConfig);
    setShowConfig(false);
  }

  return (
    <ScreenWrapper withBg onExit={resetGame} exitLabel={t("lobby.exitLabel")}>
      {showConfig && (
        <GameConfigModal
          config={currentRoom?.config ?? gameConfig}
          onClose={() => setShowConfig(false)}
          onSave={handleConfigSave}
        />
      )}

      {/* Código de sala */}
      <RoomCodeBox roomCode={roomCode} t={t} />

      {/* Admin + config en una sola fila */}
      <div
        className="glass"
        style={{ display: "flex", flexDirection: "column", gap: 10 }}
      >
        {/* Fila admin */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Avatar avatar={avatarMap[currentRoom?.admin?.id]} size="sm" crown />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="t-label">{t("lobby.adminLabel")}</div>
            <div
              style={{
                fontWeight: 800,
                color: "#fff",
                fontSize: 14,
                marginTop: 1,
              }}
              className="truncate"
            >
              {currentRoom?.admin?.name}
            </div>
          </div>
        </div>

        {/* Separador */}
        <div style={{ height: 1, background: "var(--c-w12)" }} />

        {/* Pills de configuración */}
        <ConfigPills
          cfg={cfg}
          isAdmin={isAdmin}
          onOpenConfig={() => setShowConfig(true)}
          t={t}
          changedKeys={changedKeys}
        />
      </div>

      {/* Jugadores */}
      <div className="glass">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 12,
          }}
        >
          <Users size={14} color="var(--c-w45)" />
          <span className="t-label">
            {t("lobby.playersLabel")} ({aspirants.length})
          </span>
        </div>

        {aspirants.length === 0 ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 8,
              padding: "12px 0",
            }}
          >
            <div style={{ fontSize: 28 }}>👋</div>
            <p
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: "var(--c-w45)",
                textAlign: "center",
              }}
            >
              {t("lobby.waitingPlayers")}
            </p>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: 8,
            }}
          >
            {aspirants.map((player, idx) => (
              <div
                key={player.id}
                className="anim-slide"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid var(--c-w12)",
                  borderRadius: "var(--r-md)",
                  padding: "9px 10px",
                  animationDelay: `${idx * 50}ms`,
                  minWidth: 0,
                }}
              >
                <Avatar avatar={avatarMap[player.id]} size="sm" />
                <div style={{ minWidth: 0 }}>
                  <div
                    className="truncate"
                    style={{ fontSize: 13, fontWeight: 800, color: "#fff" }}
                  >
                    {player.name}
                  </div>
                  <div
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: "var(--c-w45)",
                    }}
                  >
                    {t("lobby.playerRole")}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CTA */}
      {isAdmin ? (
        <button
          className="btn btn-green"
          onClick={startGame}
          disabled={!aspirants.length}
          style={{ fontSize: 16 }}
        >
          <Play size={18} /> {t("lobby.startGame")}
        </button>
      ) : (
        <p
          style={{
            textAlign: "center",
            fontSize: 13,
            fontWeight: 700,
            color: "var(--c-w45)",
            padding: "4px 0",
          }}
        >
          {t("lobby.waitingAdmin")}
        </p>
      )}
    </ScreenWrapper>
  );
}
