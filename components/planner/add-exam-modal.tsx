"use client"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Plus } from "lucide-react"
import type { CustomExam } from "@/lib/planner/types"
interface Props { open: boolean; onClose: () => void; onAdd: (e: CustomExam) => void }
const COLORS = [
  { bg:"#FFF1F2",border:"#FDA4AF",text:"#BE123C",dot:"#F43F5E",soft:"#FFFAFB" },
  { bg:"#EEF2FF",border:"#A5B4FC",text:"#3730A3",dot:"#6366F1",soft:"#F8FAFE" },
  { bg:"#FFFBEB",border:"#FCD34D",text:"#92400E",dot:"#F59E0B",soft:"#FFFCF4" },
  { bg:"#ECFDF5",border:"#6EE7B7",text:"#065F46",dot:"#10B981",soft:"#F7FCF9" },
  { bg:"#F5F3FF",border:"#C4B5FD",text:"#5B21B6",dot:"#8B5CF6",soft:"#FBF9FD" },
  { bg:"#F8FAFC",border:"#CBD5E1",text:"#475569",dot:"#64748B",soft:"#FBFAF8" },
]
export function AddExamModal({ open, onClose, onAdd }: Props) {
  const [name, setName] = useState("")
  const [short, setShort] = useState("")
  const [date, setDate] = useState("")
  const [time, setTime] = useState("")
  const [type, setType] = useState<"Scritto"|"Orale">("Scritto")
  const [ci, setCi] = useState(0)
  const [err, setErr] = useState("")
  const reset = () => { setName(""); setShort(""); setDate(""); setTime(""); setType("Scritto"); setCi(0); setErr("") }
  const close = () => { reset(); onClose() }
  const add = () => {
    if (!name.trim()) { setErr("Inserisci il nome"); return }
    if (!date) { setErr("Inserisci la data"); return }
    const d = new Date(date)
    const examDate = d.toLocaleDateString("it-IT",{weekday:"short",day:"numeric",month:"short"}).replace(/^\w/,c=>c.toUpperCase())
    onAdd({ id:`custom_${Date.now()}`, name:name.trim(), short:short.trim()||name.trim().slice(0,12), examDate, examTime:time||"—", examType:type, examISO:date, color:COLORS[ci], createdAt:Date.now() })
    reset(); onClose()
  }
  return (
    <AnimatePresence>
      {open && (<>
        <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={close} className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"/>
        <motion.div initial={{y:"100%"}} animate={{y:0}} exit={{y:"100%"}} transition={{type:"spring",stiffness:400,damping:35}} className="fixed bottom-0 left-0 right-0 z-50 mx-auto max-w-[680px] rounded-t-3xl bg-white px-5 pb-10 pt-4 shadow-2xl">
          <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-stone-300"/>
          <div className="flex items-center justify-between pb-3">
            <h2 className="text-[18px] font-semibold text-stone-900">Nuovo esame</h2>
            <button onClick={close} className="flex h-8 w-8 items-center justify-center rounded-full bg-stone-100 text-stone-500"><X size={15} strokeWidth={2}/></button>
          </div>
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-stone-500">Nome esame *</label>
              <input value={name} onChange={e=>setName(e.target.value)} placeholder="Es: Storia dell'Arte" className="w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-[14px] text-stone-900 placeholder:text-stone-400 focus:border-stone-400 focus:outline-none"/>
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-stone-500">Abbreviazione (max 12)</label>
              <input value={short} onChange={e=>setShort(e.target.value.slice(0,12))} placeholder="Es: Arte" className="w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-[14px] text-stone-900 placeholder:text-stone-400 focus:border-stone-400 focus:outline-none"/>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-stone-500">Data *</label>
                <input type="date" value={date} onChange={e=>setDate(e.target.value)} className="w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-[14px] text-stone-900 focus:border-stone-400 focus:outline-none"/>
              </div>
              <div>
                <label className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-stone-500">Ora</label>
                <input type="time" value={time} onChange={e=>setTime(e.target.value)} className="w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-[14px] text-stone-900 focus:border-stone-400 focus:outline-none"/>
              </div>
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-stone-500">Tipo</label>
              <div className="flex gap-3">
                {(["Scritto","Orale"] as const).map(t=>(
                  <button key={t} onClick={()=>setType(t)} className={`flex-1 rounded-xl border py-2.5 text-[13px] font-medium transition-all ${type===t?"border-stone-900 bg-stone-900 text-white":"border-stone-200 bg-stone-50 text-stone-700"}`}>{t}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-stone-500">Colore</label>
              <div className="flex gap-2.5">
                {COLORS.map((c,i)=>(
                  <button key={i} onClick={()=>setCi(i)} className={`h-7 w-7 rounded-full transition-all ${ci===i?"ring-2 ring-offset-2":"opacity-70"}`} style={{background:c.dot,outlineColor:c.dot}}/>
                ))}
              </div>
            </div>
            {err && <p className="text-[12px] text-rose-600">{err}</p>}
            <motion.button whileTap={{scale:0.98}} onClick={add} className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-stone-900 py-3.5 text-[15px] font-semibold text-white">
              <Plus size={16} strokeWidth={2.5}/>Aggiungi esame
            </motion.button>
          </div>
        </motion.div>
      </>)}
    </AnimatePresence>
  )
}
