// Guarda en este dispositivo las métricas de cada sesión (no hay backend
// todavía). Cada guardado reemplaza la versión anterior de la misma sesión,
// así una sesión que se corta sin aviso queda con su último estado. Si el
// navegador no deja guardar (modo privado) la app funciona igual.

import { isSessionSummary } from "../pilotReport";
import type { SessionSummary } from "../sessionMetrics";

const SESSIONS_KEY = "director-musical:sesiones";

// Tope para no llenar el almacenamiento (~1 KB por sesión). Se descartan
// las más antiguas: hay que exportar el CSV al cerrar cada jornada de piloto.
export const MAX_STORED_SESSIONS = 300;

// Aviso dentro de esta misma pestaña ("storage" solo llega a las demás).
const CHANGE_EVENT = "director-musical:sesiones-cambiaron";

// Texto guardado tal cual. Para useSyncExternalStore sirve mejor que la
// lista ya leída: un texto igual es el mismo valor y no re-renderiza.
export function loadSessionsRaw(): string {
  try {
    return localStorage.getItem(SESSIONS_KEY) ?? "[]";
  } catch {
    return "[]";
  }
}

export function parseSessions(raw: string): SessionSummary[] {
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isSessionSummary) : [];
  } catch {
    return [];
  }
}

export function loadSessions(): SessionSummary[] {
  return parseSessions(loadSessionsRaw());
}

export function subscribeToSessions(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

function notifyChange() {
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function saveSession(session: SessionSummary) {
  try {
    const others = loadSessions().filter((s) => s.id !== session.id);
    const sessions = [...others, session].slice(-MAX_STORED_SESSIONS);
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
    notifyChange();
  } catch {
    // Sin almacenamiento: la sesión solo se informa a AgeCare (si está embebida).
  }
}

export function clearSessions() {
  try {
    localStorage.removeItem(SESSIONS_KEY);
    notifyChange();
  } catch {
    // Nada que borrar.
  }
}

export function newSessionId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    // randomUUID solo existe en contextos seguros (https o localhost).
    return `s-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  }
}
