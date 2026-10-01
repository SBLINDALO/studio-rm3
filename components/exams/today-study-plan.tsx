"use client"

import { useEffect, useMemo, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown, ChevronUp, FastForward, Flame, ListChecks, X } from "lucide-react"
import { useExams } from "./exams-context"
import { formatISODate } from "@/lib/planner/utils/dates"
import { computeBalancedSchedule } from "@/lib/planner/algorithms/load-balancer"
import { Checkbox } from "@/components/ui/checkbox"
import { Skeleton } from "@/components/ui/skeleton"
import { SPRING_DEFAULT, SPRING_FILL, staggerSpring } from "@/lib/planner/motion"

// Chiave per-giorno: gli esami nascosti si resettano automaticamente il giorno dopo
function dismissedKey(day: string) {
  return `studio-rm3.dismissed-today.${day}`
}

function loadDismissed(day: string): Set<string> {
  if (typeof window === "undefined") return new Set()
  try {
    const raw = window.localStorage.getItem(dismissedKey(day))
    return new Set(raw ? (JSON.parse(raw) as string[]) : [])
  } catch {
    return new Set()
  }
}

function computeStreak(plan: ReturnType<typeof useExams>["dynamicPlan"]): number {
  const completedDates = new Set<string>()
  for (const sessions of Object.values(plan.byDate)) {
    if (sessions.some((session) => session.completed)) {
      completedDates.add(sessions[0].date)
    }
  }

  let streak = 0
  const cursor = new Date()
  // se oggi non è ancora stato completato nulla, si parte da ieri
  if (!completedDates.has(formatISODate(cursor))) cursor.setDate(cursor.getDate() - 1)

  while (completedDates.has(formatISODate(cursor))) {
    streak += 1
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}

export function TodayStudyPlan() {
  const { activeExams, dynamicPlan, loading, markDayAheadAsCompleted, setDayCompletion, getDayProgress, saveDayProgress } = useExams()
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [pagesDraft, setPagesDraft] = useState<Record<string, string>>({})
  const today = formatISODate(new Date())
  const [dismissed, setDismissed] = useState<Set<string>>(() => loadDismissed(today))

  // Se cambia il giorno (es. tab lasciata aperta a mezzanotte) ricarica i dismiss del nuovo giorno
  useEffect(() => {
    setDismissed(loadDismissed(today))
  }, [today])

  const dismissExam = (examId: string) => {
    setDismissed((prev) => {
      const next = new Set(prev)
      next.add(examId)
      if (typeof window !== "undefined") {
        window.localStorage.setItem(dismissedKey(today), JSON.stringify([...next]))
      }
      return next
    })
  }

  const todayTasks = useMemo(
    () =>
      activeExams
        .map((exam) => ({ exam, day: dynamicPlan.byExam[exam.id]?.[today] }))
        .filter((entry) => entry.day && !dismissed.has(entry.exam.id)),
    [activeExams, today, dismissed],
  )

  const totals = useMemo(() => {
    const totalPages = todayTasks.reduce((sum, { day }) => sum + (day?.pages || 0), 0)
    const totalHours = todayTasks.reduce((sum, { day }) => sum + (day?.hours.max || 0), 0)
    return { totalPages, totalHours }
  }, [todayTasks])

  // READ-ONLY: somma ore/pagine del giorno solo per il banner di overload.
  // Nessuna scrittura su Supabase: il ribilanciamento viene persistito solo dopo
  // aggiunta/modifica/completamento esame (persistRebalancedActiveExams in lib/supabase/exams.ts).
  const todayLoad = useMemo(() => computeBalancedSchedule(activeExams)[today], [activeExams, today])

  const streak = useMemo(() => computeStreak(dynamicPlan), [dynamicPlan])

  if (loading) {
    return (
      <section className="glass rounded-[var(--radius-2xl)] p-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Skeleton className="h-14 rounded-2xl" />
          <Skeleton className="h-14 rounded-2xl" />
        </div>
        <Skeleton className="mt-3 h-16 rounded-2xl" />
      </section>
    )
  }

  return (
    <section
      className="relative overflow-hidden rounded-[var(--radius-2xl)] border p-4 shadow-md"
      style={{
        background: "linear-gradient(155deg, color-mix(in oklch, var(--accent-info) 12%, var(--surface)), var(--surface) 55%)",
        borderColor: "color-mix(in oklch, var(--accent-info) 20%, var(--border-subtle))",
      }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-10 -top-14 h-40 w-40 rounded-full opacity-30 blur-3xl"
        style={{ background: "var(--accent-info)" }}
      />
      <div className="relative flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className="flex h-8 w-8 items-center justify-center rounded-full text-white shadow-sm"
            style={{ background: "var(--accent-info)" }}
            aria-hidden
          >
            <ListChecks size={15} strokeWidth={2.25} />
          </span>
          <div>
            <div className="text-section-header text-stone-500">Obiettivi di oggi</div>
            <h2 className="text-card-title text-stone-900 dark:text-white">Piano di oggi</h2>
          </div>
        </div>
        <motion.div
          key={streak}
          initial={{ scale: 0.85 }}
          animate={{ scale: 1 }}
          transition={SPRING_DEFAULT}
          className="flex items-center gap-1 rounded-full bg-orange-500/10 px-2.5 py-1 text-[11px] font-semibold text-orange-600"
        >
          <Flame size={14} />
          {streak} {streak === 1 ? "giorno" : "giorni"}
        </motion.div>
      </div>

      <div className="relative mt-3 grid grid-cols-2 gap-2">
        <div className="rounded-2xl bg-[var(--surface)]/70 p-3">
          <div className="text-[10px] uppercase tracking-[0.14em] text-stone-400">Pagine totali</div>
          <div className="mt-1 text-lg font-semibold text-stone-900 dark:text-white">{totals.totalPages}</div>
        </div>
        <div className="rounded-2xl bg-[var(--surface)]/70 p-3">
          <div className="text-[10px] uppercase tracking-[0.14em] text-stone-400">Ore consigliate</div>
          <div className="mt-1 text-lg font-semibold text-stone-900 dark:text-white">{totals.totalHours.toFixed(1)}h</div>
        </div>
      </div>

      {todayLoad?.isOverload && (
        <div role="alert" className="relative mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
          Il carico di oggi supera il tetto di 4 ore ({todayLoad.totalHours.toFixed(1)}h da {todayLoad.exams.length} {todayLoad.exams.length === 1 ? "esame" : "esami"}: {todayLoad.exams.map((e) => e.examName).join(", ")}). Le ore manuali restano invariate.
        </div>
      )}

      {todayTasks.length === 0 ? (
        <div className="relative mt-4 flex flex-col items-center gap-2 rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface)]/60 px-4 py-6 text-center">
          <ListChecks size={20} className="text-stone-400" strokeWidth={1.75} />
          <p className="text-sm text-stone-500">Nessun compito pianificato per oggi.</p>
        </div>
      ) : (
        <div className="relative mt-3 space-y-2">
          {todayTasks.map(({ exam, day }, i) => {
            if (!day) return null
            const progress = getDayProgress(exam.id, today)
            const topicsCompleted = new Set(progress?.topicsCompleted ?? [])
            const pagesCompleted = progress?.pagesCompleted ?? 0
            const pageTotal = day.pages ?? 0
            const pageDraftKey = `${exam.id}__${today}`
            const pageDraft = pagesDraft[pageDraftKey] ?? String(Math.min(pagesCompleted, pageTotal))
            const isOpen = expanded[exam.id] ?? !day.completed
            return (
              <motion.div
                key={exam.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={staggerSpring(i)}
                className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)] p-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setExpanded((prev) => ({ ...prev, [exam.id]: !isOpen }))}
                    className="flex flex-1 items-center gap-2 text-left"
                  >
                    {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    <span className="text-sm font-medium text-stone-900 dark:text-white">{exam.name}</span>
                    {day.isReview && (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                        Ripasso
                      </span>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => { void markDayAheadAsCompleted(exam.id, today) }}
                    className="rounded-full p-1 text-stone-400 transition hover:bg-stone-100 hover:text-stone-600"
                    aria-label="Segna completato il prossimo giorno perché hai studiato il doppio"
                    title="Ho studiato il doppio"
                  >
                    <FastForward size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => dismissExam(exam.id)}
                    aria-label="Rimuovi da oggi"
                    title="Rimuovi solo da oggi"
                    className="rounded-full p-1 text-stone-400 transition hover:bg-stone-100 hover:text-stone-600"
                  >
                    <X size={14} />
                  </button>
                </div>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={SPRING_FILL}
                      className="overflow-hidden"
                    >
                      <div className="mt-2 space-y-3 text-xs text-stone-600">
                        {day.topics.length > 0 && (
                          <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)]/70 p-2.5">
                            <div className="mb-2 text-[11px] font-medium uppercase tracking-[0.1em] text-stone-500">Argomenti</div>
                            <div className="space-y-2">
                              {day.topics.map((topic) => {
                                const checked = topicsCompleted.has(topic)
                                return (
                                  <label key={topic} className="flex items-start gap-2">
                                    <Checkbox
                                      checked={checked}
                                      onCheckedChange={(nextChecked) => {
                                        const selected = new Set(topicsCompleted)
                                        if (nextChecked === true) selected.add(topic)
                                        else selected.delete(topic)
                                        void saveDayProgress(exam, today, { topicsCompleted: [...selected] })
                                      }}
                                    />
                                    <span className="leading-snug text-stone-700 dark:text-stone-200">{topic}</span>
                                  </label>
                                )
                              })}
                            </div>
                          </div>
                        )}

                        {day.pages ? (
                          <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)]/70 p-2.5">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-stone-700 dark:text-stone-200">Pagine: {Math.min(pagesCompleted, pageTotal)} / {pageTotal}</span>
                              <input
                                type="number"
                                min={0}
                                max={pageTotal}
                                value={pageDraft}
                                onChange={(event) => {
                                  setPagesDraft((prev) => ({ ...prev, [pageDraftKey]: event.target.value }))
                                }}
                                className="h-8 w-20 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface)]/90 px-2 text-xs text-stone-800 shadow-sm focus:outline-none focus:ring-1 focus:ring-[var(--border)]"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const parsed = Number(pageDraft)
                                  const clamped = Number.isFinite(parsed) ? Math.min(Math.max(Math.round(parsed), 0), pageTotal) : 0
                                  void saveDayProgress(exam, today, { pagesCompleted: clamped })
                                }}
                                className="h-8 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface)] px-2.5 text-xs font-medium text-stone-700 transition hover:bg-[var(--bg-subtle)]"
                              >
                                Salva
                              </button>
                            </div>
                          </div>
                        ) : null}

                        <label className="flex items-center gap-2 text-xs text-stone-600">
                          <Checkbox
                            checked={day.completed}
                            onCheckedChange={(checked) => setDayCompletion(exam, today, checked === true)}
                          />
                          Sessione completata
                        </label>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
        </div>
      )}
    </section>
  )
}
