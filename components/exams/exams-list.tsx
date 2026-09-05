"use client"

import { motion } from "framer-motion"
import { Search } from "lucide-react"
import { useMemo, useState } from "react"
import type { DynamicExam } from "@/lib/planner/types"
import { useExams } from "./exams-context"
import { ExamCardMenu } from "@/components/planner/exam-card-menu"
import { MaterialIcon } from "./material-icon"
import { computeExamProgress, daysRemaining, remainingPages, remainingTopics } from "./exam-utils"

interface Props {
  onSelectExam?: (exam: DynamicExam) => void
}

export function ExamsList({ onSelectExam }: Props) {
  const { activeExams, exams, loading, error, archiveExam, removeExam, restoreExam } = useExams()
  const [query, setQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<"active" | "all">("active")
  const baseExams = statusFilter === "active" ? activeExams : exams
  const filteredExams = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("it-IT")
    if (!normalized) return baseExams
    return baseExams.filter((exam) => `${exam.name} ${exam.examDate} ${exam.status}`.toLocaleLowerCase("it-IT").includes(normalized))
  }, [baseExams, query])

  if (loading) {
    return <div className="p-4 text-sm text-stone-500">Caricamento esami…</div>
  }

  if (error) {
    return <div className="p-4 text-sm text-rose-600">{error}</div>
  }

  if (exams.length === 0) {
    return <div className="p-4 text-sm text-stone-500">Nessun esame attivo. Aggiungine uno per iniziare.</div>
  }

  return (
    <div>
      <label className="mb-3 flex items-center gap-2 rounded-2xl border border-stone-200 bg-white/90 px-3 py-2 text-sm text-stone-500">
        <Search size={16} />
        <span className="sr-only">Cerca esami</span>
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cerca per nome, data o stato" className="min-w-0 flex-1 bg-transparent text-stone-900 outline-none placeholder:text-stone-400" />
      </label>
      <div className="mb-3 flex gap-1.5">
        {([
          { value: "active" as const, label: "Attivi" },
          { value: "all" as const, label: "Tutti gli stati" },
        ]).map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setStatusFilter(option.value)}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
              statusFilter === option.value ? "border-stone-900 bg-stone-900 text-white" : "border-stone-200 bg-white text-stone-600 hover:bg-stone-50"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
      {filteredExams.map((exam, i) => {
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
            className="relative overflow-hidden rounded-3xl border border-stone-200 border-l-4 bg-white/90 p-4 text-left shadow-sm transition hover:border-stone-300"
            style={{ borderLeftColor: ["#F43F5E", "#6366F1", "#F59E0B", "#10B981"][i % 4] }}
          >
            <ExamCardMenu
              onArchive={() => (exam.status === "active" ? archiveExam(exam.id) : restoreExam(exam.id))}
              onDelete={() => removeExam(exam.id)}
              archiveLabel={exam.status === "active" ? "Segna come dato" : "Ripristina esame"}
            />

            <div className="flex items-center gap-2 pr-8">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-stone-100 text-stone-600">
                <MaterialIcon type={exam.material.type} size={16} />
              </span>
              <h3 className="truncate text-sm font-semibold text-stone-900">{exam.name}</h3>
              {exam.status !== "active" && (
                <span className="ml-auto shrink-0 rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-stone-500">
                  {exam.status === "archived" ? "Archiviato" : exam.status === "planning" ? "In preparazione" : "Completato"}
                </span>
              )}
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
      {filteredExams.length === 0 && <p className="p-4 text-sm text-stone-500">Nessun esame corrisponde alla ricerca.</p>}
    </div>
  )
}
