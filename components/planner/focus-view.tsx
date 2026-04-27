"use client"

import { motion, AnimatePresence } from "framer-motion"
import { Play, Pause, X, Flame, Coffee } from "lucide-react"
import { SUBJECTS, C } from "@/lib/planner/data"
import { SubjectIcon } from "./subject-icon"
import { fmtTime } from "@/lib/planner/helpers"
import type { SubjectKey, TimerMode } from "@/lib/planner/types"

interface Props {
  open: boolean
  timerRemaining: number
  timerTotal: number
  timerActive: boolean
  timerMode: TimerMode
  timerSubject: SubjectKey | null
  onToggle: () => void
  onClose: () => void
}

export function FocusView({
  open,
  timerRemaining,
  timerTotal,
  timerActive,
  timerMode,
  timerSubject,
  onToggle,
  onClose,
}: Props) {
  const accent = timerSubject ? C[timerSubject].dot : timerMode === "focus" ? "#E11D48" : "#059669"
  const progressPct = timerTotal ? (1 - timerRemaining / timerTotal) * 100 : 0

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="fixed inset-0 z-[10000] flex flex-col items-center justify-center overflow-hidden bg-[#0F111A]"
        >
          {/* Ambient glows */}
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3],
              x: [0, 30, 0],
              y: [0, 50, 0],
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="pointer-events-none absolute -left-[10%] -top-[10%] h-[60vw] w-[60vw] rounded-full blur-[60px]"
            style={{
              background: `radial-gradient(circle, ${accent}33 0%, transparent 70%)`,
            }}
          />
          <motion.div
            animate={{
              scale: [1.2, 1, 1.2],
              opacity: [0.2, 0.4, 0.2],
              x: [0, -40, 0],
              y: [0, -60, 0],
            }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            className="pointer-events-none absolute -bottom-[15%] -right-[10%] h-[70vw] w-[70vw] rounded-full blur-[80px]"
            style={{
              background: `radial-gradient(circle, ${accent}22 0%, transparent 70%)`,
            }}
          />

          {/* Main content */}
          <div className="relative z-10 text-center">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <div className="mb-2.5 flex items-center justify-center gap-2 text-[11px] font-semibold uppercase tracking-[0.3em] text-[#F4F1DE]/40">
                {timerMode === "focus" ? <Flame size={12} /> : <Coffee size={12} />}
                {timerMode === "focus" ? "In sessione" : "Riposo"}
              </div>
              {timerSubject && (
                <div
                  className="mx-auto mb-9 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-[13px] font-bold"
                  style={{
                    background: `${accent}15`,
                    color: accent,
                    borderColor: `${accent}30`,
                  }}
                >
                  <SubjectIcon sub={timerSubject} size={14} strokeWidth={3} />
                  {SUBJECTS[timerSubject].short}
                </div>
              )}
            </motion.div>

            {/* Giant timer with subtle float */}
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="font-black tabular-nums tracking-tighter text-[#F4F1DE]"
              style={{
                fontSize: "clamp(80px, 20vw, 140px)",
                textShadow: `0 0 30px ${accent}44`,
                letterSpacing: "-0.03em",
              }}
            >
              {fmtTime(timerRemaining)}
            </motion.div>

            {/* Progress bar */}
            <div className="mx-auto mt-10 h-[3px] w-[280px] overflow-hidden rounded-full bg-white/5">
              <motion.div
                animate={{ width: `${progressPct}%` }}
                transition={{ duration: 1, ease: "linear" }}
                className="h-full"
                style={{
                  background: accent,
                  boxShadow: `0 0 15px ${accent}`,
                }}
              />
            </div>
          </div>

          {/* Controls */}
          <div className="absolute bottom-12 z-10 flex items-center gap-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onToggle}
              className="flex h-14 w-14 items-center justify-center rounded-full border-none text-white"
              style={{
                background: accent,
                boxShadow: `0 8px 24px ${accent}55`,
              }}
              aria-label={timerActive ? "Pausa" : "Avvia"}
            >
              {timerActive ? (
                <Pause size={22} fill="#fff" strokeWidth={0} />
              ) : (
                <Play size={22} fill="#fff" strokeWidth={0} className="ml-0.5" />
              )}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onClose}
              className="flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-5 py-3.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#F4F1DE] backdrop-blur"
            >
              <X size={14} strokeWidth={2.5} /> Esci
            </motion.button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
