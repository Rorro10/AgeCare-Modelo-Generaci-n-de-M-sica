import { describe, expect, it } from "vitest";
import {
  DEFAULT_INSTRUMENT,
  INSTRUMENTS,
  getInstrument,
  isInstrumentId,
} from "../lib/director/instruments";

describe("instrumentos", () => {
  it("cada instrumento tiene un id único y nombre en español", () => {
    const ids = INSTRUMENTS.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const instrument of INSTRUMENTS) expect(instrument.name.length).toBeGreaterThan(0);
  });

  it("el instrumento por defecto está en la lista", () => {
    expect(isInstrumentId(DEFAULT_INSTRUMENT)).toBe(true);
  });

  it("las notas duran entre 1 y 2 s (antes ~0.25 s se sentían cortadas)", () => {
    for (const { noteSeconds } of INSTRUMENTS) {
      expect(noteSeconds).toBeGreaterThanOrEqual(1);
      expect(noteSeconds).toBeLessThanOrEqual(2);
    }
  });

  it("isInstrumentId rechaza valores guardados que ya no existen", () => {
    expect(isInstrumentId("guitarra")).toBe(true);
    expect(isInstrumentId("violin")).toBe(false);
    expect(isInstrumentId(null)).toBe(false);
  });

  it("getInstrument devuelve el instrumento pedido", () => {
    expect(getInstrument("campanas").name).toBe("Campanas");
  });
});
