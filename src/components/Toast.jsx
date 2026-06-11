import { useEffect, useRef, useState } from "react";
import { AlertCircle, X } from "lucide-react";

function ToastItem({ id, msg, onDismiss }) {
  const [visible, setVisible] = useState(false);
  const hideTimerRef = useRef(null);
  const dismissTimerRef = useRef(null);

  useEffect(() => {
    // Entrada
    requestAnimationFrame(() => setVisible(true));

    // Salida automática
    hideTimerRef.current = setTimeout(() => {
      setVisible(false);
      dismissTimerRef.current = setTimeout(() => onDismiss(id), 300);
    }, 3700);

    return () => {
      clearTimeout(hideTimerRef.current);
      clearTimeout(dismissTimerRef.current);
    };
  }, [id, onDismiss]);

  function handleClose() {
    clearTimeout(hideTimerRef.current);
    clearTimeout(dismissTimerRef.current);
    setVisible(false);
    dismissTimerRef.current = setTimeout(() => onDismiss(id), 300);
  }

  return (
    <div
      style={{
        width: "100%",
        transform: `translateY(${visible ? 0 : -12}px)`,
        opacity: visible ? 1 : 0,
        transition: "all 0.25s ease",
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
          {msg}
        </p>
        <button
          onClick={handleClose}
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

export default function Toast({ toasts, onDismiss }) {
  if (!toasts.length) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 16,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        gap: 8,
        width: "calc(100% - 32px)",
        maxWidth: 400,
        pointerEvents: "none",
      }}
    >
      {toasts.map((t) => (
        <ToastItem key={t.id} id={t.id} msg={t.msg} onDismiss={onDismiss} />
      ))}
    </div>
  );
}
