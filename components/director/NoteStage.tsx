// Área grande de arriba: la nota actual gigante, o un aviso cuando no hay
// nota (inicio, carga, pausa, guía "Muestra tu mano a la cámara"…).
// La caja es siempre la misma (mismo tamaño y lugar): solo cambia su
// contenido, así nada salta de sitio entre estados.

import { NOTE_TEXT_COLOR, noteColor, noteLabel } from "@/lib/director/noteDisplay";
import type { Stage } from "@/lib/director/viewModel";
import { Icon } from "./Icon";

export function NoteStage({ stage }: { stage: Stage }) {
  const isNote = stage.kind === "note";
  return (
    <section
      aria-label="Nota actual"
      className={`relative flex min-h-36 items-center justify-center overflow-hidden rounded-3xl px-4 py-4 text-center sm:min-h-44 ${
        isNote ? "" : "border-2 border-band bg-surface"
      }`}
      style={
        isNote
          ? { backgroundColor: noteColor(stage.noteIndex), color: NOTE_TEXT_COLOR }
          : undefined
      }
    >
      {isNote ? (
        <p className="text-[3.75rem] leading-none font-bold tracking-[-0.02em] [overflow-wrap:anywhere] sm:text-[6rem]">
          {noteLabel(stage.noteIndex)}
        </p>
      ) : (
        <p className="flex flex-col items-center gap-2 text-[1.75rem] leading-tight font-bold sm:text-[2.25rem]">
          <Icon
            name={stage.icon}
            className={`text-[2.5rem] sm:text-[3rem] ${
              stage.icon === "loading" ? "motion-safe:animate-spin" : ""
            }`}
          />
          <span>{stage.title}</span>
        </p>
      )}
    </section>
  );
}
