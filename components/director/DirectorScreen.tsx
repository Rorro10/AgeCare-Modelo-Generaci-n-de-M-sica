// Pantalla del adulto mayor, pensada primero para celular vertical. Ocupa
// exactamente el alto de la ventana (h-dvh): la cámara toma todo el espacio
// que dejan la nota y los botones, así el volumen siempre se ve sin bajar.
// La usan la app (DirectorMusical) y la vista de estados de desarrollo.

import type { RefObject } from "react";
import type { DirectorView } from "@/lib/director/viewModel";
import { CameraView } from "./CameraView";
import { Controls, type VolumeProps } from "./Controls";
import { NoteBands } from "./NoteBands";
import { NoteStage } from "./NoteStage";

export type DirectorScreenProps = {
  videoRef: RefObject<HTMLVideoElement | null>;
  canvasRef: RefObject<HTMLCanvasElement | null>;
  noteCardRef: RefObject<HTMLElement | null>;
  bandsRef: RefObject<HTMLUListElement | null>;
  videoAspect: number;
  view: DirectorView;
  activeBand: number | null;
  onPrimary: () => void;
  volume: VolumeProps;
};

export function DirectorScreen({
  videoRef,
  canvasRef,
  noteCardRef,
  bandsRef,
  videoAspect,
  view,
  activeBand,
  onPrimary,
  volume,
}: DirectorScreenProps) {
  return (
    // min-h: bajo ~34rem de alto (celular apaisado, zoom grande) la página
    // pasa a hacer scroll en vez de aplastar la cámara.
    <main className="mx-auto flex h-dvh min-h-[34rem] w-full max-w-[48rem] flex-col gap-2 px-3 py-2 sm:gap-4 sm:px-4 sm:py-3">
      <header className="flex shrink-0 items-center justify-center gap-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/agecare-logo.png" alt="AgeCare" className="h-9 w-auto sm:h-11" />
        <h1 className="text-lg font-bold sm:text-xl">Director Musical</h1>
      </header>

      <NoteStage stage={view.stage} cardRef={noteCardRef} />

      <CameraView
        videoRef={videoRef}
        canvasRef={canvasRef}
        notice={view.cameraNotice}
        videoAspect={videoAspect}
      >
        <NoteBands activeBand={activeBand} bandsRef={bandsRef} />
      </CameraView>

      {/* Única región aria-live: mensajes de estado, nunca cada nota. Si
          repite lo que ya dice la tarjeta, solo lo oye el lector de pantalla. */}
      <p
        role="status"
        aria-live="polite"
        className={
          view.messageVisible
            ? "shrink-0 text-center text-lg leading-snug font-medium"
            : "sr-only"
        }
      >
        {view.message}
      </p>

      <Controls primary={view.primary} onPrimary={onPrimary} volume={volume} />
    </main>
  );
}
