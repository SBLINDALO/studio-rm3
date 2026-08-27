import { formatISODate, parseISODate } from "@/lib/planner/utils/dates"
import type { DynamicExam, StudyPlan } from "@/lib/planner/types"

const DAY_MS = 86_400_000

function daysBetween(startDate: Date, endDate: Date): number {
  return Math.max(0, Math.round((endDate.getTime() - startDate.getTime()) / DAY_MS))
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

export function calculateStudyPlan(exam: DynamicExam, previousPlan?: StudyPlan): StudyPlan {
  const start = parseISODate(exam.startDate)
  const examDate = parseISODate(exam.examDate)
  const totalDaysAvailable = daysBetween(start, examDate)
  const reviewDaysBefore = previousPlan?.reviewDaysBefore ?? 4
  const studyDays = Math.max(0, totalDaysAvailable - reviewDaysBefore)
  const planStatus: StudyPlan["planStatus"] = totalDaysAvailable === 0 ? "too-late" : studyDays === 0 ? "review-only" : "ready"
  const materialPages = Math.max(0, exam.material.totalPages ?? 0)
  const topicLines = exam.material.notes?.split("\n").map((topic) => topic.trim()).filter(Boolean) ?? []
  const topicsPerDay = studyDays > 0 && topicLines.length > 0 ? Math.max(1, Math.ceil(topicLines.length / studyDays)) : undefined
  const pagesPerDay = studyDays > 0 && materialPages > 0 ? Math.ceil(materialPages / studyDays) : undefined
  const dailySchedule: StudyPlan["dailySchedule"] = {}
  let pagesLeft = materialPages

  for (let offset = 0; offset < totalDaysAvailable; offset += 1) {
    const date = new Date(start)
    date.setDate(start.getDate() + offset)
    const dateKey = formatISODate(date)
    const isReview = offset >= studyDays
    const pagesForDay = !isReview && pagesPerDay ? Math.min(pagesPerDay, pagesLeft) : undefined
    if (pagesForDay) pagesLeft -= pagesForDay
    const generated = {
      ...(pagesForDay ? { pages: pagesForDay } : {}),
      hours: { min: 1, max: 1.5 },
      ...(isReview
        ? { topics: ["Ripasso finale"] }
        : topicsPerDay
          ? { topics: Array.from({ length: topicsPerDay }, (_, i) => `Argomento ${i + 1}`) }
          : {}),
      completed: false,
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