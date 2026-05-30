import { useState } from "react";
import { X, Settings, Zap, Star, Check } from "lucide-react";
import { useTranslation } from "../i18n/useTranslation.js";

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

export default function GameConfigModal({ config, onClose, onSave }) {
  const { t } = useTranslation();
  const [local, setLocal] = useState({
    penaltyEnabled: false,
    customPointsEnabled: false,
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
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {modeOptions.map((m) => {
              const active = local.mode === m.value;
              return (
                <div
                  key={m.value}
                  onClick={() => setLocal((p) => ({ ...p, mode: m.value }))}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    background: active
                      ? "rgba(109,40,217,0.3)"
                      : "rgba(255,255,255,0.05)",
                    border: `1.5px solid ${active ? "rgba(139,92,246,0.6)" : "rgba(255,255,255,0.1)"}`,
                    borderRadius: 14,
                    padding: "12px 14px",
                    cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                >
                  <div
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: "50%",
                      border: `2px solid ${active ? "#7C3AED" : "rgba(255,255,255,0.25)"}`,
                      background: active ? "#7C3AED" : "transparent",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      transition: "all 0.15s",
                    }}
                  >
                    {active && <Check size={11} color="#fff" strokeWidth={3} />}
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 800,
                        color: active ? "#fff" : "rgba(255,255,255,0.7)",
                      }}
                    >
                      {m.label}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: "rgba(255,255,255,0.4)",
                        marginTop: 1,
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

        {/* Custom points toggle */}
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

        {/* Summary */}
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
