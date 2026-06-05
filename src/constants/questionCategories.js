/**
 * questionCategories.js
 *
 * Registro central de categorías de preguntas disponibles.
 * Para añadir una nueva categoría en el futuro:
 *   1. Añade la clave en el JSON de preguntas (ej: "picantes", "deportes")
 *   2. Agrega una entrada aquí con el mismo id
 *   3. Listo — la config modal la muestra automáticamente
 */

export const QUESTION_CATEGORIES = [
  {
    id: "genericas",       // debe coincidir con la clave del JSON
    label: "🎲 Genéricas",
    description: "Preguntas para conocerse mejor",
    color: "purple",
  },
  // Ejemplos listos para activar cuando tengas los JSONs:
  // {
  //   id: "picantes",
  //   label: "🌶️ Picantes",
  //   description: "Preguntas atrevidas para adultos",
  //   color: "red",
  // },
  // {
  //   id: "deportes",
  //   label: "⚽ Deportes",
  //   description: "Para los fanáticos del deporte",
  //   color: "gold",
  // },
];

/** Categorías activas por defecto (todas) */
export const DEFAULT_CATEGORIES = QUESTION_CATEGORIES.map((c) => c.id);
