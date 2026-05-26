import { PLAYER_ROLE } from "../constants/game";

export function shuffleArray(array) {
  const out = [...array];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function generateRoomCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export function generateId() {
  return `${Date.now()}${Math.random().toString(36).slice(2, 5)}`;
}

export function derivePlayerRole(room, playerName) {
  const isAdmin = room.admin?.name === playerName;
  const isKing = room.king?.name === playerName;

  if (isAdmin && isKing) return PLAYER_ROLE.ADMIN_KING;
  if (isAdmin) return PLAYER_ROLE.ADMIN;
  if (isKing) return PLAYER_ROLE.KING;
  return PLAYER_ROLE.ASPIRANT;
}

export function isPlayerInRoom(room, playerName) {
  return (
    room.admin?.name === playerName ||
    room.king?.name === playerName ||
    (room.aspirants || []).some((a) => a.name === playerName)
  );
}

export function getPlayerById(room, playerId) {
  if (room.admin?.id === playerId) return room.admin;
  if (room.king?.id === playerId) return room.king;
  return (room.aspirants || []).find((a) => a.id === playerId) ?? null;
}

export function getAllPlayers(room) {
  const adminIsKing = room.admin?.id === room.king?.id;
  return [
    ...(room.aspirants || []),
    ...(!adminIsKing && room.admin ? [room.admin] : []),
  ];
}

export function getEveryone(room) {
  return [room.admin, ...(room.aspirants || [])].filter(Boolean);
}

export function buildInitialScoresAndAnswers(playerIds) {
  const scores = {};
  const answers = {};
  playerIds.forEach((id) => {
    scores[id] = 0;
    answers[id] = [];
  });
  return { scores, answers };
}

export function formatDuration(startedAt, finishedAt) {
  if (!startedAt || !finishedAt) return null;
  const seconds = Math.floor(
    (new Date(finishedAt) - new Date(startedAt)) / 1000
  );
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m === 0 ? `${s}s` : `${m}m ${s}s`;
}
