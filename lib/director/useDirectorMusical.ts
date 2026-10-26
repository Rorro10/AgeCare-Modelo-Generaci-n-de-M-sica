"use client";

// Hook que orquesta cámara → detección de manos → mapeo de gestos → audio.
// La lógica de decisión vive en módulos puros (gestureMapper, noteStabilizer);
// aquí solo se conectan los servicios con efectos y el estado de la vista.

import { useEffect, useRef, useState } from "react";
import { INDEX_TIP, PENTATONIC_SCALE, THUMB_TIP, WRIST } from "./domain";
import {
  distance,
  pinchDistance,
  wristDistanceToDb,
  yToHeight,
} from "./gestureMapper";
import { NoteStabilizer } from "./noteStabilizer";
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
  const stabilizerRef = useRef<NoteStabilizer | null>(null);

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
    const stabilizer = stabilizerRef.current;
    if (!video || !canvas || !handTracker || !stabilizer) return;

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
        // de pinza (pulgar + índice) dispara la nota, como un "pluck". El
        // estabilizador filtra el temblor antes de decidir ambas cosas.
        const primary = hands[0];
        const { noteIndex, isPinching, shouldTrigger } = stabilizer.update(
          {
            height: yToHeight(primary[INDEX_TIP].y),
            pinchDistance: pinchDistance(primary[THUMB_TIP], primary[INDEX_TIP]),
          },
          now
        );
        if (noteIndex !== null) {
          const note = PENTATONIC_SCALE[noteIndex];
          setCurrentNote(note);
          if (shouldTrigger) audio?.playNote(note);
        }

        // Segunda mano (opcional): la distancia entre ambas muñecas
        // controla el volumen/intensidad, como pide la especificación
        // ("la posición controla tempo e intensidad").
        if (hands.length > 1 && audio) {
          const wristDistance = distance(primary[WRIST], hands[1][WRIST]);
          audio.setVolume(wristDistanceToDb(wristDistance));
        }

        drawHands(ctx, hands, isPinching);
      } else {
        stabilizer.update(null, now);
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
        // Estado anti-temblor limpio en cada inicio.
        stabilizerRef.current = new NoteStabilizer();
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
