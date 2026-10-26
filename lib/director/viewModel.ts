// Qué muestra cada zona de la pantalla en cada estado (ver
// docs/sprint5/wireframes.md). Módulo puro: recibe el estado del Director y
// devuelve textos e indicaciones; los componentes solo los dibujan.

export type DirectorStatus =
  | "idle"
  | "loading"
  | "running"
  | "paused"
  | "denied"
  | "error";

export type DirectorState = {
  status: DirectorStatus;
  // true si la carga es para volver de una pausa (el modelo y el audio ya
  // están listos; solo falta la cámara).
  resuming: boolean;
  noteIndex: number | null;
  showHandGuide: boolean;
};

export type IconName =
  | "play"
  | "pause"
  | "retry"
  | "loading"
  | "music"
  | "hand"
  | "camera-off"
  | "warning";

export type PrimaryAction = "start" | "pause" | "resume" | "none";

// Lo que ocupa el área grande de arriba: la nota o un aviso.
export type Stage =
  | { kind: "note"; noteIndex: number }
  | { kind: "info"; icon: IconName; title: string };

// Aviso sobre la imagen de la cámara cuando no está mostrando video en vivo.
export type CameraNotice = {
  title: string;
  steps?: readonly string[];
};

export type DirectorView = {
  message: string;
  // false cuando el mensaje repite lo que ya dice la tarjeta grande o el
  // aviso de la cámara: no se muestra dos veces en pantalla, pero se sigue
  // anunciando al lector de pantalla.
  messageVisible: boolean;
  stage: Stage;
  cameraNotice: CameraNotice | null;
  primary: { label: string; icon: IconName; busy: boolean; action: PrimaryAction };
  showVolume: boolean;
};

export const MESSAGES = {
  idle: "El navegador te pedirá usar la cámara. Toca «Permitir».",
  loading: "Preparando la cámara y la música…",
  resuming: "Preparando la cámara…",
  denied: "No tenemos permiso para usar la cámara.",
  error: "Algo salió mal. Toca «Intentar de nuevo».",
  paused: "En pausa. Toca «Seguir» para continuar.",
  showHand: "Muestra tu mano a la cámara",
  play: "Sube o baja la mano para elegir la nota. Junta el pulgar y el índice para tocar.",
} as const;

const DENIED_STEPS = [
  "Toca el candado 🔒 junto a la dirección de la página.",
  "Elige «Permitir» en Cámara.",
  "Toca «Intentar de nuevo».",
] as const;

const RETRY = { label: "Intentar de nuevo", icon: "retry", busy: false, action: "start" } as const;

export function describeView(state: DirectorState): DirectorView {
  const view = describeStatus(state);
  const repeated =
    (view.stage.kind === "info" && view.stage.title === view.message) ||
    view.cameraNotice?.title === view.message;
  return { ...view, messageVisible: !repeated };
}

function describeStatus(state: DirectorState): Omit<DirectorView, "messageVisible"> {
  const { status, resuming, noteIndex, showHandGuide } = state;

  switch (status) {
    case "idle":
      return {
        message: MESSAGES.idle,
        stage: { kind: "info", icon: "music", title: "Toca música con tu mano" },
        cameraNotice: { title: "La cámara está apagada" },
        primary: { label: "Empezar", icon: "play", busy: false, action: "start" },
        showVolume: false,
      };
    case "loading":
      return {
        message: resuming ? MESSAGES.resuming : MESSAGES.loading,
        stage: { kind: "info", icon: "loading", title: "Preparando…" },
        cameraNotice: { title: resuming ? MESSAGES.resuming : MESSAGES.loading },
        primary: { label: "Preparando…", icon: "loading", busy: true, action: "none" },
        // Al volver de una pausa el volumen ya existe: se mantiene a la
        // vista para que la fila de botones no salte.
        showVolume: resuming,
      };
    case "denied":
      return {
        message: MESSAGES.denied,
        stage: { kind: "info", icon: "camera-off", title: "No podemos ver la cámara" },
        cameraNotice: { title: "Para permitirla:", steps: DENIED_STEPS },
        primary: RETRY,
        showVolume: false,
      };
    case "error":
      return {
        message: MESSAGES.error,
        stage: { kind: "info", icon: "warning", title: "Algo salió mal" },
        cameraNotice: {
          title:
            "No pudimos preparar la música. Revisa que la cámara esté conectada y vuelve a intentar.",
        },
        primary: RETRY,
        showVolume: false,
      };
    case "paused":
      return {
        message: MESSAGES.paused,
        stage: { kind: "info", icon: "pause", title: "En pausa" },
        cameraNotice: { title: "La cámara está apagada mientras está en pausa" },
        primary: { label: "Seguir", icon: "play", busy: false, action: "resume" },
        showVolume: true,
      };
    case "running": {
      const guide = showHandGuide || noteIndex === null;
      return {
        message: guide ? MESSAGES.showHand : MESSAGES.play,
        stage: guide
          ? { kind: "info", icon: "hand", title: MESSAGES.showHand }
          : { kind: "note", noteIndex },
        cameraNotice: null,
        primary: { label: "Pausar", icon: "pause", busy: false, action: "pause" },
        showVolume: true,
      };
    }
  }
}
