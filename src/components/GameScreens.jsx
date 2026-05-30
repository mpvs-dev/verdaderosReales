// ── ResultsScreen ────────────────────────────────────────────────────────────
import { Trophy, Clock, RotateCcw, Check, X } from "lucide-react";
import Avatar from "./Avatar";
import GameBackground from "./GameBackground";
import { PLAYER_ROLE } from "../constants/game.js";
import { formatDuration } from "../utils/room.js";
import { assignAvatars } from "../assets/avatars.js";

export function ResultsScreen({ currentRoom, playerRole, resetGame, rematch }) {
  if (!currentRoom) return null;

  const duration = formatDuration(
    currentRoom.startedAt,
    currentRoom.finishedAt,
  );
  const isAdmin =
    playerRole === PLAYER_ROLE.ADMIN || playerRole === PLAYER_ROLE.ADMIN_KING;

  const everyone = [
    currentRoom.admin,
    ...(currentRoom.aspirants || []),
    currentRoom.king,
  ].filter((p, i, arr) => p && arr.findIndex((x) => x?.id === p.id) === i);
  const avatarMap = assignAvatars(everyone);

  const playerMap = new Map();
  everyone.forEach((p) => playerMap.set(p.id, p));

  const sorted = Object.entries(currentRoom.scores || {})
    .map(([id, score]) => ({
      player: playerMap.get(id),
      score,
      answers: currentRoom.answers?.[id] || [],
    }))
    .filter((e) => e.player && e.player.id !== currentRoom.king?.id)
    .sort((a, b) => b.score - a.score);

  const winner = sorted[0];
  const medals = ["🥇", "🥈", "🥉"];

  return (
    <GameBackground>
      <div className="screen">
        <div className="screen-content">
          {/* Header */}
          <div style={{ textAlign: "center" }}>
            <div
              className="anim-float"
              style={{ fontSize: 60, display: "inline-block", marginBottom: 8 }}
            >
              🏆
            </div>
            <h1
              className="text-display"
              style={{
                fontSize: 34,
                color: "#fff",
                textShadow: "0 4px 0 rgba(0,0,0,0.25)",
                marginBottom: 4,
              }}
            >
              ¡Juego Terminado!
            </h1>
            {duration && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  color: "rgba(255,255,255,0.5)",
                  fontSize: 13,
                  fontWeight: 700,
                }}
              >
                <Clock size={14} />
                Duración:{" "}
                <span style={{ color: "rgba(255,255,255,0.75)" }}>
                  {duration}
                </span>
              </div>
            )}
          </div>

          {/* Winner */}
          {winner && (
            <div
              className="anim-pop"
              style={{
                background: "rgba(245,158,11,0.2)",
                border: "2.5px solid #F59E0B",
                borderRadius: 20,
                padding: 20,
                textAlign: "center",
                boxShadow: "0 0 30px rgba(245,158,11,0.2)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  marginBottom: 10,
                }}
              >
                <Avatar avatar={avatarMap[winner.player?.id]} size="lg" />
              </div>
              <p
                className="text-display"
                style={{ fontSize: 26, color: "#fff", marginBottom: 2 }}
              >
                {winner.player?.name}
              </p>
              <p
                style={{
                  fontSize: 13,
                  color: "rgba(255,255,255,0.6)",
                  fontWeight: 700,
                  marginBottom: 8,
                }}
              >
                ¡Conoce mejor al Líder!
              </p>
              <div
                style={{
                  background: "rgba(245,158,11,0.3)",
                  borderRadius: 999,
                  padding: "6px 20px",
                  display: "inline-block",
                }}
              >
                <span
                  className="text-display"
                  style={{ fontSize: 28, color: "#F59E0B" }}
                >
                  {winner.score} pts
                </span>
              </div>
            </div>
          )}

          {/* Rankings */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {sorted.map((entry, idx) => (
              <div
                key={entry.player?.id}
                style={{
                  background: "rgba(255,255,255,0.1)",
                  backdropFilter: "blur(8px)",
                  border: "1.5px solid rgba(255,255,255,0.18)",
                  borderRadius: 16,
                  padding: "12px 14px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    marginBottom: entry.answers.length ? 10 : 0,
                  }}
                >
                  <span style={{ fontSize: 22, minWidth: 28 }}>
                    {medals[idx] ?? `#${idx + 1}`}
                  </span>
                  <Avatar avatar={avatarMap[entry.player?.id]} size="sm" />
                  <span
                    style={{
                      flex: 1,
                      fontWeight: 800,
                      color: "#fff",
                      fontSize: 15,
                    }}
                    className="truncate"
                  >
                    {entry.player?.name}
                  </span>
                  <span
                    className="text-display"
                    style={{ fontSize: 20, color: "#F59E0B" }}
                  >
                    {entry.score}
                  </span>
                </div>

                {entry.answers.length > 0 && (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 4,
                      paddingTop: 8,
                      borderTop: "1px solid rgba(255,255,255,0.1)",
                    }}
                  >
                    {entry.answers.map((a, i) => {
                      const q = currentRoom.questions?.find(
                        (q) => String(q.id) === String(a.questionId),
                      );
                      return (
                        <div
                          key={i}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            fontSize: 12,
                          }}
                        >
                          {a.isCorrect ? (
                            <Check size={12} color="#10B981" />
                          ) : (
                            <X size={12} color="#EF4444" />
                          )}
                          <span
                            className="truncate"
                            style={{ color: "rgba(255,255,255,0.5)", flex: 1 }}
                          >
                            {q?.text}:
                          </span>
                          <span
                            style={{ color: "#fff", fontWeight: 700 }}
                            className="truncate"
                          >
                            {a.answer}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Actions */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {isAdmin ? (
              <button
                className="btn btn-purple"
                onClick={rematch}
                style={{ fontSize: 17 }}
              >
                <RotateCcw size={18} /> Revancha
              </button>
            ) : (
              <div
                style={{
                  background: "rgba(255,255,255,0.08)",
                  border: "1.5px solid rgba(255,255,255,0.15)",
                  borderRadius: 14,
                  padding: "14px",
                  textAlign: "center",
                }}
              >
                <p
                  style={{
                    color: "rgba(255,255,255,0.5)",
                    fontWeight: 700,
                    fontSize: 14,
                  }}
                >
                  Esperando que el administrador decida...
                </p>
              </div>
            )}
            <button
              className="btn btn-ghost"
              onClick={resetGame}
              style={{ fontSize: 15 }}
            >
              Volver al Menú
            </button>
          </div>
        </div>
      </div>
    </GameBackground>
  );
}

// ── WaitingForQuestionScreen ─────────────────────────────────────────────────
import { Loader } from "lucide-react";

export function WaitingForQuestionScreen({ currentRoom }) {
  const roundNum = (currentRoom?.currentQuestionIndex ?? 0) + 1;
  const totalRounds = currentRoom?.config?.rounds ?? 10;

  const everyone = [
    currentRoom?.admin,
    ...(currentRoom?.aspirants || []),
  ].filter(Boolean);
  const avatarMap = assignAvatars(everyone);
  const kingAvatar = avatarMap[currentRoom?.king?.id];

  const allPlayers = [
    ...(currentRoom?.aspirants || []),
    ...(!(currentRoom?.admin?.id === currentRoom?.king?.id) &&
    currentRoom?.admin
      ? [currentRoom.admin]
      : []),
  ];
  const sorted = [...allPlayers].sort(
    (a, b) =>
      (currentRoom?.scores?.[b.id] || 0) - (currentRoom?.scores?.[a.id] || 0),
  );

  return (
    <GameBackground>
      <div className="screen" style={{ justifyContent: "center" }}>
        <div
          style={{ width: "100%", maxWidth: 560, padding: "10px 16px 0" }}
        ></div>

        <div
          className="screen-content"
          style={{ alignItems: "center", textAlign: "center" }}
        >
          <div
            style={{
              background: "rgba(109,40,217,0.4)",
              border: "1.5px solid rgba(139,92,246,0.4)",
              borderRadius: 999,
              padding: "6px 18px",
              fontWeight: 800,
              fontSize: 13,
              color: "#C4B5FD",
              display: "inline-block",
            }}
          >
            Ronda {roundNum}/{totalRounds}
          </div>

          <div
            className="anim-float"
            style={{ display: "flex", justifyContent: "center" }}
          >
            <Avatar avatar={kingAvatar} size="lg" crown />
          </div>

          <div>
            <h2
              className="text-display"
              style={{ fontSize: 28, color: "#fff", marginBottom: 6 }}
            >
              Esperando al Líder...
            </h2>
            <p
              style={{
                color: "rgba(255,255,255,0.6)",
                fontWeight: 700,
                fontSize: 14,
              }}
            >
              <strong style={{ color: "#fff" }}>
                {currentRoom?.king?.name}
              </strong>{" "}
              está escribiendo la pregunta
            </p>
          </div>

          <Loader
            size={32}
            color="rgba(139,92,246,0.8)"
            style={{ animation: "spin 1s linear infinite" }}
          />

          {/* Scores */}
          {sorted.length > 0 && (
            <div
              style={{
                width: "100%",
                background: "rgba(255,255,255,0.08)",
                border: "1.5px solid rgba(255,255,255,0.15)",
                borderRadius: 16,
                padding: 14,
              }}
            >
              <div
                className="label"
                style={{ color: "rgba(255,255,255,0.45)", marginBottom: 10 }}
              >
                Puntajes
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {sorted.map((p, i) => (
                  <div
                    key={p.id}
                    style={{ display: "flex", alignItems: "center", gap: 10 }}
                  >
                    <span
                      style={{
                        fontSize: 14,
                        minWidth: 24,
                        fontWeight: 800,
                        color: "rgba(255,255,255,0.4)",
                      }}
                    >
                      #{i + 1}
                    </span>
                    <Avatar avatar={avatarMap[p.id]} size="sm" />
                    <span
                      style={{
                        flex: 1,
                        fontWeight: 800,
                        color: "#fff",
                        fontSize: 14,
                      }}
                      className="truncate"
                    >
                      {p.name}
                    </span>
                    <span
                      className="text-display"
                      style={{ fontSize: 18, color: "#F59E0B" }}
                    >
                      {currentRoom?.scores?.[p.id] || 0}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </GameBackground>
  );
}
