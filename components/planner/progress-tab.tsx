"use client"

import { motion } from "framer-motion"
import { BarChart3, Calendar, Clock, Flame, Target, TrendingUp } from "lucide-react"
import { useMemo } from "react"
import type { PlannerData } from "@/lib/planner/types"

interface Props {
  data: PlannerData
  dailyStats: { chaptersCompleted: number; totalTimeSpent: number; examsStudied: string[] }
  streak: number
}

export function ProgressTab({ data, dailyStats, streak }: Props) {
  // Calcoli per i grafici (placeholder per ora)
  const weeklyProgress = useMemo(() => {
    // Placeholder: genera dati casuali per 7 giorni
    return Array.from({ length: 7 }, (_, i) => ({
      day: ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'][i],
      chapters: Math.floor(Math.random() * 5) + 1,
      time: Math.floor(Math.random() * 120) + 30,
    }))
  }, [])

  const examProgress = useMemo(() => {
    return data.customExams.map(exam => ({
      name: exam.short,
      completed: Math.floor(Math.random() * exam.chapters.length), // Placeholder
      total: exam.chapters.length,
      percentage: Math.floor(Math.random() * 100),
    }))
  }, [data.customExams])

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
        <div className="space-y-3">
          {weeklyProgress.map((day, index) => (
            <div key={day.day} className="flex items-center gap-3">
              <div className="w-8 text-[12px] font-medium text-stone-500">{day.day}</div>
              <div className="flex-1">
                <div className="h-2 bg-stone-200 rounded-full">
                  <div
                    className="h-2 bg-blue-500 rounded-full transition-all duration-500"
                    style={{ width: `${(day.chapters / 6) * 100}%` }}
                  ></div>
                </div>
              </div>
              <div className="text-[12px] text-stone-600">{day.chapters} cap</div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Exam Progress */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="card-quiet p-4"
      >
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-4 w-4 text-stone-600" />
          <h3 className="text-[14px] font-semibold text-stone-900">Avanzamento esami</h3>
        </div>
        <div className="space-y-4">
          {examProgress.map((exam, index) => (
            <div key={exam.name} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-medium text-stone-700">{exam.name}</span>
                <span className="text-[12px] text-stone-500">{exam.completed}/{exam.total}</span>
              </div>
              <div className="h-2 bg-stone-200 rounded-full">
                <div
                  className="h-2 bg-green-500 rounded-full transition-all duration-500"
                  style={{ width: `${exam.percentage}%` }}
                ></div>
              </div>
              <div className="text-right text-[10px] text-stone-500">{exam.percentage}% completato</div>
            </div>
          ))}
        </div>
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
            <div className="text-2xl font-bold text-stone-900">24</div>
            <div className="text-[12px] text-stone-500">ore questa settimana</div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}