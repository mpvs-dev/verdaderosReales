import { useState } from "react";
import { DEFAULT_GAME_CONFIG } from "../constants/game.js";
import useRoomState from "./useRoomState.js";
import useRoomActions from "./useRoomActions.js";
import useGameActions from "./useGameActions.js";
import useInactivityTimeout from "./useInactivityTimeout.js";

export default function useGameRoom() {
  const [gameConfig, setGameConfig] = useState(DEFAULT_GAME_CONFIG);
  const state = useRoomState();
  const roomActions = useRoomActions({ ...state, gameConfig, setGameConfig });
  const gameActions = useGameActions({ ...state });
  const { inactive, resetTimer } = useInactivityTimeout({
    gameState: state.gameState,
    playerRole: state.playerRole,
    currentRoom: state.currentRoom,
  });

  return {
    // estado
    gameState: state.gameState,
    roomCode: state.roomCode,
    playerName: state.playerName,
    playerRole: state.playerRole,
    currentRoom: state.currentRoom,
    answeredQuestions: state.answeredQuestions,
    reconnecting: state.reconnecting,
    toasts: state.toasts,
    dismiss: state.dismiss,
    emptyRoom: state.emptyRoom,
    gameConfig,
    inactive,
    resetTimer,
    // setters expuestos a la UI
    setRoomCode: state.setRoomCode,
    setPlayerName: state.setPlayerName,
    setGameConfig,
    // acciones de sala — referencias estables de useCallback
    loadingCreate: roomActions.loadingCreate,
    loadingJoin: roomActions.loadingJoin,
    createRoom: roomActions.createRoom,
    joinRoom: roomActions.joinRoom,
    startGame: roomActions.startGame,
    pickKing: roomActions.pickKing,
    pickRandomKing: roomActions.pickRandomKing,
    confirmKingAndStart: roomActions.confirmKingAndStart,
    updateRoomConfig: roomActions.updateRoomConfig,
    rematch: roomActions.rematch,
    resetGame: roomActions.resetGame,
    // acciones de juego — referencias estables de useCallback
    submitAnswer: gameActions.submitAnswer,
    validateAnswer: gameActions.validateAnswer,
    submitCustomQuestion: gameActions.submitCustomQuestion,
    advanceReview: gameActions.advanceReview,
  };
}