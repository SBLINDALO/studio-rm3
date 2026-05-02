"use client"

import { AnimatePresence, motion } from "framer-motion"
import { Archive, MoreVertical, Trash2 } from "lucide-react"
import { useEffect, useRef, useState } from "react"

interface Props {
  onArchive: () => void
  onDelete: () => void
}

export function ExamCardMenu({ onArchive, onDelete }: Props) {
  const [open, setOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const menuRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!open) return
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false)
        setConfirmDelete(false)
      }
    }
    window.addEventListener("pointerdown", handleClickOutside)
    return () => window.removeEventListener("pointerdown", handleClickOutside)
  }, [open])

  const handleDelete = () => {
    if (!confirmDelete) {
      setConfirmDelete(true)
      return
    }
    onDelete()
    setOpen(false)
    setConfirmDelete(false)
  }

  return (
    <div ref={menuRef} className="absolute right-2 top-2 z-10 text-stone-500">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="rounded-full border border-stone-200 bg-white/90 p-2 shadow-sm transition hover:bg-stone-100"
        aria-label="Apri menu esame"
      >
        <MoreVertical size={16} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mt-2 w-48 rounded-2xl border border-stone-200 bg-white p-2 shadow-xl"
          >
            <button
              type="button"
              onClick={() => {
                onArchive()
                setOpen(false)
                setConfirmDelete(false)
              }}
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium text-stone-700 transition hover:bg-stone-100"
            >
              <Archive size={16} />
              Segna come dato
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium text-rose-600 transition hover:bg-rose-50"
            >
              <Trash2 size={16} />
              {confirmDelete ? "Conferma elimina" : "Elimina esame"}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
