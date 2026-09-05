"use client"

import { useMemo, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Check, ChevronDown, GraduationCap } from "lucide-react"
import { useExams } from "@/components/exams/exams-context"
import { computeExamProgress } from "@/components/exams/exam-utils"
import { calculateMaterialQuantity } from "@/lib/planner/algorithms/study-plan-calculator"

const EXAM_COLORS = [
  { dot: "#F43F5E", text: "#BE123C", soft: "#FFF1F2" },
  { dot: "#6366F1", text: "#3730A3", soft: "#EEF2FF" },
  { dot: "#F59E0B", text: "#92400E", soft: "#FFFBEB" },
  { dot: "#10B981", text: "#065F46", soft: "#ECFDF5" },
]

export function TrackerTab() {
  const { activeExams, loading, setDayCompletion } = useExams()
  const [expanded, setExpanded] = useState<string | null>(null)
  const exams = useMemo(
    () => activeExams.map((exam, index) => ({ exam, color: EXAM_COLORS[index % EXAM_COLORS.length] })),
    [activeExams],
  )

  if (loading) return <div className="py-8 text-center text-sm text-stone-500">Caricamento esami...</div>
  if (!exams.length) return <div className="py-8 text-center text-sm text-stone-500">Aggiungi un esame per monitorare i suoi argomenti.</div>

  return <div className="space-y-3">
    {exams.map(({ exam, color }, examIndex) => {
      const { topics } = calculateMaterialQuantity(exam.material)
      const progress = computeExamProgress(exam)
      const isExpanded = expanded === exam.id
      const topicDays = new Map<string, string>()
      Object.entries(exam.studyPlan.dailySchedule).forEach(([date, day]) => {
        day.topics?.forEach((topic) => topicDays.set(topic, date))
      })
      const completedTopics = topics.filter((topic) => {
        const date = topicDays.get(topic)
        return date ? exam.studyPlan.dailySchedule[date]?.completed : false
      }).length
      const pct = topics.length ? Math.round((completedTopics / topics.length) * 100) : progress.completionPct

      return <motion.article key={exam.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: examIndex * 0.03 }} className="card-quiet overflow-hidden">
        <button onClick={() => setExpanded(isExpanded ? null : exam.id)} className="w-full p-4 text-left transition-colors" style={{ background: color.soft }} aria-expanded={isExpanded}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 flex-1 items-start gap-2.5">
              <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-white" style={{ background: color.dot }}><GraduationCap size={14} strokeWidth={2} /></span>
              <div className="min-w-0">
                <div className="text-[14.5px] font-semibold leading-tight" style={{ color: color.text }}>{exam.name}</div>
                <div className="mt-1 flex items-center gap-1.5 text-[10.5px] text-stone-600"><GraduationCap size={11} strokeWidth={2} />{exam.examDate} · {exam.examType ?? "Scritto"}</div>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <div className="text-[22px] font-semibold leading-none tabular-nums" style={{ color: color.text }}>{pct}%</div>
              <div className="text-[10.5px] tabular-nums text-stone-500">{completedTopics}/{topics.length}</div>
              <motion.span animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.2 }} className="text-stone-400"><ChevronDown size={14} strokeWidth={2} /></motion.span>
            </div>
          </div>
          <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/70"><motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.6, ease: "easeOut" }} className="h-full rounded-full" style={{ background: color.dot }} /></div>
        </button>
        <AnimatePresence initial={false}>{isExpanded && <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden border-t border-[var(--border-subtle)] bg-white">
          {topics.length ? topics.map((topic, index) => {
            const date = topicDays.get(topic)
            const completed = date ? exam.studyPlan.dailySchedule[date]?.completed === true : false
            return <div key={`${topic}-${index}`} className={`flex items-start gap-2 border-b border-[var(--border-subtle)] px-3.5 py-2.5 last:border-b-0 ${completed ? "bg-emerald-50/40" : ""}`}>
              <span className={`flex-1 pt-0.5 text-[12px] leading-snug ${completed ? "text-emerald-800 line-through" : "text-stone-700"}`}>{topic}</span>
              <motion.button whileTap={{ scale: 0.92 }} onClick={() => { if (date) void setDayCompletion(exam, date, !completed) }} disabled={!date} className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-all disabled:cursor-not-allowed disabled:opacity-40 ${completed ? "bg-emerald-500 text-white shadow-sm" : "border border-emerald-200 bg-emerald-50/60 text-emerald-600 hover:bg-emerald-100"}`} aria-label="Segna come studiato" aria-pressed={completed}><Check size={13} strokeWidth={2.75} /></motion.button>
            </div>
          }) : <p className="px-3.5 py-4 text-[12px] text-stone-500">Aggiungi le note del materiale, una per riga, per monitorare gli argomenti.</p>}
        </motion.div>}</AnimatePresence>
      </motion.article>
    })}
  </div>
}