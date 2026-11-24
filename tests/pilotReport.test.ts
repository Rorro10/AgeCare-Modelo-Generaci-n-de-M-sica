import { describe, expect, it } from "vitest";
import {
  buildPilotReport,
  isSessionSummary,
  median,
  sessionsToCsv,
} from "../lib/director/pilotReport";
import type { SessionSummary } from "../lib/director/sessionMetrics";

function session(overrides: Partial<SessionSummary> = {}): SessionSummary {
  return {
    version: 1,
    id: "s1",
    participant: "P01",
    startedAt: "2026-11-24T15:00:00.000Z",
    updatedAt: "2026-11-24T15:10:00.000Z",
    ended: true,
    totalSeconds: 600,
    activeSeconds: 540,
    handVisibleSeconds: 432,
    handVisibleRatio: 0.8,
    secondsToFirstNote: 12.5,
    notesPlayed: 90,
    distinctNotes: 8,
    notesPerMinute: 10,
    pauses: 1,
    instrument: "piano",
    instrumentsUsed: ["piano"],
    volumeChanges: { boton: 2, mano: 0 },
    volumeStep: 4,
    cameraDenied: false,
    errors: 0,
    ...overrides,
  };
}

describe("median", () => {
  it("impar, par y vacío", () => {
    expect(median([3, 1, 2])).toBe(2);
    expect(median([4, 1, 3, 2])).toBe(2.5);
    expect(median([])).toBeNull();
  });
});

describe("buildPilotReport", () => {
  it("agrupa por participante, con las sesiones sin código al final", () => {
    const report = buildPilotReport([
      session({ id: "a", participant: "P10" }),
      session({ id: "b", participant: null }),
      session({ id: "c", participant: "P2" }),
      session({ id: "d", participant: "P2" }),
    ]);
    expect(report.byParticipant.map((g) => [g.participant, g.sessions])).toEqual([
      ["P2", 2],
      ["P10", 1],
      [null, 1],
    ]);
    expect(report.overall.sessions).toBe(4);
  });

  it("las sesiones muy cortas no entran al análisis, pero sí a los problemas", () => {
    const report = buildPilotReport([
      session({ id: "a", activeSeconds: 300, notesPerMinute: 6 }),
      session({ id: "b", activeSeconds: 600, notesPerMinute: 12 }),
      session({ id: "c", activeSeconds: 5, notesPerMinute: 100, cameraDenied: true }),
    ]);
    const g = report.overall;
    expect(g.sessions).toBe(3);
    expect(g.analyzedSessions).toBe(2);
    expect(g.totalActiveMinutes).toBe(15);
    expect(g.medianActiveMinutes).toBe(7.5);
    expect(g.medianNotesPerMinute).toBe(9);
    expect(g.problemRatio).toBe(0.33);
  });

  it("proporción de sesiones que llegaron a tocar una nota", () => {
    const g = buildPilotReport([
      session({ id: "a", secondsToFirstNote: 10 }),
      session({ id: "b", secondsToFirstNote: 30 }),
      session({ id: "c", secondsToFirstNote: null, notesPlayed: 0 }),
      session({ id: "d", secondsToFirstNote: null, notesPlayed: 0 }),
    ]).overall;
    expect(g.playedRatio).toBe(0.5);
    expect(g.medianSecondsToFirstNote).toBe(20);
  });

  it("sin sesiones analizables las medianas quedan vacías", () => {
    const g = buildPilotReport([session({ activeSeconds: 10 })]).overall;
    expect(g.medianActiveMinutes).toBeNull();
    expect(g.playedRatio).toBeNull();
    expect(g.meanPauses).toBeNull();
  });
});

describe("sessionsToCsv", () => {
  it("separa con punto y coma, usa coma decimal y BOM para Excel", () => {
    const csv = sessionsToCsv([session({ participant: null, secondsToFirstNote: null })]);
    expect(csv.startsWith("﻿id;participante;inicio")).toBe(true);
    const [, row] = csv.trim().split("\r\n");
    const cells = row.split(";");
    expect(cells[1]).toBe(""); // sin participante
    expect(cells[8]).toBe("0,8"); // proporción con mano
    expect(cells[9]).toBe(""); // sin primera nota
    expect(cells[4]).toBe("si"); // terminada
  });

  it("encierra entre comillas los textos con separadores", () => {
    const csv = sessionsToCsv([session({ id: 'a;"b"' })]);
    expect(csv).toContain('"a;""b"""');
  });
});

describe("isSessionSummary", () => {
  it("acepta una sesión válida y rechaza datos corruptos", () => {
    expect(isSessionSummary(session())).toBe(true);
    expect(isSessionSummary(null)).toBe(false);
    expect(isSessionSummary({ ...session(), version: 2 })).toBe(false);
    expect(isSessionSummary({ ...session(), activeSeconds: "10" })).toBe(false);
    expect(isSessionSummary({ ...session(), instrument: "tuba" })).toBe(false);
    expect(isSessionSummary({ ...session(), volumeChanges: null })).toBe(false);
  });
});
