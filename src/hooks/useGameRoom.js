import { useState, useEffect, useRef, useCallback, useContext } from "react";
import { I18nContext, loadQuestions } from "../i18n/i18nContext.jsx";
import { DEFAULT_CATEGORIES } from "../constants/questionCategories.js";
import storage from "../services/storage.js";
import { roomApi } from "../services/roomApi.js";
import {
  GAME_STATE, ROOM_STATUS, PLAYER_ROLE, GAME_MODE,
  DEFAULT_GAME_CONFIG, POLLING_INTERVAL_MS, TOAST_DURATION_MS,
} from "../constants/game.js";
import { saveSession, clearSession, saveAnsweredQuestions, loadAnsweredQuestions } from "../utils/session.js";
import { shuffleArray, generateRoomCode, generateId, derivePlayerRole, isPlayerInRoom, buildInitialScoresAndAnswers } from "../utils/room.js";

function buildRoomKey(code) { return `room_${code}`; }

/**
 * Selecciona y mezcla preguntas de las categorías activas en la config.
 * Si no hay categorías configuradas cae en DEFAULT_CATEGORIES.
 */
async function selectQuestions(config, lang) {
  if (config.mode === GAME_MODE.CUSTOM) return [];
  const cats = config.categories?.length ? config.categories : DEFAULT_CATEGORIES;
  const pool = await loadQuestions(lang, cats);
  return shuffleArray(pool).slice(0, config.rounds);
}

// Hash rápido para evitar re-renders innecesarios en el polling
function roomHash(room) {
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

export default function useGameRoom() {
  const { lang } = useContext(I18nContext);

  const [gameState, setGameState] = useState(GAME_STATE.MENU);
  const [roomCode, setRoomCode] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [playerRole, setPlayerRole] = useState(null);
  const [currentRoom, setCurrentRoom] = useState(null);
  const [loading, setLoading] = useState(false);
  const [answeredQuestions, setAnsweredQuestions] = useState(new Set());
  const [gameConfig, setGameConfig] = useState(DEFAULT_GAME_CONFIG);
  const [reconnecting, setReconnecting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const stateRef = useRef({ roomCode: "", currentRoom: null, gameState: GAME_STATE.MENU, playerRole: null, playerName: "" });
  const lastRoomHashRef = useRef("");

  useEffect(() => { stateRef.current.roomCode = roomCode; }, [roomCode]);
  useEffect(() => { stateRef.current.currentRoom = currentRoom; }, [currentRoom]);
  useEffect(() => { stateRef.current.gameState = gameState; }, [gameState]);
  useEffect(() => { stateRef.current.playerRole = playerRole; }, [playerRole]);
  useEffect(() => { stateRef.current.playerName = playerName; }, [playerName]);

  const showError = useCallback((msg) => {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(null), TOAST_DURATION_MS);
  }, []);

  useEffect(() => {
    if (gameState === GAME_STATE.MENU || !roomCode) return;
    const timer = setInterval(pollRoom, POLLING_INTERVAL_MS);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState, roomCode]);

  async function pollRoom() {
    const { roomCode: code, gameState: gs, playerRole: role, playerName: name } = stateRef.current;
    if (!code) return;
    try {
      const result = await storage.get(buildRoomKey(code));
      const room = JSON.parse(result.value);
      const newHash = roomHash(room);
      if (newHash !== lastRoomHashRef.current) {
        lastRoomHashRef.current = newHash;
        setCurrentRoom(room);
        handleRoomTransition(room, gs, role, name, code);
      }
    } catch (err) { console.error("pollRoom:", err); }
  }

  function handleRoomTransition(room, gs, role, name, code) {
    if (room.status === "closed") {
      clearSession();
      setGameState(GAME_STATE.MENU); setCurrentRoom(null); setRoomCode(""); setPlayerRole(null);
      lastRoomHashRef.current = "";
      showError("El administrador cerró la sala.");
      return;
    }
    if (room.status === ROOM_STATUS.WAITING && gs !== GAME_STATE.LOBBY && gs !== GAME_STATE.RESULTS && !isPlayerInRoom(room, name)) {
      clearSession();
      setGameState(GAME_STATE.MENU); setCurrentRoom(null); setRoomCode(""); setPlayerRole(null);
      lastRoomHashRef.current = "";
      showError("La sala fue cerrada por el administrador.");
      return;
    }
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
    const isKingRole = effectiveRole === PLAYER_ROLE.KING || effectiveRole === PLAYER_ROLE.ADMIN_KING;
    const transitions = [
      { from: [GAME_STATE.LOBBY], status: ROOM_STATUS.PICKING_KING, to: GAME_STATE.PICKING_KING },
      { from: [GAME_STATE.PICKING_KING], status: ROOM_STATUS.KING_REVEAL, to: GAME_STATE.KING_REVEAL },
      { from: [GAME_STATE.LOBBY, GAME_STATE.PICKING_KING, GAME_STATE.KING_REVEAL], status: ROOM_STATUS.ANSWERING, to: GAME_STATE.PLAYING },
      { from: [GAME_STATE.PICKING_KING, GAME_STATE.KING_REVEAL, GAME_STATE.PLAYING, GAME_STATE.WAITING_QUESTION], status: ROOM_STATUS.WAITING_QUESTION, mode: GAME_MODE.CUSTOM, to: isKingRole ? GAME_STATE.CREATING_QUESTION : GAME_STATE.WAITING_QUESTION },
      { from: [GAME_STATE.WAITING_QUESTION], status: ROOM_STATUS.ANSWERING, mode: GAME_MODE.CUSTOM, to: GAME_STATE.PLAYING },
      { from: null, status: ROOM_STATUS.FINISHED, to: GAME_STATE.RESULTS, condition: () => gs !== GAME_STATE.RESULTS },
      { from: [GAME_STATE.RESULTS], status: ROOM_STATUS.WAITING, to: GAME_STATE.LOBBY, onTransition: () => { setAnsweredQuestions(new Set()); saveAnsweredQuestions(code, new Set()); } },
    ];
    for (const t of transitions) {
      if ((t.from === null || t.from.includes(gs)) && room.status === t.status && (!t.mode || room.mode === t.mode) && (!t.condition || t.condition())) {
        t.onTransition?.();
        setGameState(t.to);
        return;
      }
    }
  }

  async function reconnectSession(session) {
    const { code, name } = session;
    if (!code || !name) { clearSession(); return; }
    setReconnecting(true);
    try {
      const result = await storage.get(buildRoomKey(code));
      const room = JSON.parse(result.value);
      const role = derivePlayerRole(room, name);
      setRoomCode(code); setPlayerName(name); setCurrentRoom(room); setPlayerRole(role);
      lastRoomHashRef.current = roomHash(room);
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
    } catch (_) { clearSession(); }
    finally { setReconnecting(false); }
  }

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
      [ROOM_STATUS.WAITING_QUESTION]: isKingRole ? GAME_STATE.CREATING_QUESTION : GAME_STATE.WAITING_QUESTION,
    })[room.status] ?? GAME_STATE.LOBBY;
  }

  async function createRoom() {
    if (!playerName.trim()) return showError("Por favor ingresa tu nombre");
    const adminId = generateId();
    const code = generateRoomCode();
    const questions = await selectQuestions(gameConfig, lang);
    const { scores, answers } = buildInitialScoresAndAnswers([adminId]);
    const room = {
      code, mode: gameConfig.mode, config: gameConfig,
      admin: { name: playerName, id: adminId }, king: null, aspirants: [], questions,
      currentQuestionIndex: 0, currentAnswers: [], answeredAspirants: [],
      status: ROOM_STATUS.WAITING, scores, answers,
      createdAt: new Date().toISOString(), startedAt: null, finishedAt: null,
    };
    try {
      setLoading(true);
      await storage.set(buildRoomKey(code), JSON.stringify(room));
      setRoomCode(code); setPlayerRole(PLAYER_ROLE.ADMIN); setCurrentRoom(room);
      lastRoomHashRef.current = roomHash(room);
      setGameState(GAME_STATE.LOBBY);
      saveSession({ code, name: playerName, role: PLAYER_ROLE.ADMIN });
    } catch (err) { showError("Error al crear la sala: " + err.message); }
    finally { setLoading(false); }
  }

  async function joinRoom() {
    if (!playerName.trim() || !roomCode.trim()) return showError("Por favor ingresa tu nombre y código de sala");
    const code = roomCode.toUpperCase();
    setLoading(true);
    try {
      let existingRoom = null;
      try { const result = await storage.get(buildRoomKey(code)); existingRoom = JSON.parse(result.value); }
      catch (_) { return showError("Sala no encontrada. Verifica el código."); }
      if (isPlayerInRoom(existingRoom, playerName)) { await reconnectSession({ code, name: playerName }); return; }
      const { room } = await roomApi.join(code, playerName);
      setPlayerRole(PLAYER_ROLE.ASPIRANT); setCurrentRoom(room);
      lastRoomHashRef.current = roomHash(room);
      setGameState(GAME_STATE.LOBBY);
      saveSession({ code, name: playerName, role: PLAYER_ROLE.ASPIRANT });
    } catch (err) { showError("Error al unirse: " + err.message); }
    finally { setLoading(false); }
  }

  async function startGame() {
    try { await persistRoom({ ...currentRoom, status: ROOM_STATUS.PICKING_KING, startedAt: new Date().toISOString() }); setGameState(GAME_STATE.PICKING_KING); }
    catch (err) { showError("Error al iniciar: " + err.message); }
  }

  async function pickKing(personId) {
    try {
      const everyone = [currentRoom.admin, ...(currentRoom.aspirants || [])];
      const chosen = everyone.find((p) => p.id === personId);
      if (!chosen) return;
      const aspirants = currentRoom.aspirants.filter((a) => a.id !== personId);
      const allPlayerIds = [currentRoom.admin?.id, ...aspirants.map((a) => a.id), personId].filter(Boolean);
      const scores = { ...currentRoom.scores }; const answers = { ...currentRoom.answers };
      allPlayerIds.forEach((id) => { if (scores[id] === undefined) scores[id] = 0; if (!answers[id]) answers[id] = []; });
      const room = { ...currentRoom, king: chosen, aspirants, scores, answers, status: ROOM_STATUS.KING_REVEAL, pendingStatus: currentRoom.mode === GAME_MODE.CUSTOM ? ROOM_STATUS.WAITING_QUESTION : ROOM_STATUS.ANSWERING };
      await persistRoom(room);
      if (personId === currentRoom.admin.id) setPlayerRole(PLAYER_ROLE.ADMIN_KING);
      setGameState(GAME_STATE.KING_REVEAL);
    } catch (err) { showError("Error al elegir líder: " + err.message); }
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
    } catch (err) { showError("Error al iniciar: " + err.message); }
  }

  async function submitCustomQuestion(question) {
    try {
      const questions = [...(currentRoom.questions || [])];
      questions[currentRoom.currentQuestionIndex] = question;
      await persistRoom({ ...currentRoom, questions, status: ROOM_STATUS.ANSWERING, currentAnswers: [], answeredAspirants: [] });
      setGameState(GAME_STATE.PLAYING);
    } catch (err) { showError("Error al enviar pregunta: " + err.message); }
  }

  async function submitAnswer(answer) {
    const question = currentRoom.questions[currentRoom.currentQuestionIndex];
    const aspirantId = findPlayerId(currentRoom, playerName);
    const newAnswered = new Set(answeredQuestions).add(currentRoom.currentQuestionIndex);
    setAnsweredQuestions(newAnswered); saveAnsweredQuestions(roomCode, newAnswered);
    try {
      const { room } = await roomApi.submitAnswer({ roomCode, aspirantId, aspirantName: playerName, questionId: question.id, answer });
      setCurrentRoom(room);
      lastRoomHashRef.current = roomHash(room);
    }
    catch (err) { showError("Error al enviar respuesta: " + err.message); }
  }

  async function validateAnswer(aspirantId, isCorrect) {
    try {
      const { room } = await roomApi.validate({ roomCode, aspirantId, isCorrect, pointsPerAnswer: currentRoom.config?.pointsPerAnswer ?? 1, penaltyEnabled: currentRoom.config?.penaltyEnabled ?? false });
      setCurrentRoom(room);
      lastRoomHashRef.current = roomHash(room);
      if (room.status === ROOM_STATUS.FINISHED) { setGameState(GAME_STATE.RESULTS); return; }
      if (room.mode === GAME_MODE.CUSTOM && room.status === ROOM_STATUS.WAITING_QUESTION) {
        const role = stateRef.current.playerRole;
        if (role === PLAYER_ROLE.KING || role === PLAYER_ROLE.ADMIN_KING) setGameState(GAME_STATE.CREATING_QUESTION);
      }
    } catch (err) { showError("Error al validar: " + err.message); }
  }

  async function updateRoomConfig(newConfig) {
    try {
      const room = { ...currentRoom, mode: newConfig.mode, config: newConfig, questions: await selectQuestions(newConfig, lang) };
      await persistRoom(room); setGameConfig(newConfig);
    } catch (err) { showError("Error al actualizar configuración: " + err.message); }
  }

  async function rematch() {
    try {
      const config = currentRoom.config ?? DEFAULT_GAME_CONFIG;
      const activeIds = new Set(Object.keys(currentRoom.scores || {}));
      const playerMap = new Map();
      (currentRoom.aspirants || []).forEach((p) => { if (p.id !== currentRoom.admin?.id && activeIds.has(p.id)) playerMap.set(p.id, p); });
      if (currentRoom.king && currentRoom.king.id !== currentRoom.admin?.id && activeIds.has(currentRoom.king.id)) playerMap.set(currentRoom.king.id, currentRoom.king);
      const allPlayers = Array.from(playerMap.values());
      const allPlayerIds = [...(currentRoom.admin ? [currentRoom.admin.id] : []), ...allPlayers.map((p) => p.id)];
      const { scores, answers } = buildInitialScoresAndAnswers(allPlayerIds);
      const room = { ...currentRoom, king: null, aspirants: allPlayers, questions: await selectQuestions(config, lang), currentQuestionIndex: 0, currentAnswers: [], answeredAspirants: [], status: ROOM_STATUS.WAITING, scores, answers, pickingAnimation: null, startedAt: null, finishedAt: null };
      await persistRoom(room);
      setAnsweredQuestions(new Set()); saveAnsweredQuestions(roomCode, new Set());
      setPlayerRole(PLAYER_ROLE.ADMIN); setGameState(GAME_STATE.LOBBY);
    } catch (err) { showError("Error al iniciar revancha: " + err.message); }
  }

  async function resetGame() {
    const { roomCode: code, currentRoom: room, playerRole: role, playerName: name } = stateRef.current;
    if (code && room) {
      if (role === PLAYER_ROLE.ADMIN || role === PLAYER_ROLE.ADMIN_KING) {
        try { await storage.set(buildRoomKey(code), JSON.stringify({ ...room, status: "closed" })); } catch (_) {}
      } else { await removePlayerFromRoom(room, code, name); }
    }
    clearSession();
    lastRoomHashRef.current = "";
    setGameState(GAME_STATE.MENU); setCurrentRoom(null); setAnsweredQuestions(new Set()); setRoomCode(""); setPlayerRole(null);
  }

  async function removePlayerFromRoom(room, code, name) {
    try {
      const myId = findPlayerId(room, name);
      const updated = { ...room, aspirants: (room.aspirants || []).filter((a) => a.name !== name) };
      if (myId) {
        delete updated.scores?.[myId]; delete updated.answers?.[myId];
        updated.currentAnswers = (updated.currentAnswers || []).filter((a) => a.aspirantId !== myId);
        updated.answeredAspirants = (updated.answeredAspirants || []).filter((id) => id !== myId);
      }
      await storage.set(buildRoomKey(code), JSON.stringify(updated));
    } catch (_) {}
  }

  async function persistRoom(room) {
    await storage.set(buildRoomKey(roomCode), JSON.stringify(room));
    setCurrentRoom(room);
    lastRoomHashRef.current = roomHash(room);
  }

  return {
    gameState, roomCode, playerName, playerRole, currentRoom, loading,
    answeredQuestions, gameConfig, errorMsg, reconnecting,
    setRoomCode, setPlayerName, setGameConfig,
    createRoom, joinRoom, startGame, pickKing, pickRandomKing,
    submitAnswer, submitCustomQuestion, validateAnswer,
    updateRoomConfig, confirmKingAndStart, rematch, resetGame,
  };
}
