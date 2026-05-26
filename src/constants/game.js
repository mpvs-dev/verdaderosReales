export const GAME_STATE = {
  MENU: "menu",
  LOBBY: "lobby",
  PICKING_KING: "picking_king",
  KING_REVEAL: "king_reveal",
  PLAYING: "playing",
  RESULTS: "results",
  CREATING_QUESTION: "creating_question",
  WAITING_QUESTION: "waiting_question",
};

export const ROOM_STATUS = {
  WAITING: "waiting",
  PICKING_KING: "picking_king",
  KING_REVEAL: "king_reveal",
  ANSWERING: "answering",
  WAITING_QUESTION: "waiting_question",
  FINISHED: "finished",
};

export const PLAYER_ROLE = {
  ADMIN: "admin",
  ASPIRANT: "aspirant",
  KING: "king",
  ADMIN_KING: "admin_king",
};

export const QUESTION_TYPE = {
  TEXT: "text",
  BOOLEAN: "boolean",
  MULTIPLE: "multiple",
};

export const GAME_MODE = {
  GENERIC: "generic",
  CUSTOM: "custom",
};

export const MAX_QUESTION_LENGTH = 100;
export const MAX_OPTION_LENGTH = 40;
export const MAX_ANSWER_LENGTH = 60;
export const MAX_OPTIONS = 5;
export const MIN_OPTIONS = 2;

export const SESSION_KEY = "vr_session";
export const ANSWERED_KEY_PREFIX = "vr_answered";

export const POLLING_INTERVAL_MS = 3000;
export const TOAST_DURATION_MS = 4000;
export const ROOM_TTL_SECONDS = 86400;

export const DEFAULT_GAME_CONFIG = {
  rounds: 10,
  pointsPerAnswer: 1,
  penaltyEnabled: false,
  customPointsEnabled: false,
  mode: GAME_MODE.GENERIC,
};

export const KING_PICK_ANIMATION = {
  BASE_STEPS: 24,
  RANDOM_EXTRA_STEPS: 8,
  FAST_DELAY_MS: 100,
  SLOW_DELAY_MULTIPLIER: 35,
  SLOW_START_RATIO: 0.6,
};
