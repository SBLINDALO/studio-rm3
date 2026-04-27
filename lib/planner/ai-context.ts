import type { PlannerData, SubjectKey, SkippedItem } from "./types"
import { SUBJECTS, TOPICS, DAILY, BOOKINGS, TODAY_STR } from "./data"
import { getDayItems, scanSkipped } from "./catchup"

export interface AiSnapshot {
  today: string
  todayLabel: string
  progress: {
    global: { done: number; total: number; pct: number }
    bySubject: Array<{ key: SubjectKey; name: string; done: number; total: number; pct: number }>
  }
  todayPlan: Array<{ sub: string; dur: string; topic: string; done: boolean; catchup: boolean }>
  skipped: Array<{ day: string; sub: string; topic: string; dur: string }>
  nextExam: { name: string; date: string; daysUntil: number } | null
  nextBooking: { name: string; date: string; daysUntil: number } | null
  focusTodayMin: number
}

function daysBetween(a: string, b: string): number {
  const da = new Date(a + "T00:00:00")
  const db = new Date(b + "T00:00:00")
  return Math.round((db.getTime() - da.getTime()) / 86_400_000)
}

export function buildAiSnapshot(data: PlannerData): AiSnapshot {
  const entry = DAILY[TODAY_STR]
  const todayLabel = entry?.label ?? TODAY_STR

  // Global + per-subject progress
  const bySubject = (Object.keys(SUBJECTS) as SubjectKey[]).map((k) => {
    const all = TOPICS[k] ?? []
    const done = all.filter((_, i) => data.topics[`${k}_${i}`] === "done").length
    const total = all.length
    const pct = total ? Math.round((done / total) * 100) : 0
    return { key: k, name: SUBJECTS[k].name, done, total, pct }
  })
  const gDone = bySubject.reduce((s, x) => s + x.done, 0)
  const gTotal = bySubject.reduce((s, x) => s + x.total, 0)
  const gPct = gTotal ? Math.round((gDone / gTotal) * 100) : 0

  // Today's plan (planned + catchup)
  const items = getDayItems(TODAY_STR, data)
  const todayPlan = items.map((it) => ({
    sub: SUBJECTS[it.sub].name,
    dur: it.dur,
    topic: it.topic,
    done: it.done,
    catchup: it.kind === "catchup",
  }))

  // Skipped arrears (top 8 by urgency)
  const skippedAll: SkippedItem[] = scanSkipped(data)
  const skipped = skippedAll.slice(0, 8).map((s) => ({
    day: DAILY[s.origDay]?.label ?? s.origDay,
    sub: SUBJECTS[s.sub].name,
    topic: s.topic,
    dur: s.dur,
  }))

  // Next exam / booking
  const upcomingExams = Object.entries(DAILY)
    .filter(([d, v]) => v.exam && d >= TODAY_STR)
    .sort(([a], [b]) => a.localeCompare(b))
  const nextExamEntry = upcomingExams[0]
  const nextExam = nextExamEntry
    ? {
        name: nextExamEntry[1].label ?? "Esame",
        date: nextExamEntry[0],
        daysUntil: daysBetween(TODAY_STR, nextExamEntry[0]),
      }
    : null

  const upcomingBooking = BOOKINGS.find((b) => b.date >= TODAY_STR)
  const nextBooking = upcomingBooking
    ? {
        name: upcomingBooking.label,
        date: upcomingBooking.date,
        daysUntil: daysBetween(TODAY_STR, upcomingBooking.date),
      }
    : null

  // Today's focus minutes
  const focusTodayMin = Math.round(
    data.sessions
      .filter((s) => s.date === TODAY_STR && s.mode === "focus")
      .reduce((sum, s) => sum + s.duration, 0),
  )

  return {
    today: TODAY_STR,
    todayLabel,
    progress: {
      global: { done: gDone, total: gTotal, pct: gPct },
      bySubject,
    },
    todayPlan,
    skipped,
    nextExam,
    nextBooking,
    focusTodayMin,
  }
}

/**
 * Renders the AI snapshot as a compact markdown string for injection
 * into an LLM system prompt. Both the chat coach and the deep analyst
 * consume the SAME string → single source of truth → consistent fusion.
 */
export function renderSnapshotAsMarkdown(s: AiSnapshot): string {
  const lines: string[] = []
  lines.push(`# Stato studente al ${s.todayLabel}`)
  lines.push(``)
  lines.push(
    `**Progresso globale:** ${s.progress.global.done}/${s.progress.global.total} argomenti (${s.progress.global.pct}%)`,
  )
  lines.push(``)
  lines.push(`## Progresso per materia`)
  for (const p of s.progress.bySubject) {
    lines.push(`- ${p.name}: ${p.done}/${p.total} (${p.pct}%)`)
  }
  lines.push(``)
  if (s.nextExam) {
    lines.push(
      `## Prossimo esame\n${s.nextExam.name} tra ${s.nextExam.daysUntil} giorni (${s.nextExam.date})`,
    )
  }
  if (s.nextBooking) {
    lines.push(`\n## Prossima scadenza\n${s.nextBooking.name} tra ${s.nextBooking.daysUntil} giorni`)
  }
  lines.push(``)
  lines.push(`## Piano di oggi`)
  if (s.todayPlan.length === 0) {
    lines.push(`_Nessuna sessione pianificata oggi._`)
  } else {
    for (const t of s.todayPlan) {
      const tag = t.catchup ? " [RECUPERO]" : ""
      const done = t.done ? " ✓" : ""
      lines.push(`- (${t.sub}, ${t.dur})${tag}${done}: ${t.topic}`)
    }
  }
  lines.push(``)
  lines.push(`## Sessioni di studio completate oggi: ${s.focusTodayMin} minuti`)
  lines.push(``)
  if (s.skipped.length > 0) {
    lines.push(`## Argomenti arretrati (${s.skipped.length})`)
    for (const sk of s.skipped) {
      lines.push(`- ${sk.day} — ${sk.sub} (${sk.dur}): ${sk.topic}`)
    }
  }
  return lines.join("\n")
}
