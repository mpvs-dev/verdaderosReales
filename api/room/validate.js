import { withRoom } from "../../lib/withRoom.js";
import { setCors } from "../../lib/helpers.js";
import {
  getQuestionPoints, markValidated,
  tryAdvanceRound, ensureScores, sanitizeRoom,
} from "../../lib/roomlogic.js";

export default async function handler(req, res) {
  setCors(res);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  const {
    roomCode, aspirantId, isCorrect,
    pointsPerAnswer = 1, penaltyEnabled = false,
  } = req.body;

  if (!roomCode || !aspirantId)
    return res.status(400).json({ error: "Missing fields" });

  const now = new Date().toISOString();

  return withRoom(req, res, roomCode, (room) => {
    // Sala terminada — no procesar
    if (room.status === "finished") return room;

    // Ya validado — idempotente
    const alreadyValidated = (room.answeredAspirants || [])
      .some((id) => String(id) === String(aspirantId));
    if (alreadyValidated) return room;

    const { points, penalty } = getQuestionPoints(room);
    const q = room.questions?.[room.currentQuestionIndex];

    // Encontrar la respuesta en currentAnswers
    const answerEntry = (room.currentAnswers || [])
      .find((a) => String(a.aspirantId) === String(aspirantId));

    const answerText = answerEntry?.answer ?? "";

    // Aplicar puntuación manualmente (validate no usa kingAnswer — el rey valida)
    const prevScore = room.scores?.[aspirantId] ?? 0;
    const scoreDelta = isCorrect
      ? points
      : (penaltyEnabled ? -penalty : 0);

    const newRecord = {
      questionId: q?.id,
      answer: answerText,
      isCorrect: !!isCorrect,
      points: isCorrect ? points : 0,
      penalty: isCorrect ? 0 : penalty,
    };

    // Evitar duplicado
    const prevAnswers = room.answers?.[aspirantId] || [];
    const alreadyRecorded = prevAnswers
      .some((r) => String(r.questionId) === String(q?.id));

    let next = alreadyRecorded ? room : {
      ...room,
      answers: {
        ...room.answers,
        [aspirantId]: [...prevAnswers, newRecord],
      },
      scores: {
        ...room.scores,
        [aspirantId]: prevScore + scoreDelta,
      },
      answeredAspirants: [...(room.answeredAspirants || []), aspirantId],
      // Quitar de currentAnswers
      currentAnswers: (room.currentAnswers || [])
        .filter((a) => String(a.aspirantId) !== String(aspirantId)),
    };

    next = ensureScores(next);
    next = tryAdvanceRound(next, now);
    return sanitizeRoom(next);
  });
}