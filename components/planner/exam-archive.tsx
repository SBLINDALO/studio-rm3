"use client"

import { AnimatePresence, motion } from "framer-motion"
import { ChevronDown, ChevronUp, RotateCw } from "lucide-react"
import { useState } from "react"
import type { ArchivedExam } from "@/lib/planner/types"

interface Props {
  archivedExams: ArchivedExam[]
  onRestore: (id: string) => void
}

export function ExamArchive({ archivedExams, onRestore }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <section className="mt-4 rounded-3xl border border-stone-200 bg-white/90 p-4 shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center justify-between gap-3 text-left"
      >
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-stone-500">
            Esami completati
          </p>
          <p className="mt-2 text-sm text-stone-800">
            {archivedExams.length} {archivedExams.length === 1 ? "esame completato" : "esami completati"}
          </p>
        </div>
        <div className="flex items-center gap-2 text-stone-500">
          {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mt-4 overflow-hidden"
          >
            <div className="space-y-3">
              {archivedExams.map((exam) => (
                <motion.div
                  key={exam.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-3xl border border-stone-200 bg-stone-50 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: exam.color.text }}>
                        <span className="inline-flex h-2.5 w-2.5 rounded-full" style={{ background: exam.color.dot }} />
                        <span>{exam.name}</span>
                      </div>
                      <p className="mt-2 text-xs uppercase tracking-[0.18em] text-stone-500">
                        {exam.examType} · {new Date(exam.examISO).toLocaleDateString("it-IT", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                    </div>
                    <span className="rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-700">
                      Completato
                    </span>
                  </div>

                  <div className="mt-3 grid gap-2 sm:grid-cols-3">
                    <div className="rounded-2xl bg-white p-3 text-sm text-stone-700 shadow-sm">
                      <div className="text-[10px] uppercase tracking-[0.18em] text-stone-400">Argomenti</div>
                      <div className="mt-1 text-sm font-semibold">
                        {exam.topicsDone} / {exam.topicsTotal}
                      </div>
                    </div>
                    <div className="rounded-2xl bg-white p-3 text-sm text-stone-700 shadow-sm">
                      <div className="text-[10px] uppercase tracking-[0.18em] text-stone-400">Completamento</div>
                      <div className="mt-1 text-sm font-semibold">
                        {exam.completionPct}%
                      </div>
                    </div>
                    <div className="rounded-2xl bg-white p-3 text-sm text-stone-700 shadow-sm">
                      <div className="text-[10px] uppercase tracking-[0.18em] text-stone-400">Dati il</div>
                      <div className="mt-1 text-sm font-semibold">
                        {new Date(exam.completedAt).toLocaleDateString("it-IT", { day: "numeric", month: "short", year: "numeric" })}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-3">
                    <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-700">
                      <RotateCw size={14} />
                      Riapri se necessario
                    </div>
                    <button
                      type="button"
                      onClick={() => onRestore(exam.id)}
                      className="rounded-2xl bg-stone-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-stone-800"
                    >
                      Ripristina
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}
