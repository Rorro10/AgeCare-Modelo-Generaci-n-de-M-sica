import { describe, expect, it } from "vitest";
import { PENTATONIC_SCALE } from "../lib/director/domain";
import {
  NOTE_COLORS,
  NOTE_TEXT_COLOR,
  contrastRatio,
  noteColor,
  noteLabel,
  noteName,
} from "../lib/director/noteDisplay";

const INDICES = PENTATONIC_SCALE.map((_, i) => i);

describe("noteName / noteLabel", () => {
  it("nombra las 10 notas en español", () => {
    expect(INDICES.map(noteName)).toEqual([
      "Do", "Re", "Mi", "Sol", "La", "Do", "Re", "Mi", "Sol", "La",
    ]);
  });

  it("la octava de arriba lleva «agudo» en la nota gigante", () => {
    expect(INDICES.map(noteLabel)).toEqual([
      "Do", "Re", "Mi", "Sol", "La",
      "Do agudo", "Re agudo", "Mi agudo", "Sol agudo", "La agudo",
    ]);
  });
});

describe("noteColor", () => {
  it("las dos octavas de una nota comparten color", () => {
    for (let i = 0; i < 5; i++) expect(noteColor(i + 5)).toBe(noteColor(i));
  });

  it("cada nombre tiene un color distinto", () => {
    expect(new Set(Object.values(NOTE_COLORS)).size).toBe(5);
  });

  it("todos los colores tienen contraste ≥ 4.5:1 con el texto blanco", () => {
    for (const color of Object.values(NOTE_COLORS)) {
      expect(contrastRatio(color, NOTE_TEXT_COLOR)).toBeGreaterThanOrEqual(4.5);
    }
  });
});

describe("contrastRatio", () => {
  it("coincide con los valores de referencia de WCAG", () => {
    expect(contrastRatio("#000000", "#FFFFFF")).toBeCloseTo(21);
    expect(contrastRatio("#FFFFFF", "#FFFFFF")).toBeCloseTo(1);
    // El orden de los argumentos no importa.
    expect(contrastRatio("#767676", "#FFFFFF")).toBeCloseTo(
      contrastRatio("#FFFFFF", "#767676")
    );
    expect(contrastRatio("#767676", "#FFFFFF")).toBeCloseTo(4.54, 2);
  });
});
