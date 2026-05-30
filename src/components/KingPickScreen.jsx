import { useState, useEffect, useRef } from "react";
import { Shuffle } from "lucide-react";
import Avatar from "./Avatar";
import GameBackground from "./GameBackground";
import storage from "../services/storage.js";
import { PLAYER_ROLE, KING_PICK_ANIMATION } from "../constants/game.js";
import { getEveryone } from "../utils/room.js";
import { assignAvatars } from "../assets/avatars.js";

const {
  BASE_STEPS,
  RANDOM_EXTRA_STEPS,
  FAST_DELAY_MS,
  SLOW_DELAY_MULTIPLIER,
  SLOW_START_RATIO,
} = KING_PICK_ANIMATION;

function computeAnimationDuration(totalSteps) {
  const slowStart = Math.floor(totalSteps * SLOW_START_RATIO);
  return (
    slowStart * FAST_DELAY_MS +
    (totalSteps - slowStart) * totalSteps * SLOW_DELAY_MULTIPLIER +
    1200
  );
}

export default function KingPickScreen({
  currentRoom,
  playerRole,
  pickKing,
  pickRandomKing,
  roomCode,
}) {
  const [highlighted, setHighlighted] = useState(null);
  const [winner, setWinner] = useState(null);
  const [spinning, setSpinning] = useState(false);
  const isAnimatingRef = useRef(false);

  const isAdmin = playerRole === PLAYER_ROLE.ADMIN;
  const everyone = getEveryone(currentRoom);
  const avatarMap = assignAvatars(everyone);

  useEffect(() => {
    if (isAdmin) return;
    const timer = setInterval(async () => {
      if (isAnimatingRef.current) return;
      try {
        const result = await storage.get(`room_${roomCode}`);
        const room = JSON.parse(result.value);
        const winnerId = room.pickingAnimation?.winnerId;
        if (!winnerId) return;
        clearInterval(timer);
        const chosen = everyone.find((p) => p.id === winnerId);
        if (chosen) runAnimation(chosen);
      } catch (_) {}
    }, 500);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  function runAnimation(chosen) {
    if (isAnimatingRef.current) return;
    isAnimatingRef.current = true;
    setSpinning(true);
    setWinner(null);
    const totalSteps =
      BASE_STEPS + Math.floor(Math.random() * RANDOM_EXTRA_STEPS);
    let step = 0;
    function tick() {
      setHighlighted(everyone[step % everyone.length].id);
      step++;
      const slowStart = Math.floor(totalSteps * SLOW_START_RATIO);
      const delay =
        step < slowStart
          ? FAST_DELAY_MS
          : FAST_DELAY_MS + (step - slowStart) * SLOW_DELAY_MULTIPLIER;
      if (step < totalSteps) setTimeout(tick, delay);
      else {
        setHighlighted(chosen.id);
        setWinner(chosen);
        setSpinning(false);
        isAnimatingRef.current = false;
      }
    }
    tick();
  }

  async function handleRandom() {
    if (isAnimatingRef.current) return;
    const chosen = everyone[Math.floor(Math.random() * everyone.length)];
    try {
      await storage.set(
        `room_${roomCode}`,
        JSON.stringify({
          ...currentRoom,
          pickingAnimation: { winnerId: chosen.id },
        }),
      );
    } catch (_) {}
    runAnimation(chosen);
    setTimeout(
      () => pickRandomKing(chosen.id),
      computeAnimationDuration(BASE_STEPS + RANDOM_EXTRA_STEPS),
    );
  }

  return (
    <GameBackground>
      <div className="screen">
        <div
          style={{ width: "100%", maxWidth: 560, padding: "10px 16px 0" }}
        ></div>

        <div className="screen-content">
          {/* Header */}
          <div style={{ textAlign: "center" }}>
            <div
              className="anim-float"
              style={{ fontSize: 52, display: "inline-block", marginBottom: 6 }}
            >
              👑
            </div>
            <h2
              className="text-display"
              style={{
                fontSize: 32,
                color: "#fff",
                textShadow: "0 4px 0 rgba(0,0,0,0.2)",
                marginBottom: 4,
              }}
            >
              ¿Quién es el Líder?
            </h2>
            <p
              style={{
                color: "rgba(255,255,255,0.6)",
                fontWeight: 700,
                fontSize: 14,
              }}
            >
              {isAdmin
                ? "Elige tú o deja que el azar decida"
                : `${currentRoom?.admin?.name} está eligiendo al Líder`}
            </p>
          </div>

          {/* Player grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 10,
            }}
          >
            {everyone.map((person) => {
              const isHighlighted = highlighted === person.id;
              const isWinner = winner?.id === person.id;
              return (
                <div
                  key={person.id}
                  style={{
                    background: isWinner
                      ? "rgba(245,158,11,0.3)"
                      : isHighlighted
                        ? "rgba(139,92,246,0.4)"
                        : "rgba(255,255,255,0.1)",
                    border: isWinner
                      ? "2.5px solid #F59E0B"
                      : isHighlighted
                        ? "2.5px solid #8B5CF6"
                        : "1.5px solid rgba(255,255,255,0.15)",
                    borderRadius: 16,
                    padding: "14px 8px",
                    textAlign: "center",
                    backdropFilter: "blur(8px)",
                    transform:
                      isWinner || isHighlighted ? "scale(1.05)" : "scale(1)",
                    transition: "all 0.12s ease",
                    boxShadow: isWinner
                      ? "0 0 20px rgba(245,158,11,0.4)"
                      : "none",
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
                      crown={isWinner}
                      pulse={isHighlighted}
                    />
                  </div>
                  <div
                    className="truncate"
                    style={{ fontSize: 12, fontWeight: 800, color: "#fff" }}
                  >
                    {person.name}
                  </div>
                  {person.id === currentRoom.admin?.id && (
                    <div
                      style={{
                        fontSize: 10,
                        color: "rgba(245,158,11,0.9)",
                        fontWeight: 800,
                        marginTop: 2,
                      }}
                    >
                      Admin
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Controls — admin only */}
          {isAdmin && !winner && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <button
                className="btn btn-gold"
                onClick={handleRandom}
                disabled={spinning}
                style={{ fontSize: 17 }}
              >
                <Shuffle size={18} />
                {spinning ? "Eligiendo..." : "Líder al Azar"}
              </button>

              <div className="divider">o elige manualmente</div>

              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {everyone.map((person) => (
                  <button
                    key={person.id}
                    className="btn btn-outline"
                    onClick={() => pickKing(person.id)}
                    disabled={spinning}
                    style={{ justifyContent: "flex-start", gap: 12 }}
                  >
                    <Avatar avatar={avatarMap[person.id]} size="sm" />
                    <span>{person.name}</span>
                    {person.id === currentRoom.admin?.id && (
                      <span
                        style={{
                          marginLeft: "auto",
                          fontSize: 11,
                          color: "#8B5CF6",
                          fontWeight: 800,
                        }}
                      >
                        Admin
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
                color: "rgba(255,255,255,0.5)",
                fontWeight: 700,
                fontSize: 14,
              }}
            >
              Esperando decisión del administrador...
            </p>
          )}

          {winner && (
            <div
              className="anim-pop"
              style={{
                background: "rgba(245,158,11,0.2)",
                border: "2.5px solid #F59E0B",
                borderRadius: 20,
                padding: 20,
                textAlign: "center",
                boxShadow: "0 0 30px rgba(245,158,11,0.3)",
              }}
            >
              <div style={{ fontSize: 40, marginBottom: 6 }}>🎉</div>
              <p style={{ fontWeight: 800, color: "#fff", fontSize: 20 }}>
                {winner.name} es el Líder
              </p>
            </div>
          )}
        </div>

        <div
          style={{ width: "100%", maxWidth: 560, padding: "0 16px 16px" }}
        ></div>
      </div>
    </GameBackground>
  );
}
