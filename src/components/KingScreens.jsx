import { useState, useEffect, useRef } from "react";
import { Shuffle, Play } from "lucide-react";
import { ScreenWrapper, Avatar } from "./Layout.jsx";
import { PLAYER_ROLE, KING_PICK_ANIMATION } from "../constants/game.js";
import { getEveryone } from "../utils/room.js";
import { assignAvatars } from "../assets/avatars.js";
import storage from "../services/storage.js";

const { BASE_STEPS, RANDOM_EXTRA_STEPS, FAST_DELAY_MS, SLOW_DELAY_MULTIPLIER, SLOW_START_RATIO } = KING_PICK_ANIMATION;

function computeDuration(steps) {
  const slow = Math.floor(steps * SLOW_START_RATIO);
  return slow * FAST_DELAY_MS + (steps - slow) * steps * SLOW_DELAY_MULTIPLIER + 1200;
}

/* ─── KingPickScreen ─────────────────────────────────────────────────────── */
export function KingPickScreen({ currentRoom, playerRole, pickKing, pickRandomKing, roomCode, resetGame }) {
  const [highlighted, setHighlighted] = useState(null);
  const [winner, setWinner]           = useState(null);
  const [spinning, setSpinning]       = useState(false);
  const animatingRef                  = useRef(false);

  const isAdmin   = playerRole === PLAYER_ROLE.ADMIN;
  const everyone  = getEveryone(currentRoom);
  const avatarMap = assignAvatars(everyone);

  useEffect(() => {
    if (isAdmin) return;
    const timer = setInterval(async () => {
      if (animatingRef.current) return;
      try {
        const result   = await storage.get(`room_${roomCode}`);
        const room     = JSON.parse(result.value);
        const winnerId = room.pickingAnimation?.winnerId;
        if (!winnerId) return;
        clearInterval(timer);
        const chosen = everyone.find((p) => p.id === winnerId);
        if (chosen) runAnimation(chosen);
      } catch (_) {}
    }, 500);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  function runAnimation(chosen) {
    if (animatingRef.current) return;
    animatingRef.current = true;
    setSpinning(true);
    setWinner(null);
    const totalSteps = BASE_STEPS + Math.floor(Math.random() * RANDOM_EXTRA_STEPS);
    let step = 0;
    function tick() {
      setHighlighted(everyone[step % everyone.length].id);
      step++;
      const slow  = Math.floor(totalSteps * SLOW_START_RATIO);
      const delay = step < slow ? FAST_DELAY_MS : FAST_DELAY_MS + (step - slow) * SLOW_DELAY_MULTIPLIER;
      if (step < totalSteps) setTimeout(tick, delay);
      else {
        setHighlighted(chosen.id);
        setWinner(chosen);
        setSpinning(false);
        animatingRef.current = false;
      }
    }
    tick();
  }

  async function handleRandom() {
    if (animatingRef.current) return;
    const chosen = everyone[Math.floor(Math.random() * everyone.length)];
    try {
      await storage.set(`room_${roomCode}`, JSON.stringify({ ...currentRoom, pickingAnimation: { winnerId: chosen.id } }));
    } catch (_) {}
    runAnimation(chosen);
    setTimeout(() => pickRandomKing(chosen.id), computeDuration(BASE_STEPS + RANDOM_EXTRA_STEPS));
  }

  return (
    <ScreenWrapper withBg onExit={resetGame}>
      <div style={{ textAlign: "center" }}>
        <div className="anim-float" style={{ fontSize: 44, display: "inline-block", marginBottom: 8 }}>👑</div>
        <h2 className="t-display" style={{ fontSize: 28, color: "#fff", marginBottom: 4 }}>¿Quién es el Líder?</h2>
        <p style={{ fontSize: 13, fontWeight: 700, color: "var(--c-w45)" }}>
          {isAdmin ? "Elige tú o deja que el azar decida" : `${currentRoom?.admin?.name} está eligiendo...`}
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
        {everyone.map((person) => {
          const hl  = highlighted === person.id;
          const win = winner?.id  === person.id;
          return (
            <div key={person.id} style={{
              background: win ? "rgba(245,158,11,0.2)" : hl ? "rgba(109,40,217,0.35)" : "rgba(255,255,255,0.07)",
              border: `1.5px solid ${win ? "rgba(245,158,11,0.55)" : hl ? "rgba(109,40,217,0.6)" : "var(--c-w12)"}`,
              borderRadius: "var(--r-lg)", padding: "14px 10px", textAlign: "center",
              transform: win || hl ? "scale(1.04)" : "scale(1)",
              transition: "all 0.12s ease",
              boxShadow: win ? "0 0 18px rgba(245,158,11,0.3)" : "none",
            }}>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}>
                <Avatar avatar={avatarMap[person.id]} size="sm" crown={win} pulse={hl} />
              </div>
              <div className="truncate" style={{ fontSize: 13, fontWeight: 800, color: "#fff" }}>{person.name}</div>
              {person.id === currentRoom.admin?.id && (
                <div style={{ fontSize: 10, color: "var(--c-gold)", fontWeight: 800, marginTop: 2 }}>Admin</div>
              )}
            </div>
          );
        })}
      </div>

      {isAdmin && !winner && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <button className="btn btn-gold" onClick={handleRandom} disabled={spinning} style={{ fontSize: 16 }}>
            <Shuffle size={17} />
            {spinning ? "Eligiendo..." : "Líder al Azar"}
          </button>
          <div className="divider">o elige manualmente</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {everyone.map((person) => (
              <button key={person.id} className="btn btn-ghost" disabled={spinning}
                onClick={() => pickKing(person.id)}
                style={{ justifyContent: "flex-start", gap: 10, fontSize: 14 }}
              >
                <Avatar avatar={avatarMap[person.id]} size="sm" />
                <span className="truncate">{person.name}</span>
                {person.id === currentRoom.admin?.id && (
                  <span style={{ marginLeft: "auto", fontSize: 10, color: "var(--c-gold)", fontWeight: 800 }}>Admin</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {!isAdmin && !winner && !spinning && (
        <p style={{ textAlign: "center", fontSize: 13, fontWeight: 700, color: "var(--c-w45)" }}>
          Esperando decisión del administrador...
        </p>
      )}

      {winner && (
        <div className="anim-pop" style={{
          background: "rgba(245,158,11,0.18)", border: "2px solid rgba(245,158,11,0.45)",
          borderRadius: "var(--r-lg)", padding: 18, textAlign: "center",
        }}>
          <div style={{ fontSize: 36, marginBottom: 6 }}>🎉</div>
          <p style={{ fontWeight: 800, color: "#fff", fontSize: 18 }}>{winner.name} es el Líder</p>
        </div>
      )}
    </ScreenWrapper>
  );
}

/* ─── KingRevealScreen ───────────────────────────────────────────────────── */
export function KingRevealScreen({ currentRoom, playerRole, playerName, confirmKingAndStart, resetGame }) {
  const king      = currentRoom?.king;
  const isAdmin   = playerRole === PLAYER_ROLE.ADMIN || playerRole === PLAYER_ROLE.ADMIN_KING;
  const isKing    = king?.name === playerName;
  const everyone  = getEveryone(currentRoom);
  const avatarMap = assignAvatars(everyone);

  return (
    <ScreenWrapper withBg onExit={resetGame}>
      <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
        <div className="anim-float" style={{ fontSize: 44 }}>👑</div>

        <div className="anim-pop">
          <Avatar avatar={avatarMap[king?.id]} size="lg" crown />
        </div>

        <div>
          <div className="t-label" style={{ marginBottom: 5 }}>El Líder es</div>
          <h2 className="t-display" style={{ fontSize: 34, color: "#fff" }}>{king?.name}</h2>
        </div>

        {isKing ? (
          <div style={{
            background: "rgba(245,158,11,0.15)", border: "1.5px solid rgba(245,158,11,0.4)",
            borderRadius: "var(--r-lg)", padding: "12px 20px", width: "100%",
          }}>
            <p style={{ fontWeight: 800, color: "#FDE68A", fontSize: 14 }}>
              ¡Eres el Líder! Las preguntas son sobre ti 👑
            </p>
          </div>
        ) : (
          <div className="glass" style={{ width: "100%" }}>
            <p style={{ fontWeight: 700, color: "var(--c-w60)", fontSize: 14, textAlign: "center" }}>
              Las preguntas serán sobre <strong style={{ color: "#fff" }}>{king?.name}</strong>
            </p>
          </div>
        )}

        {isAdmin ? (
          <button className="btn btn-green" onClick={confirmKingAndStart} style={{ fontSize: 16, width: "100%" }}>
            <Play size={18} /> Iniciar Partida
          </button>
        ) : (
          <p style={{ fontSize: 13, fontWeight: 700, color: "var(--c-w45)" }}>
            Esperando que el administrador inicie...
          </p>
        )}
      </div>
    </ScreenWrapper>
  );
}
