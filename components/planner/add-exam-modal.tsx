"use client"

import { AnimatePresence, motion } from "framer-motion"
import { FileText, Plus, X } from "lucide-react"
import { useState } from "react"
import type { DynamicExam } from "@/lib/planner/types"
import { calculateStudyPlan } from "@/lib/planner/algorithms/study-plan-calculator"
import { formatISODate } from "@/lib/planner/utils/dates"

interface Props {
  open: boolean
  onClose: () => void
  onAdd: (exam: Omit<DynamicExam, "id" | "createdAt" | "status">) => void | Promise<void>
}

const materialTypes: Array<{ value: DynamicExam["material"]["type"]; label: string }> = [
  { value: "pages", label: "Pages" },
  { value: "pdf", label: "PDF" },
  { value: "notes", label: "Notes" },
  { value: "mixed", label: "Mix" },
]

export function AddExamModal({ open, onClose, onAdd }: Props) {
  const [name, setName] = useState("")
  const [date, setDate] = useState("")
  const [type, setType] = useState<DynamicExam["material"]["type"]>("pages")
  const [pages, setPages] = useState("")
  const [notes, setNotes] = useState("")
  const [error, setError] = useState("")

  const reset = () => { setName(""); setDate(""); setType("pages"); setPages(""); setNotes(""); setError("") }
  const close = () => { reset(); onClose() }
  const add = async () => {
    if (!name.trim() || !date) { setError("Inserisci nome e data dell'esame"); return }
    const startDate = formatISODate(new Date())
    const material: DynamicExam["material"] = {
      type,
      totalPages: pages ? Number(pages) : undefined,
      notes: notes.trim() || undefined,
    }
    if (!material.totalPages && !material.notes && !(material.files?.length)) {
      setError("Aggiungi almeno una fonte di materiale")
      return
    }
    const exam = { name: name.trim(), startDate, examDate: date, material }
    await onAdd({ ...exam, studyPlan: calculateStudyPlan({ ...exam, id: "new", createdAt: Date.now(), status: "active", studyPlan: { totalDaysAvailable: 0, studyDaysPerWeek: 5, hoursPerDay: { min: 1, max: 1.5 }, reviewDaysBefore: 4, dailySchedule: {} } }) })
    close()
  }

  return <AnimatePresence>{open && <>
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={close} className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" />
    <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} className="fixed bottom-0 left-0 right-0 z-50 mx-auto max-w-[680px] rounded-t-3xl bg-white px-5 pb-10 pt-4 shadow-2xl">
      <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-stone-300" />
      <div className="flex items-center justify-between pb-3"><h2 className="text-[18px] font-semibold text-stone-900">Nuovo esame</h2><button onClick={close} aria-label="Chiudi"><X size={18} /></button></div>
      <div className="space-y-3">
        <label className="block text-xs font-medium text-stone-600">Nome<input value={name} onChange={(event) => setName(event.target.value)} className="mt-1 w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm" placeholder="Es. Storia dell'arte" /></label>
        <label className="block text-xs font-medium text-stone-600">Data esame<input type="date" value={date} onChange={(event) => setDate(event.target.value)} className="mt-1 w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm" /></label>
        <div><p className="mb-1 text-xs font-medium text-stone-600">Materiale</p><div className="grid grid-cols-4 gap-2">{materialTypes.map((item) => <button type="button" key={item.value} onClick={() => setType(item.value)} className={`rounded-xl border px-2 py-2 text-xs ${type === item.value ? "border-stone-900 bg-stone-900 text-white" : "border-stone-200 bg-stone-50 text-stone-700"}`}>{item.label}</button>)}</div></div>
        {(type === "pages" || type === "mixed") && <label className="block text-xs font-medium text-stone-600">Pagine totali<input type="number" min="1" value={pages} onChange={(event) => setPages(event.target.value)} className="mt-1 w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm" placeholder="Es. 240" /></label>}
        {(type === "notes" || type === "mixed") && <label className="block text-xs font-medium text-stone-600">Note<textarea value={notes} onChange={(event) => setNotes(event.target.value)} className="mt-1 min-h-20 w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm" placeholder="Argomenti o capitoli da studiare" /></label>}
        {type === "pdf" && <p className="flex items-center gap-2 rounded-xl bg-stone-50 p-3 text-xs text-stone-500"><FileText size={15} />Il PDF potrà essere collegato dalla scheda dell'esame.</p>}
        {error && <p className="text-xs text-rose-600">{error}</p>}
        <button type="button" onClick={add} className="flex w-full items-center justify-center gap-2 rounded-xl bg-stone-900 py-3.5 text-sm font-semibold text-white"><Plus size={16} />Aggiungi esame</button>
      </div>
    </motion.div>
  </>}</AnimatePresence>
}
