"use client";

// Fixtures de la vista: cada estado de los wireframes más los peores casos
// realistas (la etiqueta más larga "Do agudo", el aviso con más texto, el
// volumen en sus topes). Entran por la misma frontera que la pantalla real:
// describeView + las props de los componentes. Solo para desarrollo.

import Link from "next/link";
import { useRef } from "react";
import { CameraView } from "@/components/director/CameraView";
import { Controls } from "@/components/director/Controls";
import { NoteBands } from "@/components/director/NoteBands";
import { NoteStage } from "@/components/director/NoteStage";
import { VOLUME_STEPS } from "@/lib/director/domain";
import { pulseNote } from "@/lib/director/services/feedback";
import { describeView, type DirectorState } from "@/lib/director/viewModel";

// videoAspect: proporción del stream (4:3 por defecto; 3:4 = celular vertical).
type Fixture = { state: DirectorState; volumeStep: number; videoAspect?: number };

const running = (noteIndex: number | null, showHandGuide = false): DirectorState => ({
  status: "running",
  resuming: false,
  noteIndex,
  showHandGuide,
});

const FIXTURES: Record<string, Fixture> = {
  inicio: { state: { status: "idle", resuming: false, noteIndex: null, showHandGuide: true }, volumeStep: 3 },
  cargando: { state: { status: "loading", resuming: false, noteIndex: null, showHandGuide: true }, volumeStep: 3 },
  reanudando: { state: { status: "loading", resuming: true, noteIndex: null, showHandGuide: true }, volumeStep: 3 },
  denegado: { state: { status: "denied", resuming: false, noteIndex: null, showHandGuide: true }, volumeStep: 3 },
  "sin-mano": { state: running(2, true), volumeStep: 3 },
  nota: { state: running(2), volumeStep: 3 },
  "do-agudo": { state: running(5), volumeStep: 5 },
  "nota-grave": { state: running(0), volumeStep: 1 },
  "nota-aguda": { state: running(9), volumeStep: 4 },
  "sol-agudo": { state: running(8), volumeStep: 3 },
  "camara-vertical": { state: running(7), volumeStep: 3, videoAspect: 3 / 4 },
  pausa: { state: { status: "paused", resuming: false, noteIndex: 3, showHandGuide: false }, volumeStep: 3 },
  error: { state: { status: "error", resuming: false, noteIndex: null, showHandGuide: true }, volumeStep: 3 },
};

export function StatePreview({ estado, showSelector }: { estado: string; showSelector: boolean }) {
  const fixture = FIXTURES[estado] ?? FIXTURES.nota;
  const view = describeView(fixture.state);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const noteCardRef = useRef<HTMLElement>(null);
  const bandsRef = useRef<HTMLUListElement>(null);
  const activeBand = view.stage.kind === "note" ? view.stage.noteIndex : null;
  const step = fixture.volumeStep;

  return (
    <>
      {/* Mismas clases que components/DirectorMusical.tsx. Sin padding extra
          abajo: el selector de estados queda encima, como en uso real. */}
      <main className="mx-auto flex w-full max-w-[60rem] flex-col gap-5 px-4 py-6 short:gap-3 short:py-3 sm:gap-6 sm:short:gap-3">
        <header className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/agecare-logo.jpg" alt="AgeCare" className="h-12 w-auto object-contain short:h-8" />
          <h1 className="text-2xl font-bold short:text-xl">Director Musical</h1>
        </header>
        <NoteStage stage={view.stage} cardRef={noteCardRef} />
        <CameraView
          videoRef={videoRef}
          canvasRef={canvasRef}
          notice={view.cameraNotice}
          videoAspect={fixture.videoAspect ?? 4 / 3}
        >
          <NoteBands activeBand={activeBand} bandsRef={bandsRef} />
        </CameraView>
        <p role="status" aria-live="polite" className="text-center text-xl font-medium short:text-lg">
          {view.message}
        </p>
        <Controls
          primary={view.primary}
          onPrimary={() => {
            // En la vista de prueba, el botón principal simula una pinza.
            if (activeBand !== null) pulseNote(noteCardRef.current, bandsRef.current, activeBand);
          }}
          volume={{
            visible: view.showVolume,
            step,
            steps: VOLUME_STEPS,
            canGoLouder: step < VOLUME_STEPS,
            canGoSofter: step > 1,
            louder: () => {},
            softer: () => {},
          }}
        />
      </main>

      {/* Selector de estado: herramienta de desarrollo, no es parte del diseño. */}
      {showSelector && (
      <nav
        aria-label="Estados de prueba"
        className="fixed inset-x-0 bottom-3 mx-auto flex w-fit max-w-[calc(100%-1rem)] flex-wrap justify-center gap-1 rounded-xl bg-neutral-200 p-1 font-sans text-xs text-neutral-900"
      >
        {Object.keys(FIXTURES).map((key) => (
          <Link
            key={key}
            href={`?estado=${key}`}
            className={`rounded-lg px-2 py-1 ${key === estado ? "bg-white shadow-sm" : ""}`}
          >
            {key}
          </Link>
        ))}
      </nav>
      )}
    </>
  );
}
