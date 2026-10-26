"use client";

// Vista del Director Musical. Toda la lógica (cámara, detección, mapeo de
// gestos y audio) vive en el hook useDirectorMusical y en lib/director/.
import { useDirectorMusical } from "@/lib/director/useDirectorMusical";

export default function DirectorMusical() {
  const {
    videoRef,
    canvasRef,
    status,
    errorMsg,
    currentNote,
    handsDetected,
    start: startCamera,
    stop: stopCamera,
  } = useDirectorMusical();

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
