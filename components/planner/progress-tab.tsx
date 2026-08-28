"use client"

import { motion } from "framer-motion"
import { BarChart3, Clock, Download, Flame, Target, TrendingUp } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import type { PlannerData } from "@/lib/planner/types"
import { useExams } from "@/components/exams/exams-context"
import { computeExamProgress } from "@/components/exams/exam-utils"
import { getWeeklyProgress, type DailyProgressPoint } from "@/lib/supabase/exams"
import { exportFullProgressReportPdf } from "@/lib/planner/pdf-report"

interface Props {
  data: PlannerData
  dailyStats: { chaptersCompleted: number; totalTimeSpent: number; examsStudied: string[] }
  streak: number
}

const WEEKDAY_LABELS = ["Dom", "Lun", "Mar", "Mer", "Gio", "Ven", "Sab"]

export function ProgressTab({ data, dailyStats, streak }: Props) {
  const { activeExams } = useExams()
  const [weeklyProgress, setWeeklyProgress] = useState<DailyProgressPoint[]>([])
  const [weeklyLoading, setWeeklyLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    getWeeklyProgress(7)
      .then((points) => { if (!cancelled) setWeeklyProgress(points) })
      .catch(() => { if (!cancelled) setWeeklyProgress([]) })
      .finally(() => { if (!cancelled) setWeeklyLoading(false) })
    return () => { cancelled = true }
  }, [])

  const maxHours = useMemo(
    () => Math.max(1, ...weeklyProgress.map((point) => point.hoursStudied)),
    [weeklyProgress],
  )

  const examProgress = useMemo(
    () => activeExams.map((exam) => ({ exam, progress: computeExamProgress(exam) })),
    [activeExams],
  )

  const totalWeeklyHours = useMemo(
    () => weeklyProgress.reduce((sum, point) => sum + point.hoursStudied, 0),
    [weeklyProgress],
  )

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-2 gap-3">
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-quiet p-4"
        >
          <div className="flex items-center gap-2">
            <Flame className="h-4 w-4 text-orange-500" />
            <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-stone-500">
              Streak
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold text-stone-900">{streak}</div>
          <div className="text-[12px] text-stone-500">giorni consecutivi</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card-quiet p-4"
        >
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-blue-500" />
            <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-stone-500">
              Oggi
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold text-stone-900">{dailyStats.chaptersCompleted}</div>
          <div className="text-[12px] text-stone-500">capitoli completati</div>
        </motion.div>
      </div>

      {/* Weekly Chart */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="card-quiet p-4"
      >
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="h-4 w-4 text-stone-600" />
          <h3 className="text-[14px] font-semibold text-stone-900">Progressi settimanali</h3>
        </div>
        {weeklyLoading ? (
          <p className="text-[12px] text-stone-400">Caricamento…</p>
        ) : (
          <div className="space-y-3">
            {weeklyProgress.map((point) => {
              const date = new Date(`${point.date}T00:00:00`)
              const label = WEEKDAY_LABELS[date.getDay()]
              return (
                <div key={point.date} className="flex items-center gap-3">
                  <div className="w-8 text-[12px] font-medium text-stone-500">{label}</div>
                  <div className="flex-1">
                    <div className="h-2 bg-stone-200 rounded-full">
                      <div
                        className="h-2 bg-blue-500 rounded-full transition-all duration-500"
                        style={{ width: `${(point.hoursStudied / maxHours) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="text-[12px] text-stone-600 tabular-nums">{point.hoursStudied.toFixed(1)}h</div>
                </div>
              )
            })}
          </div>
        )}
      </motion.div>

      {/* Exam Progress */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="card-quiet p-4"
      >
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-stone-600" />
            <h3 className="text-[14px] font-semibold text-stone-900">Avanzamento esami</h3>
          </div>
          {examProgress.length > 0 && (
            <button
              type="button"
              onClick={() => exportFullProgressReportPdf(examProgress.map((item) => item.exam))}
              className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 px-2.5 py-1.5 text-[11px] font-medium text-stone-600 hover:bg-stone-50"
            >
              <Download className="h-3.5 w-3.5" /> Esporta PDF
            </button>
          )}
        </div>
        {examProgress.length === 0 ? (
          <p className="text-[12px] text-stone-400">Nessun esame attivo da mostrare.</p>
        ) : (
          <div className="space-y-4">
            {examProgress.map(({ exam, progress }) => (
              <div key={exam.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-medium text-stone-700">{exam.name}</span>
                  <span className="text-[12px] text-stone-500">{progress.daysDone}/{progress.daysTotal}</span>
                </div>
                <div className="h-2 bg-stone-200 rounded-full">
                  <div
                    className="h-2 bg-green-500 rounded-full transition-all duration-500"
                    style={{ width: `${progress.completionPct}%` }}
                  ></div>
                </div>
                <div className="text-right text-[10px] text-stone-500">{progress.completionPct}% completato</div>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Time Stats */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="card-quiet p-4"
      >
        <div className="flex items-center gap-2 mb-4">
          <Clock className="h-4 w-4 text-stone-600" />
          <h3 className="text-[14px] font-semibold text-stone-900">Tempo di studio</h3>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-stone-900">{Math.round(dailyStats.totalTimeSpent / 60)}</div>
            <div className="text-[12px] text-stone-500">ore oggi</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-stone-900">{totalWeeklyHours.toFixed(1)}</div>
            <div className="text-[12px] text-stone-500">ore questa settimana</div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}