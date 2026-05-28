import { RotateCcw, Clock, Check, X, Loader } from "lucide-react";
import { ScreenWrapper, Avatar } from "./Layout.jsx";
import { PLAYER_ROLE } from "../constants/game.js";
import { formatDuration, getEveryone, getAllPlayers } from "../utils/room.js";
import { assignAvatars } from "../assets/avatars.js";
import { useTranslation } from "../i18n/useTranslation.js";

const MEDALS = ["🥇", "🥈", "🥉"];

/* ─── ResultsScreen ──────────────────────────────────────────────────────── */
export function ResultsScreen({ currentRoom, playerRole, resetGame, rematch }) {
  const { t } = useTranslation();
  if (!currentRoom) return null;

  const isAdmin   = playerRole === PLAYER_ROLE.ADMIN || playerRole === PLAYER_ROLE.ADMIN_KING;
  const duration  = formatDuration(currentRoom.startedAt, currentRoom.finishedAt);
  const everyone  = getEveryone(currentRoom);
  const avatarMap = assignAvatars(everyone);

  const playerMap = new Map();
  everyone.forEach((p) => playerMap.set(p.id, p));
  if (currentRoom.king) playerMap.set(currentRoom.king.id, currentRoom.king);

  const sorted = Object.entries(currentRoom.scores || {})
    .map(([id, score]) => ({ player: playerMap.get(id), score, answers: currentRoom.answers?.[id] || [] }))
    .filter((e) => e.player && e.player.id !== currentRoom.king?.id)
    .sort((a, b) => b.score - a.score);

  const winner = sorted[0];

  return (
    <ScreenWrapper withBg onExit={resetGame}>
      {/* Header */}
      <div style={{ textAlign: "center" }}>
        <div className="anim-float" style={{ fontSize: 48, display: "inline-block", marginBottom: 8 }}>🏆</div>
        <h1 className="t-display" style={{ fontSize: 30, color: "#fff", marginBottom: 4 }}>{t("results.title")}</h1>
        {duration && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
            <Clock size={13} color="var(--c-w45)" />
            <span style={{ fontSize: 12, fontWeight: 700, color: "var(--c-w45)" }}>
              {t("results.duration", { time: duration })}
            </span>
          </div>
        )}
      </div>

      {/* Winner */}
      {winner && (
        <div className="anim-pop glass-gold" style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <Avatar avatar={avatarMap[winner.player?.id]} size="md" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="truncate" style={{ fontSize: 17, fontWeight: 800, color: "#fff" }}>{winner.player?.name}</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--c-w45)", marginTop: 2 }}>{t("results.winnerSubtitle")}</div>
          </div>
          <div className="t-display" style={{ fontSize: 28, color: "var(--c-gold)", flexShrink: 0 }}>{winner.score} pts</div>
        </div>
      )}

      {/* Rankings */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {sorted.map((entry, idx) => (
          <div key={entry.player?.id} className="glass">
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 20, minWidth: 26 }}>{MEDALS[idx] ?? `#${idx + 1}`}</span>
              <Avatar avatar={avatarMap[entry.player?.id]} size="sm" />
              <span className="truncate" style={{ flex: 1, fontSize: 14, fontWeight: 800, color: "#fff" }}>{entry.player?.name}</span>
              <span className="t-display" style={{ fontSize: 20, color: "var(--c-gold)", flexShrink: 0 }}>{entry.score}</span>
            </div>
            {entry.answers.length > 0 && (
              <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid var(--c-w12)", display: "flex", flexDirection: "column", gap: 5 }}>
                {entry.answers.map((a, i) => {
                  const q = currentRoom.questions?.find((q) => String(q.id) === String(a.questionId));
                  return (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12 }}>
                      {a.isCorrect ? <Check size={11} color="#10B981" style={{ flexShrink: 0 }} /> : <X size={11} color="#EF4444" style={{ flexShrink: 0 }} />}
                      <span className="truncate" style={{ color: "var(--c-w45)", flex: 1 }}>{q?.text}:</span>
                      <span className="truncate" style={{ fontWeight: 800, color: "var(--c-w60)" }}>{a.answer}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Actions */}
      <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
        {isAdmin ? (
          <button className="btn btn-purple" onClick={rematch} style={{ fontSize: 15 }}>
            <RotateCcw size={17} /> {t("results.rematch")}
          </button>
        ) : (
          <div className="glass" style={{ textAlign: "center" }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: "var(--c-w45)" }}>{t("results.waitingAdmin")}</p>
          </div>
        )}
        <button className="btn btn-ghost" onClick={resetGame} style={{ fontSize: 14 }}>
          {t("results.backToMenu")}
        </button>
      </div>
    </ScreenWrapper>
  );
}

/* ─── WaitingForQuestionScreen ───────────────────────────────────────────── */
export function WaitingForQuestionScreen({ currentRoom, resetGame }) {
  const { t } = useTranslation();
  const roundNum    = (currentRoom?.currentQuestionIndex ?? 0) + 1;
  const totalRounds = currentRoom?.config?.rounds ?? 10;
  const everyone    = getEveryone(currentRoom);
  const avatarMap   = assignAvatars(everyone);
  const players     = getAllPlayers(currentRoom);
  const sorted      = [...players].sort(
    (a, b) => (currentRoom?.scores?.[b.id] || 0) - (currentRoom?.scores?.[a.id] || 0)
  );

  return (
    <ScreenWrapper withBg onExit={resetGame}>
      <div style={{ textAlign: "center" }}>
        <div className="pill pill-purple" style={{ display: "inline-flex" }}>
          {t("waitingQuestion.roundLabel", { current: roundNum, total: totalRounds })}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
        <div className="anim-float">
          <Avatar avatar={avatarMap[currentRoom?.king?.id]} size="lg" crown />
        </div>
        <div style={{ textAlign: "center" }}>
          <h2 className="t-display" style={{ fontSize: 26, color: "#fff", marginBottom: 4 }}>{t("waitingQuestion.title")}</h2>
          <p style={{ fontSize: 13, fontWeight: 700, color: "var(--c-w45)" }}>
            <strong style={{ color: "#fff" }}>{currentRoom?.king?.name}</strong> {t("waitingQuestion.subtitle", { kingName: currentRoom?.king?.name })}
          </p>
        </div>
        <span className="anim-spin" style={{ fontSize: 0, display: "flex" }}>
          <Loader size={28} color="rgba(139,92,246,0.7)" />
        </span>
      </div>

      {sorted.length > 0 && (
        <div className="glass">
          <div className="t-label" style={{ marginBottom: 10 }}>{t("waitingQuestion.scoresTitle")}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {sorted.map((p, i) => (
              <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: "var(--c-w45)", minWidth: 22 }}>#{i + 1}</span>
                <Avatar avatar={avatarMap[p.id]} size="sm" />
                <span className="truncate" style={{ flex: 1, fontSize: 14, fontWeight: 800, color: "#fff" }}>{p.name}</span>
                <span className="t-display" style={{ fontSize: 20, color: "var(--c-gold)" }}>{currentRoom?.scores?.[p.id] || 0}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </ScreenWrapper>
  );
}
