import { useState, useCallback, useRef } from "react";
import { TOAST_DURATION_MS } from "../constants/game.js";

export default function useErrorQueue() {
    const [toasts, setToasts] = useState([]);
    const counterRef = useRef(0);

    const showError = useCallback((msg) => {
        if (!msg) return;
        const id = ++counterRef.current;

        setToasts((prev) => [...prev, { id, msg }]);

        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, TOAST_DURATION_MS);
    }, []);

    const dismiss = useCallback((id) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    return { toasts, showError, dismiss };
}