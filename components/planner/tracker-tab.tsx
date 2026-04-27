"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Check, Undo2, GraduationCap, ChevronDown } from "lucide-react"
import { TOPICS, SUBJECTS, C } from "@/lib/planner/data"
import { SubjectIcon } from "./subject-icon"
import type { PlannerData, SubjectKey } from "@/lib/planner/types"

interface Props {
  data: PlannerData
  toggleTopic: (sub: SubjectKey, i: number, status: "done" | "review") => void
  getProgress: (sub: SubjectKey) => { done: number; total: number; pct: number }
}

export function TrackerTab({ data, toggleTopic, getProgress }: Props) {
  const [expanded, setExpanded] = useState<SubjectKey | null>(null)

  return (
    <div className="space-y-3">
      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-[var(--border-subtle)] bg-white px-3 py-2 text-[11.5px] text-stone-600">
        <span className="flex items-center gap-1.5">
          <span className="flex h-4 w-4 items-center justify-center rounded-md bg-emerald-500">
            <Check size={10} className="text-white" strokeWidth={3} />
          </span>
          Studiato
        </span>
        <span className="h-3 w-px bg-stone-200" />
        <span className="flex items-center gap-1.5">
          <span className="flex h-4 w-4 items-center justify-center rounded-md bg-amber-500">
            <Undo2 size={10} className="text-white" strokeWidth={2.5} />
          </span>
          Da ripassare
        </span>
      </div>

      {(Object.entries(TOPICS) as [SubjectKey, string[]][]).map(([sub, topics], si) => {
        const s = SUBJECTS[sub]
        const col = C[sub]
        const { done, total, pct } = getProgress(sub)
        const isEx = expanded === sub
        const reviewCount = topics.filter((_, i) => data.topics[`${sub}_${i}`] === "review").length

        return (
          <motion.article
            key={sub}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: si * 0.03 }}
            className="card-quiet overflow-hidden"
          >
            <button
              onClick={() => setExpanded(isEx ? null : sub)}
              className="w-full p-4 text-left transition-colors"
              style={{ background: col.soft }}
              aria-expanded={isEx}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2.5">
                    <span
                      className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg"
                      style={{ background: col.dot, color: "#fff" }}
                      aria-hidden
                    >
                      <SubjectIcon sub={sub} size={14} strokeWidth={2} />
                    </span>
                    <div className="min-w-0">
                      <div
                        className="text-[14.5px] font-semibold leading-tight"
                        style={{ color: col.text }}
                      >
                        {s.name}
                      </div>
                      <div className="mt-1 flex items-center gap-1.5 text-[10.5px] text-stone-600">
                        <GraduationCap size={11} strokeWidth={2} />
                        {s.examDate} · {s.examTime} · {s.examType}
                      </div>
                      {reviewCount > 0 && (
                        <div className="mt-1 flex items-center gap-1 text-[10.5px] font-medium text-amber-700">
                          <Undo2 size={10} strokeWidth={2.5} />
                          {reviewCount} da ripassare
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1">
                  <div
                    className="text-[22px] font-semibold tabular-nums tracking-tight leading-none"
                    style={{ color: col.text }}
                  >
                    {pct}%
                  </div>
                  <div className="text-[10.5px] tabular-nums text-stone-500">
                    {done}/{total}
                  </div>
                  <motion.span
                    animate={{ rotate: isEx ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="text-stone-400"
                  >
                    <ChevronDown size={14} strokeWidth={2} />
                  </motion.span>
                </div>
              </div>

              <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/70">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  className="h-full rounded-full"
                  style={{ background: col.dot }}
                />
              </div>
            </button>

            <AnimatePresence initial={false}>
              {isEx && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden border-t border-[var(--border-subtle)] bg-white"
                >
                  {topics.map((topic, i) => {
                    const k = `${sub}_${i}`
                    const st = data.topics[k]
                    const rowBg =
                      st === "done"
                        ? "bg-emerald-50/40"
                        : st === "review"
                          ? "bg-amber-50/50"
                          : ""
                    return (
                      <div
                        key={i}
                        className={`flex items-start gap-2 border-b border-[var(--border-subtle)] px-3.5 py-2.5 last:border-b-0 ${rowBg}`}
                      >
                        <span
                          className={`flex-1 pt-0.5 text-[12px] leading-snug ${
                            st === "done"
                              ? "text-emerald-800 line-through"
                              : "text-stone-700"
                          }`}
                        >
                          {topic}
                        </span>
                        <motion.button
                          whileTap={{ scale: 0.92 }}
                          onClick={() => toggleTopic(sub, i, "done")}
                          className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg transition-all ${
                            st === "done"
                              ? "bg-emerald-500 text-white shadow-sm"
                              : "border border-emerald-200 bg-emerald-50/60 text-emerald-600 hover:bg-emerald-100"
                          }`}
                          aria-label="Segna come studiato"
                          aria-pressed={st === "done"}
                        >
                          <Check size={13} strokeWidth={2.75} />
                        </motion.button>
                        <motion.button
                          whileTap={{ scale: 0.92 }}
                          onClick={() => toggleTopic(sub, i, "review")}
                          className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg transition-all ${
                            st === "review"
                              ? "bg-amber-500 text-white shadow-sm"
                              : "border border-amber-200 bg-amber-50/60 text-amber-700 hover:bg-amber-100"
                          }`}
                          aria-label="Segna da ripassare"
                          aria-pressed={st === "review"}
                        >
                          <Undo2 size={13} strokeWidth={2.5} />
                        </motion.button>
                      </div>
                    )
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.article>
        )
      })}
    </div>
  )
}
