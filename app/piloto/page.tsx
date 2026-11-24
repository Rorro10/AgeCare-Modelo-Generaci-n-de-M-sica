// Panel del facilitador de las pruebas piloto (Sprint 7, actividades 68 y
// 70). No es parte de la vista del adulto mayor ni tiene enlace desde ella:
// el facilitador lo abre en el mismo dispositivo donde se hicieron las
// sesiones, porque las métricas se guardan solo ahí.

import type { Metadata } from "next";
import { PilotPanel } from "./PilotPanel";

export const metadata: Metadata = {
  title: "Panel del piloto — Director Musical",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <PilotPanel />;
}
