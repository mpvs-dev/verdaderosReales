import { useState } from "react";
import { DEFAULT_GAME_CONFIG } from "../constants/game.js";
import useRoomState from "./useRoomState.js";
import useRoomActions from "./useRoomActions.js";
import useGameActions from "./useGameActions.js";
import useInactivityTimeout from "./useInactivityTimeout.js";

export default function useGameRoom() {
  const [gameConfig, setGameConfig] = useState(DEFAULT_GAME_CONFIG);

  const state = useRoomState();

  const { inactive, resetTimer } = useInactivityTimeout({
    gameState: state.gameState,
    playerRole: state.playerRole,
    currentRoom: state.currentRoom,
  });

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
    gameConfig,
    inactive,
    resetTimer,
    // setters expuestos a la UI
    setRoomCode: state.setRoomCode,
    setPlayerName: state.setPlayerName,
    setGameConfig,
    // acciones de sala
    ...roomActions,
    // acciones de juego
    ...gameActions,
  };
}