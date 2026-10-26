// Área grande de arriba: la nota actual gigante, o un aviso cuando no hay
// nota (inicio, carga, pausa, guía "Muestra tu mano a la cámara"…).
// La caja es siempre la misma (mismo tamaño y lugar): solo cambia su
// contenido, así nada salta de sitio entre estados.

import type { RefObject } from "react";
import { NOTE_TEXT_COLOR, noteColor, noteLabel } from "@/lib/director/noteDisplay";
import type { Stage } from "@/lib/director/viewModel";
import { Icon } from "./Icon";

type Props = {
  stage: Stage;
  // El hook anima el pulso sobre esta caja al tocar una nota.
  cardRef: RefObject<HTMLElement | null>;
};

export function NoteStage({ stage, cardRef }: Props) {
  const isNote = stage.kind === "note";
  return (
    <section
      ref={cardRef}
      aria-label="Nota actual"
      className={`relative flex min-h-40 items-center justify-center overflow-hidden rounded-3xl px-4 py-4 text-center sm:min-h-44 short:min-h-24 sm:short:min-h-24 ${
        isNote ? "" : "border-2 border-band bg-surface"
      }`}
      style={
        isNote
          ? { backgroundColor: noteColor(stage.noteIndex), color: NOTE_TEXT_COLOR }
          : undefined
      }
    >
      {/* Capa del destello al tocar (opacidad 0 en reposo). */}
      <span data-flash aria-hidden="true" className="pointer-events-none absolute inset-0 bg-white opacity-0" />
      {isNote ? (
        <p className="relative text-[3.75rem] leading-none font-bold tracking-[-0.02em] [overflow-wrap:anywhere] sm:text-[6rem] sm:short:text-[4rem]">
          {noteLabel(stage.noteIndex)}
        </p>
      ) : (
        <p className="relative flex flex-col items-center gap-2 text-[1.75rem] leading-tight font-bold short:flex-row short:gap-3 sm:text-[2.25rem] sm:short:text-[1.75rem]">
          <Icon
            name={stage.icon}
            className={`text-[2.5rem] sm:text-[3rem] short:text-[2rem] sm:short:text-[2rem] ${
              stage.icon === "loading" ? "motion-safe:animate-spin" : ""
            }`}
          />
          <span>{stage.title}</span>
        </p>
      )}
    </section>
  );
}
