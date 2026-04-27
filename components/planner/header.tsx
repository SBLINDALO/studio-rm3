"use client"

import { motion, AnimatePresence } from "framer-motion"
import { TrendingUp, GraduationCap, AlertTriangle } from "lucide-react"
import { SUBJECTS, C } from "@/lib/planner/data"
import { SubjectIcon } from "./subject-icon"
import type { SubjectKey } from "@/lib/planner/types"

interface Props {
  globalPct: number
  globalDone: number
  globalTotal: number
  skippedCount: number
  onOpenCatchup: () => void
  getProgress: (sub: SubjectKey) => { done: number; total: number; pct: number }
}

export function Header({
  globalPct,
  globalDone,
  globalTotal,
  skippedCount,
  onOpenCatchup,
  getProgress,
}: Props) {
  return (
    <motion.header
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="relative bg-gradient-to-b from-stone-50/80 to-transparent px-4 pt-5 pb-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.15em] text-stone-500">
            <GraduationCap size={11} strokeWidth={2} />
            Roma Tre · Sessione Estiva 2026
          </div>
          <h1 className="mt-1.5 text-[22px] font-semibold tracking-tight text-stone-900">
            Pianificatore Studio
          </h1>
        </div>

        <AnimatePresence>
          {skippedCount > 0 && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              whileTap={{ scale: 0.96 }}
              onClick={onOpenCatchup}
              className="group relative mt-0.5 flex flex-shrink-0 items-center gap-1.5 rounded-full border bg-rose-50/70 px-3 py-1.5 text-[11px] font-medium text-rose-900 shadow-sm transition-all hover:bg-rose-50 hover:shadow"
              style={{ borderColor: "color-mix(in oklch, var(--accent-urgent) 30%, transparent)" }}
              aria-label={`${skippedCount} argomenti arretrati. Apri piano di recupero`}
            >
              <motion.span
                animate={{ rotate: [0, -6, 6, -6, 0] }}
                transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 4 }}
                className="flex items-center text-rose-600"
              >
                <AlertTriangle size={12} strokeWidth={2.25} />
              </motion.span>
              <span className="tabular-nums">{skippedCount}</span>
              <span className="hidden sm:inline">arretrat{skippedCount === 1 ? "o" : "i"}</span>
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Progress card */}
      <div className="card-quiet mt-4 p-3.5">
        <div className="mb-2 flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-[11.5px] font-medium text-stone-600">
            <TrendingUp size={13} strokeWidth={2} />
            Progresso globale
          </span>
          <span className="text-[17px] font-semibold tabular-nums text-stone-900">{globalPct}%</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-stone-100">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${globalPct}%` }}
            transition={{ duration: 0.9, ease: "circOut", delay: 0.15 }}
            className="h-full rounded-full bg-stone-800"
          />
        </div>
        <div className="mt-1.5 text-[10.5px] text-stone-500">
          {globalDone}/{globalTotal} argomenti studiati
        </div>
      </div>

      {/* Subject chips */}
      <div className="mt-2.5 flex flex-wrap gap-1.5">
        {(Object.entries(SUBJECTS) as [SubjectKey, (typeof SUBJECTS)[SubjectKey]][]).map(([k, s], i) => {
          const { pct } = getProgress(k)
          return (
            <motion.div
              key={k}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.04 }}
              className="pill border border-[var(--border-subtle)] bg-white/60"
            >
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ background: C[k].dot }}
                aria-hidden
              />
              <SubjectIcon sub={k} size={11} strokeWidth={1.75} />
              <span className="text-stone-700">{s.short}</span>
              <span className="tabular-nums text-stone-400">{pct}%</span>
            </motion.div>
          )
        })}
      </div>
    </motion.header>
  )
}
