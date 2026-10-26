// Indicador vertical de las 10 franjas, junto a la cámara: arriba la nota más
// aguda, abajo la más grave, igual que subir y bajar la mano. La franja de la
// nota actual se rellena con su color. El cambio de franja es instantáneo, sin
// animación: es lo que más se repite al tocar.

import { PENTATONIC_SCALE } from "@/lib/director/domain";
import { NOTE_TEXT_COLOR, noteColor, noteName } from "@/lib/director/noteDisplay";

const TOP_TO_BOTTOM = PENTATONIC_SCALE.map((_, i) => i).reverse();

export function NoteBands({ activeBand }: { activeBand: number | null }) {
  return (
    <ul
      aria-label="Altura de tu mano"
      className="flex h-full w-[4.75rem] flex-col gap-0.5 sm:w-28"
    >
      {TOP_TO_BOTTOM.map((index) => {
        const active = index === activeBand;
        const color = noteColor(index);
        return (
          <li
            key={index}
            aria-current={active ? "true" : undefined}
            className={`flex min-h-0 flex-1 items-center gap-1 rounded-md border-l-[0.375rem] px-2 text-lg leading-none font-semibold ${
              active ? "" : "bg-band text-band-foreground"
            }`}
            style={
              active
                ? { borderColor: color, backgroundColor: color, color: NOTE_TEXT_COLOR }
                : { borderColor: color }
            }
          >
            {active && <span aria-hidden="true">◀</span>}
            <span>{noteName(index)}</span>
          </li>
        );
      })}
    </ul>
  );
}
