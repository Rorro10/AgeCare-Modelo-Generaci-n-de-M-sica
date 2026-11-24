"use client";

// Panel del facilitador: arma el enlace con el código de cada participante,
// muestra las métricas de las sesiones guardadas en este dispositivo y las
// descarga en CSV (para Excel) o JSON. Es para el equipo, no para el adulto
// mayor: prioriza densidad de datos sobre tamaño de letra.

import { useMemo, useState, useSyncExternalStore } from "react";
import { getInstrument } from "@/lib/director/instruments";
import {
  buildPilotReport,
  MIN_ANALYZED_ACTIVE_SECONDS,
  sessionsToCsv,
  type GroupSummary,
} from "@/lib/director/pilotReport";
import { parseParticipant, type SessionSummary } from "@/lib/director/sessionMetrics";
import {
  clearSessions,
  loadSessionsRaw,
  parseSessions,
  subscribeToSessions,
} from "@/lib/director/services/sessionStore";

const noSubscription = () => () => {};

export function PilotPanel() {
  const raw = useSyncExternalStore(subscribeToSessions, loadSessionsRaw, () => "[]");
  const sessions = useMemo(() => parseSessions(raw), [raw]);
  const report = useMemo(() => buildPilotReport(sessions), [sessions]);
  const newestFirst = useMemo(
    () => [...sessions].sort((a, b) => b.startedAt.localeCompare(a.startedAt)),
    [sessions]
  );

  function download(kind: "csv" | "json") {
    const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, "-");
    const blob =
      kind === "csv"
        ? new Blob([sessionsToCsv(sessions)], { type: "text/csv;charset=utf-8" })
        : new Blob([JSON.stringify(sessions, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `director-musical-sesiones-${stamp}.${kind}`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function clearAll() {
    if (
      window.confirm(
        `¿Borrar las ${sessions.length} sesiones de este dispositivo? Descarga el CSV antes: no se puede deshacer.`
      )
    ) {
      clearSessions();
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-6 text-base">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold">Panel del piloto — Director Musical</h1>
        <p className="text-stone-700">
          Solo para el equipo. Las sesiones se guardan <strong>únicamente en este dispositivo</strong>{" "}
          (no se envían a ningún servidor): descarga el CSV al terminar cada jornada.
        </p>
      </header>

      <ParticipantLink />

      <section aria-labelledby="resumen" className="flex flex-col gap-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 id="resumen" className="text-xl font-semibold">
            Resumen
          </h2>
          <div className="flex flex-wrap gap-2">
            <PanelButton onClick={() => download("csv")} disabled={sessions.length === 0}>
              Descargar CSV
            </PanelButton>
            <PanelButton onClick={() => download("json")} disabled={sessions.length === 0}>
              Descargar JSON
            </PanelButton>
            <PanelButton onClick={clearAll} disabled={sessions.length === 0} danger>
              Borrar sesiones
            </PanelButton>
          </div>
        </div>
        {sessions.length === 0 ? (
          <p className="rounded-lg bg-surface p-4 text-stone-700">
            Todavía no hay sesiones en este dispositivo. Abre el enlace de un participante y toca
            «Empezar».
          </p>
        ) : (
          <>
            <OverallCards group={report.overall} />
            <p className="text-sm text-stone-600">
              Las medianas consideran solo sesiones con al menos {MIN_ANALYZED_ACTIVE_SECONDS} s de
              tiempo activo ({report.overall.analyzedSessions} de {report.overall.sessions}).
            </p>
            <ParticipantTable groups={report.byParticipant} />
          </>
        )}
      </section>

      {sessions.length > 0 && <SessionTable sessions={newestFirst} />}
    </main>
  );
}

function ParticipantLink() {
  const [code, setCode] = useState("");
  const [copied, setCopied] = useState(false);
  // location.origin solo existe en el navegador; en el servidor queda vacío.
  const origin = useSyncExternalStore(noSubscription, () => window.location.origin, () => "");
  const participant = parseParticipant(code);
  const link = participant ? `${origin}/?participante=${encodeURIComponent(participant)}` : null;
  const invalid = code.trim() !== "" && participant === null;

  async function copy() {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Sin portapapeles: el enlace queda a la vista para copiarlo a mano.
    }
  }

  return (
    <section aria-labelledby="enlace" className="flex flex-col gap-2 rounded-lg bg-surface p-4">
      <h2 id="enlace" className="text-xl font-semibold">
        Enlace para un participante
      </h2>
      <label htmlFor="codigo" className="text-stone-700">
        Código del participante (p. ej. P01). Nunca nombres ni RUT.
      </label>
      <div className="flex flex-wrap items-center gap-2">
        <input
          id="codigo"
          value={code}
          onChange={(e) => {
            setCode(e.target.value);
            setCopied(false);
          }}
          aria-invalid={invalid}
          aria-describedby={invalid ? "codigo-error" : undefined}
          autoComplete="off"
          className="w-40 rounded-md border border-stone-400 bg-white px-3 py-2 focus-visible:outline-3 focus-visible:outline-focus"
        />
        {link && (
          <>
            <a
              href={link}
              className="font-medium text-focus underline underline-offset-2 break-all"
            >
              {link}
            </a>
            <PanelButton onClick={copy}>{copied ? "Copiado" : "Copiar"}</PanelButton>
          </>
        )}
      </div>
      {invalid && (
        <p id="codigo-error" className="text-sm text-red-800">
          Usa solo letras, números, guion o guion bajo (máximo 40).
        </p>
      )}
    </section>
  );
}

function OverallCards({ group }: { group: GroupSummary }) {
  const cards: [string, string][] = [
    ["Sesiones", String(group.sessions)],
    ["Minutos activos (total)", fmt(group.totalActiveMinutes)],
    ["Duración mediana", withUnit(group.medianActiveMinutes, "min")],
    ["Notas por minuto (mediana)", fmt(group.medianNotesPerMinute)],
    ["Con la mano a la vista", percent(group.medianHandVisibleRatio)],
    ["Hasta la primera nota", withUnit(group.medianSecondsToFirstNote, "s")],
    ["Sesiones que tocaron", percent(group.playedRatio)],
    ["Sin cámara o con error", percent(group.problemRatio)],
  ];
  return (
    <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {cards.map(([label, value]) => (
        <div key={label} className="rounded-lg bg-surface p-3">
          <dt className="text-sm text-stone-600">{label}</dt>
          <dd className="text-2xl font-semibold tabular-nums">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function ParticipantTable({ groups }: { groups: GroupSummary[] }) {
  return (
    <div className="overflow-x-auto rounded-lg bg-surface">
      <table className="w-full min-w-[44rem] text-left text-sm">
        <caption className="sr-only">Métricas por participante</caption>
        <thead className="border-b border-stone-300 text-stone-600">
          <tr>
            <Th>Participante</Th>
            <Th num>Sesiones</Th>
            <Th num>Min. activos</Th>
            <Th num>Duración mediana</Th>
            <Th num>Notas/min</Th>
            <Th num>Mano a la vista</Th>
            <Th num>1.ª nota</Th>
            <Th num>Pausas (prom.)</Th>
            <Th num>Problemas</Th>
          </tr>
        </thead>
        <tbody className="tabular-nums">
          {groups.map((g) => (
            <tr key={g.participant ?? "sin-codigo"} className="border-b border-stone-200">
              <td className="px-3 py-2 font-medium">{g.participant ?? "Sin código"}</td>
              <Td>{`${g.analyzedSessions}/${g.sessions}`}</Td>
              <Td>{fmt(g.totalActiveMinutes)}</Td>
              <Td>{withUnit(g.medianActiveMinutes, "min")}</Td>
              <Td>{fmt(g.medianNotesPerMinute)}</Td>
              <Td>{percent(g.medianHandVisibleRatio)}</Td>
              <Td>{withUnit(g.medianSecondsToFirstNote, "s")}</Td>
              <Td>{fmt(g.meanPauses)}</Td>
              <Td>{percent(g.problemRatio)}</Td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SessionTable({ sessions }: { sessions: SessionSummary[] }) {
  return (
    <section aria-labelledby="sesiones" className="flex flex-col gap-3">
      <h2 id="sesiones" className="text-xl font-semibold">
        Sesiones ({sessions.length})
      </h2>
      <div className="overflow-x-auto rounded-lg bg-surface">
        <table className="w-full min-w-[52rem] text-left text-sm">
          <thead className="border-b border-stone-300 text-stone-600">
            <tr>
              <Th>Inicio</Th>
              <Th>Participante</Th>
              <Th num>Total</Th>
              <Th num>Activo</Th>
              <Th num>Mano a la vista</Th>
              <Th num>Notas</Th>
              <Th num>Notas/min</Th>
              <Th num>1.ª nota</Th>
              <Th num>Pausas</Th>
              <Th>Instrumento</Th>
              <Th>Estado</Th>
            </tr>
          </thead>
          <tbody className="tabular-nums">
            {sessions.map((s) => (
              <tr key={s.id} className="border-b border-stone-200">
                <td className="px-3 py-2 whitespace-nowrap">{formatDate(s.startedAt)}</td>
                <td className="px-3 py-2">{s.participant ?? "—"}</td>
                <Td>{duration(s.totalSeconds)}</Td>
                <Td>{duration(s.activeSeconds)}</Td>
                <Td>{percent(s.handVisibleRatio)}</Td>
                <Td>{`${s.notesPlayed} (${s.distinctNotes} dist.)`}</Td>
                <Td>{fmt(s.notesPerMinute)}</Td>
                <Td>{withUnit(s.secondsToFirstNote, "s")}</Td>
                <Td>{String(s.pauses)}</Td>
                <td className="px-3 py-2">
                  {s.instrumentsUsed.map((id) => getInstrument(id).name).join(", ")}
                </td>
                <td className="px-3 py-2">{sessionState(s)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function sessionState(s: SessionSummary) {
  if (s.cameraDenied && s.activeSeconds === 0) return "Sin permiso de cámara";
  if (s.errors > 0) return `Con ${s.errors} error(es)`;
  return s.ended ? "Terminada" : "Sin cierre";
}

function PanelButton({
  children,
  onClick,
  disabled,
  danger,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-md px-4 py-2 font-medium focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:cursor-not-allowed disabled:opacity-50 ${
        danger
          ? "border border-red-800 text-red-800 hover:bg-red-50"
          : "bg-foreground text-background hover:bg-stone-700"
      }`}
    >
      {children}
    </button>
  );
}

function Th({ children, num }: { children: React.ReactNode; num?: boolean }) {
  return (
    <th scope="col" className={`px-3 py-2 font-medium ${num ? "text-right" : ""}`}>
      {children}
    </th>
  );
}

function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-3 py-2 text-right">{children}</td>;
}

const numberFormat = new Intl.NumberFormat("es-CL", { maximumFractionDigits: 1 });

function fmt(value: number | null) {
  return value === null ? "—" : numberFormat.format(value);
}

function withUnit(value: number | null, unit: string) {
  return value === null ? "—" : `${numberFormat.format(value)} ${unit}`;
}

function percent(ratio: number | null) {
  return ratio === null ? "—" : `${Math.round(ratio * 100)} %`;
}

function duration(totalSeconds: number) {
  const rounded = Math.round(totalSeconds);
  const minutes = Math.floor(rounded / 60);
  const seconds = rounded % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("es-CL", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}
