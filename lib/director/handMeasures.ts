// Cuál de las manos detectadas es la principal (la que toca). Módulo puro.

import { WRIST, type Hand, type Point } from "./domain";
import { distance } from "./gestureMapper";

// MediaPipe no entrega las manos siempre en el mismo orden: con dos manos a
// la vista la principal podía saltar de una a otra entre cuadros, y la nota
// saltaba con ella. Se elige la que tenga la muñeca más cerca de la muñeca
// principal del cuadro anterior.
export function pickPrimaryHand(hands: readonly Hand[], previousWrist: Point | null): number {
  if (hands.length <= 1 || previousWrist === null) return 0;
  let best = 0;
  let bestDistance = Infinity;
  hands.forEach((hand, i) => {
    const d = distance(hand[WRIST], previousWrist);
    if (d < bestDistance) {
      best = i;
      bestDistance = d;
    }
  });
  return best;
}
