export function normalizeAnswer(s) {
    if (typeof s !== "string") return "";
    return s.toLowerCase().trim();
}

export function answersMatch(a, b) {
    return normalizeAnswer(a) === normalizeAnswer(b);
}

export function getQuestionPoints(room) {
    const gp = room.config?.pointsPerAnswer ?? 1;
    const pen = gp;
    const q = room.questions?.[room.currentQuestionIndex];
    return {
        points: q?.points ? Number(q.points) : gp,
        penalty: q?.penalty ? Number(q.penalty) : pen,
    };
}

export function getCurrentQuestion(room) {
    return room.questions?.[room.currentQuestionIndex] ?? null;
}

// ── Limpieza de campos obsoletos ──────────────────────────────────────────

export function sanitizeRoom(room) {
    const out = { ...room };

    // pickingAnimation solo se necesita durante PICKING_KING
    if (out.status !== "picking_king") {
        delete out.pickingAnimation;
    }

    // pendingStatus solo durante KING_REVEAL
    if (out.status !== "king_reveal") {
        delete out.pendingStatus;
    }

    return out;
}

// ── Avance de ronda ───────────────────────────────────────────────────────

export function tryAdvanceRound(room, now) {
    if (room.status === "finished") return room;

    const q = getCurrentQuestion(room);
    const qId = q?.id ?? null;

    const adminIsKing = room.admin && room.king &&
        String(room.admin.id) === String(room.king.id);

    const players = [...(room.aspirants || [])];
    if (room.admin && !adminIsKing) {
        const adminInAspirants = players.some(
            (a) => String(a.id) === String(room.admin.id)
        );
        if (!adminInAspirants) players.push(room.admin);
    }

    const total = players.length;
    if (total === 0) return room;

    const validatedCount = players.filter((p) =>
        (room.answers?.[p.id] || []).some(
            (a) => String(a.questionId) === String(qId)
        )
    ).length;

    if (validatedCount < total) return room;

    const nextIndex = room.currentQuestionIndex + 1;
    const totalQ = room.mode === "custom"
        ? (room.config?.rounds ?? 10)
        : (room.questions?.length ?? 0);
    const isLastRound = nextIndex >= totalQ;

    const roundSnapshot = players.reduce((acc, p) => {
        const answer = (room.answers?.[p.id] || [])
            .find((a) => String(a.questionId) === String(qId));
        if (answer) acc[p.id] = answer;
        return acc;
    }, {});

    if (room.config?.showRoundReview && !isLastRound) {
        return sanitizeRoom({
            ...room,
            status: "round_review",
            roundSnapshot,       // respuestas de esta ronda para mostrar
            roundReviewEndsAt: new Date(Date.now() + (room.config?.roundReviewMs ?? 5000)).toISOString(),
        });
    }

    const next = {
        ...room,
        currentQuestionIndex: nextIndex,
        answeredAspirants: [],
        kingAnswer: null,
        currentAnswers: [],
        roundSnapshot: null,
        roundReviewEndsAt: null,
    };

    if (isLastRound) {
        next.status = "finished";
        next.finishedAt = now;
    } else if (room.mode === "custom") {
        next.status = "waiting_question";
    }

    return sanitizeRoom(next);
}

// ── Marcar respuesta como validada ────────────────────────────────────────

export function markValidated(room, aspirantId, aspirantAnswer, kingAnswer, points, penalty, questionId) {
    // Evitar duplicados
    const existing = (room.answers?.[aspirantId] || [])
        .find((r) => String(r.questionId) === String(questionId));
    if (existing) return room;

    const correct = answersMatch(aspirantAnswer, kingAnswer);

    const newRecord = {
        questionId,
        answer: aspirantAnswer,
        isCorrect: correct,
        points: correct ? points : 0,
        penalty: correct ? 0 : penalty,
    };

    const prevAnswers = room.answers?.[aspirantId] || [];
    const prevScore = room.scores?.[aspirantId] ?? 0;
    const scoreDelta = correct
        ? points
        : (room.config?.penaltyEnabled ? -penalty : 0);

    const next = {
        ...room,
        answers: {
            ...room.answers,
            [aspirantId]: [...prevAnswers, newRecord],
        },
        scores: {
            ...room.scores,
            [aspirantId]: prevScore + scoreDelta,
        },
        answeredAspirants: (() => {
            const list = room.answeredAspirants || [];
            const already = list.some((id) => String(id) === String(aspirantId));
            return already ? list : [...list, aspirantId];
        })(),
    };

    return next;
}

// ── Garantizar entradas de score para todos los jugadores ─────────────────

export function ensureScores(room) {
    const scores = { ...room.scores };
    const answers = { ...room.answers };

    const adminIsKing = room.admin && room.king &&
        String(room.admin.id) === String(room.king.id);

    const players = [...(room.aspirants || [])];
    if (room.admin && !adminIsKing) players.push(room.admin);

    players.forEach((p) => {
        if (scores[p.id] === undefined) scores[p.id] = 0;
        if (!answers[p.id]) answers[p.id] = [];
    });

    return { ...room, scores, answers };
}