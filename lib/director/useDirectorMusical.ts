"use client";

// Hook que orquesta cámara → detección de manos → mapeo de gestos → audio.
// La lógica de decisión vive en módulos puros (gestureMapper, noteStabilizer,
// volumeControl, viewModel); aquí solo se conectan los servicios con efectos
// y se entrega a la vista el estado ya listo para dibujar.

import { useEffect, useRef, useState } from "react";
import { INDEX_TIP, PENTATONIC_SCALE, THUMB_TIP, VOLUME_STEPS, WRIST } from "./domain";
import { distance, pinchDistance, yToHeight } from "./gestureMapper";
import { NoteStabilizer } from "./noteStabilizer";
import { createAudioEngine, type AudioEngine } from "./services/audioEngine";
import {
  isCameraPermissionError,
  startCameraStream,
  stopCameraStream,
} from "./services/camera";
import { createHandTracker, type HandTracker } from "./services/handTracker";
import { drawHands } from "./services/landmarkRenderer";
import { describeView, type DirectorStatus } from "./viewModel";
import { VolumeControl, volumeStepToDb } from "./volumeControl";

// Cambia a true para reactivar la detección de manos y el audio.
// En false: solo se muestra la cámara, sin procesar gestos.
const HABILITAR_DETECCION_MANOS = true;

export function useDirectorMusical() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const handTrackerRef = useRef<HandTracker | null>(null);
  const audioRef = useRef<AudioEngine | null>(null);
  const rafRef = useRef<number | null>(null);
  const stabilizerRef = useRef<NoteStabilizer | null>(null);
  // Instancia estable durante toda la vida del componente.
  const [volume] = useState(() => new VolumeControl());

  const [status, setStatus] = useState<DirectorStatus>("idle");
  const [resuming, setResuming] = useState(false);
  const [noteIndex, setNoteIndex] = useState<number | null>(null);
  const [handVisible, setHandVisible] = useState(false);
  const [volumeStep, setVolumeStep] = useState(volume.step);

  // Se usan funciones normales (no useCallback) porque no necesitamos
  // identidad estable entre renders: solo leen/escriben refs y estado.

  function stopLoop() {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
  }

  function applyVolume() {
    audioRef.current?.setVolume(volumeStepToDb(volume.step));
    setVolumeStep(volume.step);
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
      const now = performance.now();
      const hands = handTracker.detect(video, now);
      setHandVisible(hands.length > 0);

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
          setNoteIndex(noteIndex);
          if (shouldTrigger) audio?.playNote(PENTATONIC_SCALE[noteIndex]);
        }
        drawHands(ctx, hands, isPinching);
      } else {
        stabilizer.update(null, now);
      }

      // Segunda mano (opcional): la distancia entre ambas muñecas mueve el
      // volumen por pasos, igual que los botones. Solo actúa al cruzar a
      // otro paso, para no pisar al botón por temblor (ver volumeControl).
      const wristDistance =
        hands.length > 1 ? distance(hands[0][WRIST], hands[1][WRIST]) : null;
      if (volume.updateHand(wristDistance)) applyVolume();
    }

    rafRef.current = requestAnimationFrame(renderLoop);
  }

  // Sirve para empezar, para seguir después de una pausa y para reintentar
  // tras un error: solo crea lo que todavía no existe.
  async function start() {
    const isResume = status === "paused";
    setResuming(isResume);
    setStatus("loading");
    try {
      if (HABILITAR_DETECCION_MANOS) {
        // 1) Audio primero: Tone.js necesita arrancar dentro del gesto del
        // usuario (el toque en "Empezar"), antes de esperas largas como la
        // carga del modelo.
        if (!audioRef.current) {
          audioRef.current = await createAudioEngine();
          audioRef.current.setVolume(volumeStepToDb(volume.step));
        }
        // 2) Cargar MediaPipe Hands (solo la primera vez).
        if (!handTrackerRef.current) {
          handTrackerRef.current = await createHandTracker();
        }
        // Estado anti-temblor limpio en cada inicio.
        stabilizerRef.current = new NoteStabilizer();
      }

      // 3) Pedir la cámara (esto siempre corre, con o sin detección).
      if (!videoRef.current) return;
      await startCameraStream(videoRef.current);

      setNoteIndex(null);
      setHandVisible(false);
      setStatus("running");
      if (HABILITAR_DETECCION_MANOS) {
        renderLoop();
      }
    } catch (err) {
      console.error(err);
      stopCameraStream(videoRef.current);
      setStatus(isCameraPermissionError(err) ? "denied" : "error");
    }
  }

  // Pausar apaga la cámara (se apaga su luz) y detiene el sonido; el modelo
  // y el audio quedan cargados para que "Seguir" sea casi inmediato.
  function pause() {
    stopLoop();
    stopCameraStream(videoRef.current);
    stabilizerRef.current?.update(null, performance.now());
    setStatus("paused");
  }

  function louder() {
    if (volume.louder()) applyVolume();
  }

  function softer() {
    if (volume.softer()) applyVolume();
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

  const view = describeView({
    status,
    resuming,
    noteIndex,
    showHandGuide: !handVisible,
  });

  const actions = { start, resume: start, pause, none: () => {} };

  return {
    videoRef,
    canvasRef,
    view,
    // Franja iluminada: solo mientras se está mostrando una nota.
    activeBand: view.stage.kind === "note" ? view.stage.noteIndex : null,
    onPrimary: actions[view.primary.action],
    volume: {
      visible: view.showVolume,
      step: volumeStep,
      steps: VOLUME_STEPS,
      canGoLouder: volumeStep < VOLUME_STEPS,
      canGoSofter: volumeStep > 1,
      louder,
      softer,
    },
  };
}
