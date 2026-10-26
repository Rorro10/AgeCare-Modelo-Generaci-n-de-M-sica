import { describe, expect, it } from "vitest";
import { NoteStabilizer } from "../lib/director/noteStabilizer";

// Duración aproximada de un cuadro a 60 fps.
const FRAME_MS = 16;
// Distancias de pinza claramente abiertas o cerradas.
const OPEN = 0.15;
const CLOSED = 0.03;

describe("NoteStabilizer: histéresis de nota", () => {
  it("el temblor en el borde entre dos notas no cambia la nota", () => {
    const stabilizer = new NoteStabilizer();
    let t = 0;
    // Mano quieta en la franja de la nota 4 (alturas 0.4–0.5).
    for (let i = 0; i < 10; i++) {
      stabilizer.update({ height: 0.45, pinchDistance: OPEN }, (t += FRAME_MS));
    }
    // Temblor alrededor del límite 0.5 entre la nota 4 y la 5.
    const notes = new Set<number | null>();
    for (let i = 0; i < 40; i++) {
      const height = i % 2 === 0 ? 0.48 : 0.52;
      const out = stabilizer.update({ height, pinchDistance: OPEN }, (t += FRAME_MS));
      notes.add(out.noteIndex);
    }
    expect([...notes]).toEqual([4]);
  });

  it("un movimiento claro sí cambia la nota", () => {
    const stabilizer = new NoteStabilizer();
    let t = 0;
    let out = stabilizer.update({ height: 0.45, pinchDistance: OPEN }, t);
    expect(out.noteIndex).toBe(4);
    for (let i = 0; i < 15; i++) {
      out = stabilizer.update({ height: 0.75, pinchDistance: OPEN }, (t += FRAME_MS));
    }
    expect(out.noteIndex).toBe(7);
  });
});

describe("NoteStabilizer: histéresis de pinza", () => {
  it("una pinza que oscila entre 0.059 y 0.065 dispara una sola vez", () => {
    const stabilizer = new NoteStabilizer();
    let triggers = 0;
    // 30 cuadros ≈ 480 ms: más que el intervalo mínimo entre notas, así que
    // solo la histéresis evita disparos repetidos.
    for (let i = 0; i < 30; i++) {
      const pinchDistance = i % 2 === 0 ? 0.059 : 0.065;
      const out = stabilizer.update({ height: 0.5, pinchDistance }, i * FRAME_MS);
      if (out.shouldTrigger) triggers++;
    }
    expect(triggers).toBe(1);
  });

  it("dos pinzas separadas por más de 120 ms disparan dos notas", () => {
    const stabilizer = new NoteStabilizer();
    const first = stabilizer.update({ height: 0.5, pinchDistance: CLOSED }, 0);
    stabilizer.update({ height: 0.5, pinchDistance: OPEN }, 60);
    const second = stabilizer.update({ height: 0.5, pinchDistance: CLOSED }, 200);
    expect(first.shouldTrigger).toBe(true);
    expect(second.shouldTrigger).toBe(true);
  });

  it("dos pinzas a menos de 120 ms disparan una sola nota", () => {
    const stabilizer = new NoteStabilizer();
    const first = stabilizer.update({ height: 0.5, pinchDistance: CLOSED }, 0);
    stabilizer.update({ height: 0.5, pinchDistance: OPEN }, 40);
    const second = stabilizer.update({ height: 0.5, pinchDistance: CLOSED }, 80);
    expect(first.shouldTrigger).toBe(true);
    expect(second.shouldTrigger).toBe(false);
  });
});

describe("NoteStabilizer: mano perdida", () => {
  it("perder la mano resetea la pinza", () => {
    const stabilizer = new NoteStabilizer();
    const first = stabilizer.update({ height: 0.5, pinchDistance: CLOSED }, 0);
    expect(first.shouldTrigger).toBe(true);

    const lost = stabilizer.update(null, 200);
    expect(lost.isPinching).toBe(false);
    expect(lost.shouldTrigger).toBe(false);

    // Vuelve con los dedos juntos: es una pinza nueva y debe sonar.
    const back = stabilizer.update({ height: 0.5, pinchDistance: CLOSED }, 400);
    expect(back.shouldTrigger).toBe(true);
  });

  it("sin perder la mano, mantener la pinza no vuelve a disparar", () => {
    const stabilizer = new NoteStabilizer();
    stabilizer.update({ height: 0.5, pinchDistance: CLOSED }, 0);
    const held = stabilizer.update({ height: 0.5, pinchDistance: CLOSED }, 400);
    expect(held.shouldTrigger).toBe(false);
  });
});
