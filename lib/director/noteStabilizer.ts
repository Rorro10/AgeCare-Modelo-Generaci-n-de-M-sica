// Estabilizador anti-temblor: decide qué nota está seleccionada y cuándo una
// pinza debe disparar una nota, filtrando el temblor de la mano. Módulo puro:
// el reloj (now, en ms) se inyecta en cada llamada para poder testearlo.

import {
  HEIGHT_SMOOTHING_ALPHA,
  MIN_NOTE_INTERVAL_MS,
  NOTE_HYSTERESIS_RATIO,
  PENTATONIC_SCALE,
  PINCH_ENTER_THRESHOLD,
  PINCH_EXIT_THRESHOLD,
} from "./domain";
import { heightToNoteIndex } from "./gestureMapper";

export type StabilizerOptions = {
  smoothingAlpha: number;
  noteHysteresisRatio: number;
  pinchEnterThreshold: number;
  pinchExitThreshold: number;
  minNoteIntervalMs: number;
  noteCount: number;
};

// Lo que se mide de la mano principal en un cuadro.
export type StabilizerInput = {
  // Altura 0 (abajo) a 1 (arriba) de la punta del índice.
  height: number;
  // Distancia normalizada entre pulgar e índice.
  pinchDistance: number;
};

export type StabilizerOutput = {
  // Nota seleccionada (null si todavía no se ha visto ninguna mano).
  noteIndex: number | null;
  isPinching: boolean;
  // true solo en el cuadro en que debe sonar una nota.
  shouldTrigger: boolean;
};

const DEFAULT_OPTIONS: StabilizerOptions = {
  smoothingAlpha: HEIGHT_SMOOTHING_ALPHA,
  noteHysteresisRatio: NOTE_HYSTERESIS_RATIO,
  pinchEnterThreshold: PINCH_ENTER_THRESHOLD,
  pinchExitThreshold: PINCH_EXIT_THRESHOLD,
  minNoteIntervalMs: MIN_NOTE_INTERVAL_MS,
  noteCount: PENTATONIC_SCALE.length,
};

export class NoteStabilizer {
  private readonly options: StabilizerOptions;
  private smoothedHeight: number | null = null;
  private noteIndex: number | null = null;
  private pinching = false;
  private lastTriggerTime = -Infinity;

  constructor(options: Partial<StabilizerOptions> = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  // Procesa un cuadro. input = null significa que no se detectó la mano.
  update(input: StabilizerInput | null, now: number): StabilizerOutput {
    if (!input) {
      // Mano perdida: que no quede "pinzando". Si no, al volver la mano con
      // los dedos juntos esa pinza no sonaría. También se olvida la altura
      // suavizada: al volver, la nota responde de inmediato a la nueva altura
      // en vez de "arrastrarse" desde donde estaba la mano antes.
      this.pinching = false;
      this.smoothedHeight = null;
      return { noteIndex: this.noteIndex, isPinching: false, shouldTrigger: false };
    }

    this.noteIndex = this.nextNoteIndex(this.smooth(input.height));
    const shouldTrigger = this.updatePinch(input.pinchDistance, now);
    return { noteIndex: this.noteIndex, isPinching: this.pinching, shouldTrigger };
  }

  // Regla 1: media móvil exponencial sobre la altura.
  private smooth(height: number) {
    const { smoothingAlpha } = this.options;
    this.smoothedHeight =
      this.smoothedHeight === null
        ? height
        : smoothingAlpha * height + (1 - smoothingAlpha) * this.smoothedHeight;
    return this.smoothedHeight;
  }

  // Regla 2: histéresis de nota. Mientras la altura se mantenga dentro de la
  // franja actual ensanchada por el margen, la nota no cambia.
  private nextNoteIndex(height: number) {
    const { noteCount, noteHysteresisRatio } = this.options;
    if (this.noteIndex === null) return heightToNoteIndex(height, noteCount);

    const bandHeight = 1 / noteCount;
    const margin = bandHeight * noteHysteresisRatio;
    const lower = this.noteIndex * bandHeight - margin;
    const upper = (this.noteIndex + 1) * bandHeight + margin;
    if (height >= lower && height < upper) return this.noteIndex;
    return heightToNoteIndex(height, noteCount);
  }

  // Regla 3: histéresis de pinza + intervalo mínimo entre notas.
  private updatePinch(pinchDistance: number, now: number) {
    const { pinchEnterThreshold, pinchExitThreshold, minNoteIntervalMs } =
      this.options;
    const wasPinching = this.pinching;
    this.pinching = wasPinching
      ? pinchDistance <= pinchExitThreshold
      : pinchDistance < pinchEnterThreshold;

    const shouldTrigger =
      this.pinching &&
      !wasPinching &&
      now - this.lastTriggerTime > minNoteIntervalMs;
    if (shouldTrigger) this.lastTriggerTime = now;
    return shouldTrigger;
  }
}
