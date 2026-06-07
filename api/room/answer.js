import { Redis } from "@upstash/redis";
import { setCors, parseRoom } from "./_helpers.js";

const redis = Redis.fromEnv();

const ANSWER_SCRIPT = `
local key          = KEYS[1]
local aspirantId   = ARGV[1]
local aspirantName = ARGV[2]
local questionId   = ARGV[3]
local answer       = ARGV[4]
local now          = ARGV[5]

local raw = redis.call('GET', key)
if not raw then return {err = 'NOT_FOUND'} end

local room = cjson.decode(raw)

local kingId = room.king and room.king.id or nil

-- ── Helpers ──────────────────────────────────────────────────────────────

local function getQuestionPoints(room)
  local gp  = (room.config and room.config.pointsPerAnswer)
               and tonumber(room.config.pointsPerAnswer) or 1
  local pen = gp
  local qIndex = tonumber(room.currentQuestionIndex) or 0
  if room.questions and room.questions[qIndex + 1] then
    local q = room.questions[qIndex + 1]
    if q.points  then gp  = tonumber(q.points)  or gp  end
    if q.penalty then pen = tonumber(q.penalty) or pen end
  end
  return gp, pen
end

local function normalizeAnswer(s)
  if type(s) ~= 'string' then return '' end
  return s:lower():match('^%s*(.-)%s*$')
end

local function answersMatch(a, b)
  return normalizeAnswer(a) == normalizeAnswer(b)
end

local function markValidated(room, aspId, aspAnswer, kingAns, pts, pen, qId)
  local correct = answersMatch(aspAnswer, kingAns)
  if not room.answers     then room.answers     = {} end
  if not room.answers[aspId] then room.answers[aspId] = {} end
  -- Evitar duplicados
  for _, rec in ipairs(room.answers[aspId]) do
    if tostring(rec.questionId) == tostring(qId) then return end
  end
  table.insert(room.answers[aspId], {
    questionId = qId,
    answer     = aspAnswer,
    isCorrect  = correct,
    points     = correct and pts or 0,
    penalty    = (not correct) and pen or 0,
  })
  if not room.scores then room.scores = {} end
  if correct then
    room.scores[aspId] = (room.scores[aspId] or 0) + pts
  elseif room.config and room.config.penaltyEnabled then
    room.scores[aspId] = (room.scores[aspId] or 0) - pen
  end
  if not room.answeredAspirants then room.answeredAspirants = {} end
  local already = false
  for _, id in ipairs(room.answeredAspirants) do
    if tostring(id) == tostring(aspId) then already = true; break end
  end
  if not already then
    table.insert(room.answeredAspirants, aspId)
  end
end

-- Avanza la ronda si todos los aspirantes ya tienen respuesta validada para la pregunta actual
local function tryAdvanceRound(room, now)
  if room.status == 'finished' then return end
  local qIndex   = tonumber(room.currentQuestionIndex) or 0
  local currentQ = room.questions and room.questions[qIndex + 1]
  local qId      = currentQ and currentQ.id or nil

  -- Construir lista de jugadores que deben responder (aspirantes + admin si no es rey)
  local adminIsKing = room.admin and room.king
                      and (tostring(room.admin.id) == tostring(room.king.id))
  local players = {}
  for _, a in ipairs(room.aspirants or {}) do
    table.insert(players, a)
  end
  if room.admin and not adminIsKing then
    local inAspirants = false
    for _, a in ipairs(room.aspirants or {}) do
      if tostring(a.id) == tostring(room.admin.id) then inAspirants = true; break end
    end
    if not inAspirants then table.insert(players, room.admin) end
  end

  local total          = #players
  local validatedCount = 0
  for _, p in ipairs(players) do
    if room.answers and room.answers[p.id] then
      for _, ans in ipairs(room.answers[p.id]) do
        if qId and tostring(ans.questionId) == tostring(qId) then
          validatedCount = validatedCount + 1
          break
        end
      end
    end
  end

  if total > 0 and validatedCount >= total then
    room.currentQuestionIndex = qIndex + 1
    room.answeredAspirants    = {}
    room.currentAnswers       = {}
    room.kingAnswer           = nil

    local totalQ
    if room.mode == 'custom' then
      totalQ = (room.config and tonumber(room.config.rounds)) or 10
    else
      totalQ = room.questions and #room.questions or 0
    end

    if tonumber(room.currentQuestionIndex) >= totalQ then
      room.status     = 'finished'
      room.finishedAt = now
    elseif room.mode == 'custom' then
      room.status = 'waiting_question'
    end
  end
end

-- ── Caso: el rey responde (boolean / multiple) ────────────────────────────
if kingId and tostring(aspirantId) == tostring(kingId) then
  -- Evitar duplicar kingAnswer para la misma pregunta
  if room.kingAnswer and tostring(room.kingAnswer.questionId) == tostring(questionId) then
    return cjson.encode(room)
  end

  room.kingAnswer = { questionId = questionId, answer = answer }

  local pts, pen = getQuestionPoints(room)

  -- Auto-validar todas las currentAnswers que ya llegaron
  local newCurrentAnswers = {}
  for _, a in ipairs(room.currentAnswers or {}) do
    if tostring(a.questionId) == tostring(questionId) then
      markValidated(room, a.aspirantId, a.answer, answer, pts, pen, questionId)
    else
      table.insert(newCurrentAnswers, a)
    end
  end
  room.currentAnswers = newCurrentAnswers

  -- Intentar avanzar ronda (puede que todos ya hayan respondido)
  tryAdvanceRound(room, now)

  redis.call('SET', key, cjson.encode(room), 'EX', 86400)
  return cjson.encode(room)
end

-- ── Caso: aspirante responde ──────────────────────────────────────────────
-- Ignorar si ya fue validado para esta pregunta
if room.answeredAspirants then
  for _, id in ipairs(room.answeredAspirants) do
    if tostring(id) == tostring(aspirantId) then return cjson.encode(room) end
  end
end

-- Si ya hay kingAnswer para esta pregunta: auto-validar inmediatamente
if room.kingAnswer and tostring(room.kingAnswer.questionId) == tostring(questionId) then
  local pts, pen = getQuestionPoints(room)
  markValidated(room, aspirantId, answer, room.kingAnswer.answer, pts, pen, questionId)
  tryAdvanceRound(room, now)
  redis.call('SET', key, cjson.encode(room), 'EX', 86400)
  return cjson.encode(room)
end

-- Sin kingAnswer: flujo normal (texto), añadir a currentAnswers para validación manual
if not room.currentAnswers then room.currentAnswers = {} end

local entry = { aspirantId   = aspirantId,   aspirantName = aspirantName,
                questionId   = questionId,   answer       = answer }
local replaced = false
for i, a in ipairs(room.currentAnswers) do
  if tostring(a.aspirantId) == tostring(aspirantId) then
    room.currentAnswers[i] = entry
    replaced = true
    break
  end
end
if not replaced then
  table.insert(room.currentAnswers, entry)
end

redis.call('SET', key, cjson.encode(room), 'EX', 86400)
return cjson.encode(room)
`;

export default async function handler(req, res) {
  setCors(res);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  const { roomCode, aspirantId, aspirantName, questionId, answer } = req.body;
  if (!roomCode || !aspirantId || !answer)
    return res.status(400).json({ error: "Missing fields" });

  const key = `room_${roomCode.toUpperCase()}`;
  const now = new Date().toISOString();

  try {
    const result = await redis.eval(
      ANSWER_SCRIPT,
      [key],
      [aspirantId, aspirantName, questionId, answer, now],
    );
    const room = parseRoom(result);
    if (!room) return res.status(404).json({ error: "Sala no encontrada" });
    return res.status(200).json({ room });
  } catch (err) {
    console.error("answer:", err);
    return res.status(500).json({ error: err.message });
  }
}
