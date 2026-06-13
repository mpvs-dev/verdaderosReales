import { useState } from "react";
import { X, Settings, Zap, Star, Check, Layers } from "lucide-react";
import { useTranslation } from "../i18n/useTranslation.js";
import { QUESTION_CATEGORIES } from "../constants/questionCategories.js";

function Toggle({ enabled, onClick, color = "purple" }) {
  const bg = enabled
    ? color === "red"
      ? "#EF4444"
      : "#7C3AED"
    : "rgba(255,255,255,0.12)";
  return (
    <div
      onClick={onClick}
      style={{
        width: 44,
        height: 24,
        borderRadius: 999,
        background: bg,
        position: "relative",
        cursor: "pointer",
        flexShrink: 0,
        transition: "background 0.2s",
        border: `1.5px solid ${enabled ? "transparent" : "rgba(255,255,255,0.2)"}`,
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 2,
          left: enabled ? 20 : 2,
          width: 16,
          height: 16,
          background: "#fff",
          borderRadius: "50%",
          boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
          transition: "left 0.2s",
        }}
      />
    </div>
  );
}

const PILL_STYLE = {
  purple: {
    background: "rgba(109,40,217,0.3)",
    border: "1.5px solid rgba(139,92,246,0.5)",
    color: "#C4B5FD",
  },
  gold: {
    background: "rgba(245,158,11,0.2)",
    border: "1.5px solid rgba(245,158,11,0.45)",
    color: "#FCD34D",
  },
  red: {
    background: "rgba(239,68,68,0.2)",
    border: "1.5px solid rgba(239,68,68,0.45)",
    color: "#FCA5A5",
  },
  green: {
    background: "rgba(16,185,129,0.15)",
    border: "1.5px solid rgba(16,185,129,0.35)",
    color: "#6EE7B7",
  },
};

/* ─── CategorySelector ─────────────────────────────────────────────────── */
function CategorySelector({ selected, onChange }) {
  // Solo visible en modo genérico — quien llama decide si renderizarlo
  const toggle = (id) => {
    const next = selected.includes(id)
      ? selected.filter((c) => c !== id)
      : [...selected, id];
    // Mínimo 1 categoría siempre activa
    if (next.length === 0) return;
    onChange(next);
  };

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 10,
        }}
      >
        <Layers size={14} color="#A78BFA" />
        <span
          style={{
            fontSize: 13,
            fontWeight: 800,
            color: "rgba(255,255,255,0.7)",
          }}
        >
          Tipos de preguntas
        </span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
        {QUESTION_CATEGORIES.map((cat) => {
          const active = selected.includes(cat.id);
          return (
            <div
              key={cat.id}
              onClick={() => toggle(cat.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                background: active
                  ? "rgba(109,40,217,0.2)"
                  : "rgba(255,255,255,0.04)",
                border: `1.5px solid ${active ? "rgba(139,92,246,0.5)" : "rgba(255,255,255,0.1)"}`,
                borderRadius: 10,
                padding: "8px 10px",
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              {/* Check */}
              <div
                style={{
                  width: 15,
                  height: 15,
                  borderRadius: "50%",
                  flexShrink: 0,
                  border: `2px solid ${active ? "#7C3AED" : "rgba(255,255,255,0.2)"}`,
                  background: active ? "#7C3AED" : "transparent",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.15s",
                }}
              >
                {active && <Check size={8} color="#fff" strokeWidth={3} />}
              </div>

              {/* Emoji + nombre */}
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 800,
                    lineHeight: 1.2,
                    color: active ? "#fff" : "rgba(255,255,255,0.6)",
                  }}
                  className="truncate"
                >
                  {cat.label}
                </div>
                <div
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    color: "rgba(255,255,255,0.3)",
                    lineHeight: 1.3,
                    marginTop: 1,
                  }}
                  className="truncate"
                >
                  {cat.description}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {selected.length === 0 && (
        <p
          style={{
            fontSize: 11,
            color: "#FCA5A5",
            fontWeight: 700,
            marginTop: 8,
          }}
        >
          Selecciona al menos un tipo de pregunta
        </p>
      )}
    </div>
  );
}

/* ─── GameConfigModal ──────────────────────────────────────────────────── */
export default function GameConfigModal({ config, onClose, onSave }) {
  const { t } = useTranslation();
  const [local, setLocal] = useState({
    penaltyEnabled: false,
    customPointsEnabled: false,
    categories: ["genericas"],
    ...config,
  });
  const isCustom = local.mode === "custom";

  const modeOptions = [
    {
      value: "generic",
      label: t("config.modeGenericLabel"),
      desc: t("config.modeGenericDesc"),
    },
    {
      value: "custom",
      label: t("config.modeCustomLabel"),
      desc: t("config.modeCustomDesc"),
    },
  ];

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        background: "rgba(0,0,0,0.7)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 440,
          background: "#16082e",
          border: "1.5px solid rgba(139,92,246,0.35)",
          borderRadius: 24,
          padding: 22,
          maxHeight: "90vh",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: 18,
          boxShadow: "0 24px 60px rgba(0,0,0,0.6)",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: "rgba(109,40,217,0.35)",
                border: "1.5px solid rgba(139,92,246,0.4)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Settings size={18} color="#A78BFA" />
            </div>
            <span style={{ fontSize: 18, fontWeight: 800, color: "#fff" }}>
              {t("config.title")}
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: 8,
              padding: 6,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
            }}
          >
            <X size={16} color="rgba(255,255,255,0.6)" />
          </button>
        </div>

        {/* Mode selector */}
        <div>
          <div className="t-label" style={{ marginBottom: 8 }}>
            {t("config.gameMode")}
          </div>
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}
          >
            {modeOptions.map((m) => {
              const active = local.mode === m.value;
              return (
                <div
                  key={m.value}
                  onClick={() => setLocal((p) => ({ ...p, mode: m.value }))}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 8,
                    background: active
                      ? "rgba(109,40,217,0.3)"
                      : "rgba(255,255,255,0.05)",
                    border: `1.5px solid ${active ? "rgba(139,92,246,0.6)" : "rgba(255,255,255,0.1)"}`,
                    borderRadius: 14,
                    padding: "14px 10px",
                    cursor: "pointer",
                    transition: "all 0.15s",
                    textAlign: "center",
                    position: "relative",
                  }}
                >
                  {/* Check badge esquina superior derecha */}
                  <div
                    style={{
                      position: "absolute",
                      top: 8,
                      right: 8,
                      width: 18,
                      height: 18,
                      borderRadius: "50%",
                      border: `2px solid ${active ? "#7C3AED" : "rgba(255,255,255,0.2)"}`,
                      background: active ? "#7C3AED" : "transparent",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "all 0.15s",
                    }}
                  >
                    {active && <Check size={10} color="#fff" strokeWidth={3} />}
                  </div>
                  {/* Emoji grande */}
                  <span style={{ fontSize: 28, lineHeight: 1 }}>
                    {m.value === "generic" ? "🎲" : "✏️"}
                  </span>
                  <div>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 800,
                        color: active ? "#fff" : "rgba(255,255,255,0.7)",
                      }}
                    >
                      {m.value === "generic" ? "Genéricas" : "Custom"}
                    </div>
                    <div
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        color: "rgba(255,255,255,0.38)",
                        marginTop: 2,
                        lineHeight: 1.3,
                      }}
                    >
                      {m.desc}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selector de categorías — solo en modo genérico */}
        {!isCustom && (
          <div
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 16,
              padding: "14px",
            }}
          >
            <CategorySelector
              selected={local.categories ?? ["genericas"]}
              onChange={(cats) => setLocal((p) => ({ ...p, categories: cats }))}
            />
          </div>
        )}

        {/* Rounds */}
        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 8,
            }}
          >
            <div className="t-label">{t("config.roundsLabel")}</div>
            <span
              className="t-display"
              style={{ fontSize: 26, color: "var(--c-gold)" }}
            >
              {local.rounds}
            </span>
          </div>
          <input
            type="range"
            min={2}
            max={20}
            step={1}
            value={local.rounds}
            onChange={(e) =>
              setLocal((p) => ({ ...p, rounds: Number(e.target.value) }))
            }
            style={{ width: "100%", accentColor: "var(--c-gold)" }}
          />
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: 10,
              fontWeight: 700,
              color: "rgba(255,255,255,0.35)",
              marginTop: 4,
            }}
          >
            <span>{t("config.roundsMin")}</span>
            <span style={{ color: "rgba(255,255,255,0.45)" }}>
              {isCustom
                ? t("config.roundsDescCustom", { rounds: local.rounds })
                : t("config.roundsDescGeneric", { rounds: local.rounds })}
            </span>
            <span>{t("config.roundsMax")}</span>
          </div>
        </div>

        {/* Points per answer */}
        {!local.customPointsEnabled && (
          <div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 8,
              }}
            >
              <div className="t-label">{t("config.pointsLabel")}</div>
              <span
                className="t-display"
                style={{ fontSize: 26, color: "#A78BFA" }}
              >
                {local.pointsPerAnswer}
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={10}
              step={1}
              value={local.pointsPerAnswer}
              onChange={(e) =>
                setLocal((p) => ({
                  ...p,
                  pointsPerAnswer: Number(e.target.value),
                }))
              }
              style={{ width: "100%", accentColor: "#7C3AED" }}
            />
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 10,
                fontWeight: 700,
                color: "rgba(255,255,255,0.35)",
                marginTop: 4,
              }}
            >
              <span>{t("config.pointsMin")}</span>
              <span style={{ color: "rgba(255,255,255,0.45)" }}>
                {local.pointsPerAnswer > 1
                  ? t("config.pointsDescPlural", {
                      points: local.pointsPerAnswer,
                    })
                  : t("config.pointsDesc", { points: local.pointsPerAnswer })}
              </span>
              <span>{t("config.pointsMax")}</span>
            </div>
          </div>
        )}

        {/* Custom points toggle — solo modo custom */}
        {isCustom && (
          <div
            onClick={() =>
              setLocal((p) => ({
                ...p,
                customPointsEnabled: !p.customPointsEnabled,
              }))
            }
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              background: local.customPointsEnabled
                ? "rgba(109,40,217,0.2)"
                : "rgba(255,255,255,0.05)",
              border: `1.5px solid ${local.customPointsEnabled ? "rgba(139,92,246,0.45)" : "rgba(255,255,255,0.1)"}`,
              borderRadius: 14,
              padding: "12px 14px",
              cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            <Star
              size={18}
              color={
                local.customPointsEnabled ? "#A78BFA" : "rgba(255,255,255,0.35)"
              }
              style={{ flexShrink: 0 }}
            />
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 800,
                  color: local.customPointsEnabled
                    ? "#fff"
                    : "rgba(255,255,255,0.65)",
                }}
              >
                {t("config.customPointsLabel")}
              </div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "rgba(255,255,255,0.38)",
                  marginTop: 1,
                }}
              >
                {t("config.customPointsDesc")}
              </div>
            </div>
            <Toggle
              enabled={local.customPointsEnabled}
              onClick={() =>
                setLocal((p) => ({
                  ...p,
                  customPointsEnabled: !p.customPointsEnabled,
                }))
              }
            />
          </div>
        )}

        {/* Penalty toggle */}
        <div
          onClick={() =>
            setLocal((p) => ({ ...p, penaltyEnabled: !p.penaltyEnabled }))
          }
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            background: local.penaltyEnabled
              ? "rgba(239,68,68,0.15)"
              : "rgba(255,255,255,0.05)",
            border: `1.5px solid ${local.penaltyEnabled ? "rgba(239,68,68,0.4)" : "rgba(255,255,255,0.1)"}`,
            borderRadius: 14,
            padding: "12px 14px",
            cursor: "pointer",
            transition: "all 0.15s",
          }}
        >
          <Zap
            size={18}
            color={local.penaltyEnabled ? "#EF4444" : "rgba(255,255,255,0.35)"}
            style={{ flexShrink: 0 }}
          />
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontSize: 13,
                fontWeight: 800,
                color: local.penaltyEnabled
                  ? "#FCA5A5"
                  : "rgba(255,255,255,0.65)",
              }}
            >
              {t("config.penaltyLabel")}
            </div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "rgba(255,255,255,0.38)",
                marginTop: 1,
              }}
            >
              {local.customPointsEnabled
                ? t("config.penaltyDescCustom")
                : local.pointsPerAnswer > 1
                  ? t("config.penaltyDescFixedPlural", {
                      points: local.pointsPerAnswer,
                    })
                  : t("config.penaltyDescFixed", {
                      points: local.pointsPerAnswer,
                    })}
            </div>
          </div>
          <Toggle
            enabled={local.penaltyEnabled}
            color="red"
            onClick={() =>
              setLocal((p) => ({ ...p, penaltyEnabled: !p.penaltyEnabled }))
            }
          />
        </div>
        <div
          onClick={() =>
            setLocal((p) => ({ ...p, showRoundReview: !p.showRoundReview }))
          }
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            background: local.showRoundReview
              ? "rgba(59,130,246,0.15)"
              : "rgba(255,255,255,0.05)",
            border: `1.5px solid ${
              local.showRoundReview
                ? "rgba(59,130,246,0.4)"
                : "rgba(255,255,255,0.1)"
            }`,
            borderRadius: 14,
            padding: "12px 14px",
            cursor: "pointer",
            transition: "all 0.15s",
          }}
        >
          <span style={{ fontSize: 20, flexShrink: 0 }}>👁️</span>
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontSize: 13,
                fontWeight: 800,
                color: local.showRoundReview
                  ? "#93C5FD"
                  : "rgba(255,255,255,0.65)",
              }}
            >
              Revisión de respuestas
            </div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "rgba(255,255,255,0.38)",
                marginTop: 1,
              }}
            >
              Muestra las respuestas de todos durante 5s entre rondas
            </div>
          </div>
          <Toggle
            enabled={local.showRoundReview}
            onClick={() =>
              setLocal((p) => ({ ...p, showRoundReview: !p.showRoundReview }))
            }
          />
        </div>
        {/* Summary pills */}
        <div
          style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 12,
            padding: "10px 14px",
            display: "flex",
            flexWrap: "wrap",
            gap: 6,
            justifyContent: "center",
          }}
        >
          <div className="pill pill-purple">
            {local.mode === "custom"
              ? t("config.summaryCustom")
              : t("config.summaryGeneric")}
          </div>
          {/* Categorías activas en modo genérico */}
          {!isCustom &&
            (local.categories ?? ["genericas"]).map((catId) => {
              const cat = QUESTION_CATEGORIES.find((c) => c.id === catId);
              return cat ? (
                <div key={catId} className="pill pill-gold">
                  {cat.label}
                </div>
              ) : null;
            })}
          <div className="pill pill-gold">
            {t("config.summaryRounds", { rounds: local.rounds })}
          </div>
          {!local.customPointsEnabled && (
            <div className="pill pill-purple">
              {t("config.summaryPointsHit", { points: local.pointsPerAnswer })}
            </div>
          )}
          {local.penaltyEnabled && !local.customPointsEnabled && (
            <div className="pill pill-red">
              {t("config.summaryPointsMiss", { points: local.pointsPerAnswer })}
            </div>
          )}
          {local.customPointsEnabled && (
            <div className="pill pill-purple">
              {t("config.summaryCustomPoints")}
            </div>
          )}
          {local.penaltyEnabled && local.customPointsEnabled && (
            <div className="pill pill-red">
              {t("config.summaryPenaltyActive")}
            </div>
          )}
        </div>

        {/* Save */}
        <button
          className="btn btn-gold"
          onClick={() => onSave(local)}
          style={{ fontSize: 15 }}
        >
          <Check size={17} /> {t("config.saveButton")}
        </button>
      </div>
    </div>
  );
}
