// Regla "sin mano > 3 s": decide cuándo aparece la guía grande "Muestra tu
// mano a la cámara". Módulo puro: el reloj (en ms) se inyecta, como en
// NoteStabilizer, para poder testearlo sin esperar 3 segundos reales.

// Tiempo sin mano tras el cual aparece la guía. Más corto, la guía
// parpadearía con cada pérdida breve de la detección; más largo, la persona
// se queda sin saber qué hacer.
export const HAND_GUIDE_DELAY_MS = 3000;

// Devuelve true si hay que mostrar la guía grande.
//
// - lastHandSeenAt: instante (ms) del último cuadro en que se vio una mano,
//   o null si no se ha visto ninguna desde que empezó (o se reanudó) la
//   sesión.
// - now: instante actual, en el mismo reloj que lastHandSeenAt.
// - delayMs: cuánto tiempo sin mano se tolera antes de mostrar la guía.
//
// Comportamiento esperado (ver tests/handPresence.test.ts):
// - Si nunca se ha visto una mano, la guía aparece de inmediato.
// - Mientras la mano lleve delayMs o menos sin verse, NO se muestra: es un
//   parpadeo de la detección o la mano salió un momento.
// - Cuando lleva MÁS de delayMs sin verse, se muestra.
export function shouldShowHandGuide(
  lastHandSeenAt: number | null,
  now: number,
  delayMs: number = HAND_GUIDE_DELAY_MS
): boolean {
  // TODO(Paz): implementar la regla.
  void lastHandSeenAt;
  void now;
  void delayMs;
  throw new Error("shouldShowHandGuide: pendiente de implementar");
}
