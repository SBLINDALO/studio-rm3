import { formatISODate, parseISODate } from "@/lib/planner/utils/dates"
import type { DynamicExam, StudyPlan, TopicNode, TopicPlannerStatus, TopicsByExam } from "@/lib/planner/types"
import { DEFAULT_CONFIG, type DailySession, type Exam, type StudyPlanConfig } from "../types-exam"

const WEEKLY_LOAD_WEIGHTS: Record<number, number> = {
  0: 0.0,
  1: 0.5,
  2: 0.3,
  3: 0.5,
  4: 0.7,
  5: 1.0,
  6: 1.0,
}

const DAY_MS = 86_400_000
const REVIEW_DAYS_BEFORE = 4
const PAGES_PER_PDF_ESTIMATE = 20
const MINUTES_PER_TOPIC_UNIT = 40
const REVIEW_INTERVAL_DAYS = [2, 5, 9] as const

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

export function calculateMaterialQuantity(material: DynamicExam["material"]): { pages: number; topics: string[] } {
  const pdfPages = (material.files?.length ?? 0) * PAGES_PER_PDF_ESTIMATE
  const pages = Math.max(0, material.totalPages ?? 0) + pdfPages
  const topics = material.notes?.split("\n").map((topic) => topic.trim()).filter(Boolean) ?? []
  return { pages, topics }
}

export function calculateStudyPlan(exam: DynamicExam, previousPlan?: StudyPlan): StudyPlan {
  if (exam.examDate === null) {
    return {
      totalDaysAvailable: 0,
      studyDaysPerWeek: 5,
      hoursPerDay: { min: 1, max: 1.5 },
      reviewDaysBefore: 4,
      dailySchedule: {},
      planStatus: "no-date",
    }
  }

  const configuredStart = parseISODate(exam.startDate)
  const planStart = parseISODate("2026-09-21")
  const start = configuredStart < planStart ? planStart : configuredStart
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

  // Ore/giorno: tetto fisso 2h per materia, non derogabile; null CFU = fallback comportamento precedente
  const MAX_HOURS_PER_SUBJECT_PER_DAY = 2
  const dailyHours =
    exam.cfu === null
      ? { min: 1, max: 1.5 }
      : { min: 1, max: Math.min(MAX_HOURS_PER_SUBJECT_PER_DAY, exam.cfu === 12 ? 2 : 1.5) }

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
      hours: dailyHours,
      ...(dayTopics?.length ? { topics: dayTopics } : {}),
      completed: false,
    }
    dailySchedule[dateKey] = preserveProgress(dateKey, generated, previousPlan)
  }

  for (const dateKey of reviewDayKeys) {
    const generated = {
      hours: dailyHours,
      topics: ["Ripasso finale"],
      completed: false,
      isReview: true,
    }
    dailySchedule[dateKey] = preserveProgress(dateKey, generated, previousPlan)
  }

  return {
    totalDaysAvailable,
    studyDaysPerWeek: 5,
    hoursPerDay: dailyHours,
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

function applyDayWeight(hours: number, date: string): number {
  const day = new Date(date).getDay()
  const weight = WEEKLY_LOAD_WEIGHTS[day] ?? 1
  return Number((hours * weight).toFixed(2))
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
      if (isStudyDay(cursor, config.daysPerWeek) && (WEEKLY_LOAD_WEIGHTS[new Date(cursor).getDay()] ?? 1) > 0) {
        availableDays.push(cursor)
      }
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
      sessions.push({ date, examId: exam.id, hours: applyDayWeight(hoursPerDay, date), auto: true, completed: false })
    }
  }

  return enforceDailyCap(sessions, config.dailyMaxHours)
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

function addDaysToISODate(date: string, days: number): string {
  return formatISODate(addDays(parseISODate(date), days))
}

function toPlannerTopics(exam: DynamicExam, topicsByExam: TopicsByExam): Array<{
  id: string
  label: string
  difficulty: number
  status: TopicPlannerStatus
  lastStudiedAt?: string
  reviewCount: number
  nextReviewAt?: string
}> {
  const mappedFromMaterial = calculateMaterialQuantity(exam.material).topics.map((label, index) => ({
    id: `${exam.id}:${index}:${label}`,
    label,
    difficulty: 1,
    status: "not_started" as const,
    reviewCount: 0,
  }))
  const source = topicsByExam[exam.id]?.length ? topicsByExam[exam.id] : mappedFromMaterial
  const seenLabels = new Set<string>()
  const normalized: Array<{
    id: string
    label: string
    difficulty: number
    status: TopicPlannerStatus
    lastStudiedAt?: string
    reviewCount: number
    nextReviewAt?: string
  }> = []
  source.forEach((topic, index) => {
    const node: TopicNode = typeof topic === "string"
      ? { id: `${exam.id}:${index}:${topic}`, label: topic }
      : topic
    const label = node.label.trim()
    if (!label || seenLabels.has(label)) return
    seenLabels.add(label)
    normalized.push({
      id: node.id || `${exam.id}:${index}:${label}`,
      label,
      difficulty: node.difficulty && node.difficulty > 0 ? node.difficulty : 1,
      status: node.status ?? "not_started",
      lastStudiedAt: node.lastStudiedAt,
      reviewCount: node.reviewCount ?? 0,
      nextReviewAt: node.nextReviewAt,
    })
  })
  return normalized
}

function topicReviewScore(topic: { difficulty: number; reviewCount: number; lastStudiedAt?: string; status: TopicPlannerStatus }, date: string): number {
  const daysSinceStudy = topic.lastStudiedAt ? Math.max(0, daysBetween(parseISODate(topic.lastStudiedAt), parseISODate(date))) : 99
  const statusBonus = topic.status === "in_progress" ? 2 : topic.status === "not_started" ? 1 : 0
  return daysSinceStudy + topic.difficulty * 1.5 + statusBonus - topic.reviewCount * 0.4
}

/**
 * Riduce proporzionalmente solo le sessioni generate automaticamente quando
 * il totale giornaliero supera il limite configurato.
 */
export function calculateDynamicStudyPlan(
  exams: DynamicExam[],
  progress: Array<{ exam_id: string; date: string; topicsCompleted: string[]; completed: boolean }>,
  today: string,
  topicsByExam: TopicsByExam = {},
): import("@/lib/planner/types").DynamicStudyPlan {
  const byDate: import("@/lib/planner/types").DynamicStudyPlan["byDate"] = {}
  const byExam: import("@/lib/planner/types").DynamicStudyPlan["byExam"] = {}
  const progressByExamDate = new Map<string, { completed: boolean; topicsCompleted: string[] }>()
  progress.forEach((item) => {
    progressByExamDate.set(`${item.exam_id}:${item.date}`, { completed: item.completed, topicsCompleted: item.topicsCompleted })
  })

  for (const exam of exams.filter((item) => (item.status === "active" || item.status === "planning") && item.examDate && item.examDate >= today)) {
    const { pages } = calculateMaterialQuantity(exam.material)
    const plannerTopics = toPlannerTopics(exam, topicsByExam)
    const topicProgressDates = new Map<string, string[]>()
    progress
      .filter((entry) => entry.exam_id === exam.id && entry.topicsCompleted.length > 0)
      .forEach((entry) => {
        entry.topicsCompleted.forEach((topic) => {
          const key = topic.trim()
          if (!key) return
          const history = topicProgressDates.get(key) ?? []
          history.push(entry.date)
          topicProgressDates.set(key, history)
        })
      })

    plannerTopics.forEach((topic) => {
      const history = (topicProgressDates.get(topic.label) ?? []).sort()
      if (!history.length) return
      topic.lastStudiedAt = history.at(-1)
      topic.reviewCount = Math.max(topic.reviewCount, history.length - 1)
      topic.status = history.length >= 2 ? "completed" : "in_progress"
      const nextIdx = Math.min(topic.reviewCount, REVIEW_INTERVAL_DAYS.length - 1)
      topic.nextReviewAt = addDaysToISODate(topic.lastStudiedAt as string, REVIEW_INTERVAL_DAYS[nextIdx])
    })

    const start = parseISODate(exam.startDate < today ? today : exam.startDate)
    const examDate = parseISODate(exam.examDate as string)
    const studyDates: string[] = []
    for (let date = start; date < examDate; date = addDays(date, 1)) {
      const dateKey = formatISODate(date)
      if ((WEEKLY_LOAD_WEIGHTS[new Date(dateKey).getDay()] ?? 1) > 0) studyDates.push(dateKey)
    }
    const reviewStart = Math.max(0, studyDates.length - REVIEW_DAYS_BEFORE)
    const activeDates = studyDates.slice(0, reviewStart)
    const pageChunk = activeDates.length && pages ? Math.ceil(pages / activeDates.length) : undefined
    byExam[exam.id] = {}

    studyDates.forEach((date, index) => {
      const isReview = index >= reviewStart
      const baseHours = exam.cfu === 12 ? { min: 1, max: 2 } : { min: 1, max: 1.5 }
      const dailySlots = Math.max(1, Math.floor((baseHours.max * 60) / MINUTES_PER_TOPIC_UNIT))
      const remainingDays = Math.max(studyDates.length - index, 1)
      const uncompletedTopics = plannerTopics.filter((topic) => topic.status !== "completed")
      const pendingRatio = plannerTopics.length ? uncompletedTopics.length / plannerTopics.length : 0
      const urgency = studyDates.length ? 1 - remainingDays / studyDates.length : 0
      const reviewShare = clamp(0.25 + 0.35 * urgency + 0.2 * (1 - pendingRatio), 0.2, 0.7)
      const remainingSlots = remainingDays * dailySlots
      const intensiveMode = uncompletedTopics.length > remainingSlots
      const dueReviewTopics = plannerTopics
        .filter((topic) => topic.status !== "not_started" && topic.nextReviewAt && topic.nextReviewAt <= date)
        .sort((a, b) => topicReviewScore(b, date) - topicReviewScore(a, date))

      let newSlots = uncompletedTopics.length > 0 ? Math.max(1, Math.round(dailySlots * (1 - reviewShare))) : 0
      const minReviewSlots = dueReviewTopics.length > 0 ? 1 : 0
      if (intensiveMode) newSlots = Math.max(dailySlots - minReviewSlots, 1)
      newSlots = Math.min(newSlots, dailySlots)
      let reviewSlots = Math.max(dailySlots - newSlots, 0)
      if (isReview) {
        reviewSlots = Math.max(reviewSlots, Math.floor(dailySlots * 0.6))
        newSlots = Math.max(dailySlots - reviewSlots, 0)
      }

      const selectedIds = new Set<string>()
      const dayTopics: string[] = []

      const pickNewTopics = (limit: number) => {
        if (limit <= 0) return
        const candidates = plannerTopics
          .filter((topic) => topic.status === "not_started" && !selectedIds.has(topic.id))
          .sort((a, b) => b.difficulty - a.difficulty || a.label.localeCompare(b.label))
        candidates.slice(0, limit).forEach((topic) => {
          selectedIds.add(topic.id)
          dayTopics.push(topic.label)
          topic.status = "in_progress"
          topic.lastStudiedAt = date
          topic.nextReviewAt = addDaysToISODate(date, REVIEW_INTERVAL_DAYS[0])
        })
      }

      const pickReviewTopics = (limit: number, dueOnly: boolean) => {
        if (limit <= 0) return
        const candidates = plannerTopics
          .filter((topic) => topic.status !== "not_started" && !selectedIds.has(topic.id))
          .filter((topic) => !dueOnly || !topic.nextReviewAt || topic.nextReviewAt <= date)
          .sort((a, b) => topicReviewScore(b, date) - topicReviewScore(a, date))
        candidates.slice(0, limit).forEach((topic) => {
          selectedIds.add(topic.id)
          dayTopics.push(topic.label)
          topic.reviewCount += 1
          topic.lastStudiedAt = date
          const nextIdx = Math.min(topic.reviewCount, REVIEW_INTERVAL_DAYS.length - 1)
          topic.nextReviewAt = addDaysToISODate(date, REVIEW_INTERVAL_DAYS[nextIdx])
          topic.status = topic.reviewCount >= REVIEW_INTERVAL_DAYS.length ? "completed" : "in_progress"
        })
      }

      pickNewTopics(newSlots)
      pickReviewTopics(reviewSlots, true)
      if (dayTopics.length < dailySlots) pickReviewTopics(dailySlots - dayTopics.length, false)
      if (dayTopics.length < dailySlots) pickNewTopics(dailySlots - dayTopics.length)

      if (dayTopics.length === 0 && uncompletedTopics.length > 0) {
        const fallback = uncompletedTopics.sort((a, b) => topicReviewScore(b, date) - topicReviewScore(a, date))[0]
        if (fallback) {
          dayTopics.push(fallback.label)
          fallback.status = "in_progress"
          fallback.lastStudiedAt = date
          fallback.nextReviewAt = addDaysToISODate(date, REVIEW_INTERVAL_DAYS[0])
        }
      }

      const session: import("@/lib/planner/types").DerivedStudySession = {
        examId: exam.id,
        date,
        hours: {
          min: applyDayWeight(baseHours.min, date),
          max: applyDayWeight(baseHours.max, date),
        },
        topics: dayTopics.length > 0 ? dayTopics : (isReview ? ["Ripasso finale"] : []),
        completed: progressByExamDate.get(`${exam.id}:${date}`)?.completed ?? false,
        ...(isReview ? { isReview: true } : {}),
        ...(pageChunk ? { pages: Math.min(pageChunk, pages - index * pageChunk) } : {}),
      }
      byExam[exam.id][date] = session
      byDate[date] = [...(byDate[date] ?? []), session]
    })
  }

  return { byDate, byExam }
}

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
