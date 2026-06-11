import { useRef, useState, useEffect } from "react";

export default function useConfigChange(config, clearAfterMs = 2500) {
    const prevRef = useRef(null);
    const timerRef = useRef(null);
    const [changedKeys, setChangedKeys] = useState(new Set());

    useEffect(() => {
        if (!config) return;

        const prev = prevRef.current;
        prevRef.current = config;

        // Primera vez — no hay nada que comparar
        if (!prev) return;

        const keys = ["mode", "rounds", "pointsPerAnswer", "penaltyEnabled", "customPointsEnabled"];
        const changed = keys.filter((k) => prev[k] !== config[k]);
        if (changed.length === 0) return;

        clearTimeout(timerRef.current);
        setChangedKeys(new Set(changed));
        timerRef.current = setTimeout(() => setChangedKeys(new Set()), clearAfterMs);

        return () => clearTimeout(timerRef.current);
    }, [config, clearAfterMs]);

    return changedKeys;
}