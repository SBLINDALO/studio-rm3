"use client"

import { motion } from "framer-motion"
import { Check, Timer as TimerIcon, CheckCircle2, ArrowRight, Plus, X, Archive } from "lucide-react"
import { useMemo, useState } from "react"
import { daysUntil, fmtDuration } from "@/lib/planner/helpers"
import { AddExamModal } from "./add-exam-modal"
import { EditExamModal } from "./edit-exam-modal"
import { ExamArchive } from "./exam-archive"
import { TodayStudyPlan } from "@/components/exams/today-study-plan"
import { PullToRefresh } from "./pull-to-refresh"
import { SwipeToDelete } from "./swipe-to-delete"
import { useExams } from "@/components/exams/exams-context"
import { staggerSpring } from "@/lib/planner/motion"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import type { ArchivedExam, CustomExam, DynamicExam, PlannerData, StudyDoc } from "@/lib/planner/types"
import type { TabId } from "./tabs-nav"

const EXAM_COLORS = [
  { bg: "#FFF1F2", border: "#FDA4AF", text: "#BE123C", dot: "#F43F5E", soft: "#FFFAFB" },
  { bg: "#EEF2FF", border: "#A5B4FC", text: "#3730A3", dot: "#6366F1", soft: "#F8FAFE" },
  { bg: "#FFFBEB", border: "#FCD34D", text: "#92400E", dot: "#F59E0B", soft: "#FFFCF4" },
  { bg: "#ECFDF5", border: "#6EE7B7", text: "#065F46", dot: "#10B981", soft: "#F7FCF9" },
]

function toCustomExam(exam: DynamicExam, colorIndex: number): CustomExam {
  return {
    ...exam,
    short: exam.name.slice(0, 12),
    // invariant: solo esami "active" arrivano qui, examDate è sempre valorizzato
    examDate: exam.examDate as string,
    examISO: exam.examDate as string,
    examTime: "-",
    examType: exam.examType ?? "Scritto",
    color: EXAM_COLORS[colorIndex % EXAM_COLORS.length],
    chapters: exam.material.notes?.split("\n").filter(Boolean) ?? [],
  }
}

interface Props {
  data: PlannerData
  addCustomExam: (exam: Omit<DynamicExam, "id" | "createdAt">) => void | Promise<void>
  updateExam: (exam: DynamicExam, updates: Partial<Pick<DynamicExam, "name" | "examDate" | "startDate" | "material" | "examType" | "cfu" | "status">>) => void | Promise<void>
  archiveExam: (id: string) => void
  removeExam: (id: string) => void
  restoreExam: (id: string) => void
  updateChapterProgress: (examId: string, chapterId: string, status: "not_started" | "in_progress" | "completed", timeSpent?: number) => void
  dailyStats: { chaptersCompleted: number; totalTimeSpent: number; examsStudied: string[] }
  streak: number
  todayFocusMin: number
  todayFocusCount: number
  onNavigate: (t: TabId) => void
  onShowToast?: (msg: string, tone?: "success" | "warn" | "info" | "default") => void
}

export function TodayTab({
  data,
  addCustomExam,
  updateExam,
  archiveExam,
  removeExam,
  restoreExam,
  updateChapterProgress,
  dailyStats,
  streak,
  todayFocusMin,
  todayFocusCount,
  onNavigate,
  onShowToast,
}: Props) {
  const [addOpen, setAddOpen] = useState(false)
  const [editingExam, setEditingExam] = useState<CustomExam | null>(null)
  const [deletingExam, setDeletingExam] = useState<DynamicExam | null>(null)
  const [deleteBusy, setDeleteBusy] = useState(false)
  const { activeExams, refresh: refreshDynamicExams } = useExams()
  const archivedExams = data.archivedExams ?? []
  const todayLabel = new Date().toLocaleDateString("it-IT", {
    weekday: "long",
    day: "numeric",
    month: "long",
  })
  const displayTodayLabel = todayLabel.charAt(0).toUpperCase() + todayLabel.slice(1)
  const studyProgress = useMemo(() => {
    const today = new Date()
    const dayMs = 86_400_000
    return activeExams.map((exam) => {
      const start = new Date(`${exam.startDate}T00:00:00`)
      const elapsedDays = Math.max(0, Math.floor((today.getTime() - start.getTime()) / dayMs) + 1)
      return { exam, currentDay: Math.min(elapsedDays, exam.studyPlan.totalDaysAvailable), totalDays: exam.studyPlan.totalDaysAvailable }
    })
  }, [activeExams])

  const confirmDeleteExam = async () => {
    if (!deletingExam) return
    setDeleteBusy(true)
    try {
      await removeExam(deletingExam.id)
      await refreshDynamicExams().catch(() => {})
      onShowToast?.("Esame eliminato", "success")
      setDeletingExam(null)
    } catch (err) {
      onShowToast?.(err instanceof Error ? err.message : "Impossibile eliminare l'esame. Riprova.", "warn")
    } finally {
      setDeleteBusy(false)
    }
  }

  const handleArchiveExam = async (exam: DynamicExam) => {
    try {
      await archiveExam(exam.id)
      await refreshDynamicExams().catch(() => {})
      onShowToast?.("Esame segnato come dato", "success")
    } catch (err) {
      onShowToast?.(err instanceof Error ? err.message : "Impossibile aggiornare l'esame. Riprova.", "warn")
    }
  }

  const handleRestoreExam = async (id: string) => {
    await restoreExam(id)
    await refreshDynamicExams().catch(() => {})
  }

  return (
    <div className="space-y-5">
      <motion.button
        type="button"
        initial={{ scale: 0, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 280, damping: 22 }}
        whileTap={{ scale: 0.94 }}
        onClick={() => setAddOpen(true)}
        className="glass-fab fixed bottom-24 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full text-stone-900 dark:text-white sm:right-[max(calc((100vw-680px)/2 + 16px),16px)]"
        aria-label="Aggiungi esame rapidamente"
        title="Quick Add"
      >
        <Plus size={22} />
      </motion.button>
      <PullToRefresh onRefresh={refreshDynamicExams}>
      <div className="space-y-5">
      {/* Greeting card */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={staggerSpring(0)}
        className="card-quiet p-4"
      >
        <div className="text-section-header text-stone-500">
          {displayTodayLabel}
        </div>
        <h2 className="text-page-title mt-1.5 text-stone-900">
          Buono studio
        </h2>
        <div className="mt-0.5 text-[12px] text-stone-500">
          {studyProgress.length > 0
            ? studyProgress.map(({ exam, currentDay, totalDays }) => `${exam.name}: giorno ${currentDay} di ${totalDays}`).join(" · ")
            : "Aggiungi un esame per creare il piano di studio"}
        </div>
        {todayFocusMin > 0 && (
          <div className="mt-3 flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-[12px] text-emerald-900">
            <TimerIcon size={13} strokeWidth={2.25} className="text-emerald-600" />
            <span>
              Oggi hai studiato <strong className="font-semibold tabular-nums">{fmtDuration(todayFocusMin)}</strong>
              {" · "}
              <span className="tabular-nums">{todayFocusCount}</span>{" "}
              {todayFocusCount === 1 ? "sessione" : "sessioni"}
            </span>
          </div>
        )}
      </motion.div>

      {/* Daily Stats */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={staggerSpring(1)}
        className="card-quiet p-4"
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="text-section-header text-stone-500">
              Progressi oggi
            </div>
            <div className="mt-1 text-[14px] text-stone-700">
              {dailyStats.chaptersCompleted} capitoli completati · {Math.round(dailyStats.totalTimeSpent / 60)} ore studiate
            </div>
          </div>
          <div className="text-right">
            <div className="text-[12px] text-stone-500">Streak</div>
            <div className="text-[16px] font-semibold text-stone-900">{streak} giorni</div>
          </div>
        </div>
        {/* Barra di avanzamento - per ora placeholder */}
        <div className="mt-3">
          <div className="flex items-center justify-between text-[10px] text-stone-500 mb-1">
            <span>Avanzamento esame</span>
            <span>0%</span>
          </div>
          <div className="h-2 bg-stone-200 rounded-full">
            <div className="h-2 bg-blue-500 rounded-full" style={{ width: '0%' }}></div>
          </div>
        </div>
      </motion.div>

      {/* Countdown grid */}
      <section>
        <h3 className="text-section-header mb-2 px-0.5 text-stone-500">
          Giorni agli esami
        </h3>
        <div className="grid grid-cols-2 gap-2.5">
          {activeExams.map((exam, i) => {
            const customExam = toCustomExam(exam, i)
            // invariant: activeExams ha sempre examDate valorizzato
            const d = daysUntil(exam.examDate as string)
            const urgent = d !== null && d <= 7
            return (
              <motion.div
                key={exam.id}
                initial={{ opacity: 0, y: 8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={staggerSpring(i)}
              >
                <SwipeToDelete onDelete={() => setDeletingExam(exam)} ariaLabel={`Elimina ${exam.name}`}>
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => setEditingExam(customExam)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") setEditingExam(customExam)
                    }}
                    className="relative border border-[var(--border-subtle)] p-3.5 text-left shadow-sm"
                    style={{ background: `color-mix(in oklch, ${customExam.color.dot} 7%, var(--surface))` }}
                  >
                    <div
                      className="absolute left-0 top-0 h-full w-[3px]"
                      style={{ background: customExam.color.dot }}
                      aria-hidden
                    />
                    <div className="absolute right-2 top-2 z-10 flex items-center gap-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleArchiveExam(exam)
                        }}
                        className="rounded-full border border-stone-200 bg-white/90 p-1.5 text-stone-400 shadow-sm transition hover:bg-stone-100 hover:text-stone-600"
                        aria-label="Segna come dato"
                        title="Segna come dato"
                      >
                        <Archive size={12} />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setDeletingExam(exam)
                        }}
                        className="rounded-full border border-stone-200 bg-white/90 p-1.5 text-stone-400 shadow-sm transition hover:bg-rose-50 hover:text-rose-600"
                        aria-label="Elimina esame"
                        title="Elimina esame"
                      >
                        <X size={12} />
                      </button>
                    </div>
                    <div className="flex items-center justify-between gap-3 pr-14">
                      <div className="text-[10px] font-medium uppercase tracking-[0.14em]" style={{ color: customExam.color.text }}>
                        {customExam.short || exam.name}
                      </div>
                      <span className="rounded-full bg-stone-100 px-2 py-1 text-[10px] uppercase tracking-[0.14em] text-stone-600">
                        {exam.examType ?? "Scritto"}
                      </span>
                    </div>
                    <div
                      className={`mt-1.5 text-[34px] font-semibold tabular-nums leading-none tracking-tight ${
                        urgent ? "text-rose-600" : "text-stone-900 dark:text-white"
                      }`}
                    >
                      {d ?? "—"}
                    </div>
                    <div className="mt-1 text-[10.5px] text-stone-500">{d !== null ? `giorni · ${exam.examDate}` : exam.examDate}</div>
                    {exam.studyPlan?.planStatus === "too-late" && (
                      <div className="mt-2 text-[11px] font-medium text-rose-600">
                        Esame troppo vicino: ti mostriamo solo cosa rivedere subito.
                      </div>
                    )}
                  </div>
                </SwipeToDelete>
              </motion.div>
            )
          })}


          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => setAddOpen(true)}
            className="group relative flex min-h-[150px] flex-col items-center justify-center gap-3 rounded-[20px] border border-dashed border-stone-300 bg-[var(--bg-subtle)] px-4 py-5 text-stone-500 transition hover:border-stone-400 hover:bg-stone-100/60"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl border border-stone-200 bg-stone-100 text-stone-500">
              <Plus size={32} />
            </div>
            <div className="text-sm font-semibold">Aggiungi esame</div>
          </motion.button>
        </div>

        <AlertDialog open={!!deletingExam} onOpenChange={(open) => !open && setDeletingExam(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Eliminare definitivamente {deletingExam?.name}?</AlertDialogTitle>
              <AlertDialogDescription>Questa azione non può essere annullata.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleteBusy}>Annulla</AlertDialogCancel>
              <AlertDialogAction
                onClick={(e) => {
                  e.preventDefault()
                  confirmDeleteExam()
                }}
                disabled={deleteBusy}
                className="bg-rose-600 text-white hover:bg-rose-700"
              >
                {deleteBusy ? "Eliminazione…" : "Elimina definitivamente"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {archivedExams.length > 0 && (
          <div className="mt-4">
            <ExamArchive archivedExams={archivedExams} onRestore={handleRestoreExam} />
          </div>
        )}
      </section>

      {/* Piano di studio degli esami per oggi */}
      <TodayStudyPlan />

      {/* TODO: gli allegati StudyDocViewer delle sessioni legacy vivevano qui; migrarli al piano dinamico. */}

      {/* Primary actions */}
      <div className="grid grid-cols-2 gap-2">
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => onNavigate("timer")}
          className="group flex items-center justify-center gap-1.5 rounded-xl bg-stone-900 px-4 py-3 text-[13px] font-medium text-white shadow-sm transition-all hover:bg-stone-800 hover:shadow"
        >
          <TimerIcon size={14} strokeWidth={2} />
          <span>Avvia Timer</span>
          <ArrowRight
            size={13}
            strokeWidth={2}
            className="transition-transform group-hover:translate-x-0.5"
          />
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => onNavigate("tracker")}
          className="group flex items-center justify-center gap-1.5 rounded-xl border border-stone-200 bg-white px-4 py-3 text-[13px] font-medium text-stone-800 shadow-sm transition-all hover:border-stone-300 hover:bg-stone-50"
        >
          <CheckCircle2 size={14} strokeWidth={2} />
          <span>Argomenti</span>
        </motion.button>
      </div>

      </div>
      </PullToRefresh>

      <AddExamModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onAdd={async (exam) => {
          await addCustomExam(exam)
          await refreshDynamicExams().catch(() => {})
          onShowToast?.("Esame aggiunto con successo", "success")
        }}
      />

      <EditExamModal
        exam={editingExam}
        onClose={() => setEditingExam(null)}
        onSave={async (exam, updates) => {
          await updateExam(exam, updates)
          await refreshDynamicExams().catch(() => {})
          onShowToast?.("Esame aggiornato", "success")
        }}
      />
    </div>
  )
}
