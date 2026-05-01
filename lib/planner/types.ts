export type SubjectKey = "psico" | "radio" | "est" | "scog" | "genere"
export type TimerMode = "focus" | "break"
export type TopicStatus = "done" | "review" | null

export interface ActiveRecallQuestion {
  id: string
  question: string
  answer: string
}

export interface QuizEntry {
  questions: ActiveRecallQuestion[]
}

export interface Subject {
  name: string
  short: string
  examDate: string
  examTime: string
  examType: string
  examISO: string
}

export interface PaletteEntry {
  bg: string
  border: string
  text: string
  dot: string
  soft: string
}

export type Topics = Record<SubjectKey, string[]>

export interface SessionItem {
  sub: SubjectKey
  dur: string
  topic: string
}

export interface DayEntry {
  label: string
  hours?: string
  note?: string
  sunday?: boolean
  busy?: boolean
  week: number
  sessions?: SessionItem[]
  exam?: boolean
  sub?: SubjectKey
  examLabel?: string
  time?: string
  type?: string
  examNote?: string
}

export type DailySchedule = Record<string, DayEntry>

export interface Week {
  id: number
  label: string
  phase: 1 | 2 | 3
  dates: string
  phaseLabel: string
  focus?: string
}

export interface Booking {
  date: string
  label: string
  urgent: boolean
}

export interface LoggedSession {
  id: number
  date: string
  subject: SubjectKey | null
  duration: number
  mode: TimerMode
  startTime: string
}

export interface CatchupItem {
  id: string
  origDay: string // original planned day "YYYY-MM-DD"
  origIdx: number // index within DAILY[origDay].sessions
  sub: SubjectKey
  dur: string
  topic: string
  targetDay: string // rescheduled-to day "YYYY-MM-DD"
  done: boolean
  createdAt: number
}

export interface SkippedItem {
  id: string
  origDay: string
  origIdx: number
  sub: SubjectKey
  dur: string
  topic: string
  examISO: string
}

export type DayItemKind = "planned" | "catchup"

export interface DayItem {
  kind: DayItemKind
  sub: SubjectKey
  dur: string
  topic: string
  done: boolean
  plannedIdx?: number
  catchupId?: string
  origDay?: string
}

export interface StudyDoc {
  url: string
  dataUrl?: string
  name: string
  type: "pdf" | "image" | "text" | "url" | "file"
  size?: number
  addedAt: number
}

export interface PlannerData {
  topics: Record<string, TopicStatus>
  daily: Record<string, boolean>
  notes: Record<string, string>
  conf: Record<string, number>
  check: Record<string, number>
  sessions: LoggedSession[]
  catchup: CatchupItem[]
  dismissedSkips: Record<string, true>
  docs: Record<string, StudyDoc>
}
