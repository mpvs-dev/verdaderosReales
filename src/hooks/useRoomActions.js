import { useState, useContext } from "react";
import { I18nContext, loadQuestions } from "../i18n/i18nContext.jsx";
import { DEFAULT_CATEGORIES } from "../constants/questionCategories.js";
import storage from "../services/storage.js";
import { roomApi } from "../services/roomApi.js";
import { GAME_STATE, ROOM_STATUS, PLAYER_ROLE, GAME_MODE, DEFAULT_GAME_CONFIG } from "../constants/game.js";
import { shuffleArray, generateRoomCode, generateId, isPlayerInRoom, buildInitialScoresAndAnswers } from "../utils/room.js";
import { saveSession, clearSession, saveAnsweredQuestions, clearAnsweredQuestions, clearStaleAnsweredQuestions, } from "../utils/session.js";
import { roomHash } from "./useRoomState.js";
import { selectQuestions } from "../utils/questions.js";
function buildRoomKey(code) { return `room_${code}`; }

function findPlayerId(room, name) {
  return (room.aspirants || []).find((a) => a.name === name)?.id
    || (room.admin?.name === name ? room.admin.id : null)
    || (room.king?.name === name ? room.king.id : null);
}

export default function useRoomActions({
  playerName, roomCode,
  currentRoom, gameConfig,
  setRoomCode, setPlayerName, setPlayerRole,
  setCurrentRoom, setGameState, setAnsweredQuestions,
  setGameConfig, persistRoom, stateRef, lastHashRef,
  showError, reconnectSession,
}) {
  const { lang } = useContext(I18nContext);
  const [loading, setLoading] = useState(false);

  async function createRoom() {
    if (!playerName.trim()) return showError("Por favor ingresa tu nombre");
    clearStaleAnsweredQuestions(null);
    setAnsweredQuestions(new Set());
    const adminId = generateId();
    const code = generateRoomCode();
    const questions = await selectQuestions(gameConfig, lang);
    const { scores, answers } = buildInitialScoresAndAnswers([adminId]);
    const room = {
      code, mode: gameConfig.mode, config: gameConfig,
      admin: { name: playerName, id: adminId },
      king: null, aspirants: [], questions,
      currentQuestionIndex: 0, currentAnswers: [],
      answeredAspirants: [], status: ROOM_STATUS.WAITING,
      scores, answers,
      createdAt: new Date().toISOString(),
      startedAt: null, finishedAt: null,
    };
    try {
      setLoading(true);
      await storage.set(buildRoomKey(code), JSON.stringify(room));
      setRoomCode(code);
      setPlayerRole(PLAYER_ROLE.ADMIN);
      setCurrentRoom(room);
      lastHashRef.current = roomHash(room);
      setGameState(GAME_STATE.LOBBY);
      saveSession({ code, name: playerName, role: PLAYER_ROLE.ADMIN });
    } catch (err) {
      showError("Error al crear la sala: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  async function joinRoom() {
    if (!playerName.trim() || !roomCode.trim())
      return showError("Por favor ingresa tu nombre y código de sala");
    const code = roomCode.toUpperCase();
    setLoading(true);
    clearAnsweredQuestions(code);
    clearStaleAnsweredQuestions(code);
    setAnsweredQuestions(new Set());
    try {
      let existingRoom = null;
      try {
        const result = await storage.get(buildRoomKey(code));
        existingRoom = JSON.parse(result.value);
      } catch (_) {
        return showError("Sala no encontrada. Verifica el código.");
      }
      if (isPlayerInRoom(existingRoom, playerName)) {
        await reconnectSession({ code, name: playerName });
        return;
      }
      const { room } = await roomApi.join(code, playerName);
      setPlayerRole(PLAYER_ROLE.ASPIRANT);
      setCurrentRoom(room);
      lastHashRef.current = roomHash(room);
      setGameState(GAME_STATE.LOBBY);
      saveSession({ code, name: playerName, role: PLAYER_ROLE.ASPIRANT });
    } catch (err) {
      showError("Error al unirse: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  async function startGame() {
    try {
      await persistRoom({
        ...currentRoom,
        status: ROOM_STATUS.PICKING_KING,
        startedAt: new Date().toISOString(),
      });
      setGameState(GAME_STATE.PICKING_KING);
    } catch (err) {
      showError("Error al iniciar: " + err.message);
    }
  }

  async function pickKing(personId) {
    try {
      const everyone = [currentRoom.admin, ...(currentRoom.aspirants || [])];
      const chosen = everyone.find((p) => p.id === personId);
      if (!chosen) return;
      const aspirants = currentRoom.aspirants.filter((a) => a.id !== personId);
      const allIds = [currentRoom.admin?.id, ...aspirants.map((a) => a.id), personId].filter(Boolean);
      const scores = { ...currentRoom.scores };
      const answers = { ...currentRoom.answers };
      allIds.forEach((id) => {
        if (scores[id] === undefined) scores[id] = 0;
        if (!answers[id]) answers[id] = [];
      });
      const room = {
        ...currentRoom, king: chosen, aspirants, scores, answers,
        status: ROOM_STATUS.KING_REVEAL,
        pendingStatus: currentRoom.mode === GAME_MODE.CUSTOM
          ? ROOM_STATUS.WAITING_QUESTION
          : ROOM_STATUS.ANSWERING,
      };
      await persistRoom(room);
      if (personId === currentRoom.admin.id) setPlayerRole(PLAYER_ROLE.ADMIN_KING);
      setGameState(GAME_STATE.KING_REVEAL);
    } catch (err) {
      showError("Error al elegir líder: " + err.message);
    }
  }

  async function pickRandomKing(personId) { await pickKing(personId); }

  async function confirmKingAndStart() {
    try {
      const room = { ...currentRoom, status: currentRoom.pendingStatus, pendingStatus: null };
      await persistRoom(room);
      const role = stateRef.current.playerRole;
      const isKingRole = role === PLAYER_ROLE.KING || role === PLAYER_ROLE.ADMIN_KING;
      const isCustom = room.mode === GAME_MODE.CUSTOM;
      setGameState(isKingRole && isCustom ? GAME_STATE.CREATING_QUESTION : isCustom ? GAME_STATE.WAITING_QUESTION : GAME_STATE.PLAYING);
    } catch (err) {
      showError("Error al iniciar: " + err.message);
    }
  }

  async function updateRoomConfig(newConfig) {
    try {
      const room = {
        ...currentRoom,
        mode: newConfig.mode,
        config: newConfig,
        questions: await selectQuestions(newConfig, lang),
      };
      await persistRoom(room);
      setGameConfig(newConfig);
    } catch (err) {
      showError("Error al actualizar configuración: " + err.message);
    }
  }

  async function rematch() {
    try {
      const config = currentRoom.config ?? DEFAULT_GAME_CONFIG;
      const activeIds = new Set(Object.keys(currentRoom.scores || {}));
      const playerMap = new Map();
      (currentRoom.aspirants || []).forEach((p) => {
        if (p.id !== currentRoom.admin?.id)
          playerMap.set(p.id, p);
      });
      if (
        currentRoom.king &&
        currentRoom.king.id !== currentRoom.admin?.id &&
        !playerMap.has(currentRoom.king.id)
      ) {
        playerMap.set(currentRoom.king.id, currentRoom.king);
      }
      const allPlayers = Array.from(playerMap.values());
      const allIds = [...(currentRoom.admin ? [currentRoom.admin.id] : []), ...allPlayers.map((p) => p.id)];
      const { scores, answers } = buildInitialScoresAndAnswers(allIds);
      const room = {
        ...currentRoom,
        king: null, aspirants: allPlayers,
        questions: await selectQuestions(config, lang),
        currentQuestionIndex: 0, currentAnswers: [],
        answeredAspirants: [], status: ROOM_STATUS.WAITING,
        scores, answers,
        pickingAnimation: null, startedAt: null, finishedAt: null,
      };
      await persistRoom(room);
      setAnsweredQuestions(new Set());
      saveAnsweredQuestions(roomCode, new Set());
      clearAnsweredQuestions(roomCode);
      clearStaleAnsweredQuestions(roomCode);
      setPlayerRole(PLAYER_ROLE.ADMIN);
      setGameState(GAME_STATE.LOBBY);
    } catch (err) {
      showError("Error al iniciar revancha: " + err.message);
    }
  }

  async function resetGame() {
    const { roomCode: code, currentRoom: room, playerRole: role, playerName: name } = stateRef.current;
    if (code && room) {
      if (role === PLAYER_ROLE.ADMIN || role === PLAYER_ROLE.ADMIN_KING) {
        try {
          await storage.set(buildRoomKey(code), JSON.stringify({ ...room, status: "closed" }));
        } catch (_) { }
      } else {
        await removePlayerFromRoom(room, code, name);
      }
    }
    clearSession();
    if (code) clearAnsweredQuestions(code);
    clearStaleAnsweredQuestions(null)
    lastHashRef.current = "";
    setGameState(GAME_STATE.MENU);
    setCurrentRoom(null);
    setAnsweredQuestions(new Set());
    setRoomCode("");
    setPlayerRole(null);
  }

  async function removePlayerFromRoom(room, code, name) {
    try {
      const myId = findPlayerId(room, name);
      const updated = {
        ...room,
        aspirants: (room.aspirants || []).filter((a) => a.name !== name),
      };
      if (myId) {
        delete updated.scores?.[myId];
        delete updated.answers?.[myId];
        updated.currentAnswers = (updated.currentAnswers || []).filter((a) => a.aspirantId !== myId);
        updated.answeredAspirants = (updated.answeredAspirants || []).filter((id) => id !== myId);
      }
      await storage.set(buildRoomKey(code), JSON.stringify(updated));
    } catch (_) { }
  }

  return {
    loading,
    createRoom, joinRoom, startGame,
    pickKing, pickRandomKing, confirmKingAndStart,
    updateRoomConfig, rematch, resetGame,
  };
}