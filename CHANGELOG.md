# Changelog — Verdaderos Reales

---

## [Sin publicar]

---

## [1.4] - 2026-06-05

### Nuevo
- Al crear una sala, ahora puedes elegir qué tipos de preguntas quieres que salgan durante la partida. Por ahora solo hay un tipo (Genéricas).
- El código de sala ahora tiene un botón para copiarlo al portapapeles con un solo toque.
- El botón de Ko-fi aparece en la parte inferior de todas las pantallas por si quieres apoyar el proyecto.

### Cambiado
- La pantalla de sala de espera fue rediseñada: el código se ve más grande y claro, y las características de la partida.
- La configuración de la sala ahora muestra los modos de juego y los tipos de preguntas en cuadrículas de dos columnas.
- Se eliminó el banner de publicidad que aparecía en la parte superior de todas las pantallas.
- El selector de idioma y los créditos de la app ahora aparecen en una sola línea.

### Arreglado
- Al elegir al Líder con la animación de ruleta, el juego esperaba hasta 11 segundos de más antes de pasar a la siguiente pantalla. Ahora avanza en cuanto termina la animación.

### Mejoras de velocidad
- El juego dejó de actualizarse visualmente cada 3 segundos si nada había cambiado en la sala.
- Los avatares de los jugadores dejaron de recalcularse en cada actualización cuando no era necesario.
- Las preguntas del banco ya no se cargan al abrir la app, sino solo cuando se crea una sala.

---

## [1.3] - 2026-05-27

### Nuevo
- Sistema de internacionalización (i18n) completo.
- Selector de idioma en el menú principal (español / inglés).
- El Líder puede responder en preguntas de tipo Sí/No y opción múltiple. Su respuesta se valida automáticamente como correcta y suma los puntos correspondientes, sin necesidad de que él mismo la valide.
- Corrección del cierre de sala por el administrador: al pulsar "Salir", todos los jugadores conectados son redirigidos automáticamente al menú.

### Arreglado
- La animación de selección del Líder se ejecutaba 2 o 3 veces para los aspirantes.
- El contador "Esperando: X/Y" en la vista del Líder mostraba un número incorrecto después de validar alguna respuesta.
- El banner de publicidad no se mostraba en pantallas grandes.
- Al reconectarse a una sala ya iniciada, algunos jugadores podían ver el rol incorrecto si habían salido durante la fase de selección del Líder.

### Cambiado
- El layout de todas las pantallas (menú, lobby, partida, resultados) fue unificado.

---

## [1.2] - 2026-05-25

### Nuevo
- Botón de salida disponible en todas las pantallas del juego. Muestra una confirmación antes de salir para evitar cierres accidentales.

### Rediseño visual completo
- Nuevo estilo caricaturesco y colorido en todas las pantallas.
- Avatares asignados automáticamente a cada jugador al entrar a la sala.
- Pantalla del menú con gradiente oscuro y logo animado.
- Sala de espera con código de sala destacado y jugadores en cuadrícula con avatar.
- Pantalla de selección del Líder con animación visual para todos los jugadores.
- Pantalla de partida con marcador de puntajes compacto y preguntas destacadas.
- Pantalla de resultados con medallas, tarjeta del ganador y tabla final.
- Modal de configuración rediseñado con el mismo estilo del juego.
- El juego se adapta correctamente a móvil, tablet y escritorio.

---

## [1.1] - 2026-05-17

### Arreglado
- La animación de selección del Líder podía ejecutarse dos veces en algunos casos.
- El tiempo de espera antes de confirmar el Líder era incorrecto y causaba desfases.
- Las preguntas respondidas no se limpiaban correctamente al terminar una partida.
- Al reconectarse, algunos jugadores podían aparecer con el rol equivocado.
- En ciertos casos la respuesta de un jugador no quedaba guardada correctamente.
- Al unirse de nuevo a una sala, algunos jugadores no eran reconocidos como participantes existentes.

### Cambiado
- El código del juego fue reorganizado internamente para ser más fácil de mantener y menos propenso a errores. Esto no cambia nada visible para el jugador.

---

## [1.0] - 2026-05-14

### Nuevo
- Castigo por respuesta incorrecta: fallar puede restar puntos (el puntaje puede quedar en negativo).
- En el modo personalizado, el Líder puede definir cuánto vale cada pregunta individualmente.
- Se muestra el valor de cada pregunta durante la partida (puntos por acierto y castigo).
- Tabla de puntajes visible también en la pantalla de creación de pregunta y en la de espera.
- Los errores del juego ahora aparecen como mensajes en pantalla en vez de ventanas emergentes.
- Si el administrador cierra la sala, los jugadores son redirigidos al menú automáticamente.
- Las preguntas respondidas se recuerdan aunque el jugador cierre y vuelva a abrir la app.

### Cambiado
- Los controles de rondas y puntos cambiaron de botones a barras deslizantes (rondas: 2–20, puntos: 1–10).
- La tabla de puntajes ahora muestra el estado de cada jugador en la ronda actual.
- El juego ya no crea intervalos de actualización duplicados en segundo plano.

### Arreglado
- Era posible enviar la misma respuesta dos veces en preguntas de texto.
- El límite de caracteres no se aplicaba en la pantalla de creación de preguntas.
- Al hacer revancha, las preguntas respondidas no se reiniciaban para todos los jugadores.
- Al reconectarse, el índice de la última pregunta respondida podía quedar desfasado.

---

## [0.6] - 2026-04-28

### Nuevo
- Modo personalizado: el Líder escribe cada pregunta en vivo durante la partida.
- Pantalla de espera mientras el Líder redacta la pregunta de la ronda.
- Pantalla de selección del Líder con animación antes de iniciar la partida.
- Nuevo rol de administrador que controla el flujo completo de la sala.
- Botón de revancha para volver a jugar en la misma sala sin salir.

---

## [0.5] - 2026-04-18

### Nuevo
- Ventana de configuración para elegir el número de rondas y puntos por acierto antes de iniciar.
- Las respuestas pueden tener distinto valor según la pregunta.

---

## [0.4] - 2026-03-05

### Nuevo
- Límite de caracteres en las respuestas de texto.
- Pantalla de resultados al final con tabla ordenada por puntaje y detalle de cada respuesta.
- Duración total de la partida visible en los resultados.
- Instrucciones para el Líder visibles mientras la partida está en curso.

### Arreglado
- Los jugadores que no habían respondido no aparecían en el marcador.
- Las respuestas de los jugadores no se mostraban correctamente en pantalla.

---

## [0.3] - 2026-03-04

### Nuevo
- Espacios para publicidad en la parte superior e inferior de todas las pantallas.
- 101 preguntas genéricas nuevas (total: 199 preguntas disponibles).

### Cambiado
- Las pantallas ahora se ven bien en celular, tablet y computadora.

---

## [0.2] - 2026-03-03

### Nuevo
- Indicadores de color en el marcador: azul (respondió), verde (correcto), rojo (incorrecto).
- Historial de respuestas visible durante la partida.
- Detalle de preguntas, respuestas y resultados en la pantalla final.

### Cambiado
- Mejoras generales de rendimiento y estabilidad.

---

## [0.1] - 2026-02-17

### Nuevo
- Flujo completo de partida: menú → sala de espera → juego → resultados.
- Crear y unirse a salas con un código de 6 caracteres.
- Modo genérico con 99 preguntas predefinidas en español mezcladas aleatoriamente.
- El Líder marca cada respuesta como correcta o incorrecta.
- Tabla de puntajes actualizada en tiempo real tras cada validación.
- Configuración de partida: número de rondas y puntos por acierto.
- Multijugador en tiempo real: los cambios se sincronizan entre jugadores automáticamente.
