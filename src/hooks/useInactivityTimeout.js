import { useEffect, useRef, useState, useCallback } from "react";
import { GAME_STATE, ROOM_STATUS, PLAYER_ROLE } from "../constants/game.js";
import { INACTIVITY_MS } from "../constants/game.js"

export default function useInactivityTimeout({
    gameState,
    playerRole,
    currentRoom,
}) {
    const [inactive, setInactive] = useState(false);
    const timerRef = useRef(null);
    const prevAnswerCountRef = useRef(0);

    const isAdmin = playerRole === PLAYER_ROLE.ADMIN ||
        playerRole === PLAYER_ROLE.ADMIN_KING;

    const resetTimer = useCallback(() => {
        clearTimeout(timerRef.current);
        setInactive(false);
        timerRef.current = setTimeout(() => setInactive(true), INACTIVITY_MS);
    }, []);

    // Arrancar / detener según gameState
    useEffect(() => {
        if (!isAdmin) return;

        const isLobby = gameState === GAME_STATE.LOBBY;
        const isPlaying = gameState === GAME_STATE.PLAYING &&
            currentRoom?.status === ROOM_STATUS.ANSWERING;

        if (!isLobby && !isPlaying) {
            clearTimeout(timerRef.current);
            setInactive(false);
            return;
        }

        resetTimer();
        return () => clearTimeout(timerRef.current);
    }, [gameState, isAdmin, resetTimer, currentRoom?.status]);

    // Reiniciar el timer cuando llega una respuesta nueva durante la partida
    useEffect(() => {
        if (!isAdmin) return;
        if (gameState !== GAME_STATE.PLAYING) return;

        const currentCount = (currentRoom?.currentAnswers ?? []).length;
        if (currentCount !== prevAnswerCountRef.current) {
            prevAnswerCountRef.current = currentCount;
            resetTimer();
        }
    }, [currentRoom?.currentAnswers, gameState, isAdmin, resetTimer]);

    // Reiniciar cuando un jugador nuevo se une al lobby
    useEffect(() => {
        if (!isAdmin) return;
        if (gameState !== GAME_STATE.LOBBY) return;
        resetTimer();
    }, [currentRoom?.aspirants?.length, gameState, isAdmin, resetTimer]);

    return { inactive, resetTimer };
}