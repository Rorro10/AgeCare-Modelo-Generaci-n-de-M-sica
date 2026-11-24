"use client";

// Hook que orquesta cámara → detección de manos → mapeo de gestos → audio.
// La lógica de decisión vive en módulos puros (gestureMapper, noteStabilizer,
// volumeControl, viewModel); aquí solo se conectan los servicios con efectos
// y se entrega a la vista el estado ya listo para dibujar.

import { useEffect, useEffectEvent, useRef, useState, useSyncExternalStore } from "react";
import {
  INDEX_TIP,
  PENTATONIC_SCALE,
  PINCH_ENTER_THRESHOLD,
  PINCH_EXIT_THRESHOLD,
  THUMB_TIP,
  VOLUME_STEPS,
  WRIST,
  type Point,
} from "./domain";
import { distance, pinchDistance, yToHeight } from "./gestureMapper";
import { pickPrimaryHand } from "./handMeasures";
import { shouldShowHandGuide } from "./handPresence";
import { DEFAULT_INSTRUMENT, INSTRUMENTS, type InstrumentId } from "./instruments";
import { NoteStabilizer } from "./noteStabilizer";
import { createAudioEngine, type AudioEngine } from "./services/audioEngine";
import {
  isCameraPermissionError,
  startCameraStream,
  stopCameraStream,
} from "./services/camera";
import { pulseNote } from "./services/feedback";
import {
  disablePlaybackAudioSession,
  enablePlaybackAudioSession,
} from "./services/iosAudio";
import { createHandTracker, type HandTracker } from "./services/handTracker";
import { drawDebugInfo, drawHands } from "./services/landmarkRenderer";
import {
  loadInstrument,
  saveInstrument,
  subscribeToPreferences,
} from "./services/preferences";
import { notifyAgeCare } from "./services/agecareBridge";
import { newSessionId, saveSession } from "./services/sessionStore";
import { parseParticipant, SessionRecorder, type VolumeSource } from "./sessionMetrics";
import { describeView, type DirectorStatus } from "./viewModel";
import { VolumeControl, volumeStepToDb } from "./volumeControl";

// Cada cuánto se guarda la sesión mientras se toca (además de al pausar y
// al salir), para no perder sus métricas si se corta sin aviso.
const SESSION_SAVE_INTERVAL_MS = 15_000;

// Cambia a true para reactivar la detección de manos y el audio.
// En false: solo se muestra la cámara, sin procesar gestos.
const HABILITAR_DETECCION_MANOS = true;

export function useDirectorMusical() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Tarjeta de la nota y lista de franjas: el pulso al tocar se anima
  // directo sobre ellas, en el mismo cuadro que suena la nota.
  const noteCardRef = useRef<HTMLElement>(null);
  const bandsRef = useRef<HTMLUListElement>(null);
  // Último instante (ms) en que se vio una mano; null = ninguna desde que
  // empezó o se reanudó.
  const lastHandSeenAtRef = useRef<number | null>(null);
  const handTrackerRef = useRef<HandTracker | null>(null);
  const audioRef = useRef<AudioEngine | null>(null);
  // Creación del audio en curso: la comparten Empezar y la nota de muestra
  // al elegir instrumento, para no crear dos motores si se tocan seguido.
  const audioPendingRef = useRef<Promise<AudioEngine> | null>(null);
  const rafRef = useRef<number | null>(null);
  const stabilizerRef = useRef<NoteStabilizer | null>(null);
  // Muñeca de la mano principal en el último cuadro: para seguir a la misma
  // mano cuando hay dos a la vista.
  const primaryWristRef = useRef<Point | null>(null);
  // Tiempo del video del último cuadro procesado: la pantalla suele ir a
  // 60 Hz y la cámara a ~30, así que la mitad de las vueltas del bucle
  // repetirían el mismo cuadro. Se saltan, para no gastar batería.
  const lastVideoTimeRef = useRef(-1);
  // Modo diagnóstico (/?debug=1): muestra en la imagen los valores con que
  // se calibran los umbrales. Nunca lo ve el adulto mayor.
  const debugRef = useRef({ enabled: false, frames: 0, since: 0, fps: 0 });
  // Métricas de uso de la sesión actual (Sprint 7); null hasta el primer
  // «Empezar». Ver sessionMetrics.ts.
  const sessionRef = useRef<SessionRecorder | null>(null);
  const sessionSavedAtRef = useRef(0);
  // Instancia estable durante toda la vida del componente.
  const [volume] = useState(() => new VolumeControl());

  const [status, setStatus] = useState<DirectorStatus>("idle");
  const [resuming, setResuming] = useState(false);
  const [noteIndex, setNoteIndex] = useState<number | null>(null);
  const [showHandGuide, setShowHandGuide] = useState(true);
  const [volumeStep, setVolumeStep] = useState(volume.step);
  // Proporción ancho/alto del stream. Pedimos 640×480, pero en celular
  // vertical el navegador suele entregarlo girado (3:4); la vista la usa para
  // mostrar la imagen completa y alinear las franjas con ella.
  const [videoAspect, setVideoAspect] = useState(4 / 3);
  // Instrumento: el elegido en esta visita, si no el guardado de la anterior,
  // si no el por defecto. El guardado se lee con useSyncExternalStore: en el
  // servidor (sin localStorage) da null, así el HTML inicial coincide.
  const savedInstrument = useSyncExternalStore(
    subscribeToPreferences,
    loadInstrument,
    () => null
  );
  const [chosenInstrument, setChosenInstrument] = useState<InstrumentId | null>(null);
  const instrumentId = chosenInstrument ?? savedInstrument ?? DEFAULT_INSTRUMENT;

  // Se usan funciones normales (no useCallback) porque no necesitamos
  // identidad estable entre renders: solo leen/escriben refs y estado.

  // Guarda la sesión en el dispositivo y, si está dentro de AgeCare, se la
  // informa. Las métricas nunca deben romper la música: cualquier error se
  // registra y se sigue.
  function saveSessionNow() {
    const session = sessionRef.current;
    if (!session) return;
    try {
      const now = Date.now();
      const summary = session.summary(now);
      sessionSavedAtRef.current = now;
      saveSession(summary);
      notifyAgeCare(summary);
    } catch (err) {
      console.error(err);
    }
  }

  // Al cerrar o abandonar la página termina la sesión; si vuelve a tocar
  // «Empezar» se abre una nueva.
  function endSession() {
    if (!sessionRef.current) return;
    sessionRef.current.end(Date.now());
    saveSessionNow();
    sessionRef.current = null;
  }

  function stopLoop() {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
  }

  // Crea el audio si todavía no existe. Debe llamarse dentro de un toque.
  function ensureAudio(): Promise<AudioEngine> {
    if (audioRef.current) return Promise.resolve(audioRef.current);
    audioPendingRef.current ??= createAudioEngine(instrumentId)
      .then((engine) => {
        engine.setVolume(volumeStepToDb(volume.step));
        audioRef.current = engine;
        return engine;
      })
      .finally(() => {
        audioPendingRef.current = null;
      });
    return audioPendingRef.current;
  }

  // Elegir instrumento: se recuerda para la próxima vez y suena una nota de
  // muestra, para escucharlo antes de empezar.
  async function chooseInstrument(id: InstrumentId) {
    enablePlaybackAudioSession();
    setChosenInstrument(id);
    saveInstrument(id);
    sessionRef.current?.changeInstrument(Date.now(), id);
    try {
      const audio = await ensureAudio();
      audio.setInstrument(id);
      audio.playNote("C5");
    } catch (err) {
      // Sin la muestra se puede elegir igual; el error se verá al empezar.
      console.error(err);
    }
  }

  function applyVolume(source: VolumeSource) {
    audioRef.current?.setVolume(volumeStepToDb(volume.step));
    setVolumeStep(volume.step);
    sessionRef.current?.changeVolume(Date.now(), volume.step, source);
  }

  // Procesa un cuadro. Devuelve false si falta algo para seguir (p. ej. la
  // vista se desmontó), y el bucle se detiene.
  function processFrame() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const handTracker = handTrackerRef.current;
    const audio = audioRef.current;
    const stabilizer = stabilizerRef.current;
    if (!video || !canvas || !handTracker || !stabilizer) return false;

    const ctx = canvas.getContext("2d");
    if (video.readyState < 2 || !ctx) return true;
    // Mismo cuadro de cámara que la vuelta anterior: nada nuevo que ver.
    if (video.currentTime === lastVideoTimeRef.current) return true;
    lastVideoTimeRef.current = video.currentTime;

    // Cambiar el tamaño del canvas lo borra y reserva memoria de nuevo: solo
    // cuando cambia el video (al empezar o al girar el celular).
    if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // renderLoop es un bucle imperativo manejado por requestAnimationFrame
    // (no se ejecuta durante el render de React), por eso puede leer un
    // reloj externo con performance.now().
    const now = performance.now();
    const hands = handTracker.detect(video, now);
    if (hands.length > 0) lastHandSeenAtRef.current = now;
    // Las métricas usan la hora del reloj (Date.now) para poder fecharlas.
    const wallNow = Date.now();
    sessionRef.current?.frame(wallNow, hands.length > 0);
    setShowHandGuide(shouldShowHandGuide(lastHandSeenAtRef.current, now));

    const images = hands.map((hand) => hand.landmarks);
    let pinch: number | null = null;
    if (hands.length > 0) {
      // Mano principal: controla la nota (altura del índice) y el gesto de
      // pinza (pulgar + índice) dispara la nota, como un "pluck". Se sigue a
      // la misma mano entre cuadros, y el estabilizador filtra el temblor y
      // los parpadeos del detector antes de decidir.
      const primary = hands[pickPrimaryHand(images, primaryWristRef.current)].landmarks;
      primaryWristRef.current = primary[WRIST];
      pinch = pinchDistance(primary[THUMB_TIP], primary[INDEX_TIP]);
      const { noteIndex, isPinching, shouldTrigger } = stabilizer.update(
        { height: yToHeight(primary[INDEX_TIP].y), pinchDistance: pinch },
        now
      );
      if (noteIndex !== null) {
        setNoteIndex(noteIndex);
        if (shouldTrigger) {
          audio?.playNote(PENTATONIC_SCALE[noteIndex]);
          sessionRef.current?.note(wallNow, noteIndex);
          pulseNote(noteCardRef.current, bandsRef.current, noteIndex);
        }
      }
      drawHands(ctx, images, isPinching);
    } else {
      stabilizer.update(null, now);
    }

    // Segunda mano (opcional): la distancia entre ambas muñecas mueve el
    // volumen por pasos, igual que los botones. Solo actúa al cruzar a
    // otro paso, para no pisar al botón por temblor (ver volumeControl).
    const wristDistance =
      images.length > 1 ? distance(images[0][WRIST], images[1][WRIST]) : null;
    if (volume.updateHand(wristDistance)) applyVolume("mano");

    if (debugRef.current.enabled) drawDebug(ctx, now, hands.length, pinch);

    if (wallNow - sessionSavedAtRef.current >= SESSION_SAVE_INTERVAL_MS) saveSessionNow();
    return true;
  }

  function drawDebug(
    ctx: CanvasRenderingContext2D,
    now: number,
    handCount: number,
    pinch: number | null
  ) {
    const debug = debugRef.current;
    debug.frames += 1;
    if (now - debug.since >= 1000) {
      debug.fps = Math.round((debug.frames * 1000) / (now - debug.since));
      debug.frames = 0;
      debug.since = now;
    }
    drawDebugInfo(ctx, [
      `${debug.fps} cuadros/s · ${handTrackerRef.current?.delegate ?? "?"}`,
      `manos: ${handCount}`,
      `pinza: ${pinch === null ? "—" : pinch.toFixed(3)}`,
      `umbral: <${PINCH_ENTER_THRESHOLD} toca · >${PINCH_EXIT_THRESHOLD} suelta`,
    ]);
  }

  // Un error dentro de requestAnimationFrame no llega a ningún catch: el
  // bucle moría en silencio y la pantalla quedaba fija en "Muestra tu mano"
  // sin sonar. Ahora un error de un cuadro detiene todo y lo muestra.
  function renderLoop() {
    try {
      if (!processFrame()) return;
    } catch (err) {
      console.error(err);
      stopLoop();
      stopCameraStream(videoRef.current);
      sessionRef.current?.fail(Date.now(), "error");
      saveSessionNow();
      setStatus("error");
      return;
    }
    rafRef.current = requestAnimationFrame(renderLoop);
  }

  // Sirve para empezar, para seguir después de una pausa y para reintentar
  // tras un error: solo crea lo que todavía no existe.
  async function start() {
    // Antes de cualquier await, todavía dentro del toque: en iPhone, que el
    // interruptor de silencio no calle la música.
    enablePlaybackAudioSession();
    const isResume = status === "paused";
    // La sesión parte con el primer «Empezar». El código de participante
    // viene en la dirección (?participante=P01), puesto por el facilitador
    // del piloto o por AgeCare.
    sessionRef.current ??= new SessionRecorder({
      id: newSessionId(),
      participant: parseParticipant(
        new URLSearchParams(window.location.search).get("participante")
      ),
      instrument: instrumentId,
      volumeStep: volume.step,
      at: Date.now(),
    });
    setResuming(isResume);
    setStatus("loading");
    try {
      if (HABILITAR_DETECCION_MANOS) {
        // 1) Audio primero: Tone.js necesita arrancar dentro del gesto del
        // usuario (el toque en "Empezar"), antes de esperas largas como la
        // carga del modelo.
        const audio = await ensureAudio();
        audio.setInstrument(instrumentId);
        // 2) Cargar MediaPipe Hands (solo la primera vez).
        if (!handTrackerRef.current) {
          handTrackerRef.current = await createHandTracker();
        }
        // Estado anti-temblor limpio en cada inicio.
        stabilizerRef.current = new NoteStabilizer();
        primaryWristRef.current = null;
        lastVideoTimeRef.current = -1;
        debugRef.current.enabled =
          new URLSearchParams(window.location.search).get("debug") === "1";
      }

      // 3) Pedir la cámara (esto siempre corre, con o sin detección).
      if (!videoRef.current) return;
      await startCameraStream(videoRef.current);

      setNoteIndex(null);
      lastHandSeenAtRef.current = null;
      setShowHandGuide(true);
      setStatus("running");
      sessionRef.current?.running(Date.now());
      saveSessionNow();
      if (HABILITAR_DETECCION_MANOS) {
        renderLoop();
      }
    } catch (err) {
      console.error(err);
      stopCameraStream(videoRef.current);
      const denied = isCameraPermissionError(err);
      sessionRef.current?.fail(Date.now(), denied ? "denied" : "error");
      saveSessionNow();
      setStatus(denied ? "denied" : "error");
    }
  }

  // Pausar apaga la cámara (se apaga su luz) y detiene el sonido; el modelo
  // y el audio quedan cargados para que "Seguir" sea casi inmediato.
  function pause() {
    stopLoop();
    stopCameraStream(videoRef.current);
    stabilizerRef.current?.update(null, performance.now());
    disablePlaybackAudioSession();
    sessionRef.current?.pause(Date.now());
    saveSessionNow();
    setStatus("paused");
  }

  // Para los avisos de la página que se escuchan desde el efecto de abajo.
  const onPageHidden = useEffectEvent(() => saveSessionNow());
  const onPageLeft = useEffectEvent(() => endSession());

  function louder() {
    if (volume.louder()) applyVolume("boton");
  }

  function softer() {
    if (volume.softer()) applyVolume("boton");
  }

  useEffect(() => {
    const videoEl = videoRef.current;
    // "resize" se dispara cuando cambian videoWidth/videoHeight: al llegar
    // el primer cuadro y al girar el celular.
    function updateAspect() {
      if (videoEl?.videoWidth && videoEl.videoHeight) {
        setVideoAspect(videoEl.videoWidth / videoEl.videoHeight);
      }
    }
    videoEl?.addEventListener("resize", updateAspect);
    // Al pasar a otra app o pestaña se guarda cómo va la sesión (en celular
    // puede que la página no vuelva); al cerrar o salir, la sesión termina.
    function onVisibilityChange() {
      if (document.visibilityState === "hidden") onPageHidden();
    }
    function onPageHide() {
      onPageLeft();
    }
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("pagehide", onPageHide);
    return () => {
      videoEl?.removeEventListener("resize", updateAspect);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("pagehide", onPageHide);
      onPageLeft();
      stopLoop();
      stopCameraStream(videoEl);
      // Además de cerrarlos, se olvidan: start() reutiliza lo que ya existe,
      // y un sintetizador ya destruido no suena (pasaba tras un Fast Refresh
      // en desarrollo, que ejecuta esta limpieza sin desmontar la vista).
      handTrackerRef.current?.close();
      handTrackerRef.current = null;
      audioRef.current?.dispose();
      audioRef.current = null;
      audioPendingRef.current = null;
      disablePlaybackAudioSession();
    };
  }, []);

  const view = describeView({
    status,
    resuming,
    noteIndex,
    showHandGuide,
  });

  const actions = { start, resume: start, pause, none: () => {} };

  return {
    videoRef,
    canvasRef,
    noteCardRef,
    bandsRef,
    videoAspect,
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
    instruments: {
      visible: view.showInstruments,
      options: INSTRUMENTS,
      selected: instrumentId,
      choose: chooseInstrument,
    },
  };
}
