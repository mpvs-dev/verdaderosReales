const BASE_URL = import.meta.env.VITE_SERVER_URL
  ? `${import.meta.env.VITE_SERVER_URL}/api/room`
  : "/api/room";

async function post(path, body) {
  const res = await fetch(`${BASE_URL}/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || res.statusText);
  }

  return res.json();
}

export const roomApi = {
  join: (roomCode, playerName) => post("join", { roomCode, playerName }),

  submitAnswer: ({ roomCode, aspirantId, aspirantName, questionId, answer }) =>
    post("answer", { roomCode, aspirantId, aspirantName, questionId, answer }),

  validate: ({
    roomCode,
    aspirantId,
    isCorrect,
    pointsPerAnswer,
    penaltyEnabled,
  }) =>
    post("validate", {
      roomCode,
      aspirantId,
      isCorrect,
      pointsPerAnswer,
      penaltyEnabled,
    }),
};
