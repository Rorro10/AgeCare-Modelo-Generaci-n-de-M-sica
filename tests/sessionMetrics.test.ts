import { describe, expect, it } from "vitest";
import {
  MAX_FRAME_GAP_MS,
  parseParticipant,
  SessionRecorder,
} from "../lib/director/sessionMetrics";

const T0 = Date.UTC(2026, 10, 24, 15, 0, 0);
const s = (seconds: number) => T0 + seconds * 1000;

function newSession() {
  return new SessionRecorder({
    id: "sesion-1",
    participant: "P01",
    instrument: "piano",
    volumeStep: 3,
    at: T0,
  });
}

// Simula cuadros cada 100 ms entre dos instantes (en segundos).
function frames(session: SessionRecorder, from: number, to: number, handVisible: boolean) {
  for (let t = from; t <= to + 1e-9; t += 0.1) session.frame(s(t), handVisible);
}

describe("SessionRecorder", () => {
  it("sesión sin empezar a tocar: todo en cero", () => {
    const summary = newSession().summary(s(5));
    expect(summary).toMatchObject({
      id: "sesion-1",
      participant: "P01",
      startedAt: "2026-11-24T15:00:00.000Z",
      totalSeconds: 5,
      activeSeconds: 0,
      handVisibleRatio: 0,
      secondsToFirstNote: null,
      notesPlayed: 0,
      notesPerMinute: 0,
      ended: false,
    });
  });

  it("descuenta la carga y las pausas del tiempo activo", () => {
    const session = newSession();
    session.running(s(4)); // 4 s cargando
    session.pause(s(64)); // 60 s tocando
    session.running(s(100)); // 36 s en pausa
    session.end(s(130)); // 30 s más tocando
    const summary = session.summary(s(130));
    expect(summary.totalSeconds).toBe(130);
    expect(summary.activeSeconds).toBe(90);
    expect(summary.pauses).toBe(1);
    expect(summary.ended).toBe(true);
  });

  it("el tiempo activo sigue corriendo mientras no se pausa", () => {
    const session = newSession();
    session.running(s(2));
    expect(session.summary(s(32)).activeSeconds).toBe(30);
  });

  it("cuenta el tiempo con la mano a la vista", () => {
    const session = newSession();
    session.running(s(0));
    frames(session, 0, 10, true);
    frames(session, 10.1, 20, false);
    const summary = session.summary(s(20));
    expect(summary.handVisibleSeconds).toBeCloseTo(10, 0);
    expect(summary.handVisibleRatio).toBeCloseTo(0.5, 1);
  });

  it("un hueco largo entre cuadros (pestaña congelada) no cuenta entero", () => {
    const session = newSession();
    session.running(s(0));
    session.frame(s(0), true);
    session.frame(s(30), true);
    expect(session.summary(s(30)).handVisibleSeconds).toBe(MAX_FRAME_GAP_MS / 1000);
  });

  it("no cuenta cuadros durante la pausa", () => {
    const session = newSession();
    session.running(s(0));
    session.pause(s(10));
    frames(session, 10, 20, true);
    expect(session.summary(s(20)).handVisibleSeconds).toBe(0);
  });

  it("notas: total, distintas, por minuto y tiempo hasta la primera", () => {
    const session = newSession();
    session.running(s(5));
    session.note(s(17), 2);
    session.note(s(20), 2);
    session.note(s(25), 7);
    session.note(s(30), 0);
    const summary = session.summary(s(65)); // 1 minuto activo
    expect(summary.secondsToFirstNote).toBe(12);
    expect(summary.notesPlayed).toBe(4);
    expect(summary.distinctNotes).toBe(3);
    expect(summary.notesPerMinute).toBe(4);
  });

  it("registra instrumentos usados y cambios de volumen por origen", () => {
    const session = newSession();
    session.changeInstrument(s(1), "campanas");
    session.changeInstrument(s(2), "piano");
    session.changeVolume(s(3), 4, "boton");
    session.changeVolume(s(4), 5, "mano");
    session.changeVolume(s(5), 4, "mano");
    const summary = session.summary(s(5));
    expect(summary.instrument).toBe("piano");
    expect(summary.instrumentsUsed).toEqual(["piano", "campanas"]);
    expect(summary.volumeChanges).toEqual({ boton: 1, mano: 2 });
    expect(summary.volumeStep).toBe(4);
  });

  it("permiso de cámara denegado y errores", () => {
    const session = newSession();
    session.fail(s(3), "denied");
    session.running(s(10));
    session.fail(s(20), "error");
    const summary = session.summary(s(20));
    expect(summary.cameraDenied).toBe(true);
    expect(summary.errors).toBe(1);
    expect(summary.activeSeconds).toBe(10);
  });

  it("pausar dos veces o empezar dos veces no duplica nada", () => {
    const session = newSession();
    session.running(s(0));
    session.running(s(5));
    session.pause(s(10));
    session.pause(s(12));
    const summary = session.summary(s(12));
    expect(summary.activeSeconds).toBe(10);
    expect(summary.pauses).toBe(1);
  });
});

describe("parseParticipant", () => {
  it("acepta códigos simples", () => {
    expect(parseParticipant("P01")).toBe("P01");
    expect(parseParticipant("  usuario_42-b ")).toBe("usuario_42-b");
  });

  it("rechaza vacíos, nombres con espacios y caracteres raros", () => {
    expect(parseParticipant(null)).toBeNull();
    expect(parseParticipant("")).toBeNull();
    expect(parseParticipant("María Pérez")).toBeNull();
    expect(parseParticipant("<script>")).toBeNull();
    expect(parseParticipant("x".repeat(41))).toBeNull();
  });
});
