/*
  Sistema de avatares — asignados automáticamente por orden de llegada.

  Para usar tus propias imágenes:
  1. Coloca los archivos en /src/assets/avatars/
  2. Reemplaza la entrada: { emoji: null, img: '/src/assets/avatars/mi-avatar.png', bg: '#FDE68A20' }
  3. El sistema sigue asignando automáticamente — sin cambios adicionales.

  Mínimo recomendado: 12 avatares para salas grandes sin repetición.
*/

export const AVATAR_LIST = [
  { emoji: '🐱', bg: '#FDE68A22', name: 'Gatito'    },
  { emoji: '🐶', bg: '#BFDBFE22', name: 'Perrito'   },
  { emoji: '🦊', bg: '#FED7AA22', name: 'Zorro'     },
  { emoji: '🐸', bg: '#BBF7D022', name: 'Ranita'    },
  { emoji: '🐼', bg: '#E5E7EB22', name: 'Panda'     },
  { emoji: '🦁', bg: '#FEF3C722', name: 'León'      },
  { emoji: '🐯', bg: '#FED7AA22', name: 'Tigre'     },
  { emoji: '🐨', bg: '#DDD6FE22', name: 'Koala'     },
  { emoji: '🦝', bg: '#D1FAE522', name: 'Mapache'   },
  { emoji: '🐻', bg: '#FBD5E722', name: 'Oso'       },
  { emoji: '🦄', bg: '#EDE9FE22', name: 'Unicornio' },
  { emoji: '🐲', bg: '#BBF7D022', name: 'Dragón'    },
];

/** Devuelve el avatar según posición de llegada (0-based). */
export function getAvatar(index) {
  return AVATAR_LIST[index % AVATAR_LIST.length];
}

/** Devuelve un mapa { playerId → avatar } para toda la sala. */
export function assignAvatars(players) {
  return Object.fromEntries(
    players.map((p, i) => [p.id, getAvatar(i)])
  );
}
