// Servicio de detección de manos con MediaPipe. Todo corre localmente en el
// navegador (WASM + modelo), sin enviar video a ningún servidor.

import type { Hand } from "../domain";

export type HandTracker = {
  detect(video: HTMLVideoElement, timestamp: number): Hand[];
  close(): void;
};

export async function createHandTracker(): Promise<HandTracker> {
  const { HandLandmarker, FilesetResolver } = await import(
    "@mediapipe/tasks-vision"
  );
  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22-rc.20250304/wasm"
  );
  const handLandmarker = await HandLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath:
        "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
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
