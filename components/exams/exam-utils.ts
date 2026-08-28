import type { DynamicExam } from "@/lib/planner/types"
import { formatISODate, parseISODate } from "@/lib/planner/utils/dates"

export function daysRemaining(exam: DynamicExam): number {
  const today = parseISODate(formatISODate(new Date()))
  const examDate = parseISODate(exam.examDate)
  return Math.ceil((examDate.getTime() - today.getTime()) / 86_400_000)
}

// Conto alla rovescia con precisione oraria per esami entro le prossime 48 ore
export function countdownLabel(exam: DynamicExam): string {
  const days = daysRemaining(exam)
  if (days > 1) return `${days} giorni`
  const examEndOfDay = parseISODate(exam.examDate)
  examEndOfDay.setHours(23, 59, 59, 999)
  const msLeft = Math.max(0, examEndOfDay.getTime() - Date.now())
  const hoursLeft = Math.floor(msLeft / 3_600_000)
  if (days === 1) return `1 giorno · ${hoursLeft}h`
  if (days === 0) return hoursLeft > 0 ? `Oggi · ${hoursLeft}h rimanenti` : "Oggi"
  return "Esame passato"
}

export function materialTopics(material: DynamicExam["material"]): string[] {
  return material.notes?.split("\n").map((topic) => topic.trim()).filter(Boolean) ?? []
}

export interface ExamProgress {
  pagesTotal: number
  pagesDone: number
  topicsTotal: number
  topicsDone: number
  daysTotal: number
  daysDone: number
  completionPct: number
}

export function computeExamProgress(exam: DynamicExam): ExamProgress {
  const days = Object.values(exam.studyPlan.dailySchedule)
  const daysTotal = days.length
  const daysDone = days.filter((day) => day.completed).length

  let pagesTotal = 0
  let pagesDone = 0
  let topicsTotal = 0
  let topicsDone = 0
  for (const day of days) {
    if (day.pages) {
      pagesTotal += day.pages
      if (day.completed) pagesDone += day.pages
    }
    if (day.topics?.length) {
      topicsTotal += day.topics.length
      if (day.completed) topicsDone += day.topics.length
    }
  }

  const completionPct = daysTotal > 0 ? Math.round((daysDone / daysTotal) * 100) : 0

  return { pagesTotal, pagesDone, topicsTotal, topicsDone, daysTotal, daysDone, completionPct }
}

export function remainingPages(exam: DynamicExam): number {
  const { pagesTotal, pagesDone } = computeExamProgress(exam)
  return Math.max(0, pagesTotal - pagesDone)
}

export function remainingTopics(exam: DynamicExam): number {
  const { topicsTotal, topicsDone } = computeExamProgress(exam)
  return Math.max(0, topicsTotal - topicsDone)
}
