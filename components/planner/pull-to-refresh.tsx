"use client"

// Gesture di pull-to-refresh: solo layer di presentazione, richiama la funzione
// di refresh già esposta dal contesto esami — nessuna nuova logica di fetch.
import { useRef, useState, type ReactNode } from "react"
import { motion, useMotionValue, useTransform, animate } from "framer-motion"
import { RotateCw } from "lucide-react"

const THRESHOLD = 64

interface Props {
  onRefresh: () => void | Promise<void>
  children: ReactNode
}

export function PullToRefresh({ onRefresh, children }: Props) {
  const y = useMotionValue(0)
  const rotate = useTransform(y, [0, THRESHOLD], [0, 180])
  const indicatorOpacity = useTransform(y, [0, 20, THRESHOLD], [0, 0.5, 1])
  const [refreshing, setRefreshing] = useState(false)
  const scrollAtDragStart = useRef(0)

  const handleDragStart = () => {
    scrollAtDragStart.current = window.scrollY
  }

  const handleDragEnd = async (_: unknown, info: { offset: { y: number } }) => {
    if (refreshing) return
    if (scrollAtDragStart.current <= 0 && info.offset.y > THRESHOLD) {
      setRefreshing(true)
      animate(y, 44, { type: "spring", stiffness: 320, damping: 30 })
      try {
        await onRefresh()
      } finally {
        setRefreshing(false)
        animate(y, 0, { type: "spring", stiffness: 320, damping: 30 })
      }
    } else {
      animate(y, 0, { type: "spring", stiffness: 320, damping: 30 })
    }
  }

  return (
    <div className="relative">
      <motion.div
        aria-hidden
        style={{ opacity: indicatorOpacity }}
        className="pointer-events-none absolute inset-x-0 -top-9 z-10 flex justify-center"
      >
        <motion.span
          style={{ rotate: refreshing ? undefined : rotate }}
          className={`glass flex h-8 w-8 items-center justify-center rounded-full text-stone-600 ${refreshing ? "animate-spin" : ""}`}
        >
          <RotateCw size={15} strokeWidth={2.25} />
        </motion.span>
      </motion.div>
      <motion.div
        drag="y"
        dragDirectionLock
        dragConstraints={{ top: 0, bottom: THRESHOLD + 24 }}
        dragElastic={{ top: 0, bottom: 0.55 }}
        style={{ y }}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        {children}
      </motion.div>
    </div>
  )
}
