import { Redis } from "@upstash/redis";
import { setCors, parseRoom } from "./_helpers.js";

const redis = Redis.fromEnv();

const VALIDATE_SCRIPT = `
local key            = KEYS[1]
local aspirantId     = ARGV[1]
local isCorrect      = ARGV[2]
local now            = ARGV[3]
local globalPoints   = tonumber(ARGV[4]) or 1
local penaltyEnabled = ARGV[5]
local globalPenalty  = tonumber(ARGV[6]) or globalPoints

local raw = redis.call('GET', key)
if not raw then return {err = 'NOT_FOUND'} end

local room = cjson.decode(raw)

if not room.answeredAspirants then room.answeredAspirants = {} end
for _, id in ipairs(room.answeredAspirants) do
  if tostring(id) == tostring(aspirantId) then return cjson.encode(room) end
end

-- Leer puntos de la pregunta actual
local currentQ = nil
local qIndex = tonumber(room.currentQuestionIndex) or 0
if room.questions and room.questions[qIndex + 1] then
  currentQ = room.questions[qIndex + 1]
end

local pointsToUse  = globalPoints
local penaltyToUse = globalPenalty
if currentQ then
  if currentQ.points  then pointsToUse  = tonumber(currentQ.points)  or globalPoints  end
  if currentQ.penalty then penaltyToUse = tonumber(currentQ.penalty) or globalPenalty end
end

if not room.scores then room.scores = {} end

if isCorrect == '1' then
  room.scores[aspirantId] = (room.scores[aspirantId] or 0) + pointsToUse
else
  if penaltyEnabled == '1' and penaltyToUse > 0 then
    local current = room.scores[aspirantId] or 0
    room.scores[aspirantId] = current - penaltyToUse
  end
end

table.insert(room.answeredAspirants, aspirantId)

if not room.answers then room.answers = {} end
if not room.answers[aspirantId] then room.answers[aspirantId] = {} end

local remaining = {}
for _, a in ipairs(room.currentAnswers or {}) do
  if tostring(a.aspirantId) ~= tostring(aspirantId) then
    table.insert(remaining, a)
  else
    table.insert(room.answers[aspirantId], {
      questionId = a.questionId,
      answer     = a.answer,
      isCorrect  = (isCorrect == '1'),
      points     = isCorrect == '1' and pointsToUse or 0,
      penalty    = isCorrect ~= '1' and penaltyToUse or 0,
    })
  end
end
room.currentAnswers = remaining

-- Garantizar entradas en scores para todos los jugadores
for _, a in ipairs(room.aspirants or {}) do
  if room.scores[a.id] == nil then room.scores[a.id] = 0 end
end
local adminIsKing = room.admin and room.king and (tostring(room.admin.id) == tostring(room.king.id))
if room.admin and not adminIsKing then
  if room.scores[room.admin.id] == nil then room.scores[room.admin.id] = 0 end
end

-- FIX: el total esperado son solo los ASPIRANTES (el rey ya respondió por su cuenta
-- en answer.js y está en answeredAspirants, pero no debe bloquear el avance de ronda).
-- Contamos solo los aspirantes que aún NO tienen respuesta validada para esta pregunta.
local kingId = room.king and room.king.id or nil
local qId = currentQ and currentQ.id or nil

-- Total de jugadores que deben responder = aspirantes (el rey no cuenta para avanzar ronda)
local total = room.aspirants and #room.aspirants or 0

-- Contar cuántos aspirantes ya tienen su respuesta validada para esta pregunta
local validatedCount = 0
for _, a in ipairs(room.aspirants or {}) do
  if room.answers[a.id] then
    for _, ans in ipairs(room.answers[a.id]) do
      if qId and tostring(ans.questionId) == tostring(qId) then
        validatedCount = validatedCount + 1
        break
      end
    end
  end
end

-- También contar al admin si no es el rey y es aspirante en la partida
if room.admin and not adminIsKing then
  local adminId = room.admin.id
  -- El admin puede estar en aspirants o no dependiendo del flujo
  -- Solo sumarlo si NO está ya contado en aspirants
  local adminInAspirants = false
  for _, a in ipairs(room.aspirants or {}) do
    if tostring(a.id) == tostring(adminId) then adminInAspirants = true; break end
  end
  if not adminInAspirants then
    total = total + 1
    if room.answers[adminId] then
      for _, ans in ipairs(room.answers[adminId]) do
        if qId and tostring(ans.questionId) == tostring(qId) then
          validatedCount = validatedCount + 1
          break
        end
      end
    end
  end
end

if validatedCount >= total then
  room.currentQuestionIndex = tonumber(room.currentQuestionIndex) + 1
  room.answeredAspirants    = {}
  room.kingAnswer           = nil
  room.currentAnswers       = {}

  local totalQ
  if room.mode == 'custom' then
    totalQ = (room.config and tonumber(room.config.rounds)) or 10
  else
    totalQ = room.questions and #room.questions or 0
  end

  if tonumber(room.currentQuestionIndex) >= totalQ then
    room.status     = 'finished'
    room.finishedAt = now
  else
    if room.mode == 'custom' then
      room.status = 'waiting_question'
    end
  end
end

redis.call('SET', key, cjson.encode(room), 'EX', 86400)
return cjson.encode(room)
`;

export default async function handler(req, res) {
  setCors(res);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  const {
    roomCode,
    aspirantId,
    isCorrect,
    pointsPerAnswer = 1,
    penaltyEnabled  = false,
  } = req.body;

  if (!roomCode || !aspirantId)
    return res.status(400).json({ error: "Missing fields" });

  const key = `room_${roomCode.toUpperCase()}`;
  const now = new Date().toISOString();

  try {
    const result = await redis.eval(
      VALIDATE_SCRIPT,
      [key],
      [
        aspirantId,
        isCorrect ? "1" : "0",
        now,
        String(pointsPerAnswer),
        penaltyEnabled ? "1" : "0",
        String(pointsPerAnswer),
      ],
    );
    const room = parseRoom(result);
    if (!room) return res.status(404).json({ error: "Sala no encontrada" });
    return res.status(200).json({ room });
  } catch (err) {
    console.error("validate:", err);
    return res.status(500).json({ error: err.message });
  }
}
