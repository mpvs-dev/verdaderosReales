import { useState, useEffect } from "react";
import { loadSession } from "../utils/session.js";
import { DEFAULT_GAME_CONFIG } from "../constants/game.js";
import useRoomState from "./useRoomState.js";
import useRoomActions from "./useRoomActions.js";
import useGameActions from "./useGameActions.js";
import useInactivityTimeout from "./useInactivityTimeout.js";

export default function useGameRoom() {
  const [gameConfig, setGameConfig] = useState(DEFAULT_GAME_CONFIG);

  const state = useRoomState();
  const roomActions = useRoomActions({
    playerName: state.playerName,
    roomCode: state.roomCode,
    currentRoom: state.currentRoom,
    gameConfig,
    setRoomCode: state.setRoomCode,
    setPlayerName: state.setPlayerName,
    setPlayerRole: state.setPlayerRole,
    setCurrentRoom: state.setCurrentRoom,
    setGameState: state.setGameState,
    setAnsweredQuestions: state.setAnsweredQuestions,
    setGameConfig,
    persistRoom: state.persistRoom,
    stateRef: state.stateRef,
    lastHashRef: state.lastHashRef,
    showError: state.showError,
    reconnectSession: state.reconnectSession,
  });
  const gameActions = useGameActions({
    playerName: state.playerName,
    roomCode: state.roomCode,
    currentRoom: state.currentRoom,
    answeredQuestions: state.answeredQuestions,
    setCurrentRoom: state.setCurrentRoom,
    setGameState: state.setGameState,
    setAnsweredQuestions: state.setAnsweredQuestions,
    persistRoom: state.persistRoom,
    stateRef: state.stateRef,
    lastHashRef: state.lastHashRef,
    showError: state.showError,
  });

  const { inactive, resetTimer } = useInactivityTimeout({
    gameState: state.gameState,
    playerRole: state.playerRole,
    currentRoom: state.currentRoom,
  });

  useEffect(() => {
    const session = loadSession();
    if (session?.code && session?.name) {
      state.reconnectSession(session);
    }
  }, []);

  return {
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
    setRoomCode: state.setRoomCode,
    setPlayerName: state.setPlayerName,
    setGameConfig,
    loading: roomActions.loadingCreate || roomActions.loadingJoin,
    loadingCreate: roomActions.loadingCreate,
    loadingJoin: roomActions.loadingJoin,
    loadingConfig: roomActions.loadingConfig,
    createRoom: roomActions.createRoom,
    joinRoom: roomActions.joinRoom,
    startGame: roomActions.startGame,
    pickKing: roomActions.pickKing,
    pickRandomKing: roomActions.pickRandomKing,
    confirmKingAndStart: roomActions.confirmKingAndStart,
    updateRoomConfig: roomActions.updateRoomConfig,
    rematch: roomActions.rematch,
    resetGame: roomActions.resetGame,
    submitAnswer: gameActions.submitAnswer,
    validateAnswer: gameActions.validateAnswer,
    submitCustomQuestion: gameActions.submitCustomQuestion,
    advanceReview: gameActions.advanceReview,
  };
}