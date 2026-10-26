import { describe, expect, it } from "vitest";
import { PENTATONIC_SCALE } from "../lib/director/domain";
import {
  heightToNoteIndex,
  pinchDistance,
  wristDistanceToDb,
  yToHeight,
} from "../lib/director/gestureMapper";

const LAST = PENTATONIC_SCALE.length - 1;

describe("heightToNoteIndex", () => {
  it("altura 0 → nota más grave y altura 1 → nota más aguda", () => {
    expect(PENTATONIC_SCALE[heightToNoteIndex(0)]).toBe("C4");
    expect(PENTATONIC_SCALE[heightToNoteIndex(1)]).toBe("A5");
  });

  it("divide la altura en franjas iguales, una por nota", () => {
    expect(heightToNoteIndex(0.05)).toBe(0);
    expect(heightToNoteIndex(0.15)).toBe(1);
    expect(heightToNoteIndex(0.55)).toBe(5);
  });

  it("acota valores fuera de rango a los extremos de la escala", () => {
    expect(heightToNoteIndex(-0.5)).toBe(0);
    expect(heightToNoteIndex(1.5)).toBe(LAST);
  });
});

describe("yToHeight", () => {
  it("invierte y de MediaPipe: arriba de la imagen es altura máxima", () => {
    expect(yToHeight(0)).toBe(1);
    expect(yToHeight(1)).toBe(0);
  });
});

describe("pinchDistance", () => {
  it("mide la distancia en el plano, ignorando z", () => {
    const thumb = { x: 0.5, y: 0.5, z: 0 };
    const index = { x: 0.53, y: 0.54, z: 0.9 };
    expect(pinchDistance(thumb, index)).toBeCloseTo(0.05);
  });
});

describe("wristDistanceToDb", () => {
  it("mapea la distancia entre muñecas a -24..0 dB", () => {
    expect(wristDistanceToDb(0)).toBe(-24);
    expect(wristDistanceToDb(0.4)).toBeCloseTo(-12);
    expect(wristDistanceToDb(0.8)).toBe(0);
  });

  it("no sale del rango -24..0 dB", () => {
    expect(wristDistanceToDb(2)).toBe(0);
    expect(wristDistanceToDb(-1)).toBe(-24);
  });
});
