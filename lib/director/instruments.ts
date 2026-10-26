// Instrumentos que la persona puede elegir. Módulo puro: solo describe cada
// instrumento; cómo suena (la síntesis con Tone.js) vive en
// services/audioEngine.ts. Todos son sintetizados, sin archivos de audio,
// para que la app siga funcionando sin internet.

export type InstrumentId = "piano" | "guitarra" | "campanas" | "flauta";

export type Instrument = {
  id: InstrumentId;
  name: string;
  // Ícono reconocible y con color; siempre va junto al nombre.
  emoji: string;
  // Cuánto se mantiene la nota antes de soltarla (s). Antes era una corchea
  // (~0.25 s) y se sentía cortada; con 1 a 2 s la nota "respira".
  noteSeconds: number;
};

export const INSTRUMENTS: readonly Instrument[] = [
  { id: "piano", name: "Piano", emoji: "🎹", noteSeconds: 1.2 },
  { id: "guitarra", name: "Guitarra", emoji: "🎸", noteSeconds: 1.5 },
  { id: "campanas", name: "Campanas", emoji: "🔔", noteSeconds: 2 },
  { id: "flauta", name: "Flauta", emoji: "🪈", noteSeconds: 1 },
];

export const DEFAULT_INSTRUMENT: InstrumentId = "piano";

export function isInstrumentId(value: unknown): value is InstrumentId {
  return INSTRUMENTS.some((instrument) => instrument.id === value);
}

export function getInstrument(id: InstrumentId): Instrument {
  return INSTRUMENTS.find((instrument) => instrument.id === id) ?? INSTRUMENTS[0];
}
