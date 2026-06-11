// ── Mover esta función a src/utils/questions.js ────────────────────────────

import { loadQuestions } from "../i18n/i18nContext.jsx";
import { DEFAULT_CATEGORIES } from "../constants/questionCategories.js";
import { shuffleArray } from "./room.js";
import { GAME_MODE } from "../constants/game.js";

export async function selectQuestions(config, lang) {
    if (config.mode === GAME_MODE.CUSTOM) return [];
    const cats = config.categories?.length
        ? config.categories
        : DEFAULT_CATEGORIES;
    const pool = await loadQuestions(lang, cats);
    return shuffleArray(pool).slice(0, config.rounds);
}