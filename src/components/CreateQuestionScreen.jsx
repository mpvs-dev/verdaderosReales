import { useState } from "react";
import { Plus, X, Send, Zap } from "lucide-react";
import { ScreenWrapper, Avatar } from "./Layout.jsx";
import { MAX_QUESTION_LENGTH, MAX_OPTION_LENGTH, MAX_OPTIONS, MIN_OPTIONS } from "../constants/game.js";
import { getAllPlayers, getEveryone } from "../utils/room.js";
import { assignAvatars } from "../assets/avatars.js";
import { useTranslation } from "../i18n/useTranslation.js";

export default function CreateQuestionScreen({ currentRoom, submitCustomQuestion, resetGame }) {
  const { t } = useTranslation();
  const defaultPoints  = currentRoom?.config?.pointsPerAnswer ?? 1;
  const penaltyEnabled = currentRoom?.config?.penaltyEnabled  ?? false;

  const [text, setText]       = useState("");
  const [type, setType]       = useState("text");
  const [options, setOptions] = useState(["", ""]);
  const [points, setPoints]   = useState(defaultPoints);
  const [penalty, setPenalty] = useState(defaultPoints);
  const [sending, setSending] = useState(false);

  const TYPES = [
    { value: "text",     label: t("createQuestion.typeText")     },
    { value: "boolean",  label: t("createQuestion.typeBoolean")  },
    { value: "multiple", label: t("createQuestion.typeMultiple") },
  ];

  const roundNum    = (currentRoom?.currentQuestionIndex ?? 0) + 1;
  const totalRounds = currentRoom?.config?.rounds ?? 10;
  const everyone    = getEveryone(currentRoom);
  const avatarMap   = assignAvatars(everyone);
  const players     = getAllPlayers(currentRoom);
  const sorted      = [...players].sort(
    (a, b) => (currentRoom?.scores?.[b.id] || 0) - (currentRoom?.scores?.[a.id] || 0)
  );

  function addOption()        { if (options.length < MAX_OPTIONS) setOptions([...options, ""]); }
  function removeOption(i)    { if (options.length > MIN_OPTIONS) setOptions(options.filter((_, idx) => idx !== i)); }
  function updateOption(i, v) { const next = [...options]; next[i] = v.slice(0, MAX_OPTION_LENGTH); setOptions(next); }

  async function handleSend() {
    if (!text.trim() || sending) return;
    if (type === "multiple" && options.filter((o) => o.trim()).length < MIN_OPTIONS) return;
    setSending(true);
    await submitCustomQuestion({
      id: Date.now(), text: text.trim(), type,
      options: type === "multiple" ? options.filter((o) => o.trim()) : undefined,
      points, penalty: penaltyEnabled ? penalty : 0,
    });
    setSending(false);
  }

  const canSend = text.trim().length > 0
    && (type !== "multiple" || options.filter((o) => o.trim()).length >= MIN_OPTIONS)
    && !sending;

  return (
    <ScreenWrapper withBg onExit={resetGame}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 className="t-display" style={{ fontSize: 24, color: "#fff" }}>{t("createQuestion.title")}</h2>
        <div className="pill pill-purple">{t("createQuestion.roundLabel", { current: roundNum, total: totalRounds })}</div>
      </div>

      {/* Scoreboard */}
      {sorted.length > 0 && (
        <div className="glass">
          <div className="t-label" style={{ marginBottom: 10 }}>{t("createQuestion.scoresTitle")}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            {sorted.map((p, i) => (
              <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: "var(--c-w45)", minWidth: 20 }}>#{i + 1}</span>
                <Avatar avatar={avatarMap[p.id]} size="sm" />
                <span className="truncate" style={{ flex: 1, fontSize: 13, fontWeight: 800, color: "#fff" }}>{p.name}</span>
                <span className="t-display" style={{ fontSize: 18, color: "var(--c-gold)" }}>{currentRoom?.scores?.[p.id] || 0}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Type tabs */}
      <div>
        <div className="t-label" style={{ marginBottom: 8 }}>{t("createQuestion.questionLabel")}</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
          {TYPES.map((tp) => (
            <button key={tp.value} onClick={() => setType(tp.value)} style={{
              background: type === tp.value ? "var(--c-primary-mid)" : "var(--c-w12)",
              border: type === tp.value ? "1.5px solid rgba(139,92,246,0.5)" : "1.5px solid var(--c-w18)",
              borderRadius: "var(--r-md)", padding: "10px 6px",
              fontFamily: "var(--font-body)", fontWeight: 800, fontSize: 12,
              color: type === tp.value ? "#fff" : "var(--c-w60)", cursor: "pointer",
              boxShadow: type === tp.value ? "0 4px 0 var(--c-primary-dark)" : "none",
              transition: "all 0.12s",
            }}>{tp.label}</button>
          ))}
        </div>
      </div>

      {/* Textarea */}
      <div style={{ position: "relative" }}>
        <textarea rows={3} placeholder={t("createQuestion.questionPlaceholder")}
          value={text} onChange={(e) => setText(e.target.value.slice(0, MAX_QUESTION_LENGTH))}
          maxLength={MAX_QUESTION_LENGTH} className="input" style={{ paddingBottom: 28 }} />
        <span style={{
          position: "absolute", right: 10, bottom: 9, fontSize: 10, fontWeight: 700,
          color: text.length >= MAX_QUESTION_LENGTH ? "var(--c-danger)" : "var(--c-w45)",
        }}>{text.length}/{MAX_QUESTION_LENGTH}</span>
      </div>

      {/* Options */}
      {type === "multiple" && (
        <div>
          <div className="t-label" style={{ marginBottom: 8 }}>{t("createQuestion.optionsLabel")}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {options.map((opt, i) => (
              <div key={i} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <div style={{ position: "relative", flex: 1 }}>
                  <input type="text" placeholder={t("createQuestion.optionPlaceholder", { number: i + 1 })}
                    value={opt} onChange={(e) => updateOption(i, e.target.value)}
                    maxLength={MAX_OPTION_LENGTH} className="input" style={{ paddingRight: 48, fontSize: 14 }} />
                  <span style={{
                    position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
                    fontSize: 10, fontWeight: 700,
                    color: opt.length >= MAX_OPTION_LENGTH ? "var(--c-danger)" : "var(--c-w45)",
                  }}>{opt.length}/{MAX_OPTION_LENGTH}</span>
                </div>
                <button onClick={() => removeOption(i)} disabled={options.length <= MIN_OPTIONS} style={{
                  background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)",
                  borderRadius: "var(--r-sm)", padding: "10px", cursor: "pointer",
                  display: "flex", alignItems: "center", flexShrink: 0,
                  opacity: options.length <= MIN_OPTIONS ? 0.3 : 1,
                }}>
                  <X size={15} color="#EF4444" />
                </button>
              </div>
            ))}
          </div>
          {options.length < MAX_OPTIONS && (
            <button onClick={addOption} style={{
              marginTop: 8, background: "transparent", border: "none",
              color: "#8B5CF6", fontWeight: 800, fontSize: 13,
              fontFamily: "inherit", cursor: "pointer",
              display: "flex", alignItems: "center", gap: 5, padding: 0,
            }}>
              <Plus size={14} /> {t("createQuestion.addOption")}
            </button>
          )}
        </div>
      )}

      {/* Points — solo visible si customPointsEnabled está activo */}
      {currentRoom?.config?.customPointsEnabled && (
        <div className="glass">
          <div className="t-label" style={{ marginBottom: 12 }}>{t("createQuestion.pointsLabel")}</div>
          <div style={{ marginBottom: penaltyEnabled ? 14 : 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 800, color: "var(--c-w60)" }}>{t("createQuestion.hitLabel")}</span>
              <span className="t-display" style={{ fontSize: 22, color: "var(--c-gold)" }}>{points}</span>
            </div>
            <input type="range" min={1} max={10} step={1} value={points}
              onChange={(e) => setPoints(Number(e.target.value))}
              style={{ width: "100%", accentColor: "var(--c-gold)" }} />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, fontWeight: 700, color: "var(--c-w45)", marginTop: 3 }}>
              <span>1</span>
              <span>{t("createQuestion.defaultPoints", { points: defaultPoints })}</span>
              <span>10</span>
            </div>
          </div>
          {penaltyEnabled && (
            <div style={{ paddingTop: 12, borderTop: "1px solid var(--c-w12)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: "var(--c-w60)", display: "flex", alignItems: "center", gap: 5 }}>
                  <Zap size={13} color="#EF4444" /> {t("createQuestion.penaltyLabel")}
                </span>
                <span className="t-display" style={{ fontSize: 22, color: "#EF4444" }}>{penalty}</span>
              </div>
              <input type="range" min={1} max={10} step={1} value={penalty}
                onChange={(e) => setPenalty(Number(e.target.value))}
                style={{ width: "100%", accentColor: "#EF4444" }} />
            </div>
          )}
          <div style={{ display: "flex", gap: 6, marginTop: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <div className="pill pill-purple">{t("createQuestion.pillHit", { points })}</div>
            {penaltyEnabled && <div className="pill pill-red">{t("createQuestion.pillMiss", { points: penalty })}</div>}
          </div>
        </div>
      )}

      <button className="btn btn-gold" onClick={handleSend} disabled={!canSend} style={{ fontSize: 16 }}>
        <Send size={17} />
        {sending ? t("createQuestion.sendingButton") : t("createQuestion.sendButton")}
      </button>
    </ScreenWrapper>
  );
}
