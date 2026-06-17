import { Redis } from "@upstash/redis";
import { setCors } from "./helpers.js";

const redis = Redis.fromEnv();

export async function withRoom(req, res, roomCode, mutate) {
    const key = `room_${roomCode.toUpperCase()}`;

    try {
        const raw = await redis.get(key);
        if (raw === null || raw === undefined)
            return res.status(404).json({ error: "Sala no encontrada" });

        let room;
        try {
            room = typeof raw === "string" ? JSON.parse(raw) : raw;
        } catch (_) {
            return res.status(500).json({ error: "Error al leer la sala" });
        }

        let next;
        try {
            next = await mutate(room);
        } catch (err) {
            console.error("withRoom mutate error:", err);
            return res.status(500).json({ error: err.message });
        }

        await redis.set(key, JSON.stringify(next), { ex: 86400 });
        return res.status(200).json({ room: next });

    } catch (err) {
        console.error("withRoom error:", err);
        return res.status(500).json({ error: err.message });
    }
}

export { redis };