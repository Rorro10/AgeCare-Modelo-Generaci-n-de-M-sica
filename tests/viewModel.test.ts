import { describe, expect, it } from "vitest";
import {
  MESSAGES,
  describeView,
  type DirectorState,
  type DirectorStatus,
} from "../lib/director/viewModel";

const base: DirectorState = {
  status: "idle",
  resuming: false,
  noteIndex: null,
  showHandGuide: false,
};

const view = (patch: Partial<DirectorState>) => describeView({ ...base, ...patch });

describe("describeView: botón principal", () => {
  it("cambia de etiqueta y acción según el estado", () => {
    const cases: [DirectorStatus, string, string][] = [
      ["idle", "Empezar", "start"],
      ["loading", "Preparando…", "none"],
      ["running", "Pausar", "pause"],
      ["paused", "Seguir", "resume"],
      ["denied", "Intentar de nuevo", "start"],
      ["error", "Intentar de nuevo", "start"],
    ];
    for (const [status, label, action] of cases) {
      const { primary } = view({ status, noteIndex: 2 });
      expect([status, primary.label, primary.action]).toEqual([status, label, action]);
    }
  });

  it("queda ocupado (busy) solo mientras carga", () => {
    expect(view({ status: "loading" }).primary.busy).toBe(true);
    expect(view({ status: "running", noteIndex: 0 }).primary.busy).toBe(false);
  });
});

describe("describeView: mensajes de estado", () => {
  it("al volver de una pausa dice solo «Preparando la cámara…»", () => {
    expect(view({ status: "loading" }).message).toBe(MESSAGES.loading);
    expect(view({ status: "loading", resuming: true }).message).toBe(MESSAGES.resuming);
  });

  it("funcionando con la mano: indica cómo elegir y tocar la nota", () => {
    const v = view({ status: "running", noteIndex: 4 });
    expect(v.message).toBe(MESSAGES.play);
    expect(v.stage).toEqual({ kind: "note", noteIndex: 4 });
  });

  it("con la guía activa: el área grande y el mensaje piden mostrar la mano", () => {
    const v = view({ status: "running", noteIndex: 4, showHandGuide: true });
    expect(v.message).toBe(MESSAGES.showHand);
    expect(v.stage).toMatchObject({ kind: "info", title: MESSAGES.showHand });
  });

  it("sin ninguna nota todavía, muestra la guía aunque no haya pasado el plazo", () => {
    const v = view({ status: "running", noteIndex: null, showHandGuide: false });
    expect(v.stage).toMatchObject({ kind: "info", icon: "hand" });
  });

  it("el mensaje no cambia entre elegir y tocar una nota (no se re-anuncia)", () => {
    expect(view({ status: "running", noteIndex: 1 }).message).toBe(
      view({ status: "running", noteIndex: 8 }).message
    );
  });
});

describe("describeView: volumen y cámara", () => {
  it("el volumen se ve solo cuando hay audio listo", () => {
    expect(view({ status: "idle" }).showVolume).toBe(false);
    expect(view({ status: "loading" }).showVolume).toBe(false);
    expect(view({ status: "loading", resuming: true }).showVolume).toBe(true);
    expect(view({ status: "running", noteIndex: 0 }).showVolume).toBe(true);
    expect(view({ status: "paused" }).showVolume).toBe(true);
    expect(view({ status: "error" }).showVolume).toBe(false);
  });

  it("permiso denegado explica en pasos cómo permitir la cámara", () => {
    expect(view({ status: "denied" }).cameraNotice?.steps).toHaveLength(3);
  });

  it("funcionando no tapa la cámara", () => {
    expect(view({ status: "running", noteIndex: 0 }).cameraNotice).toBeNull();
  });
});
