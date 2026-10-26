// Dibujo simple de los landmarks para dar feedback visual inmediato.

import type { Hand } from "../domain";

export function drawHands(
  ctx: CanvasRenderingContext2D,
  hands: Hand[],
  isPinching: boolean
) {
  const { width, height } = ctx.canvas;
  ctx.fillStyle = isPinching ? "#22c55e" : "#38bdf8";
  for (const hand of hands) {
    for (const point of hand) {
      ctx.beginPath();
      ctx.arc(point.x * width, point.y * height, 4, 0, 2 * Math.PI);
      ctx.fill();
    }
  }
}
