import type { PlannerData, SubjectKey } from "./types"
import { SUBJECTS, TOPICS, DAILY, BOOKINGS } from "./data"
import { getTodayStr } from "./helpers"
import { parseISODate } from "./utils/dates"

export interface AiSnapshot {
  today: string
  todayLabel: string
  progress: {
    global: { done: number; total: number; pct: number }
    bySubject: Array<{ key: SubjectKey; name: string; done: number; total: number; pct: number }>
  }
  todayPlan: Array<{ sub: string; dur: string; topic: string; done: boolean }>
  nextExam: { name: string; date: string; daysUntil: number } | null
  nextBooking: { name: string; date: string; daysUntil: number } | null
  focusTodayMin: number
}

function daysBetween(a: string, b: string): number {
  const da = parseISODate(a)
  const db = parseISODate(b)
  return Math.round((db.getTime() - da.getTime()) / 86_400_000)
}

export function buildAiSnapshot(data: PlannerData): AiSnapshot {
  const todayKey = getTodayStr()
  const entry = DAILY[todayKey]
  const todayLabel = entry?.label ?? todayKey

  const topics = data.topics ?? {}

  // Global + per-subject progress
  const bySubject = (Object.keys(SUBJECTS) as SubjectKey[]).map((k) => {
    const all = TOPICS[k] ?? []
    const done = all.filter((_, i) => topics[`${k}_${i}`] === "done").length
    const total = all.length
    const pct = total ? Math.round((done / total) * 100) : 0
    return { key: k, name: SUBJECTS[k].name, done, total, pct }
  })
  const gDone = bySubject.reduce((s, x) => s + x.done, 0)
  const gTotal = bySubject.reduce((s, x) => s + x.total, 0)
  const gPct = gTotal ? Math.round((gDone / gTotal) * 100) : 0

  // Today's legacy plan, without the removed catchup queue.
  const todayPlan = (entry?.sessions ?? []).map((session, index) => ({
    sub: SUBJECTS[session.sub]?.name ?? session.sub,
    dur: session.dur,
    topic: session.topic,
    done: !!data.daily[`${todayKey}_${index}`],
  }))

  // Next exam / booking
  const upcomingExams = Object.entries(DAILY)
    .filter(([d, v]) => v.exam && d >= todayKey)
    .sort(([a], [b]) => a.localeCompare(b))
  const nextExamEntry = upcomingExams[0]
  const nextExam = nextExamEntry
    ? {
        name: nextExamEntry[1].label ?? "Esame",
        date: nextExamEntry[0],
        daysUntil: daysBetween(todayKey, nextExamEntry[0]),
      }
    : null

  const upcomingBooking = BOOKINGS.find((b) => b.date >= todayKey)
  const nextBooking = upcomingBooking
    ? {
        name: upcomingBooking.label,
        date: upcomingBooking.date,
        daysUntil: daysBetween(todayKey, upcomingBooking.date),
      }
    : null

  // Today's focus minutes
  const sessions = Array.isArray(data.sessions) ? data.sessions : []
  const focusTodayMin = Math.round(
    sessions
      .filter((s) => s.date === todayKey && s.mode === "focus")
      .reduce((sum, s) => sum + s.duration, 0),
  )

  return {
    today: todayKey,
    todayLabel,
    progress: {
      global: { done: gDone, total: gTotal, pct: gPct },
      bySubject,
    },
    todayPlan,
    nextExam,
    nextBooking,
    focusTodayMin,
  }
}

/**
 * Renders the AI snapshot as a compact markdown string for injection
 * into an LLM system prompt. Both the chat coach and the deep analyst
 * consume the SAME string → single source of truth → consistent fusion.
 *
 * Defensive: `s` may come from an untrusted client request body, so every
 * field is normalized to a safe default before use to avoid throwing on
 * undefined/missing data.
 */
export function renderSnapshotAsMarkdown(s: AiSnapshot | null | undefined): string {
  const safe: AiSnapshot = {
    today: s?.today ?? "",
    todayLabel: s?.todayLabel ?? "",
    progress: {
      global: s?.progress?.global ?? { done: 0, total: 0, pct: 0 },
      bySubject: Array.isArray(s?.progress?.bySubject) ? s.progress.bySubject : [],
    },
    todayPlan: Array.isArray(s?.todayPlan) ? s.todayPlan : [],
    nextExam: s?.nextExam ?? null,
    nextBooking: s?.nextBooking ?? null,
    focusTodayMin: s?.focusTodayMin ?? 0,
  }

  const lines: string[] = []
  lines.push(`# Stato studente al ${safe.todayLabel}`)
  lines.push(``)
  lines.push(
    `**Progresso globale:** ${safe.progress.global.done}/${safe.progress.global.total} argomenti (${safe.progress.global.pct}%)`,
  )
  lines.push(``)
  lines.push(`## Progresso per materia`)
  for (const p of safe.progress.bySubject) {
    lines.push(`- ${p.name}: ${p.done}/${p.total} (${p.pct}%)`)
  }
  lines.push(``)
  if (safe.nextExam) {
    lines.push(
      `## Prossimo esame\n${safe.nextExam.name} tra ${safe.nextExam.daysUntil} giorni (${safe.nextExam.date})`,
    )
  }
  if (safe.nextBooking) {
    lines.push(`\n## Prossima scadenza\n${safe.nextBooking.name} tra ${safe.nextBooking.daysUntil} giorni`)
  }
  lines.push(``)
  lines.push(`## Piano di oggi`)
  if (safe.todayPlan.length === 0) {
    lines.push(`_Nessuna sessione pianificata oggi._`)
  } else {
    for (const t of safe.todayPlan) {
      const done = t.done ? " ✓" : ""
      lines.push(`- (${t.sub}, ${t.dur})${done}: ${t.topic}`)
    }
  }
  lines.push(``)
  lines.push(`## Sessioni di studio completate oggi: ${safe.focusTodayMin} minuti`)
  lines.push(``)
  return lines.join("\n")
}
