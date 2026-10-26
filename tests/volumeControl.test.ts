import { describe, expect, it } from "vitest";
import {
  VolumeControl,
  volumeStepToDb,
  wristDistanceToVolumeStep,
} from "../lib/director/volumeControl";

// Con 5 pasos y 0.8 de distancia máxima, cada paso mide 0.16.
const MIDDLE_OF_STEP = (step: number) => (step - 0.5) * 0.16;

describe("volumeStepToDb", () => {
  it("reparte los 5 pasos parejo entre -24 y 0 dB", () => {
    expect([1, 2, 3, 4, 5].map(volumeStepToDb)).toEqual([-24, -18, -12, -6, 0]);
  });
});

describe("wristDistanceToVolumeStep", () => {
  it("mapea la distancia entre muñecas a los pasos 1..5, acotado", () => {
    expect(wristDistanceToVolumeStep(0, null)).toBe(1);
    expect(wristDistanceToVolumeStep(0.4, null)).toBe(3);
    expect(wristDistanceToVolumeStep(0.8, null)).toBe(5);
    expect(wristDistanceToVolumeStep(2, null)).toBe(5);
    expect(wristDistanceToVolumeStep(-1, null)).toBe(1);
  });

  it("el temblor en el borde entre dos pasos no cambia el paso", () => {
    // Borde entre el paso 3 y el 4 en 0.48.
    let step = wristDistanceToVolumeStep(MIDDLE_OF_STEP(3), null);
    for (let i = 0; i < 20; i++) {
      step = wristDistanceToVolumeStep(i % 2 === 0 ? 0.47 : 0.49, step);
      expect(step).toBe(3);
    }
  });
});

describe("VolumeControl: botones", () => {
  it("parte en el paso 3 y los botones suben y bajan de a uno", () => {
    const volume = new VolumeControl();
    expect(volume.step).toBe(3);
    expect(volume.louder()).toBe(true);
    expect(volume.step).toBe(4);
    expect(volume.softer()).toBe(true);
    expect(volume.softer()).toBe(true);
    expect(volume.step).toBe(2);
  });

  it("no pasa de los extremos y avisa que no cambió", () => {
    const volume = new VolumeControl();
    volume.louder();
    volume.louder();
    expect(volume.step).toBe(5);
    expect(volume.canGoLouder).toBe(false);
    expect(volume.louder()).toBe(false);
    expect(volume.step).toBe(5);
  });
});

describe("VolumeControl: segunda mano", () => {
  it("al aparecer, la segunda mano no cambia el volumen", () => {
    const volume = new VolumeControl();
    expect(volume.updateHand(MIDDLE_OF_STEP(5))).toBe(false);
    expect(volume.step).toBe(3);
  });

  it("al cruzar a otro paso, la mano fija el volumen en ese paso", () => {
    const volume = new VolumeControl();
    volume.updateHand(MIDDLE_OF_STEP(3));
    expect(volume.updateHand(MIDDLE_OF_STEP(5))).toBe(true);
    expect(volume.step).toBe(5);
  });

  it("gana el último que actuó: la mano quieta no pisa el botón", () => {
    const volume = new VolumeControl();
    volume.updateHand(MIDDLE_OF_STEP(2));
    volume.updateHand(MIDDLE_OF_STEP(4)); // mano → 4
    volume.softer(); // botón → 3
    for (let i = 0; i < 30; i++) volume.updateHand(MIDDLE_OF_STEP(4));
    expect(volume.step).toBe(3);
    // Si la mano se mueve a otro paso, vuelve a mandar ella.
    volume.updateHand(MIDDLE_OF_STEP(1));
    expect(volume.step).toBe(1);
  });

  it("si la segunda mano sale y vuelve, otra vez solo se registra", () => {
    const volume = new VolumeControl();
    volume.updateHand(MIDDLE_OF_STEP(3));
    volume.updateHand(null);
    expect(volume.updateHand(MIDDLE_OF_STEP(5))).toBe(false);
    expect(volume.step).toBe(3);
  });
});
