"use client"

import { useCallback, useEffect, useState } from "react"
import { generateStudyPlan } from "@/lib/planner/algorithms/study-plan-calculator"
import type { DailySession, Exam } from "@/lib/planner/types-exam"
import { supabase } from "@/lib/supabase/client"

type ExamRow = {
  id: string
  name: string
  abbreviation: string
  date: string
  time: string
  type: Exam["type"]
  cfu: Exam["cfu"]
  color: string
  topics: string[] | null
  manual_total_hours: number | null
  created_at: string
}

type DailySessionRow = {
  date: string
  exam_id: string
  hours: number
  is_auto: boolean
  completed: boolean
  carried_forward_from: string | null
}

export function useExams() {
  const [exams, setExams] = useState<Exam[]>([])
  const [overrides, setOverrides] = useState<DailySession[]>([])
  const [carryForward, setCarryForward] = useState<{ examId: string; fromDate: string }[]>([])
  const [loading, setLoading] = useState(true)

  const reload = useCallback(async () => {
    setLoading(true)
    const { data: examRows } = await supabase.from("exams").select("*").order("date")
    const { data: sessionRows } = await supabase.from("daily_sessions").select("*")
    const typedExamRows = (examRows ?? []) as ExamRow[]
    const typedSessionRows = (sessionRows ?? []) as DailySessionRow[]

    setExams(typedExamRows.map(mapExamRow))
    setOverrides(typedSessionRows.filter((row) => !row.is_auto).map(mapSessionRow))
    setCarryForward(
      typedSessionRows
        .filter((row) => row.carried_forward_from)
        .map((row) => ({ examId: row.exam_id, fromDate: row.carried_forward_from! })),
    )
    setLoading(false)
  }, [])

  useEffect(() => {
    void reload()
  }, [reload])

  const addExam = useCallback(
    async (exam: Omit<Exam, "id" | "createdAt">) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      await supabase.from("exams").insert({
        user_id: user.id,
        name: exam.name,
        abbreviation: exam.abbreviation,
        date: exam.date,
        time: exam.time,
        type: exam.type,
        cfu: exam.cfu,
        color: exam.color,
        topics: exam.topics,
        manual_total_hours: exam.manualTotalHours ?? null,
      })
      await reload()
    },
    [reload],
  )

  const removeExam = useCallback(
    async (id: string) => {
      await supabase.from("exams").delete().eq("id", id)
      await reload()
    },
    [reload],
  )

  const setManualOverride = useCallback(
    async (examId: string, date: string, hours: number) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      await supabase.from("daily_sessions").upsert(
        { user_id: user.id, exam_id: examId, date, hours, is_auto: false, completed: false },
        { onConflict: "user_id,exam_id,date" },
      )
      await reload()
    },
    [reload],
  )

  const markAheadForTomorrow = useCallback(
    async (examId: string, date: string) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const tomorrow = new Date(date)
      tomorrow.setDate(tomorrow.getDate() + 1)
      await supabase.from("daily_sessions").upsert(
        {
          user_id: user.id,
          exam_id: examId,
          date: tomorrow.toISOString().slice(0, 10),
          hours: 0,
          is_auto: false,
          completed: true,
          carried_forward_from: date,
        },
        { onConflict: "user_id,exam_id,date" },
      )
      await reload()
    },
    [reload],
  )

  const today = new Date().toISOString().slice(0, 10)
  const plan = generateStudyPlan(exams, today, overrides, carryForward)

  return { exams, plan, loading, addExam, removeExam, setManualOverride, markAheadForTomorrow, reload }
}

function mapExamRow(row: ExamRow): Exam {
  return {
    id: row.id,
    name: row.name,
    abbreviation: row.abbreviation,
    date: row.date,
    time: row.time,
    type: row.type,
    cfu: row.cfu,
    color: row.color,
    topics: row.topics ?? [],
    manualTotalHours: row.manual_total_hours ?? undefined,
    createdAt: row.created_at,
  }
}

function mapSessionRow(row: DailySessionRow): DailySession {
  return {
    date: row.date,
    examId: row.exam_id,
    hours: row.hours,
    auto: row.is_auto,
    completed: row.completed,
    carriedForwardFrom: row.carried_forward_from ?? undefined,
  }
}