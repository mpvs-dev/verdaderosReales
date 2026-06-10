import { withRoom, setCors } from "./_withRoom.js";
import {
  getQuestionPoints, markValidated,
  tryAdvanceRound, sanitizeRoom,
} from "./_roomLogic.js";

export default async function handler(req, res) {
  setCors(res);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  const { roomCode, aspirantId, aspirantName, questionId, answer } = req.body;
  if (!roomCode || !aspirantId || !answer)
    return res.status(400).json({ error: "Missing fields" });

  const now = new Date().toISOString();

  return withRoom(req, res, roomCode, (room) => {
    // Sala terminada — no procesar
    if (room.status === "finished") return room;

    const kingId = room.king?.id ?? null;
    const { points, penalty } = getQuestionPoints(room);

    // ── Caso: el rey responde (boolean / multiple) ─────────────────────
    if (kingId && String(aspirantId) === String(kingId)) {
      // Evitar duplicar kingAnswer para la misma pregunta
      if (room.kingAnswer &&
        String(room.kingAnswer.questionId) === String(questionId)) {
        return room;
      }

      let next = { ...room, kingAnswer: { questionId, answer } };

      // Auto-validar respuestas que ya llegaron
      const remaining = [];
      for (const a of next.currentAnswers || []) {
        if (String(a.questionId) === String(questionId)) {
          next = markValidated(next, a.aspirantId, a.answer, answer, points, penalty, questionId);
        } else {
          remaining.push(a);
        }
      }
      next = { ...next, currentAnswers: remaining };
      next = tryAdvanceRound(next, now);
      return sanitizeRoom(next);
    }

    // ── Caso: aspirante ya validado para esta pregunta ─────────────────
    const alreadyValidated = (room.answeredAspirants || [])
      .some((id) => String(id) === String(aspirantId));
    if (alreadyValidated) return room;

    // ── Caso: ya existe kingAnswer → auto-validar inmediatamente ───────
    if (room.kingAnswer &&
      String(room.kingAnswer.questionId) === String(questionId)) {
      let next = markValidated(
        room, aspirantId, answer,
        room.kingAnswer.answer,
        points, penalty, questionId,
      );
      next = tryAdvanceRound(next, now);
      return sanitizeRoom(next);
    }

    // ── Caso: texto, flujo normal → añadir a currentAnswers ───────────
    const entry = { aspirantId, aspirantName, questionId, answer };
    const currentAnswers = [...(room.currentAnswers || [])];
    const idx = currentAnswers.findIndex(
      (a) => String(a.aspirantId) === String(aspirantId)
    );
    if (idx >= 0) currentAnswers[idx] = entry;
    else currentAnswers.push(entry);

    return sanitizeRoom({ ...room, currentAnswers });
  });
}