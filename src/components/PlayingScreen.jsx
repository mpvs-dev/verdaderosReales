import { useState, useCallback } from "react";
import { Check, X, CheckCircle } from "lucide-react";
import { ScreenWrapper, Avatar } from "./Layout.jsx";
import { PLAYER_ROLE, MAX_ANSWER_LENGTH } from "../constants/game.js";
import { getAllPlayers, getEveryone } from "../utils/room.js";
import { assignAvatars } from "../assets/avatars.js";
import { useTranslation } from "../i18n/useTranslation.js";

const S = { CORRECT: "correct", INCORRECT: "incorrect", ANSWERED: "answered", PENDING: "pending" };
const DOT_COLOR = { correct: "#10B981", incorrect: "#EF4444", answered: "#3B82F6", pending: "rgba(255,255,255,0.2)" };
const LETTERS = ["A", "B", "C", "D", "E", "F"];

function Scoreboard({ currentRoom, getState, avatarMap }) {
  const players = getAllPlayers(currentRoom);
  const sorted  = [...players].sort((a, b) => (currentRoom.scores?.[b.id] || 0) - (currentRoom.scores?.[a.id] || 0));
  if (!sorted.length) return null;
  return (
    <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 2 }}>
      {sorted.map((p) => (
        <div key={p.id} className="score-chip">
          <Avatar avatar={avatarMap[p.id]} size="sm" />
          <span style={{ fontSize: 12, fontWeight: 800, color: "#fff" }} className="truncate">{p.name}</span>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: DOT_COLOR[getState(p.id)] ?? DOT_COLOR.pending, flexShrink: 0 }} />
          <span style={{ fontSize: 12, fontWeight: 800, color: "var(--c-gold)" }}>{currentRoom.scores?.[p.id] || 0}</span>
        </div>
      ))}
    </div>
  );
}

function AnswerOptions({ question, onSubmit, t }) {
  const [sending, setSending] = useState(false);
  const [text, setText]       = useState("");

  const submit = useCallback(async (val) => {
    if (!val || sending) return;
    setSending(true);
    try { await onSubmit(val); } finally { setSending(false); }
  }, [onSubmit, sending]);

  if (!question) return null;

  if (question.type === "multiple") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
        {question.options?.map((opt, i) => (
          <button key={opt} className="answer-btn anim-slide" disabled={sending}
            style={{ animationDelay: `${i * 50}ms` }} onClick={() => submit(opt)}>
            <div className="answer-letter">{LETTERS[i]}</div>
            <span>{opt}</span>
          </button>
        ))}
      </div>
    );
  }

  if (question.type === "boolean") {
    return (
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <button className="btn btn-green" disabled={sending} onClick={() => submit(t("playing.yes"))} style={{ fontSize: 16 }}>✅ {t("playing.yes")}</button>
        <button className="btn btn-red"   disabled={sending} onClick={() => submit(t("playing.no"))}  style={{ fontSize: 16 }}>❌ {t("playing.no")}</button>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ position: "relative" }}>
        <input className="input" type="text" placeholder={t("playing.answerPlaceholder")}
          value={text} onChange={(e) => setText(e.target.value.slice(0, MAX_ANSWER_LENGTH))}
          onKeyDown={(e) => { if (e.key === "Enter") submit(text.trim()); }}
          maxLength={MAX_ANSWER_LENGTH} disabled={sending} style={{ paddingRight: 52 }} />
        <span style={{
          position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
          fontSize: 11, fontWeight: 700,
          color: text.length >= MAX_ANSWER_LENGTH ? "var(--c-danger)" : "var(--c-w45)",
        }}>{text.length}/{MAX_ANSWER_LENGTH}</span>
      </div>
      <button className="btn btn-purple" disabled={!text.trim() || sending} onClick={() => submit(text.trim())} style={{ fontSize: 15 }}>
        {sending ? t("playing.sendingAnswer") : t("playing.sendAnswer")}
      </button>
    </div>
  );
}

function AnswerFeedback({ state, answer, question, config, t }) {
  const gp   = config?.pointsPerAnswer ?? 1;
  const pen  = config?.penaltyEnabled  ?? false;
  const show = config?.customPointsEnabled || gp !== 1 || pen;
  const pts  = question?.points  ?? gp;
  const pnt  = question?.penalty ?? gp;

  const cfg = {
    [S.CORRECT]:   { cls: "feedback-correct",  icon: "✅", title: t("playing.correct"),    titleColor: "#6EE7B7" },
    [S.INCORRECT]: { cls: "feedback-incorrect", icon: "❌", title: t("playing.incorrect"),  titleColor: "#FCA5A5" },
    [S.ANSWERED]:  { cls: "feedback-waiting",   icon: "⏳", title: t("playing.answerSent"), titleColor: "#93C5FD" },
  }[state] ?? {};

  return (
    <div className={`feedback ${cfg.cls} anim-pop`}>
      <div style={{ fontSize: 40, marginBottom: 8 }}>{cfg.icon}</div>
      <p style={{ fontWeight: 800, color: cfg.titleColor, fontSize: 18, marginBottom: 6 }}>{cfg.title}</p>
      {show && state === S.CORRECT   && <div className="pill pill-green" style={{ display: "inline-flex", marginBottom: 6 }}>{t("playing.pointsHit", { points: pts })}</div>}
      {show && state === S.INCORRECT && pen && <div className="pill pill-red" style={{ display: "inline-flex", marginBottom: 6 }}>{t("playing.pointsMiss", { points: pnt })}</div>}
      {show && state === S.ANSWERED  && (
        <div style={{ display: "flex", justifyContent: "center", gap: 6, marginBottom: 6 }}>
          <div className="pill pill-purple">{t("playing.pointsIfHit", { points: pts })}</div>
          {pen && <div className="pill pill-red">{t("playing.pointsIfMiss", { points: pnt })}</div>}
        </div>
      )}
      {answer && (
        <p style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.6)", marginTop: 4 }}>
          Tu respuesta: <strong style={{ color: "#fff" }}>{answer}</strong>
        </p>
      )}
      {state === S.ANSWERED && (
        <p style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.4)", marginTop: 6 }}>{t("playing.waitingValidation")}</p>
      )}
    </div>
  );
}

function ValuePills({ question, config, t }) {
  const gp   = config?.pointsPerAnswer ?? 1;
  const pen  = config?.penaltyEnabled  ?? false;
  const show = config?.customPointsEnabled || gp !== 1 || pen;
  if (!show) return null;
  const pts = question?.points ?? gp;
  const pnt = question?.penalty ?? gp;
  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
      <div className="pill pill-purple">{t("playing.pointsIfHit", { points: pts })}</div>
      {pen && <div className="pill pill-red">{t("playing.pointsIfMiss", { points: pnt })}</div>}
    </div>
  );
}

function AnswerHistory({ entries, questions, t }) {
  if (!entries.length) return null;
  return (
    <div>
      <div className="t-label" style={{ marginBottom: 8 }}>{t("playing.myPreviousAnswers")}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
        {entries.map((e, i) => {
          const q = questions?.find((q) => String(q.id) === String(e.questionId));
          return (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 10,
              background: e.isCorrect ? "rgba(16,185,129,0.12)" : "rgba(239,68,68,0.12)",
              border: `1px solid ${e.isCorrect ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.28)"}`,
              borderRadius: "var(--r-md)", padding: "9px 12px",
            }}>
              <span style={{ fontSize: 15, flexShrink: 0 }}>{e.isCorrect ? "✅" : "❌"}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="truncate" style={{ fontSize: 11, color: "var(--c-w45)", fontWeight: 700 }}>{q?.text}</div>
                <div className="truncate" style={{ fontSize: 13, color: "#fff", fontWeight: 800 }}>{e.answer}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function PlayingScreen({ currentRoom, playerRole, playerName, submitAnswer, validateAnswer, answeredQuestions, resetGame }) {
  const [validating, setValidating] = useState(new Set());
  const { t } = useTranslation();

  const q          = currentRoom.questions[currentRoom.currentQuestionIndex];
  const qId        = q?.id;
  const allPlayers = getAllPlayers(currentRoom);
  const everyone   = getEveryone(currentRoom);
  const avatarMap  = assignAvatars(everyone);
  const totalR     = currentRoom.config?.rounds ?? currentRoom.questions.length;
  const progress   = t("playing.roundLabel", { current: currentRoom.currentQuestionIndex + 1, total: totalR });

  const me = allPlayers.find((p) => p.name === playerName)
          ?? (currentRoom.admin?.name === playerName ? currentRoom.admin : null);

  function stateOf(id) {
    const rec = currentRoom.answers?.[id]?.find((h) => String(h.questionId) === String(qId));
    if (rec) return rec.isCorrect ? S.CORRECT : S.INCORRECT;
    if (currentRoom.currentAnswers?.some((a) => String(a.aspirantId) === String(id))) return S.ANSWERED;
    return S.PENDING;
  }

  function myState() {
    const rec = currentRoom.answers?.[me?.id]?.find((h) => String(h.questionId) === String(qId));
    if (rec) return rec.isCorrect ? S.CORRECT : S.INCORRECT;
    if (answeredQuestions.has(currentRoom.currentQuestionIndex)) return S.ANSWERED;
    return S.PENDING;
  }

  const myCurrentAnswer = currentRoom.currentAnswers?.find(
    (a) => a.aspirantName === playerName && String(a.questionId) === String(qId)
  );

  const totalExpected = allPlayers.length;
  const totalAnswered = currentRoom.currentAnswers?.length ?? 0;
  const allAnswered   = totalAnswered >= totalExpected && totalExpected > 0;

  async function handleValidate(aspirantId, isCorrect) {
    if (validating.has(aspirantId)) return;
    setValidating((prev) => new Set(prev).add(aspirantId));
    try { await validateAnswer(aspirantId, isCorrect); }
    finally { setValidating((prev) => { const s = new Set(prev); s.delete(aspirantId); return s; }); }
  }

  const Header = () => (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Avatar avatar={avatarMap[currentRoom.king?.id]} size="sm" crown />
        <span style={{ fontSize: 13, fontWeight: 800, color: "rgba(255,255,255,0.7)" }}>{currentRoom.king?.name}</span>
      </div>
      <div className="pill pill-purple">{progress}</div>
    </div>
  );

  /* ── King view ── */
  if (playerRole === PLAYER_ROLE.KING) {
    return (
      <ScreenWrapper withBg onExit={resetGame}>
        <Header />
        <Scoreboard currentRoom={currentRoom} getState={stateOf} avatarMap={avatarMap} />
        <div className="question-box">
          <div className="question-over">{t("playing.yourQuestion")}</div>
          <div className="question-text">{q?.text}</div>
          <ValuePills question={q} config={currentRoom.config} t={t} />
        </div>

        {allAnswered ? (
          <div style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(16,185,129,0.14)", border: "1.5px solid rgba(16,185,129,0.35)", borderRadius: "var(--r-lg)", padding: "11px 14px" }}>
            <CheckCircle size={16} color="#10B981" />
            <span style={{ fontSize: 13, fontWeight: 800, color: "#6EE7B7" }}>{t("playing.allAnswered")}</span>
          </div>
        ) : (
          <div className="glass">
            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--c-w60)" }}>
              {t("playing.waitingAnswers", { answered: totalAnswered, total: totalExpected })}
            </span>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
          {currentRoom.currentAnswers?.length ? (
            currentRoom.currentAnswers.map((ans) => (
              <div key={ans.aspirantId} style={{
                display: "flex", alignItems: "center", gap: 12,
                background: "rgba(255,255,255,0.07)", border: "1px solid var(--c-w12)",
                borderRadius: "var(--r-lg)", padding: "12px 14px",
              }}>
                <Avatar avatar={avatarMap[ans.aspirantId]} size="sm" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: "var(--c-w60)" }} className="truncate">{ans.aspirantName}</div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: "#fff", wordBreak: "break-word" }}>{ans.answer}</div>
                  <ValuePills question={q} config={currentRoom.config} t={t} />
                </div>
                <div style={{ display: "flex", gap: 7, flexShrink: 0 }}>
                  <button onClick={() => handleValidate(ans.aspirantId, true)} disabled={validating.has(ans.aspirantId)}
                    style={{ background: "var(--c-success)", border: "none", borderRadius: 10, padding: "9px 11px", cursor: "pointer", boxShadow: "0 4px 0 var(--c-success-dark)", display: "flex", alignItems: "center" }}>
                    <Check size={17} color="#fff" />
                  </button>
                  <button onClick={() => handleValidate(ans.aspirantId, false)} disabled={validating.has(ans.aspirantId)}
                    style={{ background: "var(--c-danger)", border: "none", borderRadius: 10, padding: "9px 11px", cursor: "pointer", boxShadow: "0 4px 0 #991B1B", display: "flex", alignItems: "center" }}>
                    <X size={17} color="#fff" />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p style={{ textAlign: "center", fontSize: 13, fontWeight: 700, color: "var(--c-w45)" }}>{t("playing.waitingAnswersList")}</p>
          )}
        </div>
      </ScreenWrapper>
    );
  }

  /* ── Aspirant view ── */
  const state   = myState();
  const history = currentRoom.answers?.[me?.id] || [];

  return (
    <ScreenWrapper withBg onExit={resetGame}>
      <Header />
      <Scoreboard currentRoom={currentRoom} getState={(id) => id === me?.id ? state : stateOf(id)} avatarMap={avatarMap} />
      <div className="question-box">
        <div className="question-over">{t("playing.aboutKing", { kingName: currentRoom.king?.name })}</div>
        <div className="question-text">{q?.text}</div>
        <ValuePills question={q} config={currentRoom.config} t={t} />
      </div>
      {state !== S.PENDING
        ? <AnswerFeedback state={state} answer={myCurrentAnswer?.answer} question={q} config={currentRoom.config} t={t} />
        : <AnswerOptions question={q} onSubmit={submitAnswer} t={t} />
      }
      <AnswerHistory entries={history} questions={currentRoom.questions} t={t} />
    </ScreenWrapper>
  );
}
