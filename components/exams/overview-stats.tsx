"use client"

import { BookOpen, CalendarClock, Gauge, Layers3 } from "lucide-react"
import { useMemo } from "react"
import { useExams } from "./exams-context"
import { daysRemaining } from "./exam-utils"
import { formatISODate, parseISODate } from "@/lib/planner/utils/dates"

export function OverviewStats() {
  const { activeExams, loading } = useExams()

  const stats = useMemo(() => {
    const firstExamDays = activeExams.length ? Math.min(...activeExams.map(daysRemaining)) : null
    const today = parseISODate(formatISODate(new Date()))
    const weekStart = new Date(today)
    const mondayOffset = today.getDay() === 0 ? -6 : 1 - today.getDay()
    weekStart.setDate(today.getDate() + mondayOffset)
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 7)

    let weekHours = 0
    let plannedPages = 0
    let plannedDays = 0
    for (const exam of activeExams) {
      for (const [dateKey, day] of Object.entries(exam.studyPlan.dailySchedule)) {
        const date = parseISODate(dateKey)
        if (date >= weekStart && date < weekEnd) weekHours += day.hours.max
        if (day.pages) {
          plannedPages += day.pages
          plannedDays += 1
        }
      }
    }

    return {
      active: activeExams.length,
      firstExamDays,
      weekHours,
      averagePages: plannedDays ? Math.round(plannedPages / plannedDays) : 0,
    }
  }, [activeExams])

  if (loading) return <div className="p-4 text-sm text-stone-500">Caricamento statistiche…</div>

  const cards = [
    { label: "Esami attivi", value: stats.active, icon: <BookOpen size={17} />, suffix: "" },
    { label: "Al primo esame", value: stats.firstExamDays ?? "—", icon: <CalendarClock size={17} />, suffix: stats.firstExamDays === 1 ? "giorno" : "giorni" },
    { label: "Carico questa settimana", value: stats.weekHours.toFixed(1), icon: <Gauge size={17} />, suffix: "ore" },
    { label: "Media pagine / giorno", value: stats.averagePages, icon: <Layers3 size={17} />, suffix: "pagine" },
  ]

  return (
    <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {cards.map((card) => (
        <div key={card.label} className="rounded-2xl border border-stone-200 bg-white/90 p-3 shadow-sm">
          <div className="flex items-center gap-2 text-stone-500">{card.icon}<span className="text-[10px] font-medium uppercase tracking-[0.12em]">{card.label}</span></div>
          <div className="mt-3 flex items-baseline gap-1"><span className="text-2xl font-semibold tabular-nums text-stone-900">{card.value}</span><span className="text-[11px] text-stone-500">{card.suffix}</span></div>
        </div>
      ))}
    </section>
  )
}
