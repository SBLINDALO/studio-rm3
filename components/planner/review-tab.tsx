"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Check, AlertTriangle, X, FileText } from "lucide-react"
import { WEEKS, SUBJECTS, C, PHASE_COLOR } from "@/lib/planner/data"
import { SubjectIcon } from "./subject-icon"
import type { PlannerData, SubjectKey } from "@/lib/planner/types"

interface Props {
  data: PlannerData
  setCheck: (key: string, value: number) => void
  setConf: (key: string, value: number) => void
  setNote: (weekIdx: number, value: string) => void
}

const QUESTIONS = [
  "Ho completato gli argomenti pianificati?",
  "Ho fatto almeno una simulazione o esercizio?",
]

const OPTIONS = [
  { label: "Sì", Icon: Check, toneActive: "bg-emerald-500 text-white", tone: "text-emerald-600" },
  { label: "In parte", Icon: AlertTriangle, toneActive: "bg-amber-500 text-white", tone: "text-amber-600" },
  { label: "No", Icon: X, toneActive: "bg-rose-500 text-white", tone: "text-rose-600" },
] as const

export function ReviewTab({ data, setCheck, setConf, setNote }: Props) {
  const [selectedWeek, setSelectedWeek] = useState(0)
  const wk = WEEKS[selectedWeek]
  const phaseColor = PHASE_COLOR[wk.phase]

  return (
    <div className="space-y-4">
      <p className="px-0.5 text-[12px] text-stone-600">
        Da compilare ogni domenica. I dati vengono salvati automaticamente.
      </p>

      {/* Week selector */}
      <div className="no-scrollbar flex gap-1.5 overflow-x-auto pb-1">
        {WEEKS.map((w, wi) => {
          const active = selectedWeek === wi
          return (
            <motion.button
              key={wi}
              whileTap={{ scale: 0.96 }}
              onClick={() => setSelectedWeek(wi)}
              className={`flex-shrink-0 rounded-full border px-3.5 py-1.5 text-[11.5px] font-medium transition-all ${
                active
                  ? "border-stone-900 bg-stone-900 text-white shadow-sm"
                  : "border-stone-200 bg-white text-stone-700 hover:bg-stone-50"
              }`}
            >
              S{wi + 1}
            </motion.button>
          )
        })}
      </div>

      <motion.article
        key={selectedWeek}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="card-quiet overflow-hidden"
      >
        <div
          className="border-b border-[var(--border-subtle)] px-4 py-3"
          style={{ background: `color-mix(in oklch, ${phaseColor} 10%, white)` }}
        >
          <div
            className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.14em]"
            style={{ color: phaseColor }}
          >
            <span
              className="inline-block h-1.5 w-1.5 rounded-full"
              style={{ background: phaseColor }}
              aria-hidden
            />
            {wk.phaseLabel}
          </div>
          <div className="mt-0.5 text-[14.5px] font-semibold text-stone-900">
            {wk.label} · {wk.dates}
          </div>
        </div>

        <div className="space-y-5 p-4">
          {/* Yes/No questions */}
          {QUESTIONS.map((q, qi) => (
            <div key={qi}>
              <div className="mb-2 text-[12.5px] font-medium text-stone-900">{q}</div>
              <div className="flex gap-1.5">
                {OPTIONS.map((opt, oi) => {
                  const k = `${selectedWeek}_q${qi}`
                  const sel = data.check[k] === oi
                  const Icon = opt.Icon
                  return (
                    <motion.button
                      key={oi}
                      whileTap={{ scale: 0.96 }}
                      onClick={() => setCheck(k, oi)}
                      className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-2 py-2.5 text-[12px] font-medium transition-all ${
                        sel
                          ? `${opt.toneActive} border-transparent shadow-sm`
                          : `border-stone-200 bg-white hover:bg-stone-50 ${opt.tone}`
                      }`}
                    >
                      <Icon size={12} strokeWidth={2.5} /> {opt.label}
                    </motion.button>
                  )
                })}
              </div>
            </div>
          ))}

          {/* Confidence per subject */}
          <div className="space-y-3 border-t border-[var(--border-subtle)] pt-4">
            <div className="text-[12.5px] font-medium text-stone-900">
              Confidenza per materia <span className="text-stone-500">(1–5)</span>
            </div>
            {(Object.entries(SUBJECTS) as [SubjectKey, (typeof SUBJECTS)[SubjectKey]][]).map(([k, s]) => {
              const confKey = `${selectedWeek}_${k}`
              const val = data.conf[confKey] || 0
              return (
                <div key={k}>
                  <div
                    className="mb-1.5 flex items-center gap-1.5 text-[11.5px] font-medium"
                    style={{ color: C[k].text }}
                  >
                    <SubjectIcon sub={k} size={11} strokeWidth={2} /> {s.short}
                  </div>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((v) => {
                      const active = val === v
                      return (
                        <motion.button
                          key={v}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => setConf(confKey, v)}
                          className="flex-1 rounded-md border py-2 text-[12px] font-semibold transition-all"
                          style={{
                            background: active ? C[k].dot : "white",
                            color: active ? "white" : C[k].text,
                            borderColor: active ? C[k].dot : "var(--border)",
                          }}
                        >
                          {v}
                        </motion.button>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Free notes */}
          <div className="border-t border-[var(--border-subtle)] pt-4">
            <label className="mb-2 flex items-center gap-1.5 text-[12.5px] font-medium text-stone-900">
              <FileText size={13} strokeWidth={2} /> Argomenti da recuperare
            </label>
            <textarea
              value={data.notes[selectedWeek] || ""}
              onChange={(e) => setNote(selectedWeek, e.target.value)}
              placeholder="Es: rivedere Fodor, Richardson Cap. 3..."
              className="min-h-[90px] w-full resize-y rounded-xl border border-stone-200 bg-stone-50/50 px-3 py-2.5 text-[13px] text-stone-800 placeholder:text-stone-400 transition-colors focus:border-stone-400 focus:bg-white focus:outline-none"
            />
          </div>
        </div>
      </motion.article>
    </div>
  )
}
