import { describe, expect, it } from "vitest";
import {
  HAND_GUIDE_DELAY_MS,
  shouldShowHandGuide,
} from "../lib/director/handPresence";

describe("shouldShowHandGuide", () => {
  it("si nunca se ha visto una mano, muestra la guía de inmediato", () => {
    expect(shouldShowHandGuide(null, 0)).toBe(true);
    expect(shouldShowHandGuide(null, 10_000)).toBe(true);
  });

  it("con la mano a la vista en este cuadro, no muestra la guía", () => {
    expect(shouldShowHandGuide(5_000, 5_000)).toBe(false);
  });

  it("un parpadeo corto de la detección no muestra la guía", () => {
    expect(shouldShowHandGuide(5_000, 5_100)).toBe(false);
    expect(shouldShowHandGuide(5_000, 5_000 + HAND_GUIDE_DELAY_MS - 1)).toBe(false);
  });

  it("exactamente 3 s sin mano todavía no muestra la guía (es «más de» 3 s)", () => {
    expect(shouldShowHandGuide(5_000, 5_000 + HAND_GUIDE_DELAY_MS)).toBe(false);
  });

  it("más de 3 s sin mano muestra la guía", () => {
    expect(shouldShowHandGuide(5_000, 5_000 + HAND_GUIDE_DELAY_MS + 1)).toBe(true);
    expect(shouldShowHandGuide(5_000, 60_000)).toBe(true);
  });

  it("respeta un retardo distinto si se le pasa", () => {
    expect(shouldShowHandGuide(1_000, 1_400, 500)).toBe(false);
    expect(shouldShowHandGuide(1_000, 1_501, 500)).toBe(true);
  });
});
