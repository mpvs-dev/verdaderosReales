import { withRoom, redis, setCors } from "./_withRoom.js";
import { ensureScores } from "./_roomLogic.js";

export default async function handler(req, res) {
  setCors(res);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  const { roomCode, playerName } = req.body;
  if (!roomCode || !playerName)
    return res.status(400).json({ error: "Missing fields" });

  const aspirantId = `${Date.now()}${Math.random().toString(36).slice(2, 5)}`;

  const key = `room_${roomCode.toUpperCase()}`;
  const raw = await redis.get(key);
  if (!raw) return res.status(404).json({ error: "Sala no encontrada" });

  const room = typeof raw === "string" ? JSON.parse(raw) : raw;

  // Jugador ya existe — devolver sin modificar
  const alreadyIn = (room.aspirants || []).some((a) => a.name === playerName);
  if (alreadyIn) return res.status(200).json({ room, aspirantId: null });

  const next = ensureScores({
    ...room,
    aspirants: [
      ...(room.aspirants || []),
      { name: playerName, id: aspirantId },
    ],
  });

  await redis.set(key, JSON.stringify(next), { ex: 86400 });
  return res.status(200).json({ room: next, aspirantId });
}