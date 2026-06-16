import { useState } from "react";
import { LogOut, X } from "lucide-react";
import { useTranslation } from "../i18n/useTranslation.js";

export default function ExitButton({ onConfirm, label }) {
  const [showConfirm, setShowConfirm] = useState(false);
  const { t } = useTranslation();
  const btnLabel = label ?? t("exit.buttonLabel");

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        style={{
          position: "fixed",
          top: "calc(14px + env(safe-area-inset-top, 0px))",
          right: "calc(14px + env(safe-area-inset-right, 0px))",
          zIndex: 40,
          background: "rgba(0,0,0,0.55)",
          border: "1.5px solid rgba(255,255,255,0.18)",
          borderRadius: 999,
          padding: "7px 14px 7px 10px",
          display: "flex",
          alignItems: "center",
          gap: 6,
          cursor: "pointer",
          backdropFilter: "blur(10px)",
          color: "rgba(255,255,255,0.7)",
          fontFamily: "var(--font-body)",
          fontSize: 13,
          fontWeight: 800,
          transition: "background 0.15s, color 0.15s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "rgba(239,68,68,0.3)";
          e.currentTarget.style.color = "#fff";
          e.currentTarget.style.borderColor = "rgba(239,68,68,0.5)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "rgba(0,0,0,0.55)";
          e.currentTarget.style.color = "rgba(255,255,255,0.7)";
          e.currentTarget.style.borderColor = "rgba(255,255,255,0.18)";
        }}
      >
        <LogOut size={15} />
        {btnLabel}
      </button>

      {showConfirm && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 60,
            background: "rgba(0,0,0,0.75)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowConfirm(false);
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 340,
              background: "#16082e",
              border: "1.5px solid rgba(239,68,68,0.35)",
              borderRadius: 20,
              padding: 22,
              display: "flex",
              flexDirection: "column",
              gap: 16,
              boxShadow: "0 20px 50px rgba(0,0,0,0.6)",
            }}
          >
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
                    background: "rgba(239,68,68,0.2)",
                    border: "1.5px solid rgba(239,68,68,0.35)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <LogOut size={18} color="#EF4444" />
                </div>
                <span style={{ fontSize: 17, fontWeight: 800, color: "#fff" }}>
                  {t("exit.dialogTitle")}
                </span>
              </div>
              <button
                onClick={() => setShowConfirm(false)}
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
                <X size={15} color="rgba(255,255,255,0.5)" />
              </button>
            </div>

            <p
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: "rgba(255,255,255,0.55)",
                lineHeight: 1.5,
              }}
            >
              {t("exit.dialogBody")}
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
              <button
                className="btn btn-red"
                onClick={() => {
                  setShowConfirm(false);
                  onConfirm();
                }}
                style={{ fontSize: 15 }}
              >
                <LogOut size={16} /> {t("exit.confirm")}
              </button>
              <button
                className="btn btn-ghost"
                onClick={() => setShowConfirm(false)}
                style={{ fontSize: 14 }}
              >
                {t("exit.cancel")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
