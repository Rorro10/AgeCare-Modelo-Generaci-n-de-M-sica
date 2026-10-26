// Dominio del Director Musical: tipos y constantes puras, sin React ni DOM.

// Punto normalizado entregado por MediaPipe: x e y van de 0 a 1 respecto al
// cuadro de video (y = 0 es arriba), z es profundidad relativa.
export type Point = { x: number; y: number; z: number };

// Una mano son los 21 landmarks de MediaPipe Hands.
export type Hand = Point[];

// Resultado de procesar un cuadro de video: las manos detectadas en él.
export type HandFrame = { hands: Hand[]; timestamp: number };

// Escala pentatónica mayor de C: siempre suena armonioso, sin importar
// el orden de las notas. Ampliada a dos octavas para tener más rango.
export const PENTATONIC_SCALE = [
  "C4",
  "D4",
  "E4",
  "G4",
  "A4",
  "C5",
  "D5",
  "E5",
  "G5",
  "A5",
] as const;

export type Note = (typeof PENTATONIC_SCALE)[number];

// Landmarks de MediaPipe Hands que usamos (ver diagrama oficial):
// 0 = muñeca, 4 = punta del pulgar, 8 = punta del índice.
export const WRIST = 0;
export const THUMB_TIP = 4;
export const INDEX_TIP = 8;

// Distancia (normalizada 0-1) entre pulgar e índice bajo la cual se considera
// "pinza". Se puede ajustar según pruebas de usabilidad.
export const PINCH_THRESHOLD = 0.06;

// Tiempo mínimo entre dos notas: evita que un mismo gesto dispare varias
// notas seguidas si la detección parpadea.
export const MIN_NOTE_INTERVAL_MS = 120;

// Rango de volumen controlado por la segunda mano. -24 dB sigue siendo
// audible con las manos juntas; 0 dB es el máximo sin saturar.
export const MIN_VOLUME_DB = -24;
export const MAX_VOLUME_DB = 0;

// Distancia entre muñecas con la que se alcanza el volumen máximo. 0.8 es
// casi el ancho del cuadro: no exige estirar los brazos por completo.
export const WRIST_DISTANCE_FOR_MAX_VOLUME = 0.8;
