// Preferencias que se recuerdan entre visitas en este dispositivo. Si el
// navegador no deja guardar (modo privado, almacenamiento bloqueado) la app
// funciona igual, con los valores por defecto.

import { isInstrumentId, type InstrumentId } from "../instruments";

const INSTRUMENT_KEY = "director-musical:instrumento";

export function loadInstrument(): InstrumentId | null {
  try {
    const saved = localStorage.getItem(INSTRUMENT_KEY);
    return isInstrumentId(saved) ? saved : null;
  } catch {
    return null;
  }
}

// Para useSyncExternalStore: avisa si otra pestaña cambia lo guardado.
export function subscribeToPreferences(onChange: () => void) {
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
}

export function saveInstrument(id: InstrumentId) {
  try {
    localStorage.setItem(INSTRUMENT_KEY, id);
  } catch {
    // Sin almacenamiento: se elige de nuevo la próxima vez.
  }
}
