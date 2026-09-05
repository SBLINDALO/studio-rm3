"use client"

import { AnimatePresence, motion } from "framer-motion"
import { FileText, Save, X } from "lucide-react"
import { useEffect, useState } from "react"
import type { CustomExam, DynamicExam } from "@/lib/planner/types"
import { formatISODate } from "@/lib/planner/utils/dates"
import { SPRING_SHEET } from "@/lib/planner/motion"

interface Props {
  exam: CustomExam | null
  onClose: () => void
  onSave: (exam: DynamicExam, updates: Partial<Pick<DynamicExam, "name" | "examDate" | "startDate" | "material" | "examType" | "cfu" | "status">>) => void | Promise<void>
}

const materialTypes: Array<{ value: DynamicExam["material"]["type"]; label: string }> = [
  { value: "pages", label: "Pages" },
  { value: "pdf", label: "PDF" },
  { value: "notes", label: "Notes" },
  { value: "mixed", label: "Mix" },
]

const examTypes: Array<{ value: NonNullable<DynamicExam["examType"]>; label: string }> = [
  { value: "Scritto", label: "Scritto" },
  { value: "Orale", label: "Orale" },
]

const cfuOptions: Array<{ value: NonNullable<DynamicExam["cfu"]>; label: string }> = [
  { value: 6, label: "6" },
  { value: 12, label: "12" },
]

export function EditExamModal({ exam, onClose, onSave }: Props) {
  const [name, setName] = useState("")
  const [date, setDate] = useState("")
  const [startDate, setStartDate] = useState("")
  const [type, setType] = useState<DynamicExam["material"]["type"]>("pages")
  const [examType, setExamType] = useState<NonNullable<DynamicExam["examType"]>>("Scritto")
  const [cfu, setCfu] = useState<NonNullable<DynamicExam["cfu"]>>(6)
  const [pages, setPages] = useState("")
  const [notes, setNotes] = useState("")
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!exam) return
    setName(exam.name)
    setDate(exam.examISO)
    setStartDate(exam.startDate ?? "")
    setType(exam.material?.type ?? "pages")
    setExamType(exam.examType === "Orale" ? "Orale" : "Scritto")
    setCfu(exam.cfu === 12 ? 12 : 6)
    setPages(exam.material?.totalPages ? String(exam.material.totalPages) : "")
    setNotes(exam.material?.notes ?? "")
    setError("")
  }, [exam])

  if (!exam) return null

  const close = () => { setError(""); onClose() }

  const isPlanning = exam.status === "planning"
  // Un esame "planning" non ha ancora una data: la prima data salvata lo attiva
  const willActivate = isPlanning && !exam.examISO && !!date

  const save = async () => {
    if (!name.trim()) { setError("Inserisci il nome dell'esame"); return }
    if (!isPlanning && !date) { setError("Inserisci nome e data dell'esame"); return }
    if (startDate && date && startDate > date) { setError("L'inizio studio non può essere dopo la data dell'esame"); return }
    const material: DynamicExam["material"] = {
      type,
      totalPages: pages ? Number(pages) : undefined,
      notes: notes.trim() || undefined,
    }
    if (date && !material.totalPages && !material.notes && !(exam.material?.files?.length)) {
      setError("Aggiungi almeno una fonte di materiale")
      return
    }

    if (!exam.startDate || !exam.studyPlan || !exam.status) {
      setError("Dati esame incompleti, ricarica la pagina e riprova")
      return
    }

    const dynamicExam: DynamicExam = {
      id: exam.id,
      name: exam.name,
      startDate: exam.startDate,
      examDate: exam.examISO || null,
      examType: exam.examType === "Orale" ? "Orale" : "Scritto",
      cfu: exam.cfu === 12 ? 12 : 6,
      material: exam.material ?? { type: "notes" },
      studyPlan: exam.studyPlan,
      createdAt: exam.createdAt,
      status: exam.status,
    }

    setSaving(true)
    try {
      const updates: Partial<Pick<DynamicExam, "name" | "examDate" | "startDate" | "material" | "examType" | "cfu" | "status">> = { name: name.trim(), material, examType, cfu }
      if (date) updates.examDate = date
      if (startDate && startDate !== exam.startDate) updates.startDate = startDate
      if (willActivate) updates.status = "active"
      await onSave(dynamicExam, updates)
      close()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossibile salvare le modifiche")
    } finally {
      setSaving(false)
    }
  }

  return <AnimatePresence>{exam && <>
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={close} className="fixed inset-0 z-50 bg-black/35 backdrop-blur-md" />
    <motion.div
      initial={{ y: "100%", opacity: 0.5 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: "100%", opacity: 0.5 }}
      transition={SPRING_SHEET}
      drag="y"
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={{ top: 0, bottom: 0.2 }}
      onDragEnd={(_, info) => { if (info.offset.y > 120 || info.velocity.y > 550) close() }}
      className="glass-strong fixed bottom-0 left-0 right-0 z-50 mx-auto max-w-[680px] rounded-t-[var(--radius-2xl)] px-5 pb-[max(2.5rem,env(safe-area-inset-bottom))] pt-4"
    >
      <div className="mx-auto mb-3 h-1.5 w-11 rounded-full bg-stone-400/50" />
      <div className="flex items-center justify-between pb-3"><h2 className="text-[18px] font-semibold text-stone-900">Modifica esame</h2><button onClick={close} aria-label="Chiudi"><X size={18} /></button></div>
      <div className="space-y-3">
        <label className="block text-xs font-medium text-stone-600">Nome<input value={name} onChange={(event) => setName(event.target.value)} className="mt-1 w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm" placeholder="Es. Storia dell'arte" /></label>
        <label className="block text-xs font-medium text-stone-600">Data esame{isPlanning ? " (facoltativa)" : ""}<input type="date" value={date} onChange={(event) => setDate(event.target.value)} className="mt-1 w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm" />{willActivate && <span className="mt-1 block text-[11px] leading-snug text-emerald-700">L'esame passerà da "in programmazione" ad "attivo" e il piano di studio verrà calcolato ora.</span>}</label>
        <label className="block text-xs font-medium text-stone-600">Inizio studio<input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} className="mt-1 w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm" />{exam.startDate && exam.examISO && date > exam.examISO && exam.startDate < formatISODate(new Date()) && (!startDate || startDate === exam.startDate) && <span className="mt-1 block text-[11px] leading-snug text-amber-700">Data esame posticipata: l'inizio studio verrà riportato a oggi e il piano ripartirà da adesso. Per conservare la cronologia passata, imposta manualmente l'inizio studio a oggi.</span>}</label>
        <div><p className="mb-1 text-xs font-medium text-stone-600">Tipo esame</p><div className="grid grid-cols-2 gap-2">{examTypes.map((item) => <button type="button" key={item.value} onClick={() => setExamType(item.value)} className={`rounded-xl border px-2 py-2 text-xs ${examType === item.value ? "border-stone-900 bg-stone-900 text-white" : "border-stone-200 bg-stone-50 text-stone-700"}`}>{item.label}</button>)}</div></div>
        <div><p className="mb-1 text-xs font-medium text-stone-600">CFU</p><div className="grid grid-cols-2 gap-2">{cfuOptions.map((item) => <button type="button" key={item.value} onClick={() => setCfu(item.value)} className={`rounded-xl border px-2 py-2 text-xs ${cfu === item.value ? "border-stone-900 bg-stone-900 text-white" : "border-stone-200 bg-stone-50 text-stone-700"}`}>{item.label}</button>)}</div></div>
        <div><p className="mb-1 text-xs font-medium text-stone-600">Materiale</p><div className="grid grid-cols-4 gap-2">{materialTypes.map((item) => <button type="button" key={item.value} onClick={() => setType(item.value)} className={`rounded-xl border px-2 py-2 text-xs ${type === item.value ? "border-stone-900 bg-stone-900 text-white" : "border-stone-200 bg-stone-50 text-stone-700"}`}>{item.label}</button>)}</div></div>
        {(type === "pages" || type === "mixed") && <label className="block text-xs font-medium text-stone-600">Pagine totali<input type="number" min="1" value={pages} onChange={(event) => setPages(event.target.value)} className="mt-1 w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm" placeholder="Es. 240" /></label>}
        {(type === "notes" || type === "mixed") && <label className="block text-xs font-medium text-stone-600">Note<textarea value={notes} onChange={(event) => setNotes(event.target.value)} className="mt-1 min-h-20 w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm" placeholder="Argomenti o capitoli da studiare" /></label>}
        {type === "pdf" && <p className="flex items-center gap-2 rounded-xl bg-stone-50 p-3 text-xs text-stone-500"><FileText size={15} />Il PDF potrà essere collegato dalla scheda dell'esame.</p>}
        {error && <p className="text-xs text-rose-600">{error}</p>}
        <button type="button" disabled={saving} onClick={save} className="flex w-full items-center justify-center gap-2 rounded-xl bg-stone-900 py-3.5 text-sm font-semibold text-white disabled:opacity-60"><Save size={16} />{saving ? "Salvataggio…" : "Salva modifiche"}</button>
      </div>
    </motion.div>
  </>}</AnimatePresence>
}
