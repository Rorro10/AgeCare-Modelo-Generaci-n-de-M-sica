"use client";

// Vista del adulto mayor del Director Musical. Toda la lógica (cámara,
// detección, mapeo de gestos, audio y qué mostrar en cada estado) vive en el
// hook useDirectorMusical y en lib/director/; estos componentes solo dibujan
// el estado que reciben.
import { useDirectorMusical } from "@/lib/director/useDirectorMusical";
import { CameraView } from "./director/CameraView";
import { Controls } from "./director/Controls";
import { NoteBands } from "./director/NoteBands";
import { NoteStage } from "./director/NoteStage";

export default function DirectorMusical() {
  const {
    videoRef,
    canvasRef,
    noteCardRef,
    bandsRef,
    view,
    activeBand,
    onPrimary,
    volume,
  } = useDirectorMusical();

  return (
    <main className="mx-auto flex w-full max-w-[60rem] flex-col gap-5 px-4 py-6 sm:gap-6">
      <header className="flex items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/agecare-logo.jpg" alt="AgeCare" className="h-12 w-auto object-contain" />
        <h1 className="text-2xl font-bold">Director Musical</h1>
      </header>

      <NoteStage stage={view.stage} cardRef={noteCardRef} />

      <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-3">
        <CameraView videoRef={videoRef} canvasRef={canvasRef} notice={view.cameraNotice} />
        <NoteBands activeBand={activeBand} bandsRef={bandsRef} />
      </div>

      {/* Única región aria-live: mensajes de estado, nunca cada nota. */}
      <p role="status" aria-live="polite" className="text-center text-xl font-medium">
        {view.message}
      </p>

      <Controls primary={view.primary} onPrimary={onPrimary} volume={volume} />
    </main>
  );
}
