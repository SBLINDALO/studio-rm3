"use client"

import { motion } from "framer-motion"
import type { DynamicExam } from "@/lib/planner/types"
import { useExams } from "./exams-context"
import { ExamCardMenu } from "@/components/planner/exam-card-menu"
import { MaterialIcon } from "./material-icon"
import { computeExamProgress, daysRemaining, remainingPages, remainingTopics } from "./exam-utils"

interface Props {
  onSelectExam?: (exam: DynamicExam) => void
}

export function ExamsList({ onSelectExam }: Props) {
  const { activeExams, loading, error, archiveExam, removeExam } = useExams()

  if (loading) {
    return <div className="p-4 text-sm text-stone-500">Caricamento esami…</div>
  }

  if (error) {
    return <div className="p-4 text-sm text-rose-600">{error}</div>
  }

  if (activeExams.length === 0) {
    return <div className="p-4 text-sm text-stone-500">Nessun esame attivo. Aggiungine uno per iniziare.</div>
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {activeExams.map((exam, i) => {
        const d = daysRemaining(exam)
        const progress = computeExamProgress(exam)
        const pagesLeft = remainingPages(exam)
        const topicsLeft = remainingTopics(exam)

        return (
          <motion.button
            type="button"
            key={exam.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            onClick={() => onSelectExam?.(exam)}
            className="relative overflow-hidden rounded-3xl border border-stone-200 bg-white/90 p-4 text-left shadow-sm transition hover:border-stone-300"
          >
            <ExamCardMenu onArchive={() => archiveExam(exam.id)} onDelete={() => removeExam(exam.id)} />

            <div className="flex items-center gap-2 pr-8">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-stone-100 text-stone-600">
                <MaterialIcon type={exam.material.type} size={16} />
              </span>
              <h3 className="truncate text-sm font-semibold text-stone-900">{exam.name}</h3>
            </div>

            <div className="mt-3 flex items-baseline gap-1">
              <span className={`text-2xl font-semibold tabular-nums ${d <= 7 ? "text-rose-600" : "text-stone-900"}`}>
                {d}
              </span>
              <span className="text-xs text-stone-500">{d === 1 ? "giorno" : "giorni"}</span>
            </div>

            <div className="mt-1 text-[11px] text-stone-500">
              {pagesLeft > 0 && `${pagesLeft} pagine rimanenti`}
              {pagesLeft > 0 && topicsLeft > 0 && " · "}
              {topicsLeft > 0 && `${topicsLeft} argomenti rimanenti`}
              {pagesLeft === 0 && topicsLeft === 0 && "Materiale completato"}
            </div>

            <div className="mt-3">
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-stone-100">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-[width]"
                  style={{ width: `${progress.completionPct}%` }}
                />
              </div>
              <div className="mt-1 text-[10px] uppercase tracking-[0.14em] text-stone-400">
                {progress.completionPct}% completato
              </div>
            </div>
          </motion.button>
        )
      })}
    </div>
  )
}
