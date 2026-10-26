// Volumen en pasos, compartido por los botones y la segunda mano. Gana el
// último que actuó. Módulo puro.
//
// La segunda mano solo "actúa" cuando su distancia entre muñecas cruza a otro
// paso: si la persona sube el volumen con el botón y la segunda mano sigue en
// cuadro sin moverse, el botón no queda pisado en el cuadro siguiente.

import {
  DEFAULT_VOLUME_STEP,
  MAX_VOLUME_DB,
  MIN_VOLUME_DB,
  VOLUME_HYSTERESIS_RATIO,
  VOLUME_STEPS,
  WRIST_DISTANCE_FOR_MAX_VOLUME,
} from "./domain";

// Paso 1..VOLUME_STEPS → dB, repartidos parejo entre MIN y MAX.
export function volumeStepToDb(step: number) {
  const ratio = (step - 1) / (VOLUME_STEPS - 1);
  return MIN_VOLUME_DB + ratio * (MAX_VOLUME_DB - MIN_VOLUME_DB);
}

// Distancia entre muñecas → paso 1..VOLUME_STEPS, con histéresis respecto al
// paso anterior de la mano (null si la mano recién aparece).
export function wristDistanceToVolumeStep(
  wristDistance: number,
  previousStep: number | null
) {
  const ratio = wristDistance / WRIST_DISTANCE_FOR_MAX_VOLUME;
  const stepFor = (r: number) =>
    Math.min(VOLUME_STEPS, Math.max(1, Math.floor(r * VOLUME_STEPS) + 1));
  if (previousStep === null) return stepFor(ratio);

  const stepWidth = 1 / VOLUME_STEPS;
  const margin = stepWidth * VOLUME_HYSTERESIS_RATIO;
  const lower = (previousStep - 1) * stepWidth - margin;
  const upper = previousStep * stepWidth + margin;
  if (ratio >= lower && ratio < upper) return previousStep;
  return stepFor(ratio);
}

export class VolumeControl {
  private current = DEFAULT_VOLUME_STEP;
  // Último paso que marcó la segunda mano (null = no hay segunda mano).
  private handStep: number | null = null;

  get step() {
    return this.current;
  }

  get canGoLouder() {
    return this.current < VOLUME_STEPS;
  }

  get canGoSofter() {
    return this.current > 1;
  }

  // Cada método devuelve true si el volumen cambió.
  louder() {
    return this.set(this.current + 1);
  }

  softer() {
    return this.set(this.current - 1);
  }

  // wristDistance = null cuando no hay segunda mano en el cuadro.
  updateHand(wristDistance: number | null) {
    if (wristDistance === null) {
      this.handStep = null;
      return false;
    }
    const previous = this.handStep;
    this.handStep = wristDistanceToVolumeStep(wristDistance, previous);
    // Cuando la segunda mano recién aparece solo se registra su paso: una
    // mano que entra al cuadro sin querer (rascarse, acomodarse los lentes)
    // no cambia el volumen. Tiene que moverse a otro paso para actuar.
    if (previous === null || this.handStep === previous) return false;
    return this.set(this.handStep);
  }

  private set(step: number) {
    const next = Math.min(VOLUME_STEPS, Math.max(1, step));
    if (next === this.current) return false;
    this.current = next;
    return true;
  }
}
