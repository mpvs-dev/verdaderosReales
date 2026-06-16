import { useState, useEffect, useRef, useMemo } from "react";
import { Shuffle, Play } from "lucide-react";
import { ScreenWrapper, Avatar } from "./Layout.jsx";
import { PLAYER_ROLE, KING_PICK_ANIMATION } from "../constants/game.js";
import { getEveryone } from "../utils/room.js";
import { assignAvatars } from "../assets/avatars.js";
import { useTranslation } from "../i18n/useTranslation.js";
import storage from "../services/storage.js";

const {
  BASE_STEPS,
  RANDOM_EXTRA_STEPS,
  FAST_DELAY_MS,
  SLOW_DELAY_MULTIPLIER,
  SLOW_START_RATIO,
} = KING_PICK_ANIMATION;

/**
 * FIX: calcula la duración real sumando el delay de cada tick,
 * igual que hace runAnimation. La versión anterior usaba
 * (steps - slow) * steps * MULTIPLIER que sobreestimaba 6-11 s.
 */
function computeRealDuration(totalSteps) {
  const slow = Math.floor(totalSteps * SLOW_START_RATIO);
  let total = 0;
  for (let step = 1; step <= totalSteps; step++) {
    total +=
      step <= slow
        ? FAST_DELAY_MS
        : FAST_DELAY_MS + (step - slow) * SLOW_DELAY_MULTIPLIER;
  }
  return total + 100; // 100 ms de margen mínimo
}

/* ─── KingPickScreen ─────────────────────────────────────────────────────── */
export function KingPickScreen({
  currentRoom,
  playerRole,
  pickKing,
  pickRandomKing,
  roomCode,
  resetGame,
}) {
  const [highlighted, setHighlighted] = useState(null);
  const [winner, setWinner] = useState(null);
  const [spinning, setSpinning] = useState(false);
  const animatingRef = useRef(false);
  const { t } = useTranslation();

  const isAdmin = playerRole === PLAYER_ROLE.ADMIN;
  const everyone = useMemo(
    () => getEveryone(currentRoom),
    [currentRoom.admin, currentRoom.aspirants],
  );
  const avatarMap = useMemo(() => assignAvatars(everyone), [everyone]);
  const everyoneRef = useRef(everyone);
  useEffect(() => {
    everyoneRef.current = everyone;
  }, [everyone]);

  const winnerId = currentRoom?.pickingAnimation?.winnerId;
  useEffect(() => {
    if (isAdmin) return;
    if (!winnerId) return;
    if (animatingRef.current) return;
    const chosen = everyoneRef.current.find((p) => p.id === winnerId);
    // Para aspirantes no conocemos los steps del admin, usamos los por defecto
    if (chosen) runAnimation(chosen);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [winnerId, isAdmin]);

  function runAnimation(chosen, forcedSteps) {
    if (animatingRef.current) return;
    animatingRef.current = true;
    setSpinning(true);
    setWinner(null);

    // FIX: si handleRandom ya calculó los steps, usarlos aquí para que
    // el setTimeout externo y la animación terminen exactamente a la vez
    const totalSteps =
      forcedSteps ??
      BASE_STEPS + Math.floor(Math.random() * RANDOM_EXTRA_STEPS);
    const slow = Math.floor(totalSteps * SLOW_START_RATIO);
    let step = 0;

    function tick() {
      setHighlighted(everyoneRef.current[step % everyoneRef.current.length].id);
      step++;
      const delay =
        step <= slow
          ? FAST_DELAY_MS
          : FAST_DELAY_MS + (step - slow) * SLOW_DELAY_MULTIPLIER;

      if (step < totalSteps) {
        setTimeout(tick, delay);
      } else {
        setHighlighted(chosen.id);
        setWinner(chosen);
        setSpinning(false);
        animatingRef.current = false;
      }
    }
    tick();
  }

  async function handleRandom() {
    if (animatingRef.current) return;
    const chosen =
      everyoneRef.current[
        Math.floor(Math.random() * everyoneRef.current.length)
      ];

    try {
      await storage.set(
        `room_${roomCode}`,
        JSON.stringify({
          ...currentRoom,
          pickingAnimation: { winnerId: chosen.id },
        }),
      );
    } catch (_) {}

    // Calcular cuánto tarda la animación con los steps elegidos al azar
    const totalSteps =
      BASE_STEPS + Math.floor(Math.random() * RANDOM_EXTRA_STEPS);
    const animDuration = computeRealDuration(totalSteps);

    runAnimation(chosen, totalSteps);
    // Llamar a pickRandomKing justo cuando termina la animación (mismos steps)
    setTimeout(() => pickRandomKing(chosen.id), animDuration);
  }

  return (
    <ScreenWrapper withBg onExit={resetGame}>
      <div style={{ textAlign: "center" }}>
        <div
          className="anim-float"
          style={{ fontSize: 44, display: "inline-block", marginBottom: 8 }}
        >
          👑
        </div>
        <h2
          className="t-display"
          style={{ fontSize: 28, color: "#fff", marginBottom: 4 }}
        >
          {t("kingPick.title")}
        </h2>
        <p style={{ fontSize: 13, fontWeight: 700, color: "var(--c-w45)" }}>
          {isAdmin
            ? t("kingPick.subtitleAdmin")
            : t("kingPick.subtitleWaiting", {
                adminName: currentRoom?.admin?.name,
              })}
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: 10,
        }}
      >
        {everyone.map((person) => {
          const hl = highlighted === person.id;
          const win = winner?.id === person.id;
          return (
            <div
              key={person.id}
              style={{
                background: win
                  ? "rgba(245,158,11,0.2)"
                  : hl
                    ? "rgba(109,40,217,0.35)"
                    : "rgba(255,255,255,0.07)",
                border: `1.5px solid ${win ? "rgba(245,158,11,0.55)" : hl ? "rgba(109,40,217,0.6)" : "var(--c-w12)"}`,
                borderRadius: "var(--r-lg)",
                padding: "14px 10px",
                textAlign: "center",
                transform: win || hl ? "scale(1.04)" : "scale(1)",
                transition: "all 0.12s ease",
                boxShadow: win ? "0 0 18px rgba(245,158,11,0.3)" : "none",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  marginBottom: 8,
                }}
              >
                <Avatar
                  avatar={avatarMap[person.id]}
                  size="sm"
                  crown={win}
                  pulse={hl}
                />
              </div>
              <div
                className="truncate"
                style={{ fontSize: 13, fontWeight: 800, color: "#fff" }}
              >
                {person.name}
              </div>
              {person.id === currentRoom.admin?.id && (
                <div
                  style={{
                    fontSize: 10,
                    color: "var(--c-gold)",
                    fontWeight: 800,
                    marginTop: 2,
                  }}
                >
                  {t("kingPick.adminBadge")}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {isAdmin && !winner && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <button
            className="btn btn-gold"
            onClick={handleRandom}
            disabled={spinning}
            style={{ fontSize: 16 }}
          >
            <Shuffle size={17} />
            {spinning
              ? t("kingPick.randomButtonSpinning")
              : t("kingPick.randomButton")}
          </button>
          <div className="divider">{t("kingPick.orChooseManual")}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {everyone.map((person) => (
              <button
                key={person.id}
                className="btn btn-ghost"
                disabled={spinning}
                onClick={() => pickKing(person.id)}
                style={{ justifyContent: "flex-start", gap: 10, fontSize: 14 }}
              >
                <Avatar avatar={avatarMap[person.id]} size="sm" />
                <span className="truncate">{person.name}</span>
                {person.id === currentRoom.admin?.id && (
                  <span
                    style={{
                      marginLeft: "auto",
                      fontSize: 10,
                      color: "var(--c-gold)",
                      fontWeight: 800,
                    }}
                  >
                    {t("kingPick.adminBadge")}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {!isAdmin && !winner && !spinning && (
        <p
          style={{
            textAlign: "center",
            fontSize: 13,
            fontWeight: 700,
            color: "var(--c-w45)",
          }}
        >
          {t("kingPick.waitingAdmin")}
        </p>
      )}

      {winner && (
        <div
          className="anim-pop"
          style={{
            background: "rgba(245,158,11,0.18)",
            border: "2px solid rgba(245,158,11,0.45)",
            borderRadius: "var(--r-lg)",
            padding: 18,
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 36, marginBottom: 6 }}>🎉</div>
          <p style={{ fontWeight: 800, color: "#fff", fontSize: 18 }}>
            {t("kingPick.winnerIs", { name: winner.name })}
          </p>
        </div>
      )}
    </ScreenWrapper>
  );
}

/* ─── KingRevealScreen ───────────────────────────────────────────────────── */
export function KingRevealScreen({
  currentRoom,
  playerRole,
  playerName,
  confirmKingAndStart,
  resetGame,
}) {
  const { t } = useTranslation();
  const king = currentRoom?.king;
  const isAdmin =
    playerRole === PLAYER_ROLE.ADMIN || playerRole === PLAYER_ROLE.ADMIN_KING;
  const isKing = king?.name === playerName;

  const everyone = useMemo(
    () => getEveryone(currentRoom),
    [currentRoom.admin, currentRoom.aspirants],
  );
  const avatarMap = useMemo(() => assignAvatars(everyone), [everyone]);

  return (
    <ScreenWrapper withBg onExit={resetGame}>
      <div
        style={{
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 14,
        }}
      >
        <div className="anim-float" style={{ fontSize: 44 }}>
          👑
        </div>
        <div className="anim-pop">
          <Avatar
            avatar={avatarMap[king?.id]}
            size="lg"
            crown
            playerName={king?.name}
          />
        </div>
        <div>
          <div className="t-label" style={{ marginBottom: 5 }}>
            {t("kingReveal.kingLabel")}
          </div>
          <h2 className="t-display" style={{ fontSize: 34, color: "#fff" }}>
            {king?.name}
          </h2>
        </div>
        {isKing ? (
          <div
            style={{
              background: "rgba(245,158,11,0.15)",
              border: "1.5px solid rgba(245,158,11,0.4)",
              borderRadius: "var(--r-lg)",
              padding: "12px 20px",
              width: "100%",
            }}
          >
            <p style={{ fontWeight: 800, color: "#FDE68A", fontSize: 14 }}>
              {t("kingReveal.isKingMessage")}
            </p>
          </div>
        ) : (
          <div className="glass" style={{ width: "100%" }}>
            <p
              style={{
                fontWeight: 700,
                color: "var(--c-w60)",
                fontSize: 14,
                textAlign: "center",
              }}
            >
              {t("kingReveal.aboutKing", { kingName: king?.name })}
            </p>
          </div>
        )}
        {isAdmin ? (
          <button
            className="btn btn-green"
            onClick={confirmKingAndStart}
            style={{ fontSize: 16, width: "100%" }}
          >
            <Play size={18} /> {t("kingReveal.startGame")}
          </button>
        ) : (
          <p style={{ fontSize: 13, fontWeight: 700, color: "var(--c-w45)" }}>
            {t("kingReveal.waitingAdmin")}
          </p>
        )}
      </div>
    </ScreenWrapper>
  );
}
