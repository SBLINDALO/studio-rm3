"use client"

import { motion } from "framer-motion"
import { AlertTriangle, ArrowRight } from "lucide-react"

interface Props {
  count: number
  onOpen: () => void
}

export function SkippedBanner({ count, onOpen }: Props) {
  if (count === 0) return null

  return (
    <motion.button
      layout
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      whileTap={{ scale: 0.99 }}
      onClick={onOpen}
      className="group flex w-full items-center gap-3 rounded-2xl border border-rose-200/70 bg-rose-50/50 p-3 text-left shadow-sm transition-all hover:bg-rose-50 hover:shadow"
      aria-label={`Apri piano di recupero, ${count} argomenti arretrati`}
    >
      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-600">
        <motion.span
          animate={{ rotate: [0, -6, 6, -6, 0] }}
          transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 4 }}
          className="flex items-center"
        >
          <AlertTriangle size={16} strokeWidth={2.25} />
        </motion.span>
      </div>

      <div className="flex-1 min-w-0">
        <div className="text-[10px] font-medium uppercase tracking-[0.14em] text-rose-800">
          Recupero necessario
        </div>
        <div className="text-[13.5px] font-medium text-stone-900">
          <span className="tabular-nums">{count}</span> {count === 1 ? "argomento arretrato" : "argomenti arretrati"}
        </div>
        <div className="text-[11px] text-stone-600">
          Apri il piano di recupero
        </div>
      </div>

      <ArrowRight
        size={16}
        strokeWidth={2}
        className="flex-shrink-0 text-rose-500 transition-transform group-hover:translate-x-0.5"
      />
    </motion.button>
  )
}
