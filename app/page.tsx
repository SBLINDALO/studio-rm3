"use client"

import { useMemo, useState } from "react"
import {
  Bell,
  BookOpen,
  ChevronDown,
  ChevronRight,
  Clock3,
  Info,
  LayoutGrid,
  MoreHorizontal,
  Settings2,
  Sparkles,
  Target,
  Users,
  Zap,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

type SlotType = "free" | "class" | "gym" | "work" | "personal"

const days = [
  { id: "lun", label: "Lunedì", short: "Lun", date: "14" },
  { id: "mar", label: "Martedì", short: "Mar", date: "15" },
  { id: "mer", label: "Mercoledì", short: "Mer", date: "16" },
  { id: "gio", label: "Giovedì", short: "Gio", date: "17" },
  { id: "ven", label: "Venerdì", short: "Ven", date: "18" },
  { id: "sab", label: "Sabato", short: "Sab", date: "19" },
  { id: "dom", label: "Domenica", short: "Dom", date: "20" },
]

const times = ["08:00", "10:00", "12:00", "14:00", "16:00", "18:00"]
const typeLabels: Record<SlotType, string> = {
  free: "Disponibile",
  class: "Lezione universitaria",
  gym: "Palestra",
  work: "Lavoro",
  personal: "Impegno personale",
}
const typeStyles: Record<SlotType, string> = {
  free: "bg-[#eef4ef] border-[#d4e5d7] text-[#467153]",
  class: "bg-[#fff0e7] border-[#f5c8ad] text-[#a45124]",
  gym: "bg-[#eaf2ff] border-[#c6d8f7] text-[#3566a5]",
  work: "bg-[#ffeded] border-[#f4c1c1] text-[#aa4848]",
  personal: "bg-[#f5edff] border-[#dec8f2] text-[#7746a5]",
}

const initialSchedule: Record<string, SlotType[]> = {
  lun: ["class", "class", "free", "free", "personal", "free"],
  mar: ["free", "class", "class", "free", "gym", "free"],
  mer: ["work", "work", "class", "class", "personal", "work"],
  gio: ["free", "free", "class", "free", "gym", "free"],
  ven: ["class", "free", "free", "work", "work", "free"],
  sab: ["free", "free", "free", "free", "free", "free"],
  dom: ["free", "free", "personal", "personal", "free", "free"],
}

function ScheduleBlock({ value, onChange }: { value: SlotType; onChange: (value: SlotType) => void }) {
  return (
    <div className={cn("group relative min-h-[76px] border p-2 transition-all hover:-translate-y-0.5 hover:shadow-sm", typeStyles[value])}>
      <select
        aria-label="Tipo di disponibilità"
        value={value}
        onChange={(event) => onChange(event.target.value as SlotType)}
        className="absolute inset-0 z-10 h-full w-full cursor-pointer appearance-none bg-transparent text-transparent outline-none"
      >
        {Object.entries(typeLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
      </select>
      <div className="pointer-events-none flex h-full flex-col justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-[0.08em] opacity-70">{value === "free" ? "Studio" : "Occupato"}</span>
        <span className="text-[11px] font-semibold leading-tight">{typeLabels[value]}</span>
      </div>
      <ChevronDown className="pointer-events-none absolute right-2 top-2 size-3 opacity-0 transition-opacity group-hover:opacity-60" />
    </div>
  )
}

export default function AvailabilityPage() {
  const [schedule, setSchedule] = useState(initialSchedule)
  const [saved, setSaved] = useState(false)

  const summaries = useMemo(() => days.map((day) => {
    const slots = schedule[day.id]
    const free = slots.filter((slot) => slot === "free").length
    return { ...day, free, occupied: 6 - free, score: Math.round((free / 6) * 100) }
  }), [schedule])

  const updateSlot = (day: string, index: number, value: SlotType) => {
    setSaved(false)
    setSchedule((current) => ({ ...current, [day]: current[day].map((slot, slotIndex) => slotIndex === index ? value : slot) }))
  }

  return (
    <main className="min-h-screen bg-[#f7f8f6] text-[#202522]">
      <div className="flex min-h-screen">
        <aside className="hidden w-[248px] shrink-0 border-r border-[#e5e9e4] bg-white px-5 py-6 lg:flex lg:flex-col">
          <div className="flex items-center gap-3 px-2">
            <div className="flex size-9 items-center justify-center rounded-xl bg-[#183b2b] text-white shadow-sm"><BookOpen className="size-4" /></div>
            <div><p className="text-sm font-bold tracking-tight">Piano Studio</p><p className="text-[11px] text-[#8a938d]">Università personale</p></div>
          </div>
          <nav className="mt-10 flex flex-col gap-1 text-sm" aria-label="Navigazione principale">
            <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.14em] text-[#a3aaa5]">Workspace</p>
            {[[LayoutGrid, "Panoramica"], [Target, "I miei esami"], [Clock3, "Piano di studio"]].map(([Icon, label], index) => <button key={label as string} className={cn("flex h-11 items-center gap-3 rounded-xl px-3 text-left transition-colors", index === 2 ? "bg-[#edf4ef] font-semibold text-[#24583d]" : "text-[#66716a] hover:bg-[#f5f7f4]")}><Icon className="size-[17px]" />{label as string}</button>)}
            <p className="mb-2 mt-8 px-3 text-[10px] font-bold uppercase tracking-[0.14em] text-[#a3aaa5]">Strumenti</p>
            <button className="flex h-11 items-center gap-3 rounded-xl px-3 text-left text-[#66716a] hover:bg-[#f5f7f4]"><Users className="size-[17px]" />Sessioni condivise</button>
            <button className="flex h-11 items-center gap-3 rounded-xl px-3 text-left text-[#66716a] hover:bg-[#f5f7f4]"><Settings2 className="size-[17px]" />Impostazioni</button>
          </nav>
          <div className="mt-auto rounded-2xl bg-[#f2f7f3] p-4"><div className="mb-3 flex items-center gap-2"><Sparkles className="size-4 text-[#6b9b79]" /><span className="text-xs font-bold text-[#28583a]">Planner AI</span></div><p className="text-xs leading-relaxed text-[#64806d]">Più conosce le tue settimane, meglio distribuisce gli argomenti.</p></div>
        </aside>

        <section className="min-w-0 flex-1">
          <header className="flex h-[72px] items-center justify-between border-b border-[#e5e9e4] bg-white/80 px-5 backdrop-blur md:px-8">
            <div className="flex items-center gap-3 lg:hidden"><div className="flex size-8 items-center justify-center rounded-lg bg-[#183b2b] text-white"><BookOpen className="size-4" /></div><span className="text-sm font-bold">Piano Studio</span></div>
            <div className="hidden text-sm text-[#7f8982] lg:block">Impostazioni <ChevronRight className="mx-2 inline size-3" /> <span className="font-semibold text-[#29332d]">Disponibilità settimanale</span></div>
            <div className="flex items-center gap-2"><button className="flex size-10 items-center justify-center rounded-xl text-[#7c867f] hover:bg-[#f2f4f1]" aria-label="Notifiche"><Bell className="size-[18px]" /></button><div className="flex size-9 items-center justify-center rounded-full bg-[#dcebe0] text-xs font-bold text-[#28583a]">MR</div></div>
          </header>

          <div className="mx-auto max-w-[1440px] px-5 py-7 md:px-8 md:py-10">
            <div className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end"><div><div className="mb-3 flex items-center gap-2"><Badge variant="secondary" className="rounded-full bg-[#e6f0e8] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#39704d]">Configurazione AI</Badge><span className="text-xs text-[#9ba39d]">Settimana ricorrente</span></div><h1 className="text-[28px] font-bold tracking-[-0.04em] text-[#1d2721] md:text-[34px]">Disponibilità settimanale</h1><p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#78827b]">Indica quando sei libero o impegnato. Il planner userà questa capacità per distribuire gli <strong className="font-semibold text-[#536159]">argomenti</strong>, non le ore di studio.</p></div><Button onClick={() => setSaved(true)} className="h-11 rounded-xl bg-[#183b2b] px-5 text-sm font-semibold shadow-sm hover:bg-[#28583a]">{saved ? "Salvato" : "Salva disponibilità"}</Button></div>

            <div className="mb-6 flex items-start gap-3 rounded-2xl border border-[#dbe9de] bg-[#f0f7f1] p-4"><div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-[#d8ebdc] text-[#438257]"><Info className="size-4" /></div><div><p className="text-sm font-bold text-[#315b3e]">Il planner ragiona per capacità</p><p className="mt-1 text-xs leading-relaxed text-[#6b8672]">Più blocchi liberi hai in un giorno, più argomenti potrà assegnarti. Gli impegni riducono la capacità disponibile, ma non vengono trasformati in ore di studio.</p></div></div>

            <Card className="overflow-hidden rounded-2xl border-[#e4e9e4] shadow-[0_8px_30px_rgba(26,44,31,0.04)]"><CardHeader className="flex flex-row items-center justify-between border-b border-[#edf0ed] px-5 py-5 md:px-6"><div><CardTitle className="text-base">La tua settimana</CardTitle><p className="mt-1 text-xs text-[#8b958e]">Clicca su un blocco per modificare il tipo di attività</p></div><button className="flex size-9 items-center justify-center rounded-lg text-[#9ca59e] hover:bg-[#f5f7f4]" aria-label="Altre opzioni"><MoreHorizontal className="size-5" /></button></CardHeader><CardContent className="overflow-x-auto p-0"><div className="min-w-[870px] p-4 md:p-6"><div className="grid grid-cols-[68px_repeat(7,minmax(96px,1fr))] gap-1.5"><div />{days.map((day, index) => <div key={day.id} className={cn("rounded-xl px-2 py-2 text-center", index === 0 && "bg-[#f1f6f2]")}><p className="text-[11px] font-semibold text-[#7e8981]">{day.label}</p><p className="mt-1 text-lg font-bold tracking-tight text-[#27332b]">{day.date}</p></div>)}{times.map((time, timeIndex) => <div key={time} className="contents"><div className="flex items-start justify-end pr-3 pt-3 text-[10px] font-semibold text-[#a1aaa3]">{time}</div>{days.map((day) => <ScheduleBlock key={`${day.id}-${time}`} value={schedule[day.id][timeIndex]} onChange={(value) => updateSlot(day.id, timeIndex, value)} />)}</div>)}</div><div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-[#edf0ed] pt-4 text-[10px] font-semibold text-[#7d877f]"><span className="mr-1 text-[#a2aaa4]">LEGENDA</span>{Object.entries(typeLabels).map(([key, label]) => <span key={key} className="flex items-center gap-1.5"><i className={cn("size-2 rounded-full", key === "free" ? "bg-[#8fba99]" : key === "class" ? "bg-[#e9915d]" : key === "gym" ? "bg-[#6d9ce0]" : key === "work" ? "bg-[#e07979]" : "bg-[#ad7bd3]")} />{label}</span>)}</div></div></CardContent></Card>

            <div className="mt-6 grid gap-6 xl:grid-cols-[1.35fr_0.65fr]"><Card className="rounded-2xl border-[#e4e9e4] shadow-[0_8px_30px_rgba(26,44,31,0.04)]"><CardHeader className="px-5 pb-3 pt-5 md:px-6"><div className="flex items-center justify-between"><div><CardTitle className="text-base">Riepilogo capacità</CardTitle><p className="mt-1 text-xs text-[#8b958e]">Quanto spazio resta per gli argomenti, giorno per giorno</p></div><Badge variant="outline" className="rounded-full border-[#dbe5dd] text-[10px] text-[#6c8172]">{summaries.reduce((total, item) => total + item.free, 0)} blocchi liberi</Badge></div></CardHeader><CardContent className="grid gap-3 px-5 pb-5 md:grid-cols-2 md:px-6">{summaries.map((item) => <div key={item.id} className="rounded-xl border border-[#edf0ed] bg-[#fcfdfc] p-3"><div className="mb-2 flex items-center justify-between"><span className="text-xs font-bold text-[#445149]">{item.label}</span><span className={cn("text-[11px] font-bold", item.score >= 65 ? "text-[#47805a]" : item.score >= 35 ? "text-[#a47636]" : "text-[#b25b5b]")}>{item.score}%</span></div><Progress value={item.score} className="h-1.5 bg-[#edf1ed]" /><div className="mt-2 flex justify-between text-[10px] text-[#9aa39c]"><span>{item.free} liberi</span><span>{item.occupied} occupati</span></div></div>)}</CardContent></Card>

              <Card className="rounded-2xl border-[#d8e8db] bg-[#f0f7f1] shadow-[0_8px_30px_rgba(26,44,31,0.04)]"><CardHeader className="px-5 pb-2 pt-5"><div className="flex items-center gap-2"><div className="flex size-8 items-center justify-center rounded-lg bg-[#d9ecdc] text-[#47815a]"><Zap className="size-4" /></div><div><CardTitle className="text-base text-[#2d5439]">AI workload distribution</CardTitle><p className="text-[11px] text-[#76917c]">Anteprima del comportamento</p></div></div></CardHeader><CardContent className="px-5 pb-5"><Separator className="mb-3 bg-[#dbe9dd]" /><div className="flex flex-col gap-3">{summaries.filter((item) => ["lun", "mer", "sab"].includes(item.id)).map((item) => <div key={item.id} className="flex items-center justify-between"><span className="text-xs font-semibold text-[#526e5b]">{item.label}</span><span className={cn("rounded-full px-2.5 py-1 text-[10px] font-bold", item.score >= 65 ? "bg-[#d8ebdc] text-[#3e7951]" : item.score >= 35 ? "bg-[#f4ead3] text-[#997331]" : "bg-[#f6dddd] text-[#a55757]")}>{item.score >= 65 ? "Alta disponibilità" : item.score >= 35 ? "Disponibilità media" : "Molto bassa"}</span></div>)}</div><div className="mt-5 rounded-xl border border-[#d9e8dc] bg-white/60 p-3"><p className="text-xs leading-relaxed text-[#64806d]"><strong className="font-bold text-[#3f684b]">Il risultato:</strong> sabato riceverà più argomenti, mentre mercoledì ne riceverà meno per rispettare i tuoi impegni.</p></div></CardContent></Card></div>
          </div>
        </section>
      </div>
    </main>
  )
}
