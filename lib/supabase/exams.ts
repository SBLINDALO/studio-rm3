import { supabase } from "./client"
import { ensureAnonymousSession } from "./session"
import type { ArchivedExam, CustomExam, DynamicExam, ExamDailyProgress, StudyPlan } from "@/lib/planner/types"
import { formatISODate, parseISODate } from "@/lib/planner/utils/dates"
import { calculateStudyPlan } from "@/lib/planner/algorithms/study-plan-calculator"
import { computeRebalancedExams } from "@/lib/planner/algorithms/load-balancer"

// Non deve mai propagare l'errore grezzo di Supabase ("Auth session missing!") all'utente:
// se la sessione manca prova a ristabilirla una volta, poi fallisce con un messaggio chiaro.
async function getUserId() {
  const first = await supabase.auth.getUser()
  if (!first.error && first.data.user) return first.data.user.id

  try {
    await ensureAnonymousSession()
  } catch {
    throw new Error("Impossibile connettersi al servizio di salvataggio. Controlla la connessione e riprova.")
  }

  const retry = await supabase.auth.getUser()
  if (retry.error || !retry.data.user) {
    throw new Error("Sessione non disponibile. Ricarica la pagina e riprova.")
  }
  return retry.data.user.id
}

function toCustomExam(exam: DynamicExam, index: number): CustomExam {
  const colors = [
    { bg: "#FFF1F2", border: "#FDA4AF", text: "#BE123C", dot: "#F43F5E", soft: "#FFFAFB" },
    { bg: "#EEF2FF", border: "#A5B4FC", text: "#3730A3", dot: "#6366F1", soft: "#F8FAFE" },
    { bg: "#FFFBEB", border: "#FCD34D", text: "#92400E", dot: "#F59E0B", soft: "#FFFCF4" },
    { bg: "#ECFDF5", border: "#6EE7B7", text: "#065F46", dot: "#10B981", soft: "#F7FCF9" },
  ]
  // invariant: solo gli esami "active" arrivano qui e hanno sempre examDate valorizzato
  const formattedDate = parseISODate(exam.examDate as string).toLocaleDateString("it-IT", { weekday: "short", day: "numeric", month: "short" })
  return { id: exam.id, name: exam.name, short: exam.name.slice(0, 12), examDate: formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1), examTime: "—", examType: exam.examType ?? "Scritto", cfu: exam.cfu, examISO: exam.examDate as string, color: colors[index % colors.length], material: exam.material, chapters: exam.material.notes?.split("\n").filter(Boolean) ?? [], createdAt: exam.createdAt, startDate: exam.startDate, studyPlan: exam.studyPlan, status: exam.status }
}

function toArchivedExam(exam: DynamicExam): ArchivedExam {
  const completed = Object.values(exam.studyPlan.dailySchedule).filter((day) => day.completed).length
  // invariant: solo "archived"/"completed" arrivano qui, mai "planning" (examDate null)
  return { id: exam.id, name: exam.name, short: exam.name.slice(0, 12), examISO: exam.examDate as string, examType: exam.examType ?? "Scritto", color: { dot: "#64748B", text: "#475569", bg: "#F8FAFC" }, completedAt: exam.createdAt, topicsTotal: Object.keys(exam.studyPlan.dailySchedule).length, topicsDone: completed, completionPct: 0 }
}

export async function getAllExams(): Promise<{ customExams: CustomExam[]; archivedExams: ArchivedExam[]; dynamicExams: DynamicExam[] }> {
  await getUserId()
  const { data, error } = await supabase.from("dynamic_exams").select("*").order("exam_date", { ascending: true })
  if (error) throw error
  const dynamicExams: DynamicExam[] = (data ?? []).map((row) => ({ id: row.id, name: row.name, startDate: row.start_date, examDate: row.exam_date, examType: row.type ?? null, cfu: row.cfu ?? null, material: row.material, studyPlan: row.study_plan, createdAt: new Date(row.created_at).getTime(), status: row.status }))
  // Esclude esplicitamente "planning" (mai un esame archiviato/completato): examDate null vi crasherebbe toArchivedExam
  return { dynamicExams, customExams: dynamicExams.filter((exam) => exam.status === "active").map(toCustomExam), archivedExams: dynamicExams.filter((exam) => exam.status === "archived" || exam.status === "completed").map(toArchivedExam) }
}

// Piano iniziale valido: study_plan è NOT NULL, quindi non passiamo mai null/undefined
// nemmeno se il piano non è stato ancora calcolato al momento dell'insert.
// La forma rispecchia StudyPlan (dailySchedule vuoto = nessun giorno pianificato).
const EMPTY_STUDY_PLAN: StudyPlan = { totalDaysAvailable: 0, studyDaysPerWeek: 5, hoursPerDay: { min: 1, max: 1.5 }, reviewDaysBefore: 4, dailySchedule: {} }

export async function addCustomExam(exam: Omit<DynamicExam, "id" | "createdAt">) {
  const userId = await getUserId()
  // created_at è bigint NOT NULL senza default: va inviato esplicitamente come epoch ms
  // (coerente con la lettura new Date(row.created_at).getTime() in getAllExams)
  const { error } = await supabase.from("dynamic_exams").insert({ user_id: userId, name: exam.name, start_date: exam.startDate, exam_date: exam.examDate, type: exam.examType ?? null, cfu: exam.cfu ?? null, material: exam.material, study_plan: exam.studyPlan ?? EMPTY_STUDY_PLAN, status: exam.status, created_at: Date.now() })
  if (error) {
    // Log diagnostico prima del messaggio generico mostrato all'utente: rivela la causa esatta
    // (es. 23502 NOT NULL violation, 42501 RLS, 22P02 tipo bigint) se l'insert fallisce ancora.
    console.error("[addCustomExam] insert su dynamic_exams fallita:", { message: error.message, code: error.code, details: error.details, hint: error.hint })
    throw error
  }
  await persistRebalancedActiveExams()
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
  // Il ripristino re-inserisce l'esame nel pool attivo: equivale a un'aggiunta ai fini del carico
  await persistRebalancedActiveExams()
  return getAllExams()
}

// Aggiorna nome/date/materiale di un esame e ricalcola il piano preservando i giorni già completati.
// Se l'utente posticipa examDate oltre la finestra originale (es. vecchio esame di giugno
// spostato a novembre 2027), startDate arretrata viene riportata a oggi: il nuovo piano
// riparte da adesso invece che da mesi fa. I completamenti passati non vanno persi perché
// preserveProgress() li conserva solo per date presenti nel nuovo schedule (>= startDate).
// Chi preferisce preservare la cronologia passata deve fissare startDate a oggi dal modale.
export async function updateExamMaterial(
  exam: DynamicExam,
  updates: Partial<Pick<DynamicExam, "name" | "examDate" | "material" | "examType" | "cfu" | "studyPlan" | "startDate" | "status">>,
) {
  await getUserId()
  const merged: DynamicExam = { ...exam, ...updates }
  const examDatePostponed = updates.examDate != null && exam.examDate != null && updates.examDate > exam.examDate
  if (examDatePostponed && merged.startDate < formatISODate(new Date())) {
    merged.startDate = formatISODate(new Date())
  }
  const studyPlan = updates.studyPlan ?? calculateStudyPlan(merged, exam.studyPlan)
  const { error } = await supabase
    .from("dynamic_exams")
    .update({ name: merged.name, start_date: merged.startDate, exam_date: merged.examDate, type: merged.examType ?? null, cfu: merged.cfu ?? null, material: merged.material, study_plan: studyPlan, status: merged.status })
    .eq("id", exam.id)
  if (error) throw error
  await persistRebalancedActiveExams()
  return getAllExams()
}

// Scrive il solo study_plan senza ricalcoli né ribilanciamento: è il canale usato da
// persistRebalancedActiveExams, quindi NON deve a sua volta triggerare il ribilanciamento.
async function saveStudyPlan(examId: string, studyPlan: StudyPlan) {
  await getUserId()
  const { error } = await supabase.from("dynamic_exams").update({ study_plan: studyPlan }).eq("id", examId)
  if (error) throw error
}

// Persiste il ribilanciamento del carico tra gli esami attivi.
// Chiamata SOLO dopo mutazioni esplicite (aggiunta, modifica, completamento, ripristino),
// mai durante il render: aprire la tab "Oggi" non deve scrivere su Supabase.
// Best-effort: un fallimento qui non invalida la mutazione principale già riuscita.
async function persistRebalancedActiveExams() {
  try {
    const { dynamicExams } = await getAllExams()
    const activeExams = dynamicExams.filter((exam) => exam.status === "active")
    const changed = computeRebalancedExams(activeExams)
    await Promise.all(changed.map((exam) => saveStudyPlan(exam.id, exam.studyPlan)))
  } catch (error) {
    console.error("[persistRebalancedActiveExams] ribilanciamento non persistito:", error)
  }
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
  await persistRebalancedActiveExams()
  return getAllExams()
}

export async function markDayAheadAsCompleted(examId: string, date: string) {
  const { dynamicExams } = await getAllExams()
  const exam = dynamicExams.find((item) => item.id === examId)
  if (!exam) throw new Error("Esame non trovato")

  const nextDate = Object.keys(exam.studyPlan.dailySchedule).sort().find((item) => item > date)
  if (!nextDate) return getAllExams()

  const nextDay = exam.studyPlan.dailySchedule[nextDate]
  const studyPlan = {
    ...exam.studyPlan,
    dailySchedule: {
      ...exam.studyPlan.dailySchedule,
      [nextDate]: { ...nextDay, completed: true, completedDate: date, hours: { min: 0, max: 0 } },
    },
  }
  return updateExamMaterial(exam, { studyPlan })
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
