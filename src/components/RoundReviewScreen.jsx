import { useEffect, useState, useCallback } from "react";
import { ChevronRight } from "lucide-react";
import { ScreenWrapper, Avatar } from "./Layout.jsx";
import { PLAYER_ROLE } from "../constants/game.js";
import { getEveryone, getAllPlayers } from "../utils/room.js";
import { assignAvatars } from "../assets/avatars.js";
import useAvatarMap from "../hooks/useAvatarMap.js";

const REVIEW_MS = 5000;

export default function RoundReviewScreen({
  currentRoom,
  playerRole,
  playerName,
  advanceReview,
  resetGame,
}) {
  const isAdmin =
    playerRole === PLAYER_ROLE.ADMIN || playerRole === PLAYER_ROLE.ADMIN_KING;

  const reviewMs = currentRoom?.config?.roundReviewMs ?? REVIEW_MS;
  const endsAt = currentRoom?.roundReviewEndsAt;
  const snapshot = currentRoom?.roundSnapshot ?? {};
  const q = currentRoom?.questions?.[currentRoom.currentQuestionIndex];

  const getRemaining = useCallback(() => {
    if (!endsAt) return reviewMs;
    const diff = new Date(endsAt).getTime() - Date.now();
    return Math.max(0, diff);
  }, [endsAt, reviewMs]);

  const [remaining, setRemaining] = useState(getRemaining);
  const [advancing, setAdvancing] = useState(false);

  useEffect(() => {
    setRemaining(getRemaining());
    const interval = setInterval(() => {
      const r = getRemaining();
      setRemaining(r);
      if (r <= 0) clearInterval(interval);
    }, 100);
    return () => clearInterval(interval);
  }, [getRemaining]);

  useEffect(() => {
    if (!isAdmin || remaining > 0 || advancing) return;
    setAdvancing(true);
    advanceReview();
  }, [remaining, isAdmin, advancing, advanceReview]);

  const progress = Math.max(0, Math.min(1, remaining / reviewMs));
  const seconds = Math.ceil(remaining / 1000);
  const roundNum = (currentRoom?.currentQuestionIndex ?? 0) + 1;
  const totalRounds =
    currentRoom?.config?.rounds ?? currentRoom?.questions?.length ?? 10;

  const { avatarMap, everyone } = useAvatarMap(currentRoom);
  const players = getAllPlayers(currentRoom);

  async function handleSkip() {
    if (advancing) return;
    setAdvancing(true);
    await advanceReview();
  }

  return (
    <ScreenWrapper withBg onExit={resetGame}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div className="pill pill-purple">
          Ronda {roundNum - 1}/{totalRounds}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          {/* Barra de progreso circular simple */}
          <svg
            width="32"
            height="32"
            viewBox="0 0 32 32"
            aria-label={`${seconds} segundos restantes`}
          >
            <circle
              cx="16"
              cy="16"
              r="13"
              fill="none"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="3"
            />
            <circle
              cx="16"
              cy="16"
              r="13"
              fill="none"
              stroke="#A78BFA"
              strokeWidth="3"
              strokeDasharray={`${2 * Math.PI * 13}`}
              strokeDashoffset={`${2 * Math.PI * 13 * (1 - progress)}`}
              strokeLinecap="round"
              transform="rotate(-90 16 16)"
              style={{ transition: "stroke-dashoffset 0.1s linear" }}
            />
            <text
              x="16"
              y="16"
              textAnchor="middle"
              dominantBaseline="central"
              fill="#fff"
              fontSize="10"
              fontWeight="800"
              fontFamily="var(--font-body)"
            >
              {seconds}
            </text>
          </svg>

          {/* Botón skip — solo admin */}
          {isAdmin && (
            <button
              className="btn btn-ghost btn-sm"
              onClick={handleSkip}
              disabled={advancing}
              style={{ width: "auto", gap: 5, fontSize: 12 }}
            >
              Siguiente <ChevronRight size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Pregunta de la ronda */}
      <div className="question-box">
        <div className="question-over">Respuestas de la ronda</div>
        <div className="question-text">{q?.text}</div>
      </div>

      {/* Lista de respuestas */}
      <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
        {players.map((p, i) => {
          const record = snapshot[p.id];
          if (!record) return null;

          const correct = record.isCorrect;
          const pts = record.points;
          const penalty = record.penalty;
          const delta = correct ? pts : -penalty;
          const hasScore = correct || penalty > 0;

          return (
            <div
              key={p.id}
              className="anim-slide"
              style={{
                animationDelay: `${i * 60}ms`,
                display: "flex",
                alignItems: "center",
                gap: 12,
                background: correct
                  ? "rgba(16,185,129,0.12)"
                  : "rgba(239,68,68,0.1)",
                border: `1.5px solid ${
                  correct ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.25)"
                }`,
                borderRadius: "var(--r-lg)",
                padding: "11px 14px",
              }}
            >
              <Avatar avatar={avatarMap[p.id]} size="sm" />

              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  className="truncate"
                  style={{
                    fontSize: 12,
                    fontWeight: 800,
                    color: "var(--c-w45)",
                  }}
                >
                  {p.name}
                </div>
                <div
                  className="truncate"
                  style={{ fontSize: 15, fontWeight: 800, color: "#fff" }}
                >
                  {record.answer}
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-end",
                  gap: 3,
                  flexShrink: 0,
                }}
              >
                <span style={{ fontSize: 18 }}>{correct ? "✅" : "❌"}</span>
                {hasScore && (
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 800,
                      color: delta > 0 ? "#6EE7B7" : "#FCA5A5",
                    }}
                  >
                    {delta > 0 ? `+${delta}` : delta} pts
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </ScreenWrapper>
  );
}
