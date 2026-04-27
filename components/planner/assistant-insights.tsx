"use client"

import { motion } from "framer-motion"
import { RefreshCw, TrendingUp, AlertTriangle, Lightbulb, Zap, Smile, Meh, Frown, Flame } from "lucide-react"
import type { StudyInsights } from "@/app/api/insights/route"

interface Props {
  insights: StudyInsights | null
  loading: boolean
  error: string | null
  onRefresh: () => void
  onAskCoach: (prompt: string) => void
}

const KIND_META = {
  strength: { icon: TrendingUp, bg: "bg-emerald-100", text: "text-emerald-800", label: "Punto di forza" },
  risk:     { icon: AlertTriangle, bg: "bg-rose-100",    text: "text-rose-800",    label: "Rischio" },
  tip:      { icon: Lightbulb,    bg: "bg-amber-100",   text: "text-amber-800",   label: "Consiglio" },
  nudge:    { icon: Zap,          bg: "bg-indigo-100",  text: "text-indigo-800",  label: "Nudge" },
} as const

const MOOD_META = {
  great:    { icon: Smile,         bg: "bg-emerald-50",  border: "border-emerald-200/70", text: "text-emerald-800", label: "In pista" },
  steady:   { icon: Meh,           bg: "bg-indigo-50",   border: "border-indigo-200/70",  text: "text-indigo-800",  label: "Stabile" },
  behind:   { icon: Flame,         bg: "bg-amber-50",    border: "border-amber-200/70",   text: "text-amber-800",   label: "In ritardo" },
  critical: { icon: Frown,         bg: "bg-rose-50",     border: "border-rose-200/70",    text: "text-rose-800",    label: "Critico" },
} as const

export function AssistantInsights({ insights, loading, error, onRefresh, onAskCoach }: Props) {
  if (loading && !insights) {
    return (
      <div className="space-y-3 p-4">
        {[0, 1, 2, 3].map((i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0.3 }}
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.12 }}
            className="h-24 rounded-2xl border border-[var(--border-subtle)] bg-stone-100/60"
          />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 p-8 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-rose-600">
          <AlertTriangle size={20} strokeWidth={2} />
        </div>
        <p className="text-[13.5px] font-medium text-stone-800">Analisi non disponibile</p>
        <p className="text-[12px] text-stone-600">{error}</p>
        <button
          onClick={onRefresh}
          className="flex items-center gap-1.5 rounded-full border border-stone-200 bg-white px-3 py-1.5 text-[12px] font-medium text-stone-700 shadow-sm hover:bg-stone-50"
        >
          <RefreshCw size={12} strokeWidth={2} />
          Riprova
        </button>
      </div>
    )
  }

  if (!insights) return null

  const mood = MOOD_META[insights.mood]
  const MoodIcon = mood.icon

  return (
    <div className="space-y-3 p-4">
      {/* Mood card */}
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        className={`rounded-2xl border ${mood.border} ${mood.bg} p-3.5`}
      >
        <div className="flex items-center justify-between gap-2">
          <div className={`flex items-center gap-1.5 text-[10.5px] font-medium ${mood.text}`}>
            <MoodIcon size={13} strokeWidth={2} />
            {mood.label}
          </div>
          <button
            onClick={onRefresh}
            disabled={loading}
            aria-label="Rigenera analisi"
            className="flex h-6 w-6 items-center justify-center rounded-full border border-stone-200 bg-white/80 text-stone-500 transition-colors hover:bg-white disabled:opacity-40"
          >
            <motion.span
              animate={loading ? { rotate: 360 } : { rotate: 0 }}
              transition={loading ? { duration: 1, repeat: Infinity, ease: "linear" } : undefined}
              className="flex"
            >
              <RefreshCw size={11} strokeWidth={2} />
            </motion.span>
          </button>
        </div>
        <p className="mt-1.5 text-[13.5px] font-medium leading-snug text-stone-900">
          {insights.summary}
        </p>
        <div className="mt-2 inline-flex items-center gap-1 rounded-lg bg-white/70 px-2 py-1 text-[10.5px] text-stone-700">
          Focus consigliato: <span className="ml-1 font-semibold">{insights.focusSubject}</span>
        </div>
      </motion.div>

      {/* Insight cards */}
      {insights.insights.map((ins, i) => {
        const meta = KIND_META[ins.kind]
        const Icon = meta.icon
        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.04 * i }}
            className="card-quiet p-3.5"
          >
            <div className="flex items-start gap-3">
              <div
                className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg ${meta.bg} ${meta.text}`}
              >
                <Icon size={13} strokeWidth={2} />
              </div>
              <div className="flex-1">
                <div className={`text-[10px] font-medium uppercase tracking-[0.12em] ${meta.text}`}>
                  {meta.label}
                </div>
                <div className="mt-0.5 text-[13.5px] font-semibold leading-snug text-stone-900">
                  {ins.title}
                </div>
                <p className="mt-1 text-[12px] leading-snug text-stone-600">{ins.detail}</p>
                <button
                  onClick={() => onAskCoach(ins.action)}
                  className="mt-2.5 inline-flex items-center gap-1 rounded-full bg-stone-900 px-2.5 py-1 text-[10.5px] font-medium text-white shadow-sm transition-opacity hover:opacity-80 active:scale-95"
                >
                  <Zap size={10} strokeWidth={2} />
                  {ins.action}
                </button>
              </div>
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}
