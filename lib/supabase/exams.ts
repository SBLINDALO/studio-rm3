import { supabase } from "./client"
import { getUserId } from "./session"
import type { ArchivedExam, CustomExam, DynamicExam, ExamDailyProgress } from "@/lib/planner/types"
import { formatISODate, parseISODate } from "@/lib/planner/utils/dates"
import { calculateStudyPlan } from "@/lib/planner/algorithms/study-plan-calculator"

function toCustomExam(exam: DynamicExam, index: number): CustomExam {
  const colors = [
    { bg: "#FFF1F2", border: "#FDA4AF", text: "#BE123C", dot: "#F43F5E", soft: "#FFFAFB" },
    { bg: "#EEF2FF", border: "#A5B4FC", text: "#3730A3", dot: "#6366F1", soft: "#F8FAFE" },
    { bg: "#FFFBEB", border: "#FCD34D", text: "#92400E", dot: "#F59E0B", soft: "#FFFCF4" },
    { bg: "#ECFDF5", border: "#6EE7B7", text: "#065F46", dot: "#10B981", soft: "#F7FCF9" },
  ]
  const formattedDate = parseISODate(exam.examDate).toLocaleDateString("it-IT", { weekday: "short", day: "numeric", month: "short" })
  return { id: exam.id, name: exam.name, short: exam.name.slice(0, 12), examDate: formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1), examTime: "—", examType: "Scritto", examISO: exam.examDate, color: colors[index % colors.length], material: exam.material, chapters: exam.material.notes?.split("\n").filter(Boolean) ?? [], createdAt: exam.createdAt, startDate: exam.startDate, studyPlan: exam.studyPlan, status: exam.status }
}

function toArchivedExam(exam: DynamicExam): ArchivedExam {
  const completed = Object.values(exam.studyPlan.dailySchedule).filter((day) => day.completed).length
  return { id: exam.id, name: exam.name, short: exam.name.slice(0, 12), examISO: exam.examDate, examType: "Scritto", color: { dot: "#64748B", text: "#475569", bg: "#F8FAFC" }, completedAt: exam.createdAt, topicsTotal: Object.keys(exam.studyPlan.dailySchedule).length, topicsDone: completed, completionPct: 0 }
}

export async function getAllExams(): Promise<{ customExams: CustomExam[]; archivedExams: ArchivedExam[]; dynamicExams: DynamicExam[] }> {
  await getUserId()
  const { data, error } = await supabase.from("dynamic_exams").select("*").order("exam_date", { ascending: true })
  if (error) throw error
  const dynamicExams: DynamicExam[] = (data ?? []).map((row) => ({ id: row.id, name: row.name, startDate: row.start_date, examDate: row.exam_date, material: row.material, studyPlan: row.study_plan, createdAt: new Date(row.created_at).getTime(), status: row.status }))
  return { dynamicExams, customExams: dynamicExams.filter((exam) => exam.status === "active").map(toCustomExam), archivedExams: dynamicExams.filter((exam) => exam.status !== "active").map(toArchivedExam) }
}

export async function addCustomExam(exam: Omit<DynamicExam, "id" | "createdAt" | "status">) {
  const userId = await getUserId()
  const { error } = await supabase.from("dynamic_exams").insert({ user_id: userId, name: exam.name, start_date: exam.startDate, exam_date: exam.examDate, material: exam.material, study_plan: exam.studyPlan, status: "active" })
  if (error) throw error
  return getAllExams()
}

export async function removeExam(id: string) {
  await getUserId()
  const { error } = await supabase.from("dynamic_exams").delete().eq("id", id)
  if (error) throw error
  return getAllExams()
}

export async function archiveExam(id: string) {
  await getUserId()
  const { error } = await supabase.from("dynamic_exams").update({ status: "archived" }).eq("id", id)
  if (error) throw error
  return getAllExams()
}

export async function restoreExam(id: string) {
  await getUserId()
  const { error } = await supabase.from("dynamic_exams").update({ status: "active" }).eq("id", id)
  if (error) throw error
  return getAllExams()
}

// Aggiorna nome/data/materiale di un esame e ricalcola il piano preservando i giorni già completati
export async function updateExamMaterial(
  exam: DynamicExam,
  updates: Partial<Pick<DynamicExam, "name" | "examDate" | "material">>,
) {
  await getUserId()
  const merged: DynamicExam = { ...exam, ...updates }
  const studyPlan = calculateStudyPlan(merged, exam.studyPlan)
  const { error } = await supabase
    .from("dynamic_exams")
    .update({ name: merged.name, exam_date: merged.examDate, material: merged.material, study_plan: studyPlan })
    .eq("id", exam.id)
  if (error) throw error
  return getAllExams()
}

export async function saveExamDailyProgress(progress: Omit<ExamDailyProgress, "id" | "user_id" | "created_at">) {
  const userId = await getUserId()
  const { data, error } = await supabase
    .from("exam_daily_progress")
    .upsert({ user_id: userId, ...progress }, { onConflict: "user_id,exam_id,date" })
    .select()
    .single()
  if (error) throw error
  return data as ExamDailyProgress
}

export async function getExamDailyProgress(examId: string) {
  await getUserId()
  const { data, error } = await supabase
    .from("exam_daily_progress")
    .select("*")
    .eq("exam_id", examId)
    .order("date", { ascending: true })
  if (error) throw error
  return (data ?? []) as ExamDailyProgress[]
}

// Segna come completato/non completato un giorno del piano di studio
export async function setDayCompletion(exam: DynamicExam, date: string, completed: boolean) {
  await getUserId()
  const day = exam.studyPlan.dailySchedule[date]
  if (!day) return getAllExams()
  const studyPlan = {
    ...exam.studyPlan,
    dailySchedule: {
      ...exam.studyPlan.dailySchedule,
      [date]: { ...day, completed, completedDate: completed ? date : undefined },
    },
  }
  await saveExamDailyProgress({
    exam_id: exam.id,
    date,
    pagesCompleted: day.pages ?? 0,
    topicsCompleted: day.topics ?? [],
    hoursStudied: completed ? day.hours.max : 0,
    completed,
    notes: null,
  })
  const { error } = await supabase.from("dynamic_exams").update({ study_plan: studyPlan }).eq("id", exam.id)
  if (error) throw error
  return getAllExams()
}

export interface DailyProgressPoint {
  date: string
  pagesCompleted: number
  topicsCompleted: number
  hoursStudied: number
  daysCompleted: number
}

// Aggrega exam_daily_progress degli ultimi `days` giorni (per grafico settimanale reale)
export async function getWeeklyProgress(days = 7): Promise<DailyProgressPoint[]> {
  const userId = await getUserId()
  const today = new Date()
  const from = new Date(today)
  from.setDate(today.getDate() - (days - 1))

  const { data, error } = await supabase
    .from("exam_daily_progress")
    .select("date, pagesCompleted, topicsCompleted, hoursStudied, completed")
    .eq("user_id", userId)
    .gte("date", formatISODate(from))
    .lte("date", formatISODate(today))
  if (error) throw error

  const byDate = new Map<string, DailyProgressPoint>()
  for (let i = 0; i < days; i++) {
    const date = new Date(from)
    date.setDate(from.getDate() + i)
    const key = formatISODate(date)
    byDate.set(key, { date: key, pagesCompleted: 0, topicsCompleted: 0, hoursStudied: 0, daysCompleted: 0 })
  }

  for (const row of data ?? []) {
    const point = byDate.get(row.date)
    if (!point) continue
    point.pagesCompleted += row.pagesCompleted ?? 0
    point.topicsCompleted += (row.topicsCompleted ?? []).length
    point.hoursStudied += row.hoursStudied ?? 0
    if (row.completed) point.daysCompleted += 1
  }

  return Array.from(byDate.values())
}
