// Dibujo de la mano sobre la imagen de la cámara, para dar feedback visual
// inmediato. El canvas se muestra en espejo (CSS), igual que el video.

import type { Hand } from "../domain";

const OPEN_COLOR = "#38bdf8";
const PINCH_COLOR = "#22c55e";

export function drawHands(
  ctx: CanvasRenderingContext2D,
  hands: Hand[],
  isPinching: boolean
) {
  const { width, height } = ctx.canvas;
  ctx.fillStyle = isPinching ? PINCH_COLOR : OPEN_COLOR;
  for (const hand of hands) {
    for (const point of hand) {
      ctx.beginPath();
      ctx.arc(point.x * width, point.y * height, 4, 0, 2 * Math.PI);
      ctx.fill();
    }
  }
}

// Texto de diagnóstico (solo con /?debug=1) en la esquina superior
// izquierda. Como el canvas está en espejo, se invierte para que se lea.
export function drawDebugInfo(ctx: CanvasRenderingContext2D, lines: readonly string[]) {
  const { width } = ctx.canvas;
  const size = Math.max(12, Math.round(width / 32));
  ctx.save();
  ctx.translate(width, 0);
  ctx.scale(-1, 1);
  ctx.font = `${size}px ui-monospace, monospace`;
  ctx.textBaseline = "top";
  const boxWidth = Math.max(...lines.map((line) => ctx.measureText(line).width)) + size;
  ctx.fillStyle = "rgba(0, 0, 0, 0.65)";
  ctx.fillRect(0, 0, boxWidth, lines.length * size * 1.3 + size * 0.6);
  ctx.fillStyle = "#ffffff";
  lines.forEach((line, i) => ctx.fillText(line, size * 0.5, size * 0.3 + i * size * 1.3));
  ctx.restore();
}
