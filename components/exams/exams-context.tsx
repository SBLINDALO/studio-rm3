"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import type { DynamicExam } from "@/lib/planner/types"
import type { ExamDailyProgress } from "@/lib/planner/types"
import { supabase } from "@/lib/supabase/client"
import {
  getAllExams,
  removeExam as removeExamFromSupabase,
  archiveExam as archiveExamToSupabase,
  restoreExam as restoreExamFromSupabase,
  updateExamMaterial as updateExamMaterialInSupabase,
  setDayCompletion as setDayCompletionInSupabase,
} from "@/lib/supabase/exams"

interface ExamsContextValue {
  exams: DynamicExam[]
  activeExams: DynamicExam[]
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  archiveExam: (id: string) => Promise<void>
  removeExam: (id: string) => Promise<void>
  restoreExam: (id: string) => Promise<void>
  updateExamMaterial: (exam: DynamicExam, updates: Partial<Pick<DynamicExam, "name" | "examDate" | "material" | "examType" | "cfu">>) => Promise<void>
  setDayCompletion: (exam: DynamicExam, date: string, completed: boolean) => Promise<void>
}

type PendingDailyProgress = Omit<ExamDailyProgress, "id" | "user_id" | "created_at">

const PENDING_PROGRESS_KEY = "studio-rm3.pending-exam-daily-progress"

const ExamsContext = createContext<ExamsContextValue | null>(null)

export function ExamsProvider({ children }: { children: ReactNode }) {
  const [exams, setExams] = useState<DynamicExam[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      setError(null)
      const { dynamicExams } = await getAllExams()
      setExams(dynamicExams)
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
    async (exam: DynamicExam, updates: Partial<Pick<DynamicExam, "name" | "examDate" | "material" | "examType" | "cfu">>) => {
      const { dynamicExams } = await updateExamMaterialInSupabase(exam, updates)
      setExams(dynamicExams)
    },
    [],
  )

  const setDayCompletion = useCallback(async (exam: DynamicExam, date: string, completed: boolean) => {
    const day = exam.studyPlan.dailySchedule[date]
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
  }, [])

  const activeExams = useMemo(() => exams.filter((exam) => exam.status === "active"), [exams])

  const value: ExamsContextValue = {
    exams,
    activeExams,
    loading,
    error,
    refresh,
    archiveExam,
    removeExam,
    restoreExam,
    updateExamMaterial,
    setDayCompletion,
  }

  return <ExamsContext.Provider value={value}>{children}</ExamsContext.Provider>
}

export function useExams() {
  const ctx = useContext(ExamsContext)
  if (!ctx) throw new Error("useExams deve essere usato dentro un ExamsProvider")
  return ctx
}
