"use client";

// Vista del adulto mayor del Director Musical. Toda la lógica (cámara,
// detección, mapeo de gestos, audio y qué mostrar en cada estado) vive en el
// hook useDirectorMusical y en lib/director/; DirectorScreen solo dibuja el
// estado que recibe.
import { useDirectorMusical } from "@/lib/director/useDirectorMusical";
import { DirectorScreen } from "./director/DirectorScreen";

export default function DirectorMusical() {
  const director = useDirectorMusical();
  return <DirectorScreen {...director} />;
}
