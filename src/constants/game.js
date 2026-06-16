export const GAME_STATE = {
  MENU: "menu",
  LOBBY: "lobby",
  PICKING_KING: "picking_king",
  KING_REVEAL: "king_reveal",
  PLAYING: "playing",
  RESULTS: "results",
  CREATING_QUESTION: "creating_question",
  WAITING_QUESTION: "waiting_question",
  ROUND_REVIEW: "round_review",
};

export const ROOM_STATUS = {
  WAITING: "waiting",
  PICKING_KING: "picking_king",
  KING_REVEAL: "king_reveal",
  ANSWERING: "answering",
  WAITING_QUESTION: "waiting_question",
  FINISHED: "finished",
  ROUND_REVIEW: "round_review",
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

export const POLL_INTERVAL_BY_STATE = {
  ["menu"]: 0,
  ["lobby"]: 5_000,
  ["picking_king"]: 1_500,
  ["king_reveal"]: 3_000,
  ["playing"]: 1_500,
  ["round_review"]: 2_000,
  ["waiting_question"]: 2_000,
  ["creating_question"]: 4_000,
  ["results"]: 5_000,
};

export const POLL_MAX_MS = 48_000;
export const POLL_FAIL_TOAST = 3;

export const TOAST_DURATION_MS = 4000;
export const ROOM_TTL_SECONDS = 86400;

export const INACTIVITY_MS = 5 * 60 * 1000; // 10 minutos

export const DEFAULT_GAME_CONFIG = {
  rounds: 5,
  pointsPerAnswer: 1,
  penaltyEnabled: false,
  customPointsEnabled: false,
  mode: GAME_MODE.GENERIC,
  categories: ["genericas"],
  showRoundReview: true,
  roundReviewMs: 5000,
};

export const KING_PICK_ANIMATION = {
  BASE_STEPS: 24,
  RANDOM_EXTRA_STEPS: 8,
  FAST_DELAY_MS: 100,
  SLOW_DELAY_MULTIPLIER: 35,
  SLOW_START_RATIO: 0.6,
};
