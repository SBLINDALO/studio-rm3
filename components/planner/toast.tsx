"use client"

import { motion, AnimatePresence } from "framer-motion"
import { Check, AlertTriangle, Info, Sparkles } from "lucide-react"

export type ToastTone = "success" | "warn" | "info" | "default"

export interface ToastState {
  msg: string
  tone: ToastTone
}

const TONE_STYLES: Record<ToastTone, string> = {
  success: "border-emerald-200/70 bg-emerald-50 text-emerald-900",
  warn: "border-amber-200/70 bg-amber-50 text-amber-900",
  info: "border-indigo-200/70 bg-indigo-50 text-indigo-900",
  default: "border-stone-200 bg-white text-stone-800",
}

const TONE_ICON_CLASSES: Record<ToastTone, string> = {
  success: "text-emerald-600",
  warn: "text-amber-600",
  info: "text-indigo-600",
  default: "text-stone-500",
}

const TONE_ICONS = {
  success: Check,
  warn: AlertTriangle,
  info: Info,
  default: Sparkles,
}

export function Toast({ toast }: { toast: ToastState | null }) {
  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          initial={{ y: 20, opacity: 0, x: "-50%" }}
          animate={{ y: 0, opacity: 1, x: "-50%" }}
          exit={{ y: 12, opacity: 0, x: "-50%" }}
          transition={{ type: "spring", stiffness: 360, damping: 30 }}
          role="status"
          aria-live="polite"
          className={`fixed bottom-[88px] left-1/2 z-[9998] flex items-center gap-2 rounded-full border px-4 py-2 text-[13px] font-medium shadow-md backdrop-blur-sm ${TONE_STYLES[toast.tone]}`}
        >
          {(() => {
            const Icon = TONE_ICONS[toast.tone]
            return (
              <Icon size={14} strokeWidth={2.25} className={TONE_ICON_CLASSES[toast.tone]} />
            )
          })()}
          {toast.msg}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
