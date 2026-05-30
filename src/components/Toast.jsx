import { useEffect, useState } from "react";
import { AlertCircle, X } from "lucide-react";

export default function Toast({ message, onClose }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!message) {
      setVisible(false);
      return;
    }
    setVisible(true);
    const t = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 300);
    }, 3700);
    return () => clearTimeout(t);
  }, [message]);

  if (!message) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 16,
        left: "50%",
        zIndex: 9999,
        transform: `translateX(-50%) translateY(${visible ? 0 : -16}px)`,
        opacity: visible ? 1 : 0,
        transition: "all 0.25s ease",
        width: "calc(100% - 32px)",
        maxWidth: 400,
        pointerEvents: visible ? "auto" : "none",
      }}
    >
      <div
        style={{
          background: "#7F1D1D",
          border: "1.5px solid #EF4444",
          borderRadius: "var(--r-lg)",
          padding: "12px 14px",
          display: "flex",
          alignItems: "flex-start",
          gap: 10,
          boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
        }}
      >
        <AlertCircle
          size={18}
          color="#FCA5A5"
          style={{ flexShrink: 0, marginTop: 1 }}
        />
        <p
          style={{
            flex: 1,
            fontSize: 14,
            fontWeight: 700,
            color: "#FEE2E2",
            lineHeight: 1.4,
          }}
        >
          {message}
        </p>
        <button
          onClick={() => {
            setVisible(false);
            setTimeout(onClose, 300);
          }}
          style={{
            background: "transparent",
            border: "none",
            cursor: "pointer",
            padding: 0,
            display: "flex",
            color: "rgba(255,255,255,0.5)",
            flexShrink: 0,
          }}
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
