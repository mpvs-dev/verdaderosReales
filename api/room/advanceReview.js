import { withRoom, setCors } from "./_withRoom.js";
import { sanitizeRoom } from "./_roomLogic.js";

export default async function handler(req, res) {
  setCors(res);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  const { roomCode } = req.body;
  if (!roomCode) return res.status(400).json({ error: "Missing roomCode" });

  const now = new Date().toISOString();

  return withRoom(req, res, roomCode, (room) => {
    // Solo procesar si estamos en round_review
    if (room.status !== "round_review") return room;

    const nextIndex = room.currentQuestionIndex + 1;
    const totalQ    = room.mode === "custom"
      ? (room.config?.rounds ?? 10)
      : (room.questions?.length ?? 0);
    const isLastRound = nextIndex >= totalQ;

    const next = {
      ...room,
      currentQuestionIndex: nextIndex,
      answeredAspirants:    [],
      kingAnswer:           null,
      currentAnswers:       [],
      roundSnapshot:        null,
      roundReviewEndsAt:    null,
    };

    if (isLastRound) {
      next.status     = "finished";
      next.finishedAt = now;
    } else if (room.mode === "custom") {
      next.status = "waiting_question";
    } else {
      next.status = "answering";
    }

    return sanitizeRoom(next);
  });
}