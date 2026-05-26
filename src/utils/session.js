import { SESSION_KEY, ANSWERED_KEY_PREFIX } from "../constants/game";

export function saveSession(data) {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(data));
  } catch (_) {}
}

export function loadSession() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY));
  } catch (_) {
    return null;
  }
}

export function clearSession() {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch (_) {}
}

export function saveAnsweredQuestions(roomCode, questionIndexSet) {
  try {
    localStorage.setItem(
      `${ANSWERED_KEY_PREFIX}_${roomCode}`,
      JSON.stringify([...questionIndexSet])
    );
  } catch (_) {}
}

export function loadAnsweredQuestions(roomCode) {
  try {
    const raw = localStorage.getItem(`${ANSWERED_KEY_PREFIX}_${roomCode}`);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch (_) {
    return new Set();
  }
}

export function clearAnsweredQuestions(roomCode) {
  try {
    localStorage.removeItem(`${ANSWERED_KEY_PREFIX}_${roomCode}`);
  } catch (_) {}
}
