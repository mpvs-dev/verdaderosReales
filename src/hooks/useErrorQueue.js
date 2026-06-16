import { useState, useCallback, useRef } from "react";
import { TOAST_DURATION_MS } from "../constants/game.js";

const CRITICAL_PATTERNS = [
  "cerró la sala",
  "sala fue cerrada",
  "Problemas de conexión",
];

function isCritical(msg) {
  return CRITICAL_PATTERNS.some((p) =>
    msg.toLowerCase().includes(p.toLowerCase())
  );
}

export default function useErrorQueue() {
  const [toasts, setToasts] = useState([]);
  const counterRef          = useRef(0);

  const showError = useCallback((msg) => {
    if (!msg) return;
    const id       = ++counterRef.current;
    const critical = isCritical(msg);

    setToasts((prev) => [...prev, { id, msg, critical }]);

    if (!critical) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, TOAST_DURATION_MS);
    }
  }, []);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { toasts, showError, dismiss };
}