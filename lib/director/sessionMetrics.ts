// Métricas de uso de una sesión (Sprint 7, actividad 66). Módulo puro: no
// lee relojes ni guarda nada; el hook le pasa la hora de cada evento (ms) y
// pide el resumen cuando quiere guardarlo. Solo se registran conteos y
// tiempos: nunca imágenes, video ni posición de la mano.
//
// Una sesión parte cuando la persona toca «Empezar» por primera vez y dura
// hasta que cierra o abandona la página; las pausas quedan dentro de la misma
// sesión. Definiciones de cada métrica: docs/sprint7/metricas-de-uso.md.

import type { InstrumentId } from "./instruments";

export const SESSION_SUMMARY_VERSION = 1;

// Un cuadro que llega más tarde que esto se cuenta solo hasta este tope: si
// el navegador congeló la pestaña, ese hueco no es "tiempo con la mano".
export const MAX_FRAME_GAP_MS = 500;

export type VolumeSource = "boton" | "mano";

export type SessionSummary = {
  version: typeof SESSION_SUMMARY_VERSION;
  id: string;
  // Código del participante del piloto o id que entrega AgeCare; null si se
  // abrió sin código.
  participant: string | null;
  startedAt: string;
  updatedAt: string;
  // true cuando la página se cerró o se abandonó; si queda en false, la
  // sesión terminó sin aviso (p. ej. se cortó la batería) y vale updatedAt.
  ended: boolean;
  // Desde el primer toque en «Empezar» hasta el último evento.
  totalSeconds: number;
  // Tiempo con la cámara funcionando (sin pausas ni carga).
  activeSeconds: number;
  // Parte del tiempo activo en que se vio al menos una mano.
  handVisibleSeconds: number;
  // handVisibleSeconds / activeSeconds, de 0 a 1 (0 si no hubo tiempo activo).
  handVisibleRatio: number;
  // Desde que la cámara empezó a funcionar hasta la primera nota; null si
  // nunca tocó una nota.
  secondsToFirstNote: number | null;
  notesPlayed: number;
  distinctNotes: number;
  notesPerMinute: number;
  pauses: number;
  instrument: InstrumentId;
  instrumentsUsed: InstrumentId[];
  volumeChanges: Record<VolumeSource, number>;
  volumeStep: number;
  cameraDenied: boolean;
  errors: number;
};

export type SessionStart = {
  id: string;
  participant: string | null;
  instrument: InstrumentId;
  volumeStep: number;
  at: number;
};

export class SessionRecorder {
  readonly id: string;
  private readonly participant: string | null;
  private readonly startedAt: number;
  private lastEventAt: number;
  private runningSince: number | null = null;
  private activeMs = 0;
  private lastFrameAt: number | null = null;
  private handVisibleMs = 0;
  private firstRunningAt: number | null = null;
  private firstNoteAt: number | null = null;
  private notes = 0;
  private readonly noteIndexes = new Set<number>();
  private pauses = 0;
  private instrument: InstrumentId;
  private readonly instrumentsUsed: InstrumentId[];
  private readonly volumeChanges: Record<VolumeSource, number> = { boton: 0, mano: 0 };
  private volumeStep: number;
  private cameraDenied = false;
  private errors = 0;
  private ended = false;

  constructor(start: SessionStart) {
    this.id = start.id;
    this.participant = start.participant;
    this.startedAt = start.at;
    this.lastEventAt = start.at;
    this.instrument = start.instrument;
    this.instrumentsUsed = [start.instrument];
    this.volumeStep = start.volumeStep;
  }

  get isRunning() {
    return this.runningSince !== null;
  }

  // La cámara empezó a funcionar (al empezar o al seguir tras una pausa).
  running(at: number) {
    this.touch(at);
    if (this.runningSince !== null) return;
    this.runningSince = at;
    this.firstRunningAt ??= at;
    this.lastFrameAt = null;
  }

  // Pausa pedida por la persona.
  pause(at: number) {
    if (this.runningSince === null) return;
    this.stopRunning(at);
    this.pauses += 1;
  }

  // Un cuadro procesado; handVisible = se detectó al menos una mano.
  frame(at: number, handVisible: boolean) {
    if (this.runningSince === null) return;
    this.touch(at);
    if (this.lastFrameAt !== null && handVisible) {
      this.handVisibleMs += Math.min(Math.max(0, at - this.lastFrameAt), MAX_FRAME_GAP_MS);
    }
    this.lastFrameAt = at;
  }

  note(at: number, noteIndex: number) {
    this.touch(at);
    this.notes += 1;
    this.noteIndexes.add(noteIndex);
    this.firstNoteAt ??= at;
  }

  changeInstrument(at: number, instrument: InstrumentId) {
    this.touch(at);
    this.instrument = instrument;
    if (!this.instrumentsUsed.includes(instrument)) this.instrumentsUsed.push(instrument);
  }

  changeVolume(at: number, step: number, source: VolumeSource) {
    this.touch(at);
    this.volumeStep = step;
    this.volumeChanges[source] += 1;
  }

  // No se pudo empezar: sin permiso de cámara o error al preparar.
  fail(at: number, kind: "denied" | "error") {
    this.stopRunning(at);
    if (kind === "denied") this.cameraDenied = true;
    else this.errors += 1;
  }

  // La página se cierra o se abandona.
  end(at: number) {
    this.stopRunning(at);
    this.ended = true;
  }

  summary(now: number): SessionSummary {
    const until = Math.max(now, this.lastEventAt);
    const activeMs =
      this.activeMs + (this.runningSince !== null ? until - this.runningSince : 0);
    const handVisibleMs = Math.min(this.handVisibleMs, activeMs);
    const activeMinutes = activeMs / 60_000;
    return {
      version: SESSION_SUMMARY_VERSION,
      id: this.id,
      participant: this.participant,
      startedAt: new Date(this.startedAt).toISOString(),
      updatedAt: new Date(until).toISOString(),
      ended: this.ended,
      totalSeconds: seconds(until - this.startedAt),
      activeSeconds: seconds(activeMs),
      handVisibleSeconds: seconds(handVisibleMs),
      handVisibleRatio: activeMs > 0 ? round(handVisibleMs / activeMs, 3) : 0,
      secondsToFirstNote:
        this.firstNoteAt !== null && this.firstRunningAt !== null
          ? seconds(this.firstNoteAt - this.firstRunningAt)
          : null,
      notesPlayed: this.notes,
      distinctNotes: this.noteIndexes.size,
      notesPerMinute: activeMinutes > 0 ? round(this.notes / activeMinutes, 1) : 0,
      pauses: this.pauses,
      instrument: this.instrument,
      instrumentsUsed: [...this.instrumentsUsed],
      volumeChanges: { ...this.volumeChanges },
      volumeStep: this.volumeStep,
      cameraDenied: this.cameraDenied,
      errors: this.errors,
    };
  }

  private stopRunning(at: number) {
    this.touch(at);
    if (this.runningSince === null) return;
    this.activeMs += Math.max(0, at - this.runningSince);
    this.runningSince = null;
    this.lastFrameAt = null;
  }

  private touch(at: number) {
    if (at > this.lastEventAt) this.lastEventAt = at;
  }
}

// Código de participante aceptado (p. ej. "P01", o el id que entregue
// AgeCare). Solo letras, números, guion y guion bajo: nunca nombres ni RUT.
const PARTICIPANT_PATTERN = /^[A-Za-z0-9_-]{1,40}$/;

export function parseParticipant(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed && PARTICIPANT_PATTERN.test(trimmed) ? trimmed : null;
}

function seconds(ms: number) {
  return round(Math.max(0, ms) / 1000, 1);
}

function round(value: number, decimals: number) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}
