"use client"

import { useEffect, useMemo, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { TrendingUp, GraduationCap, AlertTriangle, Settings } from "lucide-react"
import { SUBJECTS, C } from "@/lib/planner/data"
import { SubjectIcon } from "./subject-icon"
import type { SubjectKey } from "@/lib/planner/types"

const SUBJECT_COLORS: Record<SubjectKey, string> = {
  psico: "#E11D48",
  radio: "#4F46E5",
  est: "#D97706",
  scog: "#059669",
  genere: "#7C3AED",
}

interface Props {
  globalPct: number
  globalDone: number
  globalTotal: number
  skippedCount: number
  onOpenCatchup: () => void
  onOpenSettings: () => void
  getProgress: (sub: SubjectKey) => { done: number; total: number; pct: number }
}

export function Header({
  globalPct,
  globalDone,
  globalTotal,
  skippedCount,
  onOpenCatchup,
  onOpenSettings,
  getProgress,
}: Props) {
  const [expanded, setExpanded] = useState(false)
  const [displayPct, setDisplayPct] = useState(0)
  const [celebrate, setCelebrate] = useState<number | null>(null)
  const [lastThreshold, setLastThreshold] = useState(0)

  const subjectProgress = useMemo(
    () =>
      (Object.keys(SUBJECTS) as SubjectKey[]).map((key) => ({
        key,
        name: SUBJECTS[key].short,
        ...getProgress(key),
      })),
    [getProgress],
  )

  const dominantSubject = useMemo(
    () => subjectProgress.reduce((best, item) => (item.pct > best.pct ? item : best), subjectProgress[0]),
    [subjectProgress],
  )

  const motivator = useMemo(() => {
    if (globalPct >= 100) return "COMPLETATO! 🎉"
    if (globalPct >= 75) return "Quasi fatto!"
    if (globalPct >= 50) return "Ottimo lavoro!"
    if (globalPct >= 30) return "A metà strada!"
    if (globalPct >= 10) return "Buon inizio!"
    return "Si parte!"
  }, [globalPct])

  useEffect(() => {
    let start: number | null = null
    const from = displayPct
    const to = globalPct
    const duration = 1500
    let frame = 0

    const tick = (timestamp: number) => {
      if (!start) start = timestamp
      const progress = Math.min(1, (timestamp - start) / duration)
      setDisplayPct(Math.round(from + (to - from) * progress))
      if (progress < 1) {
        frame = requestAnimationFrame(tick)
      }
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [globalPct])

  useEffect(() => {
    const thresholds = [25, 50, 75, 100]
    const reached = thresholds.filter((threshold) => threshold > lastThreshold && globalPct >= threshold)
    if (reached.length > 0) {
      const nextThreshold = reached[0]
      setCelebrate(nextThreshold)
      setLastThreshold(Math.max(lastThreshold, nextThreshold))

      const timer = window.setTimeout(() => setCelebrate(null), 900)
      return () => window.clearTimeout(timer)
    }

    if (globalPct > lastThreshold) {
      setLastThreshold(globalPct)
    }

    return undefined
  }, [globalPct, lastThreshold])

  const glowColor = SUBJECT_COLORS[dominantSubject?.key ?? "psico"]

  return (
    <motion.header
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="relative bg-gradient-to-b from-stone-900 via-stone-900 to-stone-800 text-white px-4 pt-5 pb-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.15em] text-stone-200">
            <GraduationCap size={11} strokeWidth={2} />
            Roma Tre · Sessione Estiva 2026
          </div>
          <h1 className="mt-1.5 text-[22px] font-semibold tracking-tight text-white">
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

        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={onOpenSettings}
          className="group relative mt-0.5 flex flex-shrink-0 items-center gap-1.5 rounded-full border bg-white/10 px-3 py-1.5 text-[11px] font-medium text-white shadow-sm transition-all hover:bg-white/15 hover:shadow"
          aria-label="Impostazioni notifiche"
        >
          <Settings size={12} strokeWidth={2.25} />
        </motion.button>
      </div>

      {/* Progress card */}
      <div className="card-quiet mt-4 p-3.5 bg-white/10 border-white/15">
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="flex items-center gap-1.5 text-[11.5px] font-medium uppercase tracking-[0.16em] text-stone-200">
              <TrendingUp size={13} strokeWidth={2} />
              Progresso globale
            </span>
            <p className="mt-1 text-[12px] text-stone-200/80">{motivator}</p>
          </div>
          <span className="text-[26px] font-semibold tabular-nums text-white">{displayPct}%</span>
        </div>

        <div
          role="button"
          tabIndex={0}
          onClick={() => setExpanded((current) => !current)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault()
              setExpanded((current) => !current)
            }
          }}
          className="group relative mt-3 cursor-pointer overflow-hidden rounded-full border border-white/15 bg-stone-900/10 p-2"
          aria-expanded={expanded}
        >
          <motion.div
            className="absolute inset-0 rounded-full"
            animate={{
              boxShadow: [
                `0 0 24px 4px ${glowColor}22`,
                `0 0 32px 8px ${glowColor}44`,
                `0 0 24px 4px ${glowColor}22`,
              ],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          <div className="relative h-3 overflow-hidden rounded-full bg-stone-900/10">
            <motion.div
              className="absolute inset-y-0 left-0 h-full w-[200%] rounded-full bg-[linear-gradient(90deg,#E11D48, #4F46E5, #D97706, #059669, #7C3AED, #E11D48)] progress-shimmer"
              animate={{ x: ["0%", "-50%", "0%"] }}
              transition={{ duration: 3, ease: "linear", repeat: Infinity }}
            />
            <div
              className="absolute inset-y-0 left-0 h-full rounded-full bg-[rgba(255,255,255,0.12)]"
              style={{ width: `${globalPct}%` }}
            />
          </div>
          <div className="pointer-events-none absolute inset-x-0 top-0 flex h-full items-center justify-between px-2">
            {[25, 50, 75, 100].map((milestone) => {
              const active = globalPct >= milestone
              return (
                <span
                  key={milestone}
                  className={`relative block h-3 w-3 rounded-full border transition-colors ${
                    active
                      ? "bg-white shadow-[0_0_0_8px_rgba(255,255,255,0.18)]"
                      : "bg-white/10 border-white/30"
                  }`}
                  style={{ left: `${milestone}%`, transform: "translateX(-50%)" }}
                />
              )
            })}
          </div>

          {celebrate && (
            <AnimatePresence>
              <motion.div
                key={celebrate}
                className="absolute left-1/2 top-1/2 z-10 flex -translate-x-1/2 -translate-y-1/2 gap-1"
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.7 }}
                transition={{ duration: 0.35 }}
              >
                {[...Array(5)].map((_, index) => (
                  <motion.span
                    key={index}
                    className="h-2 w-2 rounded-full bg-white shadow-[0_0_12px_rgba(255,255,255,0.6)]"
                    initial={{ y: 0, opacity: 0 }}
                    animate={{ y: [-8, 0], opacity: [0, 1] }}
                    transition={{ delay: index * 0.05, duration: 0.35 }}
                  />
                ))}
              </motion.div>
            </AnimatePresence>
          )}
        </div>

        <div className="mt-3 grid gap-1 text-[11px] text-stone-200/80 sm:grid-cols-[1fr_auto]">
          <span>{globalDone}/{globalTotal} argomenti studiati</span>
          <span className="text-right">Tocca per vedere il dettaglio</span>
        </div>

        <AnimatePresence>
          {expanded && (
            <motion.div
              className="mt-4 space-y-3"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
            >
              {subjectProgress.map((item, index) => (
                <div key={item.key} className="rounded-[16px] bg-white/10 p-3">
                  <div className="mb-2 flex items-center justify-between text-[12px] text-stone-100">
                    <span className="flex items-center gap-2">
                      <span
                        className="inline-flex h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: SUBJECT_COLORS[item.key] }}
                      />
                      <span>{item.name}</span>
                    </span>
                    <span className="tabular-nums font-semibold">{item.pct}%</span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-stone-900/10">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ backgroundColor: SUBJECT_COLORS[item.key] }}
                      initial={{ width: 0 }}
                      animate={{ width: `${item.pct}%` }}
                      transition={{ duration: 0.6, delay: index * 0.1, ease: "easeOut" }}
                    />
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
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
              className="pill border border-white/15 bg-white/10 text-white"
              style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}
            >
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ background: C[k].dot }}
                aria-hidden
              />
              <SubjectIcon sub={k} size={11} strokeWidth={1.75} />
              <span className="text-white">{s.short}</span>
              <span className="tabular-nums text-stone-200/80">{pct}%</span>
            </motion.div>
          )
        })}
      </div>
    </motion.header>
  )
}
