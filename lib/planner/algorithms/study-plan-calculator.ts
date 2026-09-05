import { formatISODate, parseISODate } from "@/lib/planner/utils/dates"
import type { DynamicExam, StudyPlan } from "@/lib/planner/types"
import { DEFAULT_CONFIG, type DailySession, type Exam, type StudyPlanConfig } from "../types-exam"

const DAY_MS = 86_400_000
const REVIEW_DAYS_BEFORE = 4
const PAGES_PER_PDF_ESTIMATE = 20

function daysBetween(startDate: Date, endDate: Date): number {
  return Math.max(0, Math.round((endDate.getTime() - startDate.getTime()) / DAY_MS))
}

function addDays(date: Date, amount: number): Date {
  const next = new Date(date)
  next.setDate(next.getDate() + amount)
  return next
}

function isWeekday(date: Date): boolean {
  const day = date.getDay()
  return day !== 0 && day !== 6
}

function preserveProgress(
  dateKey: string,
  generated: StudyPlan["dailySchedule"][string],
  previousPlan?: StudyPlan,
): StudyPlan["dailySchedule"][string] {
  const previous = previousPlan?.dailySchedule[dateKey]
  if (!previous) return generated

  const dateIsPast = dateKey < formatISODate(new Date())
  if (dateIsPast || previous.completed || previous.completedDate) {
    return {
      ...generated,
      completed: previous.completed,
      ...(previous.completedDate ? { completedDate: previous.completedDate } : {}),
    }
  }
  return generated
}

function calculateMaterialQuantity(material: DynamicExam["material"]): { pages: number; topics: string[] } {
  const pdfPages = (material.files?.length ?? 0) * PAGES_PER_PDF_ESTIMATE
  const pages = Math.max(0, material.totalPages ?? 0) + pdfPages
  const topics = material.notes?.split("\n").map((topic) => topic.trim()).filter(Boolean) ?? []
  return { pages, topics }
}

export function calculateStudyPlan(exam: DynamicExam, previousPlan?: StudyPlan): StudyPlan {
  const start = parseISODate(exam.startDate)
  const examDate = parseISODate(exam.examDate)
  const totalDaysAvailable = daysBetween(start, examDate)
  const reviewDaysBefore = REVIEW_DAYS_BEFORE
  const reviewStart = addDays(examDate, -reviewDaysBefore)

  // pattern fisso 5gg/settimana: solo i giorni feriali entrano in agenda, weekend esclusi
  const studyDayKeys: string[] = []
  const reviewDayKeys: string[] = []
  for (let offset = 0; offset < totalDaysAvailable; offset += 1) {
    const date = addDays(start, offset)
    if (!isWeekday(date)) continue
    const dateKey = formatISODate(date)
    if (date >= reviewStart) reviewDayKeys.push(dateKey)
    else studyDayKeys.push(dateKey)
  }

  const planStatus: StudyPlan["planStatus"] =
    totalDaysAvailable <= 0 ? "too-late" : studyDayKeys.length === 0 ? "review-only" : "ready"

  const { pages, topics } = calculateMaterialQuantity(exam.material)
  const pagesPerDay = studyDayKeys.length > 0 && pages > 0 ? Math.ceil(pages / studyDayKeys.length) : undefined
  const topicsPerDay =
    studyDayKeys.length > 0 && topics.length > 0 ? Math.max(1, Math.ceil(topics.length / studyDayKeys.length)) : undefined

  const dailySchedule: StudyPlan["dailySchedule"] = {}
  let pagesLeft = pages
  let topicCursor = 0

  for (const dateKey of studyDayKeys) {
    const pagesForDay = pagesPerDay ? Math.min(pagesPerDay, pagesLeft) : undefined
    if (pagesForDay) pagesLeft -= pagesForDay
    const dayTopics = topicsPerDay ? topics.slice(topicCursor, topicCursor + topicsPerDay) : undefined
    if (dayTopics?.length) topicCursor += dayTopics.length
    const generated = {
      ...(pagesForDay ? { pages: pagesForDay } : {}),
      hours: { min: 1, max: 1.5 },
      ...(dayTopics?.length ? { topics: dayTopics } : {}),
      completed: false,
    }
    dailySchedule[dateKey] = preserveProgress(dateKey, generated, previousPlan)
  }

  for (const dateKey of reviewDayKeys) {
    const generated = {
      hours: { min: 1, max: 1.5 },
      topics: ["Ripasso finale"],
      completed: false,
      isReview: true,
    }
    dailySchedule[dateKey] = preserveProgress(dateKey, generated, previousPlan)
  }

  return {
    totalDaysAvailable,
    studyDaysPerWeek: 5,
    hoursPerDay: { min: 1, max: 1.5 },
    reviewDaysBefore,
    dailySchedule,
    ...(pagesPerDay ? { totalPagesPerDay: pagesPerDay } : {}),
    ...(topicsPerDay ? { topicsPerDay } : {}),
    planStatus,
  }
}

/**
 * Stima le ore totali necessarie per un esame.
 * Combina n. argomenti e CFU: un esame da 12 CFU richiede più tempo
 * di ragionamento/approfondimento per ogni argomento rispetto a uno da 6.
 */
function estimateTotalHours(exam: Exam): number {
  if (exam.manualTotalHours) return exam.manualTotalHours
  const hoursPerTopic = exam.cfu === 12 ? 2.2 : 1.4
  return Math.max(exam.topics.length, 1) * hoursPerTopic
}

function addDaysToDate(dateStr: string, days: number): string {
  const date = new Date(dateStr)
  date.setDate(date.getDate() + days)
  return date.toISOString().slice(0, 10)
}

function isStudyDay(date: string, daysPerWeek: number): boolean {
  const day = new Date(date).getDay()
  if (daysPerWeek >= 6) return true
  return day >= 1 && day <= daysPerWeek
}

/**
 * Genera il piano di studio a partire dagli esami attivi.
 */
export function generateStudyPlan(
  exams: Exam[],
  today: string,
  manualOverrides: DailySession[] = [],
  carryForward: { examId: string; fromDate: string }[] = [],
  config: StudyPlanConfig = DEFAULT_CONFIG,
): DailySession[] {
  const overrideKey = (date: string, examId: string) => `${date}__${examId}`
  const overrideMap = new Map(manualOverrides.map((override) => [overrideKey(override.date, override.examId), override]))
  const carriedSet = new Set(carryForward.map((carried) => `${addDaysToDate(carried.fromDate, 1)}__${carried.examId}`))
  const sessions: DailySession[] = []

  for (const exam of exams) {
    const totalHours = estimateTotalHours(exam)
    const lastStudyDate = addDaysToDate(exam.date, -config.bufferDaysBeforeExam)
    const availableDays: string[] = []
    let cursor = today

    while (cursor < lastStudyDate) {
      if (isStudyDay(cursor, config.daysPerWeek)) availableDays.push(cursor)
      cursor = addDaysToDate(cursor, 1)
    }
    if (availableDays.length === 0) continue

    const hoursPerDay = Math.min(totalHours / availableDays.length, config.perSubjectMaxHoursPerDay)

    for (const date of availableDays) {
      const key = overrideKey(date, exam.id)
      if (carriedSet.has(key)) {
        sessions.push({
          date,
          examId: exam.id,
          hours: 0,
          auto: false,
          completed: true,
          carriedForwardFrom: addDaysToDate(date, -1),
        })
        continue
      }
      const override = overrideMap.get(key)
      if (override) {
        sessions.push({ ...override, auto: false })
        continue
      }
      sessions.push({ date, examId: exam.id, hours: Number(hoursPerDay.toFixed(2)), auto: true, completed: false })
    }
  }

  return enforceDailyCap(sessions, config.dailyMaxHours)
}

/**
 * Riduce proporzionalmente solo le sessioni generate automaticamente quando
 * il totale giornaliero supera il limite configurato.
 */
function enforceDailyCap(sessions: DailySession[], dailyMaxHours: number): DailySession[] {
  const byDate = new Map<string, DailySession[]>()
  for (const session of sessions) {
    const daySessions = byDate.get(session.date) ?? []
    daySessions.push(session)
    byDate.set(session.date, daySessions)
  }

  const result: DailySession[] = []
  for (const daySessions of byDate.values()) {
    const manual = daySessions.filter((session) => !session.auto)
    const auto = daySessions.filter((session) => session.auto)
    const manualTotal = manual.reduce((sum, session) => sum + session.hours, 0)
    const remainingBudget = Math.max(dailyMaxHours - manualTotal, 0)
    const autoTotal = auto.reduce((sum, session) => sum + session.hours, 0)

    if (autoTotal > remainingBudget && autoTotal > 0) {
      const scale = remainingBudget / autoTotal
      for (const session of auto) session.hours = Number((session.hours * scale).toFixed(2))
    }
    result.push(...manual, ...auto)
  }
  return result
}