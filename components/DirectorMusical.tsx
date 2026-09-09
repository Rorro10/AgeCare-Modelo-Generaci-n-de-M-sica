"use client";

import { useEffect, useRef, useState } from "react";
import type { HandLandmarker as HandLandmarkerType } from "@mediapipe/tasks-vision";
import type * as ToneTypes from "tone";

// Escala pentatónica mayor de C: siempre suena armonioso, sin importar
// el orden de las notas. Ampliada a dos octavas para tener más rango.
const PENTATONIC_SCALE = [
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
];

// Landmarks de MediaPipe Hands que usamos (ver diagrama oficial):
// 0 = muñeca, 4 = punta del pulgar, 8 = punta del índice.
const WRIST = 0;
const THUMB_TIP = 4;
const INDEX_TIP = 8;

// Umbral de distancia (normalizada 0-1) para considerar un gesto de "pinza"
// entre el pulgar y el índice. Se puede ajustar según pruebas de usabilidad.
const PINCH_THRESHOLD = 0.06;
// Cambia a true para reactivar la detección de manos y el audio.
// En false: solo se muestra la cámara, sin procesar gestos.
const HABILITAR_DETECCION_MANOS = false;
type Point = { x: number; y: number; z: number };

function distance(a: Point, b: Point) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export default function DirectorMusical() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const handLandmarkerRef = useRef<HandLandmarkerType | null>(null);
  const synthRef = useRef<ToneTypes.Synth | null>(null);
  const volumeRef = useRef<ToneTypes.Volume | null>(null);
  const rafRef = useRef<number | null>(null);
  const wasPinchingRef = useRef<boolean>(false);
  const lastNoteTimeRef = useRef<number>(0);

  const [status, setStatus] = useState<
    "idle" | "loading" | "running" | "error"
  >("idle");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [currentNote, setCurrentNote] = useState<string>("—");
  const [handsDetected, setHandsDetected] = useState<number>(0);

  // Se usan funciones normales (no useCallback) porque no necesitamos
  // identidad estable entre renders: solo leen/escriben refs y estado.

  function stopCamera() {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    const stream = videoRef.current?.srcObject as MediaStream | null;
    stream?.getTracks().forEach((t) => t.stop());
    setStatus("idle");
  }

  function renderLoop() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const handLandmarker = handLandmarkerRef.current;
    const synth = synthRef.current;
    const volume = volumeRef.current;
    if (!video || !canvas || !handLandmarker) return;

    const ctx = canvas.getContext("2d");
    if (video.readyState >= 2 && ctx) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.save();
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // renderLoop es un bucle imperativo manejado por requestAnimationFrame
      // (no se ejecuta durante el render de React), por eso puede leer un
      // reloj externo con performance.now().
      // eslint-disable-next-line react-hooks/purity
      const result = handLandmarker.detectForVideo(video, performance.now());
      const hands = result.landmarks ?? [];
      setHandsDetected(hands.length);

      if (hands.length > 0) {
        // Mano principal: controla la nota (altura del índice) y el gesto
        // de pinza (pulgar + índice) dispara la nota, como un "pluck".
        const primary = hands[0];
        const indexTip = primary[INDEX_TIP];
        const thumbTip = primary[THUMB_TIP];

        // y va de 0 (arriba) a 1 (abajo): invertimos para que "arriba" sea
        // una nota más aguda, que es lo intuitivo.
        const heightRatio = 1 - indexTip.y;
        const noteIndex = Math.min(
          PENTATONIC_SCALE.length - 1,
          Math.max(0, Math.floor(heightRatio * PENTATONIC_SCALE.length))
        );
        const note = PENTATONIC_SCALE[noteIndex];
        setCurrentNote(note);

        const pinchDistance = distance(indexTip, thumbTip);
        const isPinching = pinchDistance < PINCH_THRESHOLD;
        // eslint-disable-next-line react-hooks/purity
        const now = performance.now();
        if (
          isPinching &&
          !wasPinchingRef.current &&
          now - lastNoteTimeRef.current > 120
        ) {
          synth?.triggerAttackRelease(note, "8n");
          lastNoteTimeRef.current = now;
        }
        wasPinchingRef.current = isPinching;

        // Segunda mano (opcional): la distancia entre ambas muñecas
        // controla el volumen/intensidad, como pide la especificación
        // ("la posición controla tempo e intensidad").
        if (hands.length > 1 && volume) {
          const otherWrist = hands[1][WRIST];
          const wristDistance = distance(primary[WRIST], otherWrist);
          const db = -24 + Math.min(1, wristDistance / 0.8) * 24; // -24dB a 0dB
          volume.volume.rampTo(db, 0.05);
        }

        // Dibujo simple de los landmarks para dar feedback visual inmediato.
        for (const hand of hands) {
          for (const point of hand) {
            ctx.beginPath();
            ctx.arc(
              point.x * canvas.width,
              point.y * canvas.height,
              4,
              0,
              2 * Math.PI
            );
            ctx.fillStyle = isPinching ? "#22c55e" : "#38bdf8";
            ctx.fill();
          }
        }
      } else {
        wasPinchingRef.current = false;
      }
      ctx.restore();
    }

    rafRef.current = requestAnimationFrame(renderLoop);
  }

  async function startCamera() {
    setStatus("loading");
    setErrorMsg("");
    try {
      /*if (HABILITAR_DETECCION_MANOS) {
        // 1) Cargar MediaPipe Hands. Todo corre localmente en el navegador
        // (WASM + modelo), sin enviar video a ningún servidor.
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
        handLandmarkerRef.current = handLandmarker;

        // 2) Inicializar Tone.js (requiere gesto del usuario, por eso está
        // dentro del click del botón "Iniciar").
        const Tone = await import("tone");
        await Tone.start();
        const volume = new Tone.Volume(-8).toDestination();
        const synth = new Tone.Synth({
          oscillator: { type: "sine" },
          envelope: { attack: 0.01, decay: 0.15, sustain: 0.2, release: 0.4 },
        }).connect(volume);
        synthRef.current = synth;
        volumeRef.current = volume;
      }*/

      // 3) Pedir la cámara (esto siempre corre, con o sin detección).
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
        audio: false,
      });
      if (!videoRef.current) return;
      videoRef.current.srcObject = stream;
      await videoRef.current.play();

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
      const stream = videoEl?.srcObject as MediaStream | null;
      stream?.getTracks().forEach((t) => t.stop());
      handLandmarkerRef.current?.close();
      synthRef.current?.dispose();
    };
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center gap-6 bg-zinc-50 px-4 py-10 dark:bg-black">
      <div className="text-center">
        <img
          src="/agecare-logo.jpg"
          alt="AgeCareLogoImage"
          className="mx-auto mb-2 h-20 w-auto object-contain"
        />
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Director Musical
        </h1>
        <p className="mt-1 max-w-md text-lg text-zinc-600 dark:text-zinc-300">
          Prototipo de reconocimiento gestual — mueve la mano para elegir la
          nota y junta el pulgar con el índice para tocarla.
        </p>
      </div>

      <div className="relative aspect-[4/3] w-full max-w-xl overflow-hidden rounded-2xl border-4 border-zinc-300 bg-black shadow-lg dark:border-zinc-700">
        <video
          ref={videoRef}
          className="h-full w-full -scale-x-100 object-cover"
          playsInline
          muted
        />
        <canvas
          ref={canvasRef}
          className="absolute inset-0 h-full w-full -scale-x-100"
        />
        {status !== "running" && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-center text-white">
            {status === "loading"
              ? "Cargando cámara y modelo…"
              : "Cámara apagada"}
          </div>
        )}
      </div>

      <div className="flex flex-col items-center gap-3">
        <div className="flex gap-4 text-xl font-semibold text-zinc-800 dark:text-zinc-100">
          <span>
            Nota actual:{" "}
            <span className="text-sky-600 dark:text-sky-400">
              {currentNote}
            </span>
          </span>
          <span>Manos detectadas: {handsDetected}</span>
        </div>

        {status === "running" ? (
          <button
            onClick={stopCamera}
            className="rounded-2xl bg-red-600 px-8 py-4 text-xl font-bold text-white shadow-md hover:bg-red-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-red-300"
          >
            Detener
          </button>
        ) : (
          <button
            onClick={startCamera}
            disabled={status === "loading"}
            className="rounded-2xl bg-sky-600 px-8 py-4 text-xl font-bold text-white shadow-md hover:bg-sky-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-sky-300 disabled:opacity-50"
          >
            {status === "loading" ? "Cargando…" : "Iniciar"}
          </button>
        )}

        {status === "error" && (
          <p className="max-w-md text-center text-red-600">
            {errorMsg} — revisa que le hayas dado permiso de cámara al
            navegador.
          </p>
        )}
      </div>
    </div>
  );
}
