"use client"

import { motion } from "framer-motion"
import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  Maximize2,
  Volume2,
  VolumeX,
  Minus,
  Plus,
  Target,
  Check,
  Coffee,
  Flame,
  History,
  Circle,
  Zap,
} from "lucide-react"
import { SUBJECTS, C, DAILY_GOAL_MIN } from "@/lib/planner/data"
import { SubjectIcon } from "./subject-icon"
import { fmtTime, fmtDuration } from "@/lib/planner/helpers"
import type { SubjectKey, TimerMode, LoggedSession } from "@/lib/planner/types"

interface Props {
  timerRemaining: number
  timerTotal: number
  timerActive: boolean
  timerMode: TimerMode
  timerSubject: SubjectKey | null
  customMin: number
  autoChain: boolean
  soundOn: boolean
  todayFocusMin: number
  todayFocusCount: number
  todaySessions: LoggedSession[]
  onSubjectChange: (s: SubjectKey | null) => void
  onStart: () => void
  onPause: () => void
  onReset: () => void
  onSkip: () => void
  onApplyPreset: (min: number, mode: TimerMode) => void
  onApplyCustom: (min: number) => void
  onToggleAutoChain: () => void
  onToggleSound: () => void
  onOpenFocus: () => void
}

const PRESETS = [
  { min: 25, label: "Focus", mode: "focus" as const, Icon: Flame },
  { min: 50, label: "Deep", mode: "focus" as const, Icon: Zap },
  { min: 5, label: "Pausa", mode: "break" as const, Icon: Coffee },
  { min: 15, label: "Lunga", mode: "break" as const, Icon: Coffee },
]

export function TimerTab({
  timerRemaining,
  timerTotal,
  timerActive,
  timerMode,
  timerSubject,
  customMin,
  autoChain,
  soundOn,
  todayFocusMin,
  todayFocusCount,
  todaySessions,
  onSubjectChange,
  onStart,
  onPause,
  onReset,
  onSkip,
  onApplyPreset,
  onApplyCustom,
  onToggleAutoChain,
  onToggleSound,
  onOpenFocus,
}: Props) {
  const progress = timerTotal > 0 ? 1 - timerRemaining / timerTotal : 0
  const circumference = 2 * Math.PI * 110
  const accent = timerSubject
    ? C[timerSubject].dot
    : timerMode === "focus"
      ? "#E11D48" // rose-600, urgent-style accent for active focus
      : "#059669" // emerald for breaks
  const goalPct = Math.min(100, (todayFocusMin / DAILY_GOAL_MIN) * 100)

  return (
    <div className="space-y-4">
      {/* Subject picker */}
      <section>
        <h3 className="mb-2 px-0.5 text-[10px] font-medium uppercase tracking-[0.14em] text-stone-500">
          Cosa stai studiando
        </h3>
        <div className="no-scrollbar flex gap-1.5 overflow-x-auto pb-1">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => onSubjectChange(null)}
            className={`flex flex-shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11.5px] font-medium transition-colors ${
              timerSubject === null
                ? "border-stone-900 bg-stone-900 text-white"
                : "border-stone-200 bg-white text-stone-600 hover:border-stone-300"
            }`}
          >
            <Circle size={11} strokeWidth={2} /> Generale
          </motion.button>
          {(Object.entries(SUBJECTS) as [SubjectKey, (typeof SUBJECTS)[SubjectKey]][]).map(([k, s]) => {
            const sel = timerSubject === k
            return (
              <motion.button
                key={k}
                whileTap={{ scale: 0.97 }}
                onClick={() => onSubjectChange(k)}
                className="flex flex-shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11.5px] font-medium transition-colors"
                style={{
                  background: sel ? C[k].dot : "white",
                  color: sel ? "white" : C[k].text,
                  borderColor: sel ? C[k].dot : "var(--border)",
                }}
              >
                <SubjectIcon sub={k} size={11} strokeWidth={2} /> {s.short}
              </motion.button>
            )
          })}
        </div>
      </section>

      {/* Daily goal */}
      <div className="card-quiet p-4">
        <div className="mb-2 flex items-baseline justify-between">
          <span className="flex items-center gap-1.5 text-[11px] font-medium text-stone-600">
            <Target size={12} strokeWidth={2} /> Obiettivo di oggi
          </span>
          <span className="text-[14px] font-semibold tabular-nums text-stone-900">
            {fmtDuration(todayFocusMin)}
            <span className="font-normal text-stone-400"> / {fmtDuration(DAILY_GOAL_MIN)}</span>
          </span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-stone-100">
          <motion.div
            animate={{ width: `${goalPct}%` }}
            transition={{ duration: 0.6 }}
            className={`h-full rounded-full ${
              todayFocusMin >= DAILY_GOAL_MIN ? "bg-emerald-500" : "bg-stone-800"
            }`}
          />
        </div>
        <div className="mt-3 flex items-center gap-1.5">
          {[0, 1, 2, 3].map((i) => (
            <motion.div
              key={i}
              animate={i < todayFocusCount % 4 ? { scale: [1, 1.15, 1] } : {}}
              transition={{ duration: 0.3 }}
              className={`flex h-4 w-4 items-center justify-center rounded-md transition-colors ${
                i < todayFocusCount % 4
                  ? "bg-stone-900 text-white"
                  : "border border-stone-200 bg-stone-50"
              }`}
            >
              {i < todayFocusCount % 4 && <Check size={10} strokeWidth={3} />}
            </motion.div>
          ))}
          <span className="ml-2 text-[10.5px] text-stone-500">
            {todayFocusCount > 0
              ? `${todayFocusCount} sessione${todayFocusCount === 1 ? "" : "i"} completate`
              : "Nessuna sessione ancora"}
          </span>
        </div>
      </div>

      {/* Main timer circle */}
      <div className="card-quiet flex flex-col items-center p-5">
        <div className="mb-3 flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.14em] text-stone-500">
          {timerMode === "focus" ? (
            <Flame size={11} strokeWidth={2} style={{ color: accent }} />
          ) : (
            <Coffee size={11} strokeWidth={2} className="text-emerald-600" />
          )}
          {timerMode === "focus" ? "In sessione" : "Pausa"}
        </div>

        <div className="relative h-[240px] w-[240px]">
          <svg className="h-full w-full -rotate-90" viewBox="0 0 240 240">
            <circle cx="120" cy="120" r="110" fill="none" stroke="var(--border-subtle)" strokeWidth="6" />
            <motion.circle
              cx="120"
              cy="120"
              r="110"
              fill="none"
              stroke={accent}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={false}
              animate={{ strokeDashoffset: circumference * (1 - progress) }}
              transition={{ duration: 1, ease: "linear" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div
              className="text-[52px] font-semibold tabular-nums tracking-tight text-stone-900"
              aria-live="polite"
            >
              {fmtTime(timerRemaining)}
            </div>
            <div className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.16em] text-stone-400">
              / {Math.round(timerTotal / 60)} min
            </div>
          </div>
        </div>

        {/* Primary controls */}
        <div className="mt-6 flex items-center gap-3">
          <motion.button
            whileTap={{ scale: 0.94 }}
            onClick={onReset}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-stone-200 bg-white text-stone-600 shadow-sm transition-colors hover:bg-stone-50"
            aria-label="Reset"
          >
            <RotateCcw size={15} strokeWidth={2.25} />
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.94 }}
            onClick={timerActive ? onPause : onStart}
            className="flex h-16 w-16 items-center justify-center rounded-full text-white shadow-md transition-all hover:shadow-lg"
            style={{ background: accent }}
            aria-label={timerActive ? "Pausa" : "Avvia"}
          >
            {timerActive ? (
              <Pause size={22} fill="#fff" strokeWidth={0} />
            ) : (
              <Play size={22} fill="#fff" strokeWidth={0} className="ml-0.5" />
            )}
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.94 }}
            onClick={onSkip}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-stone-200 bg-white text-stone-600 shadow-sm transition-colors hover:bg-stone-50"
            aria-label="Skip"
          >
            <SkipForward size={15} strokeWidth={2.25} />
          </motion.button>
        </div>

        {/* Secondary controls */}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-1.5">
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={onOpenFocus}
            className="flex items-center gap-1 rounded-full bg-stone-900 px-3 py-1.5 text-[11px] font-medium text-white transition-colors hover:bg-stone-800"
          >
            <Maximize2 size={11} strokeWidth={2.25} /> Focus
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={onToggleSound}
            className={`flex items-center gap-1 rounded-full border px-3 py-1.5 text-[11px] font-medium transition-colors ${
              soundOn
                ? "border-stone-200 bg-white text-stone-700 hover:bg-stone-50"
                : "border-stone-200 bg-stone-50 text-stone-400"
            }`}
          >
            {soundOn ? <Volume2 size={11} strokeWidth={2.25} /> : <VolumeX size={11} strokeWidth={2.25} />}
            {soundOn ? "On" : "Off"}
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={onToggleAutoChain}
            className={`flex items-center gap-1 rounded-full border px-3 py-1.5 text-[11px] font-medium transition-colors ${
              autoChain
                ? "border-amber-200 bg-amber-50 text-amber-900"
                : "border-stone-200 bg-white text-stone-600 hover:bg-stone-50"
            }`}
          >
            <Zap size={11} strokeWidth={2.25} /> Auto
          </motion.button>
        </div>
      </div>

      {/* Presets */}
      <section>
        <h3 className="mb-2 px-0.5 text-[10px] font-medium uppercase tracking-[0.14em] text-stone-500">
          Preset
        </h3>
        <div className="grid grid-cols-4 gap-2">
          {PRESETS.map((p) => {
            const Icon = p.Icon
            const active = timerTotal === p.min * 60 && timerMode === p.mode
            return (
              <motion.button
                key={p.label + p.min}
                whileTap={{ scale: 0.96 }}
                onClick={() => onApplyPreset(p.min, p.mode)}
                className={`flex flex-col items-center gap-1 rounded-xl border p-3 transition-all ${
                  active
                    ? "border-stone-900 bg-stone-900 text-white shadow-md"
                    : "border-stone-200 bg-white text-stone-700 hover:border-stone-300 hover:shadow-sm"
                }`}
              >
                <Icon size={14} strokeWidth={2} />
                <div className="text-[13px] font-semibold tabular-nums">{p.min}</div>
                <div
                  className={`text-[9.5px] font-medium uppercase tracking-wider ${
                    active ? "text-white/70" : "text-stone-500"
                  }`}
                >
                  {p.label}
                </div>
              </motion.button>
            )
          })}
        </div>
      </section>

      {/* Custom duration */}
      <div className="card-quiet p-3.5">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[10.5px] font-medium uppercase tracking-wider text-stone-500">
            Durata personalizzata
          </span>
          <span className="text-[13px] font-semibold tabular-nums text-stone-900">
            {customMin} min
          </span>
        </div>
        <div className="flex items-center gap-2">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => onApplyCustom(customMin - 5)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-stone-200 bg-stone-50 text-stone-600 hover:bg-stone-100"
          >
            <Minus size={13} strokeWidth={2.25} />
          </motion.button>
          <input
            type="range"
            min={5}
            max={120}
            step={5}
            value={customMin}
            onChange={(e) => onApplyCustom(Number(e.target.value))}
            className="flex-1"
            style={{ accentColor: "#E11D48" }}
            aria-label="Durata personalizzata"
          />
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => onApplyCustom(customMin + 5)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-stone-200 bg-stone-50 text-stone-600 hover:bg-stone-100"
          >
            <Plus size={13} strokeWidth={2.25} />
          </motion.button>
        </div>
      </div>

      {/* Session history */}
      {todaySessions.length > 0 && (
        <section>
          <h3 className="mb-2 flex items-center gap-1.5 px-0.5 text-[10px] font-medium uppercase tracking-[0.14em] text-stone-500">
            <History size={11} strokeWidth={2} /> Cronologia di oggi
          </h3>
          <div className="space-y-1.5">
            {[...todaySessions]
              .reverse()
              .slice(0, 5)
              .map((s) => {
                const col = s.subject ? C[s.subject] : C.gen
                return (
                  <div
                    key={s.id}
                    className="card-quiet relative flex items-center gap-2 overflow-hidden px-3 py-2"
                  >
                    <div
                      className="absolute left-0 top-0 h-full w-[3px]"
                      style={{ background: col.dot }}
                      aria-hidden
                    />
                    <span className="text-[10px] font-medium tabular-nums text-stone-400">
                      {s.startTime}
                    </span>
                    <span
                      className="flex items-center gap-1 text-[11.5px] font-medium"
                      style={{ color: col.text }}
                    >
                      {s.subject ? (
                        <SubjectIcon sub={s.subject} size={11} strokeWidth={2} />
                      ) : (
                        <Circle size={10} strokeWidth={2} />
                      )}
                      {s.subject ? SUBJECTS[s.subject].short : "Generale"}
                    </span>
                    <span className="ml-auto flex items-center gap-1 text-[11px] font-medium text-stone-600">
                      {s.mode === "focus" ? (
                        <Flame size={11} strokeWidth={2} className="text-rose-500" />
                      ) : (
                        <Coffee size={11} strokeWidth={2} className="text-emerald-500" />
                      )}
                      <span className="tabular-nums">{s.duration}m</span>
                    </span>
                  </div>
                )
              })}
          </div>
        </section>
      )}
    </div>
  )
}
