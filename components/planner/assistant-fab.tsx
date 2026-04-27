"use client"

import { motion } from "framer-motion"
import { Sparkles } from "lucide-react"

interface Props {
  onClick: () => void
  hidden?: boolean
}

export function AssistantFab({ onClick, hidden }: Props) {
  if (hidden) return null
  return (
    <motion.button
      initial={{ scale: 0, y: 20 }}
      animate={{ scale: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 280, damping: 22 }}
      whileTap={{ scale: 0.92 }}
      whileHover={{ y: -1 }}
      onClick={onClick}
      aria-label="Apri coach AI"
      className="group fixed bottom-20 right-4 z-30 flex h-13 w-13 items-center justify-center md:bottom-6 md:right-6"
      style={{ height: 52, width: 52 }}
    >
      {/* Halo */}
      <motion.span
        aria-hidden
        className="absolute inset-0 rounded-full bg-stone-900/20"
        animate={{ scale: [1, 1.3], opacity: [0.3, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
      />
      {/* Main button */}
      <span className="relative flex h-full w-full items-center justify-center rounded-full bg-stone-900 text-white shadow-md transition-shadow group-hover:shadow-lg">
        <motion.span
          animate={{ rotate: [0, 8, -8, 0] }}
          transition={{ duration: 3, repeat: Infinity, repeatDelay: 1.5 }}
        >
          <Sparkles size={18} strokeWidth={2} fill="currentColor" />
        </motion.span>
      </span>
    </motion.button>
  )
}
