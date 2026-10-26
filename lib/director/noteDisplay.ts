// Cómo se muestra cada nota en pantalla: nombre en español y color. Módulo
// puro, sin React ni DOM.

import { PENTATONIC_SCALE } from "./domain";

export type NoteName = "Do" | "Re" | "Mi" | "Sol" | "La";

// Un color por nombre de nota (las dos octavas comparten color: "Mi siempre
// es verde"). Todos se usan como fondo con texto blanco encima; el contraste
// de cada uno contra blanco está documentado en docs/sprint5/contraste.md y
// se verifica en tests/noteDisplay.test.ts (mínimo 4.5:1, WCAG AA).
export const NOTE_COLORS: Record<NoteName, string> = {
  Do: "#B91C1C", // rojo
  Re: "#A14E05", // naranjo tostado
  Mi: "#15803D", // verde
  Sol: "#1D4ED8", // azul
  La: "#7E22CE", // morado
};

export const NOTE_TEXT_COLOR = "#FFFFFF";

const NAME_BY_LETTER: Record<string, NoteName> = {
  C: "Do",
  D: "Re",
  E: "Mi",
  G: "Sol",
  A: "La",
};

// Nombre corto, para las franjas: "Do", "Re", …
export function noteName(index: number): NoteName {
  return NAME_BY_LETTER[PENTATONIC_SCALE[index][0]];
}

// Nombre para la nota gigante. Las notas de la octava de arriba se distinguen
// con texto ("Re agudo"), no con otro color.
export function noteLabel(index: number): string {
  const isHighOctave = PENTATONIC_SCALE[index].endsWith("5");
  return isHighOctave ? `${noteName(index)} agudo` : noteName(index);
}

export function noteColor(index: number): string {
  return NOTE_COLORS[noteName(index)];
}

// Razón de contraste WCAG 2.x entre dos colores #RRGGBB (1 a 21).
export function contrastRatio(hexA: string, hexB: string) {
  const [light, dark] = [relativeLuminance(hexA), relativeLuminance(hexB)].sort(
    (a, b) => b - a
  );
  return (light + 0.05) / (dark + 0.05);
}

function relativeLuminance(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const channel = parseInt(hex.slice(i, i + 2), 16) / 255;
    return channel <= 0.03928
      ? channel / 12.92
      : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
