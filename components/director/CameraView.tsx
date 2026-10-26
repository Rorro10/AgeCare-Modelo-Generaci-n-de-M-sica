// Imagen de la cámara (en espejo) con los puntos de la mano dibujados encima,
// y a su lado las franjas de notas (children). Cuando la cámara no está en
// vivo muestra un aviso en el mismo lugar.
//
// La imagen se muestra COMPLETA, sin recortar: el cuadro del video toma la
// proporción real del stream y cabe entero en la caja; lo que sobra queda
// como bandas negras. Las franjas miden exactamente el alto del cuadro, así
// cada franja calza con su altura en la imagen visible.

import type { ReactNode, RefObject } from "react";
import type { CameraNotice } from "@/lib/director/viewModel";

type Props = {
  videoRef: RefObject<HTMLVideoElement | null>;
  canvasRef: RefObject<HTMLCanvasElement | null>;
  notice: CameraNotice | null;
  // Ancho / alto del stream de la cámara (4:3, o 3:4 en celular vertical).
  videoAspect: number;
  // Las franjas de notas.
  children: ReactNode;
};

export function CameraView({ videoRef, canvasRef, notice, videoAspect, children }: Props) {
  return (
    // Caja: alto --cam-h, entre 17.5rem y ~55 % de la ventana (en pantallas
    // bajas, lo que queda tras el resto de la vista). Con video en vivo no
    // crece más que el video a lo ancho disponible (100vw − 2rem de margen
    // − franjas): en un celular con stream 4:3 no quedan franjas negras
    // enormes. Con un aviso usa el alto completo para que el texto quepa.
    // Es un container query de tamaño para que el cuadro del video calcule
    // cuánto cabe.
    <div
      className="relative flex w-full items-center justify-center overflow-hidden rounded-3xl bg-black p-1.5 [--bands-gap:0.5rem] [--bands-w:3.5rem] [--cam-h:clamp(17.5rem,55vh,36rem)] [container-type:size] short:[--cam-h:max(15rem,calc(100dvh-23rem))] sm:[--bands-gap:0.75rem] sm:[--bands-w:7rem]"
      style={{
        height: notice
          ? "var(--cam-h)"
          : `min(var(--cam-h), calc((100vw - 2rem - var(--bands-w) - var(--bands-gap)) / ${videoAspect}))`,
      }}
    >
      {/* Fila: cuadro del video + espacio reservado para las franjas. */}
      <div className="relative pr-[calc(var(--bands-w)+var(--bands-gap))]">
        <div
          className="relative overflow-hidden rounded-xl bg-stone-900"
          style={{
            aspectRatio: videoAspect,
            width: `min(calc(100cqw - var(--bands-w) - var(--bands-gap)), calc(100cqh * ${videoAspect}))`,
          }}
        >
          <video
            ref={videoRef}
            aria-label="Imagen de tu cámara"
            className="absolute inset-0 h-full w-full -scale-x-100 object-contain"
            playsInline
            muted
          />
          <canvas
            ref={canvasRef}
            aria-hidden="true"
            className="absolute inset-0 h-full w-full -scale-x-100 object-contain"
          />
        </div>
        {/* Franjas: mismo alto que el cuadro del video, pegadas a su derecha. */}
        <div className="absolute inset-y-0 right-0 w-[var(--bands-w)]">{children}</div>
      </div>

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
