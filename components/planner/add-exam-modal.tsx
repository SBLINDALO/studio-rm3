"use client"

import { AnimatePresence, motion } from "framer-motion"
import { Plus, X } from "lucide-react"
import { useMemo, useState } from "react"
import type { CustomExam } from "@/lib/planner/types"

const COLORS = [
  {
    id: "pink",
    label: "Rosa",
    bg: "#FCE7F3",
    border: "#FBCFE8",
    text: "#DB2777",
    dot: "#EC4899",
    soft: "#FCE7F3",
  },
  {
    id: "indigo",
    label: "Indaco",
    bg: "#EEF2FF",
    border: "#C7D2FE",
    text: "#4338CA",
    dot: "#6366F1",
    soft: "#E0E7FF",
  },
  {
    id: "amber",
    label: "Ambra",
    bg: "#FFFBEB",
    border: "#FDE68A",
    text: "#B45309",
    dot: "#F59E0B",
    soft: "#FEF3C7",
  },
  {
    id: "emerald",
    label: "Smeraldo",
    bg: "#ECFDF5",
    border: "#A7F3D0",
    text: "#047857",
    dot: "#10B981",
    soft: "#D1FAE5",
  },
  {
    id: "violet",
    label: "Viola",
    bg: "#F5F3FF",
    border: "#DDD6FE",
    text: "#7C3AED",
    dot: "#8B5CF6",
    soft: "#EDE9FE",
  },
  {
    id: "slate",
    label: "Slate",
    bg: "#F8FAFC",
    border: "#E2E8F0",
    text: "#334155",
    dot: "#64748B",
    soft: "#F1F5F9",
  },
]

interface Props {
  open: boolean
  onClose: () => void
  onAdd: (exam: CustomExam) => void
}

export function AddExamModal({ open, onClose, onAdd }: Props) {
  const [name, setName] = useState("")
  const [shortName, setShortName] = useState("")
  const [examDate, setExamDate] = useState("")
  const [examTime, setExamTime] = useState("")
  const [examType, setExamType] = useState<"Scritto" | "Orale">("Scritto")
  const [material, setMaterial] = useState("")
  const [colorId, setColorId] = useState(COLORS[0].id)
  const [errors, setErrors] = useState<{ name?: string; examDate?: string; examTime?: string }>({})

  const selectedColor = useMemo(
    () => COLORS.find((color) => color.id === colorId) ?? COLORS[0],
    [colorId],
  )

  const resetForm = () => {
    setName("")
    setShortName("")
    setExamDate("")
    setExamTime("")
    setExamType("Scritto")
    setMaterial("")
    setColorId(COLORS[0].id)
    setErrors({})
  }

  const formatExamDateLabel = (dateValue: string) => {
    if (!dateValue) return ""
    const date = new Date(dateValue)
    return date.toLocaleDateString("it-IT", {
      weekday: "short",
      day: "numeric",
      month: "short",
    })
  }

  const handleSubmit = () => {
    const nextErrors: typeof errors = {}
    if (!name.trim()) nextErrors.name = "Nome esame obbligatorio"
    if (!examDate) nextErrors.examDate = "Data esame obbligatoria"
    if (!examTime) nextErrors.examTime = "Ora esame obbligatoria"
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    const exam: CustomExam = {
      id: `exam_${Date.now()}`,
      name: name.trim(),
      short: shortName.trim().slice(0, 15),
      examDate: formatExamDateLabel(examDate),
      examTime,
      examType,
      examISO: examDate,
      color: {
        bg: selectedColor.bg,
        border: selectedColor.border,
        text: selectedColor.text,
        dot: selectedColor.dot,
        soft: selectedColor.soft,
      },
      material: material.trim() || undefined,
      createdAt: Date.now(),
    }

    onAdd(exam)
    resetForm()
    onClose()
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/40 px-3 py-4"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              handleClose()
            }
          }}
        >
          <motion.div
            initial={{ y: 120, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 120, opacity: 0 }}
            transition={{ type: "spring", damping: 24, stiffness: 240 }}
            className="w-full max-w-lg overflow-hidden rounded-[24px] bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-stone-200 px-5 py-4">
              <div>
                <p className="text-sm font-semibold text-stone-900">Aggiungi un nuovo esame</p>
                <p className="mt-1 text-xs text-stone-500">Completa i dettagli e salva il promemoria.</p>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="rounded-full border border-stone-200 p-2 text-stone-500 transition hover:bg-stone-100 hover:text-stone-700"
                aria-label="Chiudi"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4 px-5 py-5">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                  Nome esame
                </label>
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-stone-400 focus:bg-white"
                  placeholder="Es. Storia della comunicazione"
                />
                {errors.name && <p className="mt-1 text-xs text-rose-600">{errors.name}</p>}
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                    Nome abbreviato
                  </label>
                  <input
                    value={shortName}
                    onChange={(event) => setShortName(event.target.value)}
                    maxLength={15}
                    className="mt-2 w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-stone-400 focus:bg-white"
                    placeholder="Comunicazione"
                  />
                  <p className="mt-1 text-xs text-stone-400">{shortName.length}/15</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                    Tipo esame
                  </label>
                  <select
                    value={examType}
                    onChange={(event) => setExamType(event.target.value as "Scritto" | "Orale")}
                    className="mt-2 w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-stone-400 focus:bg-white"
                  >
                    <option value="Scritto">Scritto</option>
                    <option value="Orale">Orale</option>
                  </select>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                    Data esame
                  </label>
                  <input
                    type="date"
                    value={examDate}
                    onChange={(event) => setExamDate(event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-stone-400 focus:bg-white"
                  />
                  {errors.examDate && <p className="mt-1 text-xs text-rose-600">{errors.examDate}</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                    Ora esame
                  </label>
                  <input
                    type="time"
                    value={examTime}
                    onChange={(event) => setExamTime(event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-stone-400 focus:bg-white"
                  />
                  {errors.examTime && <p className="mt-1 text-xs text-rose-600">{errors.examTime}</p>}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                  Colore
                </label>
                <div className="mt-3 flex flex-wrap gap-3">
                  {COLORS.map((color) => {
                    const isSelected = color.id === colorId
                    return (
                      <button
                        type="button"
                        key={color.id}
                        onClick={() => setColorId(color.id)}
                        className={`flex h-10 w-10 items-center justify-center rounded-full border transition ${
                          isSelected ? "border-stone-900" : "border-stone-200"
                        }`}
                        style={{ background: color.bg }}
                        aria-label={color.label}
                      >
                        <span
                          className={`block h-3.5 w-3.5 rounded-full ${isSelected ? "ring-2 ring-stone-900" : "ring-1 ring-stone-200"}`}
                          style={{ background: color.dot }}
                        />
                      </button>
                    )
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                  Materiale di studio
                </label>
                <textarea
                  value={material}
                  onChange={(event) => setMaterial(event.target.value)}
                  rows={4}
                  className="mt-2 w-full rounded-3xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-stone-400 focus:bg-white"
                  placeholder="Note, link o dettagli extra"
                />
              </div>
            </div>

            <div className="flex flex-col gap-3 border-t border-stone-200 px-5 py-4">
              <button
                type="button"
                onClick={handleSubmit}
                className="inline-flex items-center justify-center rounded-2xl bg-stone-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-stone-800"
              >
                Aggiungi esame
              </button>
              <button
                type="button"
                onClick={handleClose}
                className="inline-flex items-center justify-center rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm font-semibold text-stone-700 transition hover:bg-stone-50"
              >
                Annulla
              </button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
