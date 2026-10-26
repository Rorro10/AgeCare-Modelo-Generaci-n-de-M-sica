// Servicio de audio con Tone.js. Debe crearse tras un gesto del usuario
// (click en "Iniciar"), porque el navegador bloquea el audio antes de eso.

import type { Note } from "../domain";

export type AudioEngine = {
  playNote(note: Note): void;
  setVolume(db: number): void;
  dispose(): void;
};

export async function createAudioEngine(): Promise<AudioEngine> {
  const Tone = await import("tone");
  await Tone.start();
  const volume = new Tone.Volume(-8).toDestination();
  const synth = new Tone.Synth({
    oscillator: { type: "sine" },
    envelope: { attack: 0.01, decay: 0.15, sustain: 0.2, release: 0.4 },
  }).connect(volume);

  return {
    playNote(note) {
      synth.triggerAttackRelease(note, "8n");
    },
    setVolume(db) {
      volume.volume.rampTo(db, 0.05);
    },
    dispose() {
      synth.dispose();
    },
  };
}
