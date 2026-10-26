// Selector de instrumento: cuatro botones grandes (emoji + nombre), un solo
// toque. Va dentro del recuadro de la cámara cuando está apagada (inicio y
// pausa). Al tocar uno suena una nota de muestra (eso lo hace el hook).

import type { Instrument, InstrumentId } from "@/lib/director/instruments";

export type InstrumentProps = {
  visible: boolean;
  options: readonly Instrument[];
  selected: InstrumentId;
  choose: (id: InstrumentId) => void;
};

export function InstrumentPicker({ options, selected, choose }: InstrumentProps) {
  return (
    <div className="flex w-full max-w-[26rem] flex-col items-center gap-3">
      <p id="instrumento-titulo" className="text-xl font-semibold text-white">
        Elige un instrumento
      </p>
      <div
        role="group"
        aria-labelledby="instrumento-titulo"
        className="grid w-full grid-cols-2 gap-2"
      >
        {options.map((instrument) => {
          const isSelected = instrument.id === selected;
          return (
            <button
              key={instrument.id}
              type="button"
              aria-pressed={isSelected}
              onClick={() => choose(instrument.id)}
              className={`inline-flex min-h-16 items-center justify-center gap-2 rounded-2xl border-2 px-2 text-lg font-bold transition-transform duration-150 ease-strong-out focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-white motion-safe:active:scale-[0.97] ${
                isSelected
                  ? "border-white bg-white text-foreground"
                  : "border-stone-500 bg-stone-800 text-white"
              }`}
            >
              <span aria-hidden="true" className="text-[1.75rem] leading-none">
                {instrument.emoji}
              </span>
              <span>{instrument.name}</span>
              {isSelected && (
                <span aria-hidden="true" className="text-base">
                  ✓
                </span>
              )}
            </button>
          );
        })}
      </div>
      <p className="text-base text-stone-300">Tócalo para escucharlo</p>
    </div>
  );
}
