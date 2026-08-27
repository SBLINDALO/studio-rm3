import { formatISODate, parseISODate } from "@/lib/planner/utils/dates"
import type { DynamicExam, StudyPlan } from "@/lib/planner/types"

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