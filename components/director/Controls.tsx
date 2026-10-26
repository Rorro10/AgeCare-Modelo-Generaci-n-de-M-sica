// Botones grandes (≥ 64 px de alto, ícono + texto, un solo toque) y nivel de
// volumen. Sin sliders, swipes ni doble clic. Pensado para celular: el botón
// principal a lo ancho y los dos de volumen lado a lado, para que todo quepa
// en pantalla sin bajar.

import { useCallback } from "react";
import type { DirectorView } from "@/lib/director/viewModel";
import { Icon, type AnyIconName } from "./Icon";

export type VolumeProps = {
  visible: boolean;
  step: number;
  steps: number;
  canGoLouder: boolean;
  canGoSofter: boolean;
  louder: () => void;
  softer: () => void;
};

type Props = {
  primary: DirectorView["primary"];
  onPrimary: () => void;
  volume: VolumeProps;
};

export function Controls({ primary, onPrimary, volume }: Props) {
  return (
    <div className="flex shrink-0 flex-col gap-2">
      <BigButton
        icon={primary.icon}
        label={primary.label}
        onPress={onPrimary}
        busy={primary.busy}
        variant="primary"
        spin={primary.icon === "loading"}
        autoFocus
      />
      {volume.visible && (
        <>
          <p className="flex items-center justify-center gap-3 text-lg font-semibold">
            <span>Volumen</span>
            <span aria-hidden="true" className="flex items-end gap-1">
              {Array.from({ length: volume.steps }, (_, i) => (
                <span
                  key={i}
                  className={`w-2.5 rounded-sm ${i < volume.step ? "bg-foreground" : "bg-band"}`}
                  style={{ height: `${0.6 + i * 0.25}rem` }}
                />
              ))}
            </span>
            <span className="tabular-nums">
              {volume.step} de {volume.steps}
            </span>
          </p>
          <div className="grid grid-cols-2 gap-2">
            <BigButton
              icon="volume-down"
              label="Más suave"
              onPress={volume.softer}
              unavailable={!volume.canGoSofter}
            />
            <BigButton
              icon="volume-up"
              label="Más fuerte"
              onPress={volume.louder}
              unavailable={!volume.canGoLouder}
            />
          </div>
        </>
      )}
    </div>
  );
}

type BigButtonProps = {
  icon: AnyIconName;
  label: string;
  onPress: () => void;
  variant?: "primary" | "secondary";
  // Mientras carga, o en el tope del volumen, el botón no hace nada pero
  // sigue enfocable (aria-disabled en vez de disabled): así el foco no se
  // pierde a mitad de camino.
  busy?: boolean;
  unavailable?: boolean;
  spin?: boolean;
  autoFocus?: boolean;
};

function BigButton({
  icon,
  label,
  onPress,
  variant = "secondary",
  busy = false,
  unavailable = false,
  spin = false,
  autoFocus = false,
}: BigButtonProps) {
  const inactive = busy || unavailable;
  // Foco inicial sin hacer scroll: el atributo autoFocus desplazaría la
  // página hasta el botón y, en pantallas bajas, dejaría la nota fuera de
  // la vista al cargar.
  const focusOnMount = useCallback(
    (el: HTMLButtonElement | null) => {
      if (el && autoFocus) el.focus({ preventScroll: true });
    },
    [autoFocus]
  );
  return (
    <button
      ref={focusOnMount}
      type="button"
      onClick={inactive ? undefined : onPress}
      aria-disabled={inactive || undefined}
      aria-busy={busy || undefined}
      className={`inline-flex min-h-16 w-full min-w-0 items-center justify-center gap-2 rounded-2xl border-2 px-3 py-2 text-xl font-bold max-[23rem]:text-lg transition-transform duration-150 ease-strong-out focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-focus aria-disabled:cursor-not-allowed aria-disabled:opacity-60 motion-safe:active:scale-[0.97] motion-safe:aria-disabled:active:scale-100 ${
        variant === "primary"
          ? "border-foreground bg-foreground text-background"
          : "border-foreground bg-surface text-foreground"
      }`}
    >
      <Icon name={icon} className={`text-[1.75rem] ${spin ? "motion-safe:animate-spin" : ""}`} />
      <span>{label}</span>
    </button>
  );
}
