"use client";

// Hook que orquesta cámara → detección de manos → mapeo de gestos → audio.
// La lógica de decisión vive en módulos puros (gestureMapper); aquí solo se
// conectan los servicios con efectos y el estado que muestra la vista.

import { useEffect, useRef, useState } from "react";
import {
  INDEX_TIP,
  MIN_NOTE_INTERVAL_MS,
  PENTATONIC_SCALE,
  PINCH_THRESHOLD,
  THUMB_TIP,
  WRIST,
} from "./domain";
import {
  distance,
  heightToNoteIndex,
  pinchDistance,
  wristDistanceToDb,
  yToHeight,
} from "./gestureMapper";
import { createAudioEngine, type AudioEngine } from "./services/audioEngine";
import { startCameraStream, stopCameraStream } from "./services/camera";
import { createHandTracker, type HandTracker } from "./services/handTracker";
import { drawHands } from "./services/landmarkRenderer";

// Cambia a true para reactivar la detección de manos y el audio.
// En false: solo se muestra la cámara, sin procesar gestos.
const HABILITAR_DETECCION_MANOS = true;

export type DirectorStatus = "idle" | "loading" | "running" | "error";

export function useDirectorMusical() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const handTrackerRef = useRef<HandTracker | null>(null);
  const audioRef = useRef<AudioEngine | null>(null);
  const rafRef = useRef<number | null>(null);
  const wasPinchingRef = useRef<boolean>(false);
  const lastNoteTimeRef = useRef<number>(0);

  const [status, setStatus] = useState<DirectorStatus>("idle");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [currentNote, setCurrentNote] = useState<string>("—");
  const [handsDetected, setHandsDetected] = useState<number>(0);

  // Se usan funciones normales (no useCallback) porque no necesitamos
  // identidad estable entre renders: solo leen/escriben refs y estado.

  function stop() {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    stopCameraStream(videoRef.current);
    setStatus("idle");
  }

  function renderLoop() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const handTracker = handTrackerRef.current;
    const audio = audioRef.current;
    if (!video || !canvas || !handTracker) return;

    const ctx = canvas.getContext("2d");
    if (video.readyState >= 2 && ctx) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // renderLoop es un bucle imperativo manejado por requestAnimationFrame
      // (no se ejecuta durante el render de React), por eso puede leer un
      // reloj externo con performance.now().
      // eslint-disable-next-line react-hooks/purity
      const now = performance.now();
      const hands = handTracker.detect(video, now);
      setHandsDetected(hands.length);

      if (hands.length > 0) {
        // Mano principal: controla la nota (altura del índice) y el gesto
        // de pinza (pulgar + índice) dispara la nota, como un "pluck".
        const primary = hands[0];
        const noteIndex = heightToNoteIndex(yToHeight(primary[INDEX_TIP].y));
        const note = PENTATONIC_SCALE[noteIndex];
        setCurrentNote(note);

        const isPinching =
          pinchDistance(primary[THUMB_TIP], primary[INDEX_TIP]) <
          PINCH_THRESHOLD;
        if (
          isPinching &&
          !wasPinchingRef.current &&
          now - lastNoteTimeRef.current > MIN_NOTE_INTERVAL_MS
        ) {
          audio?.playNote(note);
          lastNoteTimeRef.current = now;
        }
        wasPinchingRef.current = isPinching;

        // Segunda mano (opcional): la distancia entre ambas muñecas
        // controla el volumen/intensidad, como pide la especificación
        // ("la posición controla tempo e intensidad").
        if (hands.length > 1 && audio) {
          const wristDistance = distance(primary[WRIST], hands[1][WRIST]);
          audio.setVolume(wristDistanceToDb(wristDistance));
        }

        drawHands(ctx, hands, isPinching);
      } else {
        wasPinchingRef.current = false;
      }
    }

    rafRef.current = requestAnimationFrame(renderLoop);
  }

  async function start() {
    setStatus("loading");
    setErrorMsg("");
    try {
      if (HABILITAR_DETECCION_MANOS) {
        // 1) Cargar MediaPipe Hands.
        handTrackerRef.current = await createHandTracker();
        // 2) Inicializar Tone.js (requiere gesto del usuario, por eso está
        // dentro del click del botón "Iniciar").
        audioRef.current = await createAudioEngine();
      }

      // 3) Pedir la cámara (esto siempre corre, con o sin detección).
      if (!videoRef.current) return;
      await startCameraStream(videoRef.current);

      setStatus("running");
      if (HABILITAR_DETECCION_MANOS) {
        renderLoop();
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(
        err instanceof Error ? err.message : "No se pudo iniciar la cámara."
      );
      setStatus("error");
    }
  }

  useEffect(() => {
    const videoEl = videoRef.current;
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      stopCameraStream(videoEl);
      handTrackerRef.current?.close();
      audioRef.current?.dispose();
    };
  }, []);

  return {
    videoRef,
    canvasRef,
    status,
    errorMsg,
    currentNote,
    handsDetected,
    start,
    stop,
  };
}
