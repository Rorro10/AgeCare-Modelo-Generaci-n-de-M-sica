// Servicio de detección de manos con MediaPipe. Todo corre localmente en el
// navegador (WASM + modelo), sin enviar video a ningún servidor.
//
// El WASM y el modelo se sirven desde /public/mediapipe (ver README, sección
// "Modo sin internet"): la app funciona sin conexión una vez cargada la
// página, y el WASM siempre calza con la versión instalada del paquete.

import type { Hand } from "../domain";

const WASM_BASE_PATH = "/mediapipe/wasm";
const HAND_MODEL_PATH = "/mediapipe/hand_landmarker.task";

export type HandTracker = {
  detect(video: HTMLVideoElement, timestamp: number): Hand[];
  close(): void;
};

export async function createHandTracker(): Promise<HandTracker> {
  const { HandLandmarker, FilesetResolver } = await import(
    "@mediapipe/tasks-vision"
  );
  const vision = await FilesetResolver.forVisionTasks(WASM_BASE_PATH);
  const handLandmarker = await HandLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: HAND_MODEL_PATH,
      delegate: "GPU",
    },
    runningMode: "VIDEO",
    numHands: 2,
  });

  return {
    detect(video, timestamp) {
      return handLandmarker.detectForVideo(video, timestamp).landmarks ?? [];
    },
    close() {
      handLandmarker.close();
    },
  };
}
