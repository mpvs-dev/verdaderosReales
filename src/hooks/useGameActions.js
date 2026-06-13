import { useContext } from "react";
import { I18nContext } from "../i18n/i18nContext.jsx";
import { roomApi } from "../services/roomApi.js";
import { GAME_STATE, ROOM_STATUS, PLAYER_ROLE, GAME_MODE } from "../constants/game.js";
import { saveAnsweredQuestions } from "../utils/session.js";
import { roomHash } from "./useRoomState.js";

function findPlayerId(room, name) {
    return (room.aspirants || []).find((a) => a.name === name)?.id
        || (room.admin?.name === name ? room.admin.id : null)
        || (room.king?.name === name ? room.king.id : null);
}

function resolvePostActionState(room, stateRef, setGameState) {
    if (room.status === ROOM_STATUS.FINISHED) {
        setGameState(GAME_STATE.RESULTS);
        return;
    }
    if (room.status === ROOM_STATUS.ROUND_REVIEW) {
        setGameState(GAME_STATE.ROUND_REVIEW);
        return;
    }

    if (room.mode === GAME_MODE.CUSTOM &&
        room.status === ROOM_STATUS.WAITING_QUESTION) {
        const role = stateRef.current.playerRole;
        if (role === PLAYER_ROLE.KING || role === PLAYER_ROLE.ADMIN_KING)
            setGameState(GAME_STATE.CREATING_QUESTION);
        else
            setGameState(GAME_STATE.WAITING_QUESTION);
        return;
    }

    if (room.status === ROOM_STATUS.ANSWERING) {
        setGameState(GAME_STATE.PLAYING);
    }
}

export default function useGameActions({
    playerName, roomCode,
    currentRoom, answeredQuestions,
    setCurrentRoom, setGameState, setAnsweredQuestions,
    persistRoom, stateRef, lastHashRef,
    showError,
}) {
    async function submitAnswer(answer) {
        const question = currentRoom.questions[currentRoom.currentQuestionIndex];
        const aspirantId = findPlayerId(currentRoom, playerName);
        const newAnswered = new Set(answeredQuestions).add(currentRoom.currentQuestionIndex);
        setAnsweredQuestions(newAnswered);
        saveAnsweredQuestions(roomCode, newAnswered);
        try {
            const { room } = await roomApi.submitAnswer({
                roomCode, aspirantId, aspirantName: playerName,
                questionId: question.id, answer,
            });
            setCurrentRoom(room);
            lastHashRef.current = roomHash(room);
            resolvePostActionState(room, stateRef, setGameState);
            if (room.status === ROOM_STATUS.FINISHED) {
                setGameState(GAME_STATE.RESULTS);
                return;
            }
            if (room.mode === GAME_MODE.CUSTOM && room.status === ROOM_STATUS.WAITING_QUESTION) {
                const role = stateRef.current.playerRole;
                if (role === PLAYER_ROLE.KING || role === PLAYER_ROLE.ADMIN_KING) {
                    setGameState(GAME_STATE.CREATING_QUESTION);
                } else {
                    setGameState(GAME_STATE.WAITING_QUESTION);
                }
            }
        } catch (err) {
            showError("Error al enviar respuesta: " + err.message);
        }
    }

    async function validateAnswer(aspirantId, isCorrect) {
        try {
            const { room } = await roomApi.validate({
                roomCode, aspirantId, isCorrect,
                pointsPerAnswer: currentRoom.config?.pointsPerAnswer ?? 1,
                penaltyEnabled: currentRoom.config?.penaltyEnabled ?? false,
            });
            setCurrentRoom(room);
            lastHashRef.current = roomHash(room);
            resolvePostActionState(room, stateRef, setGameState);

            if (room.status === ROOM_STATUS.FINISHED) {
                setGameState(GAME_STATE.RESULTS);
                return;
            }
            if (room.mode === GAME_MODE.CUSTOM && room.status === ROOM_STATUS.WAITING_QUESTION) {
                const role = stateRef.current.playerRole;
                if (role === PLAYER_ROLE.KING || role === PLAYER_ROLE.ADMIN_KING)
                    setGameState(GAME_STATE.CREATING_QUESTION);
            }
        } catch (err) {
            showError("Error al validar: " + err.message);
        }
    }

    async function submitCustomQuestion(question) {
        try {
            const questions = [...(currentRoom.questions || [])];
            questions[currentRoom.currentQuestionIndex] = question;
            await persistRoom({
                ...currentRoom,
                questions,
                status: ROOM_STATUS.ANSWERING,
                currentAnswers: [],
                answeredAspirants: [],
            });
            setGameState(GAME_STATE.PLAYING);
        } catch (err) {
            showError("Error al enviar pregunta: " + err.message);
        }
    }

    async function advanceReview() {
        try {
            const { room } = await roomApi.advanceReview(roomCode);
            setCurrentRoom(room);
            lastHashRef.current = roomHash(room);
            resolvePostActionState(room, stateRef, setGameState);

            if (room.status === ROOM_STATUS.FINISHED) {
                setGameState(GAME_STATE.RESULTS);
                return;
            }
            if (room.mode === GAME_MODE.CUSTOM &&
                room.status === ROOM_STATUS.WAITING_QUESTION) {
                const role = stateRef.current.playerRole;
                if (role === PLAYER_ROLE.KING || role === PLAYER_ROLE.ADMIN_KING)
                    setGameState(GAME_STATE.CREATING_QUESTION);
                else
                    setGameState(GAME_STATE.WAITING_QUESTION);
                return;
            }
            setGameState(GAME_STATE.PLAYING);
        } catch (err) {
            showError("Error al avanzar ronda: " + err.message);
        }
    }
    return { submitAnswer, validateAnswer, submitCustomQuestion, advanceReview };
}