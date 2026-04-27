import { DAILY, SUBJECTS, TODAY_STR } from "./data"
import type { CatchupItem, DayItem, PlannerData, SkippedItem, SubjectKey } from "./types"

/** Max sessions per day as capacity constraint for auto-rescheduling. */
const MAX_LOAD = 6
const MAX_LOAD_SUNDAY = 4
/** How many "recuperi" at most can land on the same day to avoid overload. */
const MAX_CATCHUP_PER_DAY = 2

/**
 * Scan past days and return sessions that were planned but never marked done,
 * excluding those already rescheduled (in catchup array) or explicitly dismissed.
 */
export function scanSkipped(data: PlannerData, effectiveToday: string = TODAY_STR): SkippedItem[] {
  const skipped: SkippedItem[] = []
  const catchup = data.catchup ?? []
  const dismissed = data.dismissedSkips ?? {}

  for (const day of Object.keys(DAILY)) {
    if (day >= effectiveToday) continue // only past days count as "skipped"
    const entry = DAILY[day]
    if (!entry?.sessions || entry.busy || entry.exam) continue
    entry.sessions.forEach((s, idx) => {
      const key = `${day}_${idx}`
      if (data.daily[key]) return // marked done
      if (dismissed[key]) return // user dismissed
      if (catchup.some((c) => c.origDay === day && c.origIdx === idx)) return // already rescheduled
      skipped.push({
        id: `${day}_${idx}`,
        origDay: day,
        origIdx: idx,
        sub: s.sub,
        dur: s.dur,
        topic: s.topic,
        examISO: SUBJECTS[s.sub].examISO,
      })
    })
  }

  // Sort by urgency (closest exam first), then chronologically
  return skipped.sort((a, b) => {
    if (a.examISO !== b.examISO) return a.examISO.localeCompare(b.examISO)
    return a.origDay.localeCompare(b.origDay)
  })
}

/**
 * Propose target days for each skipped item, producing a preview mapping.
 * Does NOT mutate state. Returns { itemId: targetDay } for items that fit,
 * and `orphaned` for those with no capacity before the exam.
 */
export function proposeReschedule(
  skippedItems: SkippedItem[],
  data: PlannerData,
  effectiveToday: string = TODAY_STR,
): { proposal: Record<string, string>; orphaned: string[]; loadByDay: Record<string, number> } {
  const proposal: Record<string, string> = {}
  const orphaned: string[] = []
  const load: Record<string, number> = {}
  const catchupCount: Record<string, number> = {}

  // Initialize load map from existing planned sessions
  for (const day of Object.keys(DAILY)) {
    if (day < effectiveToday) continue
    load[day] = DAILY[day].sessions?.length ?? 0
  }
  // Add load from already-scheduled catchup items
  for (const c of data.catchup ?? []) {
    if (c.targetDay < effectiveToday) continue
    load[c.targetDay] = (load[c.targetDay] ?? 0) + 1
    catchupCount[c.targetDay] = (catchupCount[c.targetDay] ?? 0) + 1
  }

  for (const item of skippedItems) {
    const examISO = item.examISO
    const candidates = Object.keys(DAILY)
      .filter((d) => {
        if (d <= effectiveToday) return false
        if (d >= examISO) return false
        const entry = DAILY[d]
        if (!entry || entry.busy || entry.exam) return false
        const cap = entry.sunday ? MAX_LOAD_SUNDAY : MAX_LOAD
        if ((load[d] ?? 0) >= cap) return false
        if ((catchupCount[d] ?? 0) >= MAX_CATCHUP_PER_DAY) return false
        return true
      })
      .sort((a, b) => {
        // Priority 1: day already studies this subject (coherence)
        const aHasSub = DAILY[a].sessions?.some((s) => s.sub === item.sub) ? 0 : 1
        const bHasSub = DAILY[b].sessions?.some((s) => s.sub === item.sub) ? 0 : 1
        if (aHasSub !== bHasSub) return aHasSub - bHasSub
        // Priority 2: lighter days first (spread load)
        const la = load[a] ?? 0
        const lb = load[b] ?? 0
        if (la !== lb) return la - lb
        // Priority 3: earlier days first (avoid cramming before exam)
        return a.localeCompare(b)
      })

    const target = candidates[0]
    if (!target) {
      orphaned.push(item.id)
      continue
    }
    proposal[item.id] = target
    load[target] = (load[target] ?? 0) + 1
    catchupCount[target] = (catchupCount[target] ?? 0) + 1
  }

  return { proposal, orphaned, loadByDay: load }
}

/**
 * Merge original planned sessions with any catchup sessions targeted at a day,
 * returning a unified list for UI rendering.
 */
export function getDayItems(day: string, data: PlannerData): DayItem[] {
  const planned: DayItem[] = (DAILY[day]?.sessions ?? []).map((s, i) => ({
    kind: "planned",
    sub: s.sub,
    dur: s.dur,
    topic: s.topic,
    done: !!data.daily[`${day}_${i}`],
    plannedIdx: i,
  }))
  const catchup: DayItem[] = (data.catchup ?? [])
    .filter((c) => c.targetDay === day)
    .map((c) => ({
      kind: "catchup",
      sub: c.sub,
      dur: c.dur,
      topic: c.topic,
      done: !!c.done,
      catchupId: c.id,
      origDay: c.origDay,
    }))
  return [...planned, ...catchup]
}

/**
 * Get count of catchup sessions scheduled for a specific day (for badges).
 */
export function getCatchupCountForDay(day: string, data: PlannerData): number {
  return (data.catchup ?? []).filter((c) => c.targetDay === day).length
}

/**
 * Build a summary of a proposed plan: day -> array of items landing on it.
 * Useful for rendering the preview card.
 */
export function summarizeProposal(
  items: SkippedItem[],
  proposal: Record<string, string>,
): { day: string; items: SkippedItem[] }[] {
  const buckets: Record<string, SkippedItem[]> = {}
  for (const it of items) {
    const target = proposal[it.id]
    if (!target) continue
    if (!buckets[target]) buckets[target] = []
    buckets[target].push(it)
  }
  return Object.keys(buckets)
    .sort()
    .map((day) => ({ day, items: buckets[day] }))
}

/**
 * Pretty label for a day string like "2026-04-23" using DAILY[day].label.
 */
export function dayLabel(day: string): string {
  return DAILY[day]?.label ?? day
}

/**
 * Build CatchupItem records from skipped items + proposal, ready to persist.
 */
export function buildCatchupItems(
  skipped: SkippedItem[],
  proposal: Record<string, string>,
): CatchupItem[] {
  const out: CatchupItem[] = []
  for (const it of skipped) {
    const target = proposal[it.id]
    if (!target) continue
    out.push({
      id: `c_${it.origDay}_${it.origIdx}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      origDay: it.origDay,
      origIdx: it.origIdx,
      sub: it.sub as SubjectKey,
      dur: it.dur,
      topic: it.topic,
      targetDay: target,
      done: false,
      createdAt: Date.now(),
    })
  }
  return out
}
