import { Redis } from "@upstash/redis";
import { setCors } from "./_helpers.js";

const redis = Redis.fromEnv();

export async function withRoom(req, res, roomCode, mutate) {
    const key = `room_${roomCode.toUpperCase()}`;

    const raw = await redis.get(key);
    if (!raw) return res.status(404).json({ error: "Sala no encontrada" });

    const room = typeof raw === "string" ? JSON.parse(raw) : raw;

    let next;
    try {
        next = await mutate(room);
    } catch (err) {
        console.error("withRoom mutate error:", err);
        return res.status(500).json({ error: err.message });
    }

    await redis.set(key, JSON.stringify(next), { ex: 86400 });
    return res.status(200).json({ room: next });
}

export { redis, setCors };