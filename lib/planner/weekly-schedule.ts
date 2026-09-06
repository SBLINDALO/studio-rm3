export type WeekDay = 0 | 1 | 2 | 3 | 4 | 5 | 6 // 0 = domenica, 1 = lunedì ... 6 = sabato

export type CommitmentMode = "lezione_presenza" | "lezione_online" | "autostudio" | "allenamento" | "partita"

export interface WeeklyCommitment {
  day: WeekDay
  start: string // "HH:MM", 24h
  end: string // "HH:MM", 24h
  label: string
  mode: CommitmentMode
  blocksStudy: boolean
  countsAsStudy?: boolean
  note?: string
}

export const WEEKLY_COMMITMENTS: WeeklyCommitment[] = [
  { day: 2, start: "08:00", end: "11:00", label: "Marketing", mode: "autostudio", blocksStudy: false, countsAsStudy: true },
  { day: 2, start: "08:00", end: "11:00", label: "Linguistica e Comunicazione", mode: "lezione_presenza", blocksStudy: true },
  { day: 2, start: "11:00", end: "14:00", label: "Istituzioni Storia Contemporanea", mode: "lezione_presenza", blocksStudy: true },
  { day: 2, start: "20:00", end: "22:00", label: "Allenamento", mode: "allenamento", blocksStudy: true },

  { day: 3, start: "08:00", end: "11:00", label: "Linguistica e Comunicazione", mode: "lezione_presenza", blocksStudy: true },
  { day: 3, start: "08:00", end: "11:00", label: "Psicologia della Comunicazione", mode: "autostudio", blocksStudy: false, countsAsStudy: true },
  { day: 3, start: "11:00", end: "14:00", label: "Istituzioni Storia Contemporanea", mode: "lezione_presenza", blocksStudy: true },

  { day: 4, start: "08:00", end: "11:00", label: "Psicologia della Comunicazione", mode: "lezione_online", blocksStudy: true },
  { day: 4, start: "20:00", end: "22:00", label: "Allenamento", mode: "allenamento", blocksStudy: true },

  { day: 1, start: "11:00", end: "17:00", label: "Comunicazione e Persuasione", mode: "lezione_presenza", blocksStudy: true },

  { day: 5, start: "14:00", end: "17:00", label: "Laboratorio di Comunicazione", mode: "lezione_presenza", blocksStudy: true, note: "tranne 15/10" },
]

export const SCHEDULE_EXCEPTIONS: Record<string, { skipLabels: string[] }> = {
  "2026-10-15": { skipLabels: ["Laboratorio di Comunicazione"] },
}

const STUDY_WINDOW = { start: "08:00", end: "24:00" }

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number)
  return h * 60 + m
}

function toDateKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

interface Interval {
  start: number
  end: number
}

function mergeIntervals(intervals: Interval[]): Interval[] {
  if (intervals.length === 0) return []
  const sorted = [...intervals].sort((a, b) => a.start - b.start)
  const merged: Interval[] = [sorted[0]]
  for (const cur of sorted.slice(1)) {
    const last = merged[merged.length - 1]
    if (cur.start <= last.end) {
      last.end = Math.max(last.end, cur.end)
    } else {
      merged.push(cur)
    }
  }
  return merged
}

function subtractIntervals(base: Interval, blocking: Interval[]): Interval[] {
  let remaining: Interval[] = [base]
  for (const block of blocking) {
    const next: Interval[] = []
    for (const seg of remaining) {
      if (block.end <= seg.start || block.start >= seg.end) {
        next.push(seg)
        continue
      }
      if (block.start > seg.start) next.push({ start: seg.start, end: block.start })
      if (block.end < seg.end) next.push({ start: block.end, end: seg.end })
    }
    remaining = next
  }
  return remaining
}

export function getStudyWindows(date: Date): Interval[] {
  const day = date.getDay() as WeekDay
  const dateKey = toDateKey(date)
  const exceptions = SCHEDULE_EXCEPTIONS[dateKey]?.skipLabels ?? []

  const blocking = WEEKLY_COMMITMENTS.filter(
    (c) => c.day === day && c.blocksStudy && !exceptions.includes(c.label)
  ).map((c) => ({ start: toMinutes(c.start), end: toMinutes(c.end) }))

  const window: Interval = { start: toMinutes(STUDY_WINDOW.start), end: toMinutes(STUDY_WINDOW.end) }
  return subtractIntervals(window, mergeIntervals(blocking))
}

export function getAvailableStudyHours(date: Date, maxDailyHours = 4): number {
  const windows = getStudyWindows(date)
  const totalMinutes = windows.reduce((sum, w) => sum + (w.end - w.start), 0)
  const hours = totalMinutes / 60
  return Math.min(hours, maxDailyHours)
}

export function isStudyDay(date: Date, minHours = 0.5): boolean {
  return getAvailableStudyHours(date) >= minHours
}
