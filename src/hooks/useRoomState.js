import { useState, useEffect, useRef, useCallback } from "react";
import storage from "../services/storage.js";
import {
  GAME_STATE, ROOM_STATUS, PLAYER_ROLE, GAME_MODE,
  POLLING_INTERVAL_MS, TOAST_DURATION_MS,
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

export default function useRoomState() {
  const [gameState, setGameState]       = useState(GAME_STATE.MENU);
  const [roomCode, setRoomCode]         = useState("");
  const [playerName, setPlayerName]     = useState("");
  const [playerRole, setPlayerRole]     = useState(null);
  const [currentRoom, setCurrentRoom]   = useState(null);
  const [answeredQuestions, setAnsweredQuestions] = useState(new Set());
  const [reconnecting, setReconnecting] = useState(false);
  const [errorMsg, setErrorMsg]         = useState(null);

  const stateRef        = useRef({ roomCode: "", currentRoom: null, gameState: GAME_STATE.MENU, playerRole: null, playerName: "" });
  const lastHashRef     = useRef("");

  useEffect(() => { stateRef.current.roomCode    = roomCode;    }, [roomCode]);
  useEffect(() => { stateRef.current.currentRoom = currentRoom; }, [currentRoom]);
  useEffect(() => { stateRef.current.gameState   = gameState;   }, [gameState]);
  useEffect(() => { stateRef.current.playerRole  = playerRole;  }, [playerRole]);
  useEffect(() => { stateRef.current.playerName  = playerName;  }, [playerName]);

  const showError = useCallback((msg) => {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(null), TOAST_DURATION_MS);
  }, []);

  // ── Persistir sala ──────────────────────────────────────────────────────
  const persistRoom = useCallback(async (room) => {
    await storage.set(buildRoomKey(stateRef.current.roomCode), JSON.stringify(room));
    setCurrentRoom(room);
    lastHashRef.current = roomHash(room);
  }, []);

  // ── Transiciones de pantalla ────────────────────────────────────────────
  const handleRoomTransition = useCallback((room, gs, role, name, code) => {
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

    let effectiveRole = role;

    if (room.status === ROOM_STATUS.WAITING) {
      if (role === PLAYER_ROLE.ADMIN_KING) effectiveRole = PLAYER_ROLE.ADMIN;
      else if (role === PLAYER_ROLE.KING)  effectiveRole = PLAYER_ROLE.ASPIRANT;
      if (effectiveRole !== role) setPlayerRole(effectiveRole);
    }

    if (room.king && room.status !== ROOM_STATUS.WAITING && room.status !== ROOM_STATUS.PICKING_KING) {
      if (room.king.name === name && role === PLAYER_ROLE.ADMIN)    { setPlayerRole(PLAYER_ROLE.ADMIN_KING); effectiveRole = PLAYER_ROLE.ADMIN_KING; }
      if (room.king.name === name && role === PLAYER_ROLE.ASPIRANT) { setPlayerRole(PLAYER_ROLE.KING);       effectiveRole = PLAYER_ROLE.KING; }
    }

    const isKingRole = effectiveRole === PLAYER_ROLE.KING || effectiveRole === PLAYER_ROLE.ADMIN_KING;

    // FINISHED siempre tiene prioridad — va primero
    const transitions = [
      { from: null,
        status: ROOM_STATUS.FINISHED,
        to: GAME_STATE.RESULTS,
        condition: () => gs !== GAME_STATE.RESULTS },

      { from: [GAME_STATE.LOBBY],
        status: ROOM_STATUS.PICKING_KING,
        to: GAME_STATE.PICKING_KING },

      { from: [GAME_STATE.PICKING_KING],
        status: ROOM_STATUS.KING_REVEAL,
        to: GAME_STATE.KING_REVEAL },

      { from: [GAME_STATE.LOBBY, GAME_STATE.PICKING_KING, GAME_STATE.KING_REVEAL],
        status: ROOM_STATUS.ANSWERING,
        to: GAME_STATE.PLAYING },

      { from: [GAME_STATE.PICKING_KING, GAME_STATE.KING_REVEAL, GAME_STATE.PLAYING, GAME_STATE.WAITING_QUESTION],
        status: ROOM_STATUS.WAITING_QUESTION,
        mode: GAME_MODE.CUSTOM,
        to: isKingRole ? GAME_STATE.CREATING_QUESTION : GAME_STATE.WAITING_QUESTION },

      { from: [GAME_STATE.WAITING_QUESTION],
        status: ROOM_STATUS.ANSWERING,
        mode: GAME_MODE.CUSTOM,
        to: GAME_STATE.PLAYING },

      { from: [GAME_STATE.RESULTS],
        status: ROOM_STATUS.WAITING,
        to: GAME_STATE.LOBBY,
        onTransition: () => {
          setAnsweredQuestions(new Set());
          saveAnsweredQuestions(code, new Set());
        }},
    ];

    for (const t of transitions) {
      if (
        (t.from === null || t.from.includes(gs)) &&
        room.status === t.status &&
        (!t.mode || room.mode === t.mode) &&
        (!t.condition || t.condition())
      ) {
        t.onTransition?.();
        setGameState(t.to);
        return;
      }
    }
  }, [showError]);

  // ── Polling ─────────────────────────────────────────────────────────────
  const pollRoom = useCallback(async () => {
    const { roomCode: code, gameState: gs, playerRole: role, playerName: name } = stateRef.current;
    if (!code) return;
    try {
      const result  = await storage.get(buildRoomKey(code));
      const room    = JSON.parse(result.value);
      const newHash = roomHash(room);
      if (newHash !== lastHashRef.current) {
        lastHashRef.current = newHash;
        setCurrentRoom(room);
        handleRoomTransition(room, gs, role, name, code);
      }
    } catch (err) {
      console.error("pollRoom:", err);
    }
  }, [handleRoomTransition]);

  useEffect(() => {
    if (gameState === GAME_STATE.MENU || !roomCode) return;
    const timer = setInterval(pollRoom, POLLING_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [gameState, roomCode, pollRoom]);

  // ── Reconexión ──────────────────────────────────────────────────────────
  const reconnectSession = useCallback(async (session) => {
    const { code, name } = session;
    if (!code || !name) { clearSession(); return; }
    setReconnecting(true);
    try {
      const result = await storage.get(buildRoomKey(code));
      const room   = JSON.parse(result.value);
      const role   = derivePlayerRole(room, name);

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
    // estado
    gameState, roomCode, playerName, playerRole,
    currentRoom, answeredQuestions, reconnecting, errorMsg,
    // setters
    setGameState, setRoomCode, setPlayerName, setPlayerRole,
    setCurrentRoom, setAnsweredQuestions,
    // utils
    showError, persistRoom, stateRef, lastHashRef,
    // reconexión
    reconnectSession,
  };
}

// helpers locales
function findPlayerId(room, name) {
  return (room.aspirants || []).find((a) => a.name === name)?.id
    || (room.admin?.name === name ? room.admin.id : null)
    || (room.king?.name  === name ? room.king.id  : null);
}

function deriveGameState(room, role) {
  const isKingRole = role === PLAYER_ROLE.KING || role === PLAYER_ROLE.ADMIN_KING;
  return ({
    [ROOM_STATUS.WAITING]:          GAME_STATE.LOBBY,
    [ROOM_STATUS.PICKING_KING]:     GAME_STATE.PICKING_KING,
    [ROOM_STATUS.KING_REVEAL]:      GAME_STATE.KING_REVEAL,
    [ROOM_STATUS.ANSWERING]:        GAME_STATE.PLAYING,
    [ROOM_STATUS.FINISHED]:         GAME_STATE.RESULTS,
    [ROOM_STATUS.WAITING_QUESTION]: isKingRole ? GAME_STATE.CREATING_QUESTION : GAME_STATE.WAITING_QUESTION,
  })[room.status] ?? GAME_STATE.LOBBY;
}