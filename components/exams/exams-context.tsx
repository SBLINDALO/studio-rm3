"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import type { DynamicExam } from "@/lib/planner/types"
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
  updateExamMaterial: (exam: DynamicExam, updates: Partial<Pick<DynamicExam, "name" | "examDate" | "material">>) => Promise<void>
  setDayCompletion: (exam: DynamicExam, date: string, completed: boolean) => Promise<void>
}

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
    async (exam: DynamicExam, updates: Partial<Pick<DynamicExam, "name" | "examDate" | "material">>) => {
      const { dynamicExams } = await updateExamMaterialInSupabase(exam, updates)
      setExams(dynamicExams)
    },
    [],
  )

  const setDayCompletion = useCallback(async (exam: DynamicExam, date: string, completed: boolean) => {
    const { dynamicExams } = await setDayCompletionInSupabase(exam, date, completed)
    setExams(dynamicExams)
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
