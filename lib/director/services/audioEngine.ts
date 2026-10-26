// Servicio de audio con Tone.js. Debe crearse tras un gesto del usuario
// (toque en "Empezar" o en un instrumento), porque el navegador bloquea el
// audio antes de eso.
//
// Cadena: voces del instrumento → (efecto propio) → reverberación → volumen.
// La reverberación suave compartida es lo que más le quita el sonido "de
// computador" a los sintetizadores.

import type { Note } from "../domain";
import { getInstrument, type InstrumentId } from "../instruments";

type ToneModule = typeof import("tone");

export type AudioEngine = {
  playNote(note: Note): void;
  setInstrument(id: InstrumentId): void;
  setVolume(db: number): void;
  dispose(): void;
};

// Lo mínimo que se usa de cada voz (Synth, FMSynth, PluckSynth…).
type Voice = {
  triggerAttackRelease(note: string, duration: number): unknown;
  connect(destination: import("tone").InputNode): unknown;
  dispose(): unknown;
};

// Varias voces por instrumento: con notas de 1–2 s, una nota nueva no debe
// cortar a la anterior. Se usan por turnos.
const VOICES = 4;

// Ajuste de volumen por instrumento (dB) para que todos suenen parecido de
// fuerte. Valores iniciales: afinarlos escuchando en el celular.
const GAIN_DB: Record<InstrumentId, number> = {
  piano: 0,
  guitarra: 4,
  campanas: -6,
  flauta: -2,
};

function createVoice(Tone: ToneModule, id: InstrumentId): Voice {
  switch (id) {
    case "piano":
      // Piano eléctrico por FM: ataque rápido y caída larga.
      return new Tone.FMSynth({
        harmonicity: 2,
        modulationIndex: 3.5,
        oscillator: { type: "sine" },
        modulation: { type: "sine" },
        envelope: { attack: 0.005, decay: 1.2, sustain: 0.15, release: 1.2 },
        modulationEnvelope: { attack: 0.005, decay: 0.5, sustain: 0.1, release: 0.8 },
      });
    case "guitarra":
      // Cuerda pulsada (Karplus-Strong): suena natural con el gesto de pinza.
      return new Tone.PluckSynth({
        attackNoise: 1,
        dampening: 4000,
        resonance: 0.97,
        release: 1,
      });
    case "campanas":
      // FM con razón inarmónica: timbre de campana, larga resonancia.
      return new Tone.FMSynth({
        harmonicity: 3.5,
        modulationIndex: 10,
        oscillator: { type: "sine" },
        modulation: { type: "sine" },
        envelope: { attack: 0.001, decay: 2.5, sustain: 0, release: 2.5 },
        modulationEnvelope: { attack: 0.001, decay: 1.5, sustain: 0, release: 1 },
      });
    case "flauta":
      // Tono suave con ataque algo lento, como un soplido.
      return new Tone.Synth({
        oscillator: { type: "triangle" },
        envelope: { attack: 0.08, decay: 0.2, sustain: 0.8, release: 0.8 },
      });
  }
}

export async function createAudioEngine(
  initialInstrument: InstrumentId
): Promise<AudioEngine> {
  const Tone = await import("tone");
  await Tone.start();
  // Tone programa los sonidos con 0.1 s de anticipación por defecto: la nota
  // sonaría ~100 ms después del pulso visual. En 0 suena en cuanto se pide,
  // en el mismo cuadro que la animación.
  Tone.getContext().lookAhead = 0;

  const volume = new Tone.Volume(-8).toDestination();
  const reverb = new Tone.Reverb({ decay: 2.5, wet: 0.25 }).connect(volume);

  let instrumentId = initialInstrument;
  // Nodos propios del instrumento actual (volumen relativo y, en la flauta,
  // un vibrato leve), para liberarlos al cambiar de instrumento.
  let chain: import("tone").ToneAudioNode[] = [];
  let voices: Voice[] = [];
  let nextVoice = 0;

  function disposeInstrument() {
    voices.forEach((voice) => voice.dispose());
    chain.forEach((node) => node.dispose());
  }

  function buildInstrument(id: InstrumentId) {
    disposeInstrument();

    const gain = new Tone.Volume(GAIN_DB[id]).connect(reverb);
    chain = [gain];
    let input: import("tone").ToneAudioNode = gain;
    if (id === "flauta") {
      input = new Tone.Vibrato({ frequency: 5, depth: 0.08 }).connect(gain);
      chain.push(input);
    }
    voices = Array.from({ length: VOICES }, () => {
      const voice = createVoice(Tone, id);
      voice.connect(input);
      return voice;
    });
    nextVoice = 0;
    instrumentId = id;
  }

  // La reverberación genera su respuesta en segundo plano; mientras tanto
  // solo suena la parte seca, así que no hace falta esperarla.
  buildInstrument(initialInstrument);

  return {
    playNote(note) {
      const voice = voices[nextVoice];
      nextVoice = (nextVoice + 1) % voices.length;
      voice.triggerAttackRelease(note, getInstrument(instrumentId).noteSeconds);
    },
    setInstrument(id) {
      if (id !== instrumentId) buildInstrument(id);
    },
    setVolume(db) {
      volume.volume.rampTo(db, 0.05);
    },
    dispose() {
      disposeInstrument();
      reverb.dispose();
      volume.dispose();
    },
  };
}
