// Indicador vertical de las 10 franjas, junto a la cámara: arriba la nota más
// aguda, abajo la más grave, igual que subir y bajar la mano. La franja de la
// nota actual se rellena con su color. El cambio de franja es instantáneo, sin
// animación: es lo que más se repite al tocar.

import type { RefObject } from "react";
import { PENTATONIC_SCALE } from "@/lib/director/domain";
import { NOTE_TEXT_COLOR, noteColor, noteName } from "@/lib/director/noteDisplay";

const TOP_TO_BOTTOM = PENTATONIC_SCALE.map((_, i) => i).reverse();

type Props = {
  activeBand: number | null;
  // El hook anima el destello de la franja al tocar una nota.
  bandsRef: RefObject<HTMLUListElement | null>;
};

export function NoteBands({ activeBand, bandsRef }: Props) {
  return (
    <ul
      ref={bandsRef}
      aria-label="Altura de tu mano"
      className="flex h-full w-full flex-col gap-0.5"
    >
      {TOP_TO_BOTTOM.map((index) => {
        const active = index === activeBand;
        const color = noteColor(index);
        return (
          <li
            key={index}
            data-band={index}
            aria-current={active ? "true" : undefined}
            className={`relative flex min-h-0 flex-1 overflow-hidden items-center gap-1 rounded-md border-l-[0.375rem] px-1.5 text-base leading-none font-semibold max-[22.5rem]:text-sm sm:px-2 ${
              active ? "" : "bg-band text-band-foreground"
            }`}
            style={
              active
                ? { borderColor: color, backgroundColor: color, color: NOTE_TEXT_COLOR }
                : { borderColor: color }
            }
          >
            <span data-flash aria-hidden="true" className="pointer-events-none absolute inset-0 bg-white opacity-0" />
            {/* En franjas angostas (celular) no cabe: basta el relleno de color. */}
            {active && <span aria-hidden="true" className="relative hidden sm:inline">◀</span>}
            <span className="relative">{noteName(index)}</span>
          </li>
        );
      })}
    </ul>
  );
}
