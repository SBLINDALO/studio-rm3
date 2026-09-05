// Sostituisce le costanti hardcoded SUBJECTS con record dinamici salvati su Supabase

export type ExamKind = "Scritto" | "Orale"
export type Cfu = 6 | 12

export interface Exam {
  id: string
  name: string
  abbreviation: string
  date: string
  time: string
  type: ExamKind
  cfu: Cfu
  color: string
  topics: string[]
  manualTotalHours?: number
  createdAt: string
}

// Una sessione di studio generata (o modificata a mano) per un giorno specifico
export interface DailySession {
  date: string
  examId: string
  hours: number
  auto: boolean
  completed: boolean
  carriedForwardFrom?: string
}

export interface StudyPlanConfig {
  dailyMaxHours: number
  perSubjectMaxHoursPerDay: number
  bufferDaysBeforeExam: number
  daysPerWeek: number
}

export const DEFAULT_CONFIG: StudyPlanConfig = {
  dailyMaxHours: 4,
  perSubjectMaxHoursPerDay: 2,
  bufferDaysBeforeExam: 4,
  daysPerWeek: 5,
}