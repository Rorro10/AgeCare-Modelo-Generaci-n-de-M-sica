// Tarjeta de arriba: la nota actual en grande, o un aviso cuando no hay nota
// (inicio, carga, pausa, guía "Muestra tu mano a la cámara"…). Compacta, para
// dejarle el espacio a la cámara. La caja es siempre la misma (mismo tamaño
// y lugar): solo cambia su contenido, así nada salta de sitio entre estados.

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
      className={`relative flex min-h-[5.5rem] shrink-0 items-center justify-center overflow-hidden rounded-3xl px-4 py-3 text-center sm:min-h-28 ${
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
        <p className="relative text-[3.5rem] leading-none font-bold tracking-[-0.02em] [overflow-wrap:anywhere] sm:text-[4.5rem]">
          {noteLabel(stage.noteIndex)}
        </p>
      ) : (
        <p className="relative flex items-center gap-3 text-2xl leading-tight font-bold sm:text-3xl">
          <Icon
            name={stage.icon}
            className={`text-[2.25rem] ${stage.icon === "loading" ? "motion-safe:animate-spin" : ""}`}
          />
          <span>{stage.title}</span>
        </p>
      )}
    </section>
  );
}
