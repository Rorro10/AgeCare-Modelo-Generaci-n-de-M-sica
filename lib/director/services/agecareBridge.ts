// Integración con la suite AgeCare (Sprint 7, actividades 64 y 65). Cuando
// el Director Musical corre dentro de un iframe de AgeCare, le avisa por
// postMessage cómo va la sesión. Contrato completo y ejemplo del lado de
// AgeCare: docs/sprint7/integracion-agecare.md.
//
// Solo se envía al origen configurado en NEXT_PUBLIC_AGECARE_ORIGIN (p. ej.
// https://app.agecare.cl). Sin esa variable, o si la página no está
// embebida, no se envía nada: las métricas nunca salen hacia un sitio
// desconocido.

import type { SessionSummary } from "../sessionMetrics";

export const AGECARE_MESSAGE_SOURCE = "director-musical";
export const AGECARE_MESSAGE_VERSION = 1;

export type AgeCareMessage = {
  source: typeof AGECARE_MESSAGE_SOURCE;
  version: typeof AGECARE_MESSAGE_VERSION;
  // "session-update": la sesión sigue (al pausar y cada ~15 s jugando).
  // "session-end": la persona cerró o abandonó el módulo.
  type: "session-update" | "session-end";
  session: SessionSummary;
};

export function agecareOrigin(): string | null {
  const origin = process.env.NEXT_PUBLIC_AGECARE_ORIGIN?.trim();
  return origin ? origin : null;
}

export function isEmbedded(): boolean {
  try {
    return window.parent !== window;
  } catch {
    return true;
  }
}

export function notifyAgeCare(session: SessionSummary) {
  const origin = agecareOrigin();
  if (!origin || !isEmbedded()) return;
  const message: AgeCareMessage = {
    source: AGECARE_MESSAGE_SOURCE,
    version: AGECARE_MESSAGE_VERSION,
    type: session.ended ? "session-end" : "session-update",
    session,
  };
  try {
    // Si el padre no es ese origen, el navegador descarta el mensaje.
    window.parent.postMessage(message, origin);
  } catch (err) {
    console.error(err);
  }
}
