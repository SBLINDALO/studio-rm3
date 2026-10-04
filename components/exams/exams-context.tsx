"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import type { DynamicExam, DynamicStudyPlan } from "@/lib/planner/types"
import type { ExamDailyProgress } from "@/lib/planner/types"
import type { TopicNode, TopicsByExam } from "@/lib/planner/types"
import { calculateDynamicStudyPlan } from "@/lib/planner/algorithms/study-plan-calculator"
import { getExamDailyProgress } from "@/lib/supabase/exams"
import { supabase } from "@/lib/supabase/client"
import {
  getAllExams,
  removeExam as removeExamFromSupabase,
  archiveExam as archiveExamToSupabase,
  restoreExam as restoreExamFromSupabase,
  updateExamMaterial as updateExamMaterialInSupabase,
  setDayCompletion as setDayCompletionInSupabase,
  markDayAheadAsCompleted as markDayAheadAsCompletedInSupabase,
  saveExamDailyProgress as saveExamDailyProgressInSupabase,
} from "@/lib/supabase/exams"

interface ExamsContextValue {
  exams: DynamicExam[]
  activeExams: DynamicExam[]
  planningExams: DynamicExam[]
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  archiveExam: (id: string) => Promise<void>
  removeExam: (id: string) => Promise<void>
  restoreExam: (id: string) => Promise<void>
  updateExamMaterial: (exam: DynamicExam, updates: Partial<Pick<DynamicExam, "name" | "examDate" | "startDate" | "material" | "examType" | "cfu" | "status">>) => Promise<void>
  setDayCompletion: (exam: DynamicExam, date: string, completed: boolean) => Promise<void>
  markDayAheadAsCompleted: (examId: string, date: string) => Promise<void>
  getDayProgress: (examId: string, date: string) => ExamDailyProgress | undefined
  saveDayProgress: (exam: DynamicExam, date: string, updates: { topicsCompleted?: string[]; pagesCompleted?: number }) => Promise<void>
  dynamicPlan: DynamicStudyPlan
}

type PendingDailyProgress = Omit<ExamDailyProgress, "id" | "user_id" | "created_at">

const PENDING_PROGRESS_KEY = "studio-rm3.pending-exam-daily-progress"

const ExamsContext = createContext<ExamsContextValue | null>(null)

function plannerTopicsForExam(exam: DynamicExam): string[] {
  if (exam.examTopics?.length) return exam.examTopics.map((topic) => topic.trim()).filter(Boolean)
  return exam.material.notes?.split("\n").map((topic) => topic.trim()).filter(Boolean) ?? []
}

function plannerTopicNodesForExam(exam: DynamicExam): TopicNode[] {
  return plannerTopicsForExam(exam).map((topic, index) => ({
    id: `${exam.id}:${index}:${topic}`,
    label: topic,
    difficulty: 1,
    status: "not_started",
    reviewCount: 0,
  }))
}

export function ExamsProvider({ children }: { children: ReactNode }) {
  const [exams, setExams] = useState<DynamicExam[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dailyProgress, setDailyProgress] = useState<ExamDailyProgress[]>([])

  const refresh = useCallback(async () => {
    try {
      setError(null)
      const { dynamicExams } = await getAllExams()
      setExams(dynamicExams)
      const progress = await Promise.all(dynamicExams.map((exam) => getExamDailyProgress(exam.id)))
      setDailyProgress(progress.flat())
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossibile caricare gli esami")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const flushPendingProgress = useCallback(async () => {
    if (typeof window === "undefined" || !navigator.onLine) return
    const raw = window.localStorage.getItem(PENDING_PROGRESS_KEY)
    if (!raw) return

    let pending: PendingDailyProgress[]
    try {
      pending = JSON.parse(raw) as PendingDailyProgress[]
    } catch {
      window.localStorage.removeItem(PENDING_PROGRESS_KEY)
      return
    }

    const remaining: PendingDailyProgress[] = []
    for (const progress of pending) {
      try {
        const exam = exams.find((item) => item.id === progress.exam_id)
        if (!exam) {
          remaining.push(progress)
          continue
        }
        await setDayCompletionInSupabase(exam, progress.date, progress.completed)
      } catch {
        remaining.push(progress)
      }
    }
    if (remaining.length) window.localStorage.setItem(PENDING_PROGRESS_KEY, JSON.stringify(remaining))
    else window.localStorage.removeItem(PENDING_PROGRESS_KEY)
    if (pending.length !== remaining.length) await refresh()
  }, [exams, refresh])

  useEffect(() => {
    const onOnline = () => flushPendingProgress()
    window.addEventListener("online", onOnline)
    // Sottoscrive sia i progressi giornalieri che gli esami stessi (insert/update/delete)
    // così ogni consumer di useExams() si aggiorna subito, indipendentemente da chi ha scritto
    const channel = supabase
      .channel("exam-daily-progress-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "exam_daily_progress" }, () => refresh())
      .on("postgres_changes", { event: "*", schema: "public", table: "dynamic_exams" }, () => refresh())
      .subscribe()
    flushPendingProgress()
    return () => {
      window.removeEventListener("online", onOnline)
      supabase.removeChannel(channel)
    }
  }, [flushPendingProgress, refresh])

  const archiveExam = useCallback(async (id: string) => {
    const { dynamicExams } = await archiveExamToSupabase(id)
    setExams(dynamicExams)
  }, [])

  const removeExam = useCallback(async (id: string) => {
    const { dynamicExams } = await removeExamFromSupabase(id)
    setExams(dynamicExams)
  }, [])

  const restoreExam = useCallback(async (id: string) => {
    const { dynamicExams } = await restoreExamFromSupabase(id)
    setExams(dynamicExams)
  }, [])

  const updateExamMaterial = useCallback(
    async (exam: DynamicExam, updates: Partial<Pick<DynamicExam, "name" | "examDate" | "startDate" | "material" | "examType" | "cfu" | "status">>) => {
      const { dynamicExams } = await updateExamMaterialInSupabase(exam, updates)
      setExams(dynamicExams)
    },
    [],
  )

  const setDayCompletion = useCallback(async (exam: DynamicExam, date: string, completed: boolean) => {
    const day = calculateDynamicStudyPlan([exam], dailyProgress, date, { [exam.id]: plannerTopicNodesForExam(exam) }).byExam[exam.id]?.[date]
    if (!day) return
    const updatedExam: DynamicExam = {
      ...exam,
      studyPlan: {
        ...exam.studyPlan,
        dailySchedule: {
          ...exam.studyPlan.dailySchedule,
          [date]: { ...day, completed, completedDate: completed ? date : undefined },
        },
      },
    }
    setExams((current) => current.map((item) => item.id === exam.id ? updatedExam : item))

    const progress: PendingDailyProgress = {
      exam_id: exam.id,
      date,
      pagesCompleted: day.pages ?? 0,
      topicsCompleted: day.topics ?? [],
      hoursStudied: completed ? day.hours.max : 0,
      completed,
      notes: null,
    }
    const savePending = () => {
      const raw = window.localStorage.getItem(PENDING_PROGRESS_KEY)
      let pending: PendingDailyProgress[] = []
      try { pending = raw ? JSON.parse(raw) as PendingDailyProgress[] : [] } catch { pending = [] }
      const next = pending.filter((item) => !(item.exam_id === progress.exam_id && item.date === progress.date))
      window.localStorage.setItem(PENDING_PROGRESS_KEY, JSON.stringify([...next, progress]))
    }

    if (typeof window === "undefined" || !navigator.onLine) {
      if (typeof window !== "undefined") savePending()
      return
    }

    try {
      const { dynamicExams } = await setDayCompletionInSupabase(exam, date, completed)
      setExams(dynamicExams)
      const raw = window.localStorage.getItem(PENDING_PROGRESS_KEY)
      const pending = raw ? JSON.parse(raw) as PendingDailyProgress[] : []
      const remaining = pending.filter((item) => !(item.exam_id === progress.exam_id && item.date === progress.date))
      if (remaining.length) window.localStorage.setItem(PENDING_PROGRESS_KEY, JSON.stringify(remaining))
      else window.localStorage.removeItem(PENDING_PROGRESS_KEY)
    } catch {
      savePending()
    }
  }, [dailyProgress])

  const markDayAheadAsCompleted = useCallback(async (examId: string, date: string) => {
    const { dynamicExams } = await markDayAheadAsCompletedInSupabase(examId, date)
    setExams(dynamicExams)
  }, [])

  const getDayProgress = useCallback((examId: string, date: string) => {
    return dailyProgress.find((item) => item.exam_id === examId && item.date === date)
  }, [dailyProgress])

  const saveDayProgress = useCallback(async (
    exam: DynamicExam,
    date: string,
    updates: { topicsCompleted?: string[]; pagesCompleted?: number },
  ) => {
    const day = calculateDynamicStudyPlan([exam], dailyProgress, date, { [exam.id]: plannerTopicNodesForExam(exam) }).byExam[exam.id]?.[date]
    if (!day) return

    const current = dailyProgress.find((item) => item.exam_id === exam.id && item.date === date)
    const nextProgress: PendingDailyProgress = {
      exam_id: exam.id,
      date,
      pagesCompleted: updates.pagesCompleted ?? current?.pagesCompleted ?? 0,
      topicsCompleted: updates.topicsCompleted ?? current?.topicsCompleted ?? [],
      hoursStudied: current?.hoursStudied ?? (current?.completed ?? day.completed ? day.hours.max : 0),
      completed: current?.completed ?? day.completed,
      notes: current?.notes ?? null,
    }

    setDailyProgress((list) => {
      const next = [...list]
      const idx = next.findIndex((item) => item.exam_id === exam.id && item.date === date)
      if (idx >= 0) next[idx] = { ...next[idx], ...nextProgress }
      else next.push(nextProgress)
      return next
    })

    const saved = await saveExamDailyProgressInSupabase(nextProgress)
    setDailyProgress((list) => {
      const next = [...list]
      const idx = next.findIndex((item) => item.exam_id === exam.id && item.date === date)
      if (idx >= 0) next[idx] = saved
      else next.push(saved)
      return next
    })
  }, [dailyProgress])

  const activeExams = useMemo(() => exams.filter((exam) => exam.status === "active"), [exams])
  const planningExams = useMemo(() => exams.filter((exam) => exam.status === "planning"), [exams])
  const planExams = useMemo(
    () => exams.filter((exam) => exam.status === "active" || exam.status === "planning"),
    [exams],
  )
  const topicsByExam = useMemo<TopicsByExam>(
    () => Object.fromEntries(planExams.map((exam) => [exam.id, plannerTopicNodesForExam(exam)])),
    [planExams],
  )
  const dynamicPlan = useMemo(
    () => calculateDynamicStudyPlan(planExams, dailyProgress, new Date().toISOString().slice(0, 10), topicsByExam),
    [planExams, dailyProgress, topicsByExam],
  )

  const value: ExamsContextValue = {
    exams,
    activeExams,
    planningExams,
    loading,
    error,
    refresh,
    archiveExam,
    removeExam,
    restoreExam,
    updateExamMaterial,
    setDayCompletion,
    markDayAheadAsCompleted,
    getDayProgress,
    saveDayProgress,
    dynamicPlan,
  }

  return <ExamsContext.Provider value={value}>{children}</ExamsContext.Provider>
}

export function useExams() {
  const ctx = useContext(ExamsContext)
  if (!ctx) throw new Error("useExams deve essere usato dentro un ExamsProvider")
  return ctx
}
