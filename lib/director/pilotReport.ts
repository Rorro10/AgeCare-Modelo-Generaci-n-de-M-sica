// Resumen de las sesiones de las pruebas piloto (Sprint 7, actividades 68 y
// 70). Módulo puro: recibe las sesiones guardadas y entrega los agregados y
// el CSV que usa el panel /piloto. Las metas con que se comparan están en
// docs/sprint7/protocolo-pruebas-piloto.md.

import { isInstrumentId } from "./instruments";
import { SESSION_SUMMARY_VERSION, type SessionSummary } from "./sessionMetrics";

// Sesiones de menos de esto (tiempo activo) no cuentan para el análisis:
// suelen ser pruebas del facilitador o un «Empezar» tocado sin querer.
export const MIN_ANALYZED_ACTIVE_SECONDS = 30;

export type GroupSummary = {
  // Código de participante, o null para las sesiones sin código.
  participant: string | null;
  sessions: number;
  // Sesiones con al menos MIN_ANALYZED_ACTIVE_SECONDS de tiempo activo.
  analyzedSessions: number;
  totalActiveMinutes: number;
  medianActiveMinutes: number | null;
  medianNotesPerMinute: number | null;
  medianHandVisibleRatio: number | null;
  medianSecondsToFirstNote: number | null;
  // Sesiones analizadas que llegaron a tocar al menos una nota, de 0 a 1.
  playedRatio: number | null;
  meanPauses: number | null;
  // Sesiones (todas) que quedaron sin cámara o con error, de 0 a 1.
  problemRatio: number;
};

export type PilotReport = {
  overall: GroupSummary;
  byParticipant: GroupSummary[];
};

export function buildPilotReport(sessions: readonly SessionSummary[]): PilotReport {
  const groups = new Map<string | null, SessionSummary[]>();
  for (const session of sessions) {
    const list = groups.get(session.participant) ?? [];
    list.push(session);
    groups.set(session.participant, list);
  }
  const byParticipant = [...groups.entries()]
    .map(([participant, list]) => summarizeGroup(participant, list))
    // Con código primero, en orden; las sesiones sin código al final.
    .sort((a, b) =>
      a.participant === null
        ? 1
        : b.participant === null
          ? -1
          : a.participant.localeCompare(b.participant, "es", { numeric: true })
    );
  return { overall: summarizeGroup(null, sessions), byParticipant };
}

export function summarizeGroup(
  participant: string | null,
  sessions: readonly SessionSummary[]
): GroupSummary {
  const analyzed = sessions.filter((s) => s.activeSeconds >= MIN_ANALYZED_ACTIVE_SECONDS);
  const withNote = analyzed.filter((s) => s.secondsToFirstNote !== null);
  const problems = sessions.filter((s) => s.cameraDenied || s.errors > 0);
  return {
    participant,
    sessions: sessions.length,
    analyzedSessions: analyzed.length,
    totalActiveMinutes: round(sum(analyzed.map((s) => s.activeSeconds)) / 60, 1),
    medianActiveMinutes: roundOrNull(median(analyzed.map((s) => s.activeSeconds / 60)), 1),
    medianNotesPerMinute: roundOrNull(median(analyzed.map((s) => s.notesPerMinute)), 1),
    medianHandVisibleRatio: roundOrNull(median(analyzed.map((s) => s.handVisibleRatio)), 2),
    medianSecondsToFirstNote: roundOrNull(
      median(withNote.map((s) => s.secondsToFirstNote as number)),
      1
    ),
    playedRatio: analyzed.length > 0 ? round(withNote.length / analyzed.length, 2) : null,
    meanPauses:
      analyzed.length > 0 ? round(sum(analyzed.map((s) => s.pauses)) / analyzed.length, 1) : null,
    problemRatio: sessions.length > 0 ? round(problems.length / sessions.length, 2) : 0,
  };
}

export function median(values: readonly number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

// Una fila por sesión, separada por ";" y con coma decimal para que Excel en
// español la abra en columnas sin pasos extra.
const CSV_COLUMNS: readonly [string, (s: SessionSummary) => string | number | boolean | null][] = [
  ["id", (s) => s.id],
  ["participante", (s) => s.participant],
  ["inicio", (s) => s.startedAt],
  ["ultima_actualizacion", (s) => s.updatedAt],
  ["terminada", (s) => s.ended],
  ["duracion_total_s", (s) => s.totalSeconds],
  ["tiempo_activo_s", (s) => s.activeSeconds],
  ["tiempo_con_mano_s", (s) => s.handVisibleSeconds],
  ["proporcion_con_mano", (s) => s.handVisibleRatio],
  ["s_hasta_primera_nota", (s) => s.secondsToFirstNote],
  ["notas_tocadas", (s) => s.notesPlayed],
  ["notas_distintas", (s) => s.distinctNotes],
  ["notas_por_minuto", (s) => s.notesPerMinute],
  ["pausas", (s) => s.pauses],
  ["instrumento_final", (s) => s.instrument],
  ["instrumentos_usados", (s) => s.instrumentsUsed.join("|")],
  ["cambios_volumen_boton", (s) => s.volumeChanges.boton],
  ["cambios_volumen_mano", (s) => s.volumeChanges.mano],
  ["paso_volumen_final", (s) => s.volumeStep],
  ["camara_denegada", (s) => s.cameraDenied],
  ["errores", (s) => s.errors],
];

export function sessionsToCsv(sessions: readonly SessionSummary[]): string {
  const header = CSV_COLUMNS.map(([name]) => name).join(";");
  const rows = sessions.map((session) =>
    CSV_COLUMNS.map(([, read]) => csvCell(read(session))).join(";")
  );
  // BOM: Excel reconoce el UTF-8 y muestra bien los acentos.
  return "﻿" + [header, ...rows].join("\r\n") + "\r\n";
}

function csvCell(value: string | number | boolean | null): string {
  if (value === null) return "";
  if (typeof value === "boolean") return value ? "si" : "no";
  if (typeof value === "number") return String(value).replace(".", ",");
  return /[";\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

// Valida lo leído del almacenamiento: solo pasan sesiones con la forma
// esperada, para que un dato corrupto no rompa el panel.
export function isSessionSummary(value: unknown): value is SessionSummary {
  if (typeof value !== "object" || value === null) return false;
  const s = value as Record<string, unknown>;
  const numbers = [
    "totalSeconds",
    "activeSeconds",
    "handVisibleSeconds",
    "handVisibleRatio",
    "notesPlayed",
    "distinctNotes",
    "notesPerMinute",
    "pauses",
    "volumeStep",
    "errors",
  ];
  const volume = s.volumeChanges as Record<string, unknown> | null | undefined;
  return (
    s.version === SESSION_SUMMARY_VERSION &&
    typeof s.id === "string" &&
    (s.participant === null || typeof s.participant === "string") &&
    typeof s.startedAt === "string" &&
    typeof s.updatedAt === "string" &&
    typeof s.ended === "boolean" &&
    numbers.every((key) => typeof s[key] === "number" && Number.isFinite(s[key])) &&
    (s.secondsToFirstNote === null || typeof s.secondsToFirstNote === "number") &&
    isInstrumentId(s.instrument) &&
    Array.isArray(s.instrumentsUsed) &&
    s.instrumentsUsed.every(isInstrumentId) &&
    typeof volume === "object" &&
    volume !== null &&
    typeof volume.boton === "number" &&
    typeof volume.mano === "number" &&
    typeof s.cameraDenied === "boolean"
  );
}

function sum(values: readonly number[]) {
  return values.reduce((total, value) => total + value, 0);
}

function round(value: number, decimals: number) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function roundOrNull(value: number | null, decimals: number) {
  return value === null ? null : round(value, decimals);
}
