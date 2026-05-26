import { getAvatar } from "../assets/avatars.js";

/**
 * Avatar
 * Se usa en toda la app. Acepta `index` (posición de llegada) o el objeto avatar directamente.
 *
 * @param {number}  index   - posición de llegada del jugador (0-based)
 * @param {object}  avatar  - objeto avatar { emoji, img, bg } (alternativa a index)
 * @param {string}  size    - "sm" | "md" | "lg"
 * @param {boolean} crown   - muestra corona encima (para el Líder)
 * @param {boolean} pulse   - anima con glow (para highlight en animación)
 */
export default function Avatar({ index, avatar: avatarProp, size = "md", crown = false, pulse = false }) {
  const avatar = avatarProp ?? getAvatar(index ?? 0);

  return (
    <div style={{ position: "relative", display: "inline-flex" }}>
      <div
        className={`avatar avatar-${size} ${pulse ? "anim-float" : ""}`}
        style={{ background: avatar.bg }}
      >
        {avatar.img ? (
          <img src={avatar.img} alt={avatar.name ?? "avatar"} />
        ) : (
          <span style={{ lineHeight: 1 }}>{avatar.emoji}</span>
        )}
      </div>

      {crown && (
        <span
          style={{
            position: "absolute",
            top: -10,
            left: "50%",
            transform: "translateX(-50%)",
            fontSize: size === "lg" ? 20 : 14,
            filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.3))",
            lineHeight: 1,
          }}
        >
          👑
        </span>
      )}
    </div>
  );
}
