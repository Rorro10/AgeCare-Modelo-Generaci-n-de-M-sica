// En iPhone, Safari trata el audio web como un sonido del sistema: el
// interruptor de silencio lo calla. Este servicio pone la sesión de audio en
// modo "reproducción" (como una app de música), que ignora el interruptor.
// Debe llamarse dentro del toque del usuario (botón Empezar), antes de crear
// el audio.

// WAV de 50 ms de silencio (8 bits, 8 kHz). Solo se usa en iOS < 17.
const SILENT_WAV =
  "data:audio/wav;base64,UklGRrQBAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YZABAACAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA";

type NavigatorWithAudioSession = Navigator & {
  audioSession?: { type: string };
};

let silentLoop: HTMLAudioElement | null = null;

export function enablePlaybackAudioSession() {
  const nav = navigator as NavigatorWithAudioSession;
  // iOS 17+ (Safari 17): API de sesión de audio.
  if (nav.audioSession) {
    nav.audioSession.type = "playback";
    return;
  }
  // iOS más antiguos: un <audio> en reproducción pone la sesión del teléfono
  // en modo música, y el audio web se escucha con el interruptor en
  // silencio. En otros navegadores no tiene efecto audible.
  if (!silentLoop) {
    silentLoop = new Audio(SILENT_WAV);
    silentLoop.loop = true;
    silentLoop.setAttribute("playsinline", "");
  }
  silentLoop.play().catch(() => {
    // Si el navegador lo bloquea, el audio igual funciona con el
    // interruptor desactivado: no es un error para la persona.
  });
}

export function disablePlaybackAudioSession() {
  silentLoop?.pause();
}
