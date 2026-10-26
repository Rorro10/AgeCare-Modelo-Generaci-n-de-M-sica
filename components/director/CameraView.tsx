// Imagen de la cámara (en espejo) con los puntos de la mano dibujados encima.
// Cuando la cámara no está en vivo muestra un aviso en el mismo lugar.

import type { RefObject } from "react";
import type { CameraNotice } from "@/lib/director/viewModel";

type Props = {
  videoRef: RefObject<HTMLVideoElement | null>;
  canvasRef: RefObject<HTMLCanvasElement | null>;
  notice: CameraNotice | null;
};

export function CameraView({ videoRef, canvasRef, notice }: Props) {
  return (
    // El alto manda: mínimo 17.5rem, para que cada una de las 10 franjas de
    // al lado tenga lugar para su texto, y como máximo ~55 % de la ventana,
    // para que la nota y la cámara quepan juntas en pantalla. El ancho sale
    // del 4:3, pero puede angostarse (min-w-0) si no cabe: object-cover
    // recorta los costados, nunca arriba/abajo, así la altura de la mano
    // sigue calzando con las franjas.
    <div className="relative aspect-[4/3] h-[clamp(17.5rem,55vh,36rem)] min-w-0 overflow-hidden rounded-3xl bg-stone-900">
      <video
        ref={videoRef}
        aria-label="Imagen de tu cámara"
        className="absolute inset-0 h-full w-full -scale-x-100 object-cover"
        playsInline
        muted
      />
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="absolute inset-0 h-full w-full -scale-x-100 object-cover"
      />
      {notice && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 overflow-y-auto bg-stone-900 p-5 text-center text-white">
          <p className="max-w-[28rem] text-xl font-semibold sm:text-2xl">{notice.title}</p>
          {notice.steps && (
            <ol className="max-w-[28rem] list-decimal space-y-1 pl-7 text-left text-lg sm:text-xl">
              {notice.steps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          )}
        </div>
      )}
    </div>
  );
}
