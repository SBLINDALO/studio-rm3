"use client"

import { useState } from "react"
import type { Cfu, Exam, ExamKind } from "@/lib/planner/types-exam"

interface ExamManagerProps {
  exams: Exam[]
  onAdd: (exam: Omit<Exam, "id" | "createdAt">) => void
  onRemove: (id: string) => void
  onMarkAheadForTomorrow: (examId: string, date: string) => void
  onManualOverride: (examId: string, date: string, hours: number) => void
}

export function ExamManager({ exams, onAdd, onRemove, onMarkAheadForTomorrow }: ExamManagerProps) {
  const [name, setName] = useState("")
  const [date, setDate] = useState("")
  const [time, setTime] = useState("09:00")
  const [type, setType] = useState<ExamKind>("Scritto")
  const [cfu, setCfu] = useState<Cfu>(6)
  const [topicsRaw, setTopicsRaw] = useState("")

  function submit() {
    if (!name || !date) return
    onAdd({
      name,
      abbreviation: name.slice(0, 4).toUpperCase(),
      date,
      time,
      type,
      cfu,
      color: "indigo",
      topics: topicsRaw.split(",").map((topic) => topic.trim()).filter(Boolean),
    })
    setName("")
    setDate("")
    setTopicsRaw("")
  }

  return (
    <div className="space-y-4 p-4">
      <div className="space-y-3 rounded-2xl bg-white p-4 shadow-sm">
        <input
          placeholder="Nome esame"
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="w-full rounded-xl border p-2"
        />
        <div className="flex gap-2">
          <input
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            className="flex-1 rounded-xl border p-2"
          />
          <input
            type="time"
            value={time}
            onChange={(event) => setTime(event.target.value)}
            className="w-28 rounded-xl border p-2"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={type}
            onChange={(event) => setType(event.target.value as ExamKind)}
            className="flex-1 rounded-xl border p-2"
          >
            <option>Scritto</option>
            <option>Orale</option>
          </select>
          <select
            value={cfu}
            onChange={(event) => setCfu(Number(event.target.value) as Cfu)}
            className="flex-1 rounded-xl border p-2"
          >
            <option value={6}>6 CFU</option>
            <option value={12}>12 CFU</option>
          </select>
        </div>
        <textarea
          placeholder="Argomenti separati da virgola"
          value={topicsRaw}
          onChange={(event) => setTopicsRaw(event.target.value)}
          className="w-full rounded-xl border p-2"
        />
        <button onClick={submit} className="w-full rounded-xl bg-indigo-600 py-2 text-white">
          Aggiungi esame
        </button>
      </div>

      <div className="space-y-2">
        {exams.map((exam) => (
          <div key={exam.id} className="flex items-center justify-between rounded-xl bg-white p-3 shadow-sm">
            <div>
              <p className="font-medium">
                {exam.name} · {exam.cfu} CFU
              </p>
              <p className="text-sm text-neutral-500">
                {exam.date} · {exam.type}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => onMarkAheadForTomorrow(exam.id, new Date().toISOString().slice(0, 10))}
                className="rounded-lg bg-amber-100 px-2 py-1 text-xs text-amber-700"
                title="Ho studiato il doppio oggi: salta la sessione di domani"
              >
                Fatto il doppio →
              </button>
              <button
                onClick={() => onRemove(exam.id)}
                className="rounded-lg bg-red-100 px-2 py-1 text-xs text-red-700"
              >
                Rimuovi
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}