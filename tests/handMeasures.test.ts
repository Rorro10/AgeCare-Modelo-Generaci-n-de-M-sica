import { describe, expect, it } from "vitest";
import { WRIST, type Hand, type Point } from "../lib/director/domain";
import { pickPrimaryHand } from "../lib/director/handMeasures";

// Mano de 21 puntos con solo la muñeca ubicada; el resto en el origen.
function handAt(wrist: Point): Hand {
  return Array.from({ length: 21 }, (_, i) => (i === WRIST ? wrist : { x: 0, y: 0, z: 0 }));
}

const p = (x: number, y: number): Point => ({ x, y, z: 0 });

describe("pickPrimaryHand", () => {
  const left = handAt(p(0.2, 0.8));
  const right = handAt(p(0.8, 0.8));

  it("con una sola mano o sin historia, es la primera", () => {
    expect(pickPrimaryHand([right], p(0.2, 0.8))).toBe(0);
    expect(pickPrimaryHand([left, right], null)).toBe(0);
  });

  it("sigue a la misma mano aunque el detector cambie el orden", () => {
    expect(pickPrimaryHand([left, right], p(0.78, 0.79))).toBe(1);
    expect(pickPrimaryHand([right, left], p(0.78, 0.79))).toBe(0);
  });
});
