import { useEffect, useRef, useCallback } from "react";
import { GAME_STATE } from "../constants/game.js";

const SSE_BASE_URL = import.meta.env.VITE_SERVER_URL
    ? `${import.meta.env.VITE_SERVER_URL}/api/room/stream`
    : "/api/room/stream";

// Fases donde SSE aporta valor real
// En lobby y results el lag de 10s es aceptable
const SSE_ACTIVE_STATES = new Set([
    GAME_STATE.PICKING_KING,
    GAME_STATE.KING_REVEAL,
    GAME_STATE.PLAYING,
    GAME_STATE.ROUND_REVIEW,
    GAME_STATE.WAITING_QUESTION,
    GAME_STATE.CREATING_QUESTION,
]);

/**
 * Hook que mantiene una conexión SSE con el servidor.
 * - Reconecta automáticamente cuando el servidor cierra la conexión
 * - Solo activa SSE en fases donde el lag importa
 * - onMessage recibe { type, room } desde el servidor
 */
export default function useSSE({ roomCode, gameState, onMessage, enabled }) {
    const esRef = useRef(null);
    const reconnTimerRef = useRef(null);
    const activeRef = useRef(false);

    const shouldUseSSE = enabled &&
        roomCode &&
        SSE_ACTIVE_STATES.has(gameState);

    const connect = useCallback(() => {
        if (!roomCode || !activeRef.current) return;

        // Limpiar conexión anterior
        if (esRef.current) {
            esRef.current.close();
            esRef.current = null;
        }

        const url = `${SSE_BASE_URL}?roomCode=${encodeURIComponent(roomCode)}`;
        const es = new EventSource(url);
        esRef.current = es;

        es.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);

                if (data.type === "RECONNECT") {
                    // El servidor pidió reconexión — esperar 100ms y reconectar
                    es.close();
                    esRef.current = null;
                    reconnTimerRef.current = setTimeout(connect, 100);
                    return;
                }

                if (data.type === "NOT_FOUND" || data.type === "ERROR") {
                    es.close();
                    esRef.current = null;
                    return;
                }

                if (data.type === "ROOM_UPDATE" && data.room) {
                    onMessage(data.room);
                }
            } catch (_) { }
        };

        es.onerror = () => {
            es.close();
            esRef.current = null;
            if (activeRef.current) {
                // Reconectar tras 2s en caso de error
                reconnTimerRef.current = setTimeout(connect, 2_000);
            }
        };
    }, [roomCode, onMessage]);

    useEffect(() => {
        if (!shouldUseSSE) {
            // Cerrar SSE si no está en fase activa
            activeRef.current = false;
            clearTimeout(reconnTimerRef.current);
            if (esRef.current) {
                esRef.current.close();
                esRef.current = null;
            }
            return;
        }

        activeRef.current = true;
        connect();

        return () => {
            activeRef.current = false;
            clearTimeout(reconnTimerRef.current);
            if (esRef.current) {
                esRef.current.close();
                esRef.current = null;
            }
        };
    }, [shouldUseSSE, connect]);

    // Pausar SSE cuando la pestaña se oculta — reconectar al volver
    useEffect(() => {
        function onVisibilityChange() {
            if (document.hidden) {
                clearTimeout(reconnTimerRef.current);
                if (esRef.current) {
                    esRef.current.close();
                    esRef.current = null;
                }
            } else if (shouldUseSSE && activeRef.current) {
                connect();
            }
        }
        document.addEventListener("visibilitychange", onVisibilityChange);
        return () => document.removeEventListener("visibilitychange", onVisibilityChange);
    }, [shouldUseSSE, connect]);
}