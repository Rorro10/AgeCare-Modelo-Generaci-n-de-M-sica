// Retroalimentación visual al tocar una nota. Se llama en el MISMO cuadro en
// que suena la nota (justo después de triggerAttackRelease), por eso usa la
// Web Animations API directamente sobre el DOM en vez de estado de React:
// un setState recién se vería en el render siguiente.

// Ease-out fuerte, el mismo de --ease-out en globals.css.
const EASE_OUT = "cubic-bezier(0.23, 1, 0.32, 1)";
// 180 ms: dentro de 150–200 ms, perceptible pero sin quedarse pegado.
export const PULSE_MS = 180;
// Escala máxima del pulso. Sutil: se toca muchas veces por minuto y la
// tarjeta es enorme (en 58 rem de ancho, 3 % ya son ~28 px de crecimiento).
const PULSE_SCALE = 1.03;
const FLASH_OPACITY = 0.35;

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

// Pulso en la tarjeta de la nota + destello en su franja. El pulso parte en
// su punto máximo y vuelve con ease-out: la respuesta se ve en el mismo
// cuadro del sonido, sin una subida previa que la atrase, y sin rebote.
// Con prefers-reduced-motion no hay escala: solo el destello de color.
export function pulseNote(
  card: HTMLElement | null,
  bands: HTMLElement | null,
  noteIndex: number
) {
  const timing = { duration: PULSE_MS, easing: EASE_OUT };
  const flash = [{ opacity: FLASH_OPACITY }, { opacity: 0 }];

  if (card && !prefersReducedMotion()) {
    card.animate(
      [{ transform: `scale(${PULSE_SCALE})` }, { transform: "scale(1)" }],
      timing
    );
  }
  card?.querySelector<HTMLElement>("[data-flash]")?.animate(flash, timing);
  // Se busca la franja por índice y no por aria-current: si la nota cambió en
  // este mismo cuadro, React todavía no ha movido aria-current.
  bands
    ?.querySelector<HTMLElement>(`[data-band="${noteIndex}"] [data-flash]`)
    ?.animate(flash, timing);
}
