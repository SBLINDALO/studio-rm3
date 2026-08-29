"use client"

import { useEffect, useMemo, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown, ChevronUp, Flame, X } from "lucide-react"
import { useExams } from "./exams-context"
import { formatISODate } from "@/lib/planner/utils/dates"
import { Checkbox } from "@/components/ui/checkbox"

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

function computeStreak(exams: ReturnType<typeof useExams>["activeExams"]): number {
  const completedDates = new Set<string>()
  for (const exam of exams) {
    for (const [date, day] of Object.entries(exam.studyPlan.dailySchedule)) {
      if (day.completed) completedDates.add(date)
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
  const { activeExams, loading, setDayCompletion } = useExams()
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
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
        .map((exam) => ({ exam, day: exam.studyPlan.dailySchedule[today] }))
        .filter((entry) => entry.day && !dismissed.has(entry.exam.id)),
    [activeExams, today, dismissed],
  )

  const totals = useMemo(() => {
    const totalPages = todayTasks.reduce((sum, { day }) => sum + (day?.pages || 0), 0)
    const totalHours = todayTasks.reduce((sum, { day }) => sum + (day?.hours.max || 0), 0)
    return { totalPages, totalHours }
  }, [todayTasks])

  const streak = useMemo(() => computeStreak(activeExams), [activeExams])

  if (loading) return <div className="p-4 text-sm text-stone-500">Caricamento piano di oggi…</div>

  return (
    <section className="rounded-3xl border border-stone-200 bg-white/90 p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-stone-900">Piano di oggi</h2>
        <div className="flex items-center gap-1 rounded-full bg-orange-50 px-2.5 py-1 text-[11px] font-semibold text-orange-600">
          <Flame size={14} />
          {streak} {streak === 1 ? "giorno" : "giorni"}
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <div className="rounded-2xl bg-stone-50 p-3">
          <div className="text-[10px] uppercase tracking-[0.14em] text-stone-400">Pagine totali</div>
          <div className="mt-1 text-lg font-semibold text-stone-900">{totals.totalPages}</div>
        </div>
        <div className="rounded-2xl bg-stone-50 p-3">
          <div className="text-[10px] uppercase tracking-[0.14em] text-stone-400">Ore consigliate</div>
          <div className="mt-1 text-lg font-semibold text-stone-900">{totals.totalHours.toFixed(1)}h</div>
        </div>
      </div>

      {totals.totalHours > 1.5 && (
        <div role="alert" className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
          Il carico di oggi supera 1,5 ore consigliate.
        </div>
      )}

      {todayTasks.length === 0 ? (
        <p className="mt-4 text-sm text-stone-500">Nessun compito pianificato per oggi.</p>
      ) : (
        <div className="mt-3 space-y-2">
          {todayTasks.map(({ exam, day }) => {
            if (!day) return null
            const isOpen = expanded[exam.id] ?? true
            return (
              <div key={exam.id} className="rounded-2xl border border-stone-200 p-3">
                <div className="flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setExpanded((prev) => ({ ...prev, [exam.id]: !isOpen }))}
                    className="flex flex-1 items-center gap-2 text-left"
                  >
                    {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    <span className="text-sm font-medium text-stone-900">{exam.name}</span>
                    {day.isReview && (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                        Ripasso
                      </span>
                    )}
                  </button>
                  <label className="flex items-center gap-2 text-xs text-stone-500">
                    <Checkbox
                      checked={day.completed}
                      onCheckedChange={(checked) => setDayCompletion(exam, today, checked === true)}
                    />
                    Fatto
                  </label>
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
                      className="overflow-hidden"
                    >
                      <div className="mt-2 text-xs text-stone-600">
                        {day.pages ? `${day.pages} pagine` : null}
                        {day.pages && day.topics?.length ? " · " : null}
                        {day.topics?.length ? day.topics.join(", ") : null}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
