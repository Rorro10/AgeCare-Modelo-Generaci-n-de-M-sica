import DirectorMusical from "@/components/DirectorMusical";

// DirectorMusical es un Client Component ("use client"): usa cámara,
// WebAudio y WASM, pero solo dentro de callbacks (no al importar el
// módulo), así que se puede importar directo sin next/dynamic.
export default function Home() {
  return <DirectorMusical />;
}
