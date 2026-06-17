export const config = { runtime: "edge" };

const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

async function getRoomRaw(roomCode) {
    const res = await fetch(
        `${REDIS_URL}/get/room_${roomCode.toUpperCase()}`,
        { headers: { Authorization: `Bearer ${REDIS_TOKEN}` } }
    );
    const data = await res.json();
    return data.result ?? null;
}

function roomHash(room) {
    if (!room) return "";
    try {
        const r = typeof room === "string" ? JSON.parse(room) : room;
        return [
            r.status,
            r.currentQuestionIndex,
            r.finishedAt,
            r.startedAt,
            r.king?.id ?? "",
            r.pickingAnimation?.winnerId ?? "",
            (r.currentAnswers ?? []).length,
            (r.answeredAspirants ?? []).length,
            JSON.stringify(r.scores ?? {}),
            r.config?.rounds ?? "",
            r.config?.pointsPerAnswer ?? "",
            r.config?.mode ?? "",
            r.config?.penaltyEnabled ?? "",
            r.config?.customPointsEnabled ?? "",
            (r.aspirants ?? []).length,
            r.roundReviewEndsAt ?? "",
        ].join("|");
    } catch (_) { return ""; }
}

export default async function handler(req) {
    const { searchParams } = new URL(req.url);
    const roomCode = searchParams.get("roomCode");

    if (!roomCode) {
        return new Response("Missing roomCode", { status: 400 });
    }

    const headers = {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        "Connection": "keep-alive",
        "Access-Control-Allow-Origin": "*",
        "X-Accel-Buffering": "no",
    };

    const stream = new ReadableStream({
        async start(controller) {
            const encode = (data) =>
                new TextEncoder().encode(`data: ${JSON.stringify(data)}\n\n`);

            controller.enqueue(new TextEncoder().encode(`: connected\n\n`));

            let lastHash = "";
            let iteration = 0;

            while (iteration < 44) {
                iteration++;
                try {
                    const raw = await getRoomRaw(roomCode);

                    if (raw === null) {
                        controller.enqueue(encode({ type: "NOT_FOUND" }));
                        break;
                    }

                    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
                    const hash = roomHash(parsed);

                    if (hash !== lastHash) {
                        lastHash = hash;
                        controller.enqueue(encode({ type: "ROOM_UPDATE", room: parsed }));

                        if (parsed.status === "finished" || parsed.status === "closed") {
                            break;
                        }
                    }

                    if (iteration % 15 === 0) {
                        controller.enqueue(new TextEncoder().encode(`: ping\n\n`));
                    }

                } catch (err) {
                    controller.enqueue(encode({ type: "ERROR", message: err.message }));
                    break;
                }

                await new Promise((r) => setTimeout(r, 500));
            }

            controller.enqueue(encode({ type: "RECONNECT" }));
            controller.close();
        },
    });

    return new Response(stream, { headers });
}