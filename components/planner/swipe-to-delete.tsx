"use client"

// Wrapper di sola presentazione: rivela un'azione di eliminazione via swipe.
// L'azione rivelata richiama esattamente la stessa callback del pulsante X esistente —
// nessuna nuova funzione di dominio, solo un secondo punto d'ingresso gestuale.
import { useState, type ReactNode } from "react"
import { motion, useMotionValue, useTransform, animate } from "framer-motion"
import { Trash2 } from "lucide-react"

const REVEAL = -84
const OPEN_THRESHOLD = -40

interface Props {
  onDelete: () => void
  children: ReactNode
  ariaLabel: string
}

export function SwipeToDelete({ onDelete, children, ariaLabel }: Props) {
  const x = useMotionValue(0)
  const deleteOpacity = useTransform(x, [REVEAL, OPEN_THRESHOLD, 0], [1, 0.4, 0])
  const [open, setOpen] = useState(false)

  const settle = (toOpen: boolean) => {
    setOpen(toOpen)
    animate(x, toOpen ? REVEAL : 0, { type: "spring", stiffness: 420, damping: 36 })
  }

  return (
    <div className="relative overflow-hidden rounded-[20px]">
      <div className="absolute inset-y-0 right-0 flex items-center">
        <motion.button
          type="button"
          style={{ opacity: deleteOpacity }}
          onClick={() => {
            onDelete()
            settle(false)
          }}
          aria-label={ariaLabel}
          className="flex h-full w-[84px] flex-col items-center justify-center gap-1 bg-rose-600 text-white"
        >
          <Trash2 size={16} strokeWidth={2.25} />
          <span className="text-[10px] font-medium">Elimina</span>
        </motion.button>
      </div>
      <motion.div
        drag="x"
        dragDirectionLock
        dragConstraints={{ left: REVEAL, right: 0 }}
        dragElastic={{ left: 0.15, right: 0.15 }}
        style={{ x }}
        onDragEnd={(_, info) => {
          const shouldOpen = info.offset.x < OPEN_THRESHOLD || info.velocity.x < -400
          settle(open ? info.offset.x > -OPEN_THRESHOLD ? false : true : shouldOpen)
        }}
        onClickCapture={(event) => {
          if (open) {
            event.stopPropagation()
            settle(false)
          }
        }}
        className="relative bg-inherit"
      >
        {children}
      </motion.div>
    </div>
  )
}
