import { useState, useEffect, useRef, useCallback } from "react";
import storage from "../services/storage.js";
import {
  GAME_STATE, ROOM_STATUS, PLAYER_ROLE, GAME_MODE,
  POLL_BASE_MS, POLL_MAX_MS, POLL_FAIL_TOAST, TOAST_DURATION_MS,
} from "../constants/game.js";
import { derivePlayerRole, isPlayerInRoom } from "../utils/room.js";
import {
  saveSession, clearSession,
  saveAnsweredQuestions, loadAnsweredQuestions,
} from "../utils/session.js";

function buildRoomKey(code) { return `room_${code}`; }

export function roomHash(room) {
  if (!room) return "";
  return [
    room.status,
    room.currentQuestionIndex,
    room.finishedAt,
    room.startedAt,
    room.king?.id ?? "",
    room.pickingAnimation?.winnerId ?? "",
    (room.currentAnswers ?? []).length,
    (room.answeredAspirants ?? []).length,
    JSON.stringify(room.scores ?? {}),
  ].join("|");
}

// ── Mapa de transiciones O(1) ──────────────────────────────────────────────
// Cada entrada: status → función(gs, role, room, code, callbacks) → nextState | null
function buildTransitionMap(callbacks) {
  const { setAnsweredQuestions, saveAnsweredQuestions: saveAQ, showError, clearSession: cs, setGameState, setCurrentRoom, setRoomCode, setPlayerRole } = callbacks;

  return {
    // FINISHED siempre tiene prioridad — se evalúa primero en resolveTransition
    [ROOM_STATUS.FINISHED]: (gs) =>
      gs !== GAME_STATE.RESULTS ? GAME_STATE.RESULTS : null,

    [ROOM_STATUS.PICKING_KING]: (gs) =>
      gs === GAME_STATE.LOBBY ? GAME_STATE.PICKING_KING : null,

    [ROOM_STATUS.KING_REVEAL]: (gs) =>
      gs === GAME_STATE.PICKING_KING ? GAME_STATE.KING_REVEAL : null,

    [ROOM_STATUS.ANSWERING]: (gs, _role, room) => {
      const validFrom = [GAME_STATE.LOBBY, GAME_STATE.PICKING_KING, GAME_STATE.KING_REVEAL];
      if (validFrom.includes(gs)) return GAME_STATE.PLAYING;
      if (gs === GAME_STATE.WAITING_QUESTION && room.mode === GAME_MODE.CUSTOM)
        return GAME_STATE.PLAYING;
      return null;
    },

    [ROOM_STATUS.WAITING_QUESTION]: (gs, role, room) => {
      const validFrom = [GAME_STATE.PICKING_KING, GAME_STATE.KING_REVEAL, GAME_STATE.PLAYING, GAME_STATE.WAITING_QUESTION];
      if (!validFrom.includes(gs) || room.mode !== GAME_MODE.CUSTOM) return null;
      const isKingRole = role === PLAYER_ROLE.KING || role === PLAYER_ROLE.ADMIN_KING;
      return isKingRole ? GAME_STATE.CREATING_QUESTION : GAME_STATE.WAITING_QUESTION;
    },

    [ROOM_STATUS.WAITING]: (gs, _role, _room, code) => {
      if (gs === GAME_STATE.RESULTS) {
        setAnsweredQuestions(new Set());
        saveAQ(code, new Set());
        return GAME_STATE.LOBBY;
      }
      return null;
    },
  };
}

function resolveTransition(room, gs, role, code, transitionMap) {
  // FINISHED siempre primero
  if (room.status === ROOM_STATUS.FINISHED) {
    return transitionMap[ROOM_STATUS.FINISHED]?.(gs, role, room, code) ?? null;
  }
  const handler = transitionMap[room.status];
  return handler ? handler(gs, role, room, code) : null;
}

// ── Hook ───────────────────────────────────────────────────────────────────
export default function useRoomState() {
  const [gameState, setGameState] = useState(GAME_STATE.MENU);
  const [roomCode, setRoomCode] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [playerRole, setPlayerRole] = useState(null);
  const [currentRoom, setCurrentRoom] = useState(null);
  const [answeredQuestions, setAnsweredQuestions] = useState(new Set());
  const [reconnecting, setReconnecting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const stateRef = useRef({ roomCode: "", currentRoom: null, gameState: GAME_STATE.MENU, playerRole: null, playerName: "" });
  const lastHashRef = useRef("");

  // refs de control del polling
  const pollTimerRef = useRef(null);
  const pollIntervalRef = useRef(POLL_BASE_MS);  // intervalo actual (crece con backoff)
  const failCountRef = useRef(0);              // fallos consecutivos
  const isHiddenRef = useRef(false);          // pestaña oculta

  useEffect(() => { stateRef.current.roomCode = roomCode; }, [roomCode]);
  useEffect(() => { stateRef.current.currentRoom = currentRoom; }, [currentRoom]);
  useEffect(() => { stateRef.current.gameState = gameState; }, [gameState]);
  useEffect(() => { stateRef.current.playerRole = playerRole; }, [playerRole]);
  useEffect(() => { stateRef.current.playerName = playerName; }, [playerName]);

  const showError = useCallback((msg) => {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(null), TOAST_DURATION_MS);
  }, []);

  const persistRoom = useCallback(async (room) => {
    await storage.set(buildRoomKey(stateRef.current.roomCode), JSON.stringify(room));
    setCurrentRoom(room);
    lastHashRef.current = roomHash(room);
  }, []);

  // ── Transiciones ──────────────────────────────────────────────────────
  const handleRoomTransition = useCallback((room, gs, role, name, code) => {
    // Sala cerrada
    if (room.status === "closed") {
      clearSession();
      setGameState(GAME_STATE.MENU);
      setCurrentRoom(null);
      setRoomCode("");
      setPlayerRole(null);
      lastHashRef.current = "";
      showError("El administrador cerró la sala.");
      return;
    }

    // Jugador expulsado
    if (
      room.status === ROOM_STATUS.WAITING &&
      gs !== GAME_STATE.LOBBY &&
      gs !== GAME_STATE.RESULTS &&
      !isPlayerInRoom(room, name)
    ) {
      clearSession();
      setGameState(GAME_STATE.MENU);
      setCurrentRoom(null);
      setRoomCode("");
      setPlayerRole(null);
      lastHashRef.current = "";
      showError("La sala fue cerrada por el administrador.");
      return;
    }

    // Ajuste de rol
    let effectiveRole = role;
    if (room.status === ROOM_STATUS.WAITING) {
      if (role === PLAYER_ROLE.ADMIN_KING) effectiveRole = PLAYER_ROLE.ADMIN;
      else if (role === PLAYER_ROLE.KING) effectiveRole = PLAYER_ROLE.ASPIRANT;
      if (effectiveRole !== role) setPlayerRole(effectiveRole);
    }
    if (room.king && room.status !== ROOM_STATUS.WAITING && room.status !== ROOM_STATUS.PICKING_KING) {
      if (room.king.name === name && role === PLAYER_ROLE.ADMIN) { setPlayerRole(PLAYER_ROLE.ADMIN_KING); effectiveRole = PLAYER_ROLE.ADMIN_KING; }
      if (room.king.name === name && role === PLAYER_ROLE.ASPIRANT) { setPlayerRole(PLAYER_ROLE.KING); effectiveRole = PLAYER_ROLE.KING; }
    }

    const transitionMap = buildTransitionMap({
      setAnsweredQuestions,
      saveAnsweredQuestions,
      showError,
      clearSession,
      setGameState,
      setCurrentRoom,
      setRoomCode,
      setPlayerRole,
    });

    const nextState = resolveTransition(room, gs, effectiveRole, code, transitionMap);
    if (nextState !== null) setGameState(nextState);

  }, [showError, setAnsweredQuestions]);

  // ── Polling con backoff + visibilitychange ────────────────────────────
  const schedulePoll = useCallback(() => {
    clearTimeout(pollTimerRef.current);
    if (isHiddenRef.current) return;  // pestaña oculta → no programar
    pollTimerRef.current = setTimeout(doPoll, pollIntervalRef.current);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function doPoll() {
    const { roomCode: code, gameState: gs, playerRole: role, playerName: name } = stateRef.current;
    if (!code || gs === GAME_STATE.MENU) return;

    try {
      const result = await storage.get(buildRoomKey(code));
      const room = JSON.parse(result.value);
      const newHash = roomHash(room);

      // éxito → resetear backoff
      failCountRef.current = 0;
      pollIntervalRef.current = POLL_BASE_MS;

      if (newHash !== lastHashRef.current) {
        lastHashRef.current = newHash;
        setCurrentRoom(room);
        handleRoomTransition(room, gs, role, name, code);
      }
    } catch (err) {
      failCountRef.current += 1;

      // backoff exponencial con techo
      pollIntervalRef.current = Math.min(
        POLL_BASE_MS * Math.pow(2, failCountRef.current - 1),
        POLL_MAX_MS,
      );

      // toast tras N fallos consecutivos
      if (failCountRef.current === POLL_FAIL_TOAST) {
        showError("Problemas de conexión. Reintentando...");
      }

      console.warn(`pollRoom fallo #${failCountRef.current}:`, err.message);
    }

    // programar siguiente tick
    schedulePoll();
  }

  // iniciar / detener polling según gameState y roomCode
  useEffect(() => {
    if (gameState === GAME_STATE.MENU || !roomCode) {
      clearTimeout(pollTimerRef.current);
      pollIntervalRef.current = POLL_BASE_MS;
      failCountRef.current = 0;
      return;
    }
    // arrancar primer tick
    schedulePoll();
    return () => clearTimeout(pollTimerRef.current);
  }, [gameState, roomCode, schedulePoll]);

  // pausar polling cuando la pestaña se oculta
  useEffect(() => {
    function onVisibilityChange() {
      isHiddenRef.current = document.hidden;
      if (!document.hidden) {
        // reanudar inmediatamente al volver
        pollIntervalRef.current = POLL_BASE_MS;
        failCountRef.current = 0;
        schedulePoll();
      } else {
        clearTimeout(pollTimerRef.current);
      }
    }
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, [schedulePoll]);

  // ── Reconexión ────────────────────────────────────────────────────────
  const reconnectSession = useCallback(async (session) => {
    const { code, name } = session;
    if (!code || !name) { clearSession(); return; }
    setReconnecting(true);
    try {
      const result = await storage.get(buildRoomKey(code));
      const room = JSON.parse(result.value);
      const role = derivePlayerRole(room, name);
      setRoomCode(code);
      setPlayerName(name);
      setCurrentRoom(room);
      setPlayerRole(role);
      lastHashRef.current = roomHash(room);
      const savedAnswered = loadAnsweredQuestions(code);
      const myId = findPlayerId(room, name);
      if (myId && room.answers?.[myId] && room.questions) {
        room.answers[myId].forEach((entry) => {
          const idx = room.questions.findIndex((q) => String(q.id) === String(entry.questionId));
          if (idx !== -1) savedAnswered.add(idx);
        });
      }
      setAnsweredQuestions(savedAnswered);
      setGameState(deriveGameState(room, role));
      saveSession({ code, name, role });
    } catch (_) {
      clearSession();
    } finally {
      setReconnecting(false);
    }
  }, []);

  return {
    gameState, roomCode, playerName, playerRole,
    currentRoom, answeredQuestions, reconnecting, errorMsg,
    setGameState, setRoomCode, setPlayerName, setPlayerRole,
    setCurrentRoom, setAnsweredQuestions,
    showError, persistRoom, stateRef, lastHashRef,
    reconnectSession,
  };
}

// ── helpers locales ────────────────────────────────────────────────────────
function findPlayerId(room, name) {
  return (room.aspirants || []).find((a) => a.name === name)?.id
    || (room.admin?.name === name ? room.admin.id : null)
    || (room.king?.name === name ? room.king.id : null);
}

function deriveGameState(room, role) {
  const isKingRole = role === PLAYER_ROLE.KING || role === PLAYER_ROLE.ADMIN_KING;
  return ({
    [ROOM_STATUS.WAITING]: GAME_STATE.LOBBY,
    [ROOM_STATUS.PICKING_KING]: GAME_STATE.PICKING_KING,
    [ROOM_STATUS.KING_REVEAL]: GAME_STATE.KING_REVEAL,
    [ROOM_STATUS.ANSWERING]: GAME_STATE.PLAYING,
    [ROOM_STATUS.FINISHED]: GAME_STATE.RESULTS,
    [ROOM_STATUS.WAITING_QUESTION]: isKingRole
      ? GAME_STATE.CREATING_QUESTION
      : GAME_STATE.WAITING_QUESTION,
  })[room.status] ?? GAME_STATE.LOBBY;
}