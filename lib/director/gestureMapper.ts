// Traduce posiciones de la mano a parámetros musicales. Funciones puras.

import {
  MAX_VOLUME_DB,
  MIN_VOLUME_DB,
  PENTATONIC_SCALE,
  WRIST_DISTANCE_FOR_MAX_VOLUME,
  type Point,
} from "./domain";

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

// Distancia en el plano de la imagen (se ignora z, que es poco confiable).
export function distance(a: Point, b: Point) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

// y va de 0 (arriba) a 1 (abajo): invertimos para que "arriba" sea una
// altura mayor y, por lo tanto, una nota más aguda, que es lo intuitivo.
export function yToHeight(y: number) {
  return 1 - y;
}

// Altura 0-1 → índice de nota. La pantalla se divide en franjas iguales,
// una por nota; valores fuera de rango quedan acotados a los extremos.
export function heightToNoteIndex(
  height: number,
  noteCount: number = PENTATONIC_SCALE.length
) {
  return clamp(Math.floor(height * noteCount), 0, noteCount - 1);
}

export function pinchDistance(thumbTip: Point, indexTip: Point) {
  return distance(thumbTip, indexTip);
}

// Distancia entre muñecas → volumen en dB, lineal entre MIN y MAX.
export function wristDistanceToDb(wristDistance: number) {
  const ratio = clamp(wristDistance / WRIST_DISTANCE_FOR_MAX_VOLUME, 0, 1);
  return MIN_VOLUME_DB + ratio * (MAX_VOLUME_DB - MIN_VOLUME_DB);
}
