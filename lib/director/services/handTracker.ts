// Servicio de detección de manos con MediaPipe. Todo corre localmente en el
// navegador (WASM + modelo), sin enviar video a ningún servidor.
//
// El WASM y el modelo se sirven desde /public/mediapipe (ver README, sección
// "Modo sin internet"): la app funciona sin conexión una vez cargada la
// página, y el WASM siempre calza con la versión instalada del paquete.

import type { DetectedHand } from "../domain";

const WASM_BASE_PATH = "/mediapipe/wasm";
const HAND_MODEL_PATH = "/mediapipe/hand_landmarker.task";

export type HandTracker = {
  detect(video: HTMLVideoElement, timestamp: number): DetectedHand[];
  // "GPU" o "CPU": con qué terminó corriendo el modelo (se ve en /?debug=1).
  delegate: "GPU" | "CPU";
  close(): void;
};

export async function createHandTracker(): Promise<HandTracker> {
  const { HandLandmarker, FilesetResolver } = await import(
    "@mediapipe/tasks-vision"
  );
  const vision = await FilesetResolver.forVisionTasks(WASM_BASE_PATH);

  const create = (delegate: "GPU" | "CPU") =>
    HandLandmarker.createFromOptions(vision, {
      baseOptions: { modelAssetPath: HAND_MODEL_PATH, delegate },
      runningMode: "VIDEO",
      numHands: 2,
    });

  // La GPU es más rápida, pero algunos celulares (WebGL limitado o
  // bloqueado) no la soportan y antes la app quedaba en «Algo salió mal».
  // En ese caso se usa la CPU: más lenta, pero funciona.
  let delegate: "GPU" | "CPU" = "GPU";
  let handLandmarker;
  try {
    handLandmarker = await create("GPU");
  } catch (err) {
    console.warn("MediaPipe sin GPU, se usa CPU:", err);
    delegate = "CPU";
    handLandmarker = await create("CPU");
  }

  return {
    delegate,
    detect(video, timestamp) {
      const result = handLandmarker.detectForVideo(video, timestamp);
      return (result.landmarks ?? []).map((landmarks, i) => ({
        landmarks,
        world: result.worldLandmarks?.[i] ?? null,
      }));
    },
    close() {
      handLandmarker.close();
    },
  };
}
