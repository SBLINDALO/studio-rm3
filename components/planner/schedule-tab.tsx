"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown, GraduationCap, BookOpen, RotateCw, MapPin, X, Check } from "lucide-react"
import { WEEKS, DAILY, C, SUBJECTS, PHASE_COLOR } from "@/lib/planner/data"
import { getTodayStr } from "@/lib/planner/helpers"
import { SubjectIcon } from "./subject-icon"
import { StudyDocViewer } from "./study-doc-viewer"
import { getCatchupCountForDay, getDayItems } from "@/lib/planner/catchup"
import type { PlannerData, SubjectKey, StudyDoc } from "@/lib/planner/types"

interface Props {
  data: PlannerData
  toggleDaily: (day: string, ti: number) => void
  toggleCatchupDone: (id: string) => void
  attachDoc: (key: string, doc: StudyDoc) => void
  removeDoc: (key: string) => void
  skippedByDay: Record<string, number>
}

export function ScheduleTab({ data, toggleDaily, toggleCatchupDone, attachDoc, removeDoc, skippedByDay }: Props) {
  const [openWeek, setOpenWeek] = useState<number>(0)
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const todayKey = getTodayStr()
  const allStudyDays = Object.keys(DAILY).sort()

  return (
    <div className="space-y-2.5">
      <p className="px-0.5 text-[12px] leading-relaxed text-stone-600">
        Tocca una settimana per espanderla. Domeniche 3h · Ven/Sab liberi.
      </p>

      {WEEKS.map((wk, wi) => {
        const isOpen = openWeek === wi
        const weekDays = allStudyDays.filter((d) => DAILY[d]?.week === wi)
        const phaseColor = PHASE_COLOR[wk.phase]

        return (
          <motion.article
            key={wi}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: wi * 0.025 }}
            className="card-quiet overflow-hidden"
          >
            {/* Week header */}
            <button
              onClick={() => setOpenWeek(isOpen ? -1 : wi)}
              className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left"
              style={{
                background: `color-mix(in oklch, ${phaseColor} 12%, white)`,
                borderBottom: isOpen ? "1px solid var(--border-subtle)" : "none",
              }}
            >
              <div>
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
                {wk.focus && (
                  <div className="mt-0.5 text-[11px] text-stone-600">{wk.focus}</div>
                )}
              </div>
              <motion.span
                animate={{ rotate: isOpen ? 180 : 0 }}
                transition={{ duration: 0.2 }}
                className="text-stone-400"
              >
                <ChevronDown size={16} strokeWidth={2} />
              </motion.span>
            </button>

            {/* Days list */}
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.22 }}
                  className="overflow-hidden bg-[var(--bg-subtle)]"
                >
                  <div className="space-y-1.5 p-2">
                    {weekDays.map((dayStr) => {
                      const d = DAILY[dayStr]

                      if (d.busy) {
                        return (
                          <div
                            key={dayStr}
                            className="flex items-center gap-2 rounded-lg border border-dashed border-stone-300 bg-stone-100/60 px-3 py-2"
                          >
                            <X size={11} className="text-stone-400" strokeWidth={2} />
                            <span className="text-[11.5px] text-stone-500">
                              {d.label} — Sport / Lavoro
                            </span>
                          </div>
                        )
                      }

                      const isExamDay = d.exam
                      const isSel = selectedDay === dayStr
                      const dayItems = getDayItems(dayStr, data)
                      const doneTasks = dayItems.filter((it) => it.done).length
                      const catchupOnDay = getCatchupCountForDay(dayStr, data)
                      const skippedOnDay = skippedByDay[dayStr] ?? 0
                      const isPast = dayStr < todayKey
                      const isToday = dayStr === todayKey
                      const colSub = isExamDay && d.sub ? C[d.sub as SubjectKey] : null

                      return (
                        <div
                          key={dayStr}
                          className="overflow-hidden rounded-xl border bg-white"
                          style={
                            isToday
                              ? { borderColor: "#94A3B8" }
                              : isExamDay && colSub
                                ? { borderColor: colSub.border }
                                : isSel
                                  ? { borderColor: "var(--border-strong)" }
                                  : { borderColor: "var(--border-subtle)" }
                          }
                        >
                          {/* Day row header */}
                          <button
                            onClick={() => setSelectedDay(selectedDay === dayStr ? null : dayStr)}
                            className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left"
                            style={{
                              background:
                                isExamDay && colSub
                                  ? colSub.soft
                                  : isSel
                                    ? "var(--bg-subtle)"
                                    : "white",
                            }}
                          >
                            <div className="flex-1 min-w-0">
                              <div
                                className="flex items-center gap-1.5 text-[12px] font-medium"
                                style={{
                                  color: isExamDay && colSub ? colSub.text : "#0F172A",
                                }}
                              >
                                {isExamDay ? (
                                  <GraduationCap size={13} strokeWidth={2} />
                                ) : (
                                  <BookOpen size={12} strokeWidth={2} />
                                )}
                                <span className="font-semibold">{d.label}</span>
                                {isToday && (
                                  <span className="ml-2 inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-800">
                                    OGGI
                                  </span>
                                )}
                                {d.sunday && (
                                  <RotateCw size={10} strokeWidth={2} className="text-stone-400" />
                                )}
                                {isExamDay && (
                                  <span className="font-normal text-stone-600">
                                    — {d.type} {d.time}
                                  </span>
                                )}
                              </div>

                              {isExamDay && d.examLabel && (
                                <div
                                  className="mt-0.5 text-[10.5px] font-medium"
                                  style={{ color: colSub?.text }}
                                >
                                  {d.examLabel}
                                </div>
                              )}

                              {!isExamDay && (
                                <div className="mt-1.5 flex flex-wrap items-center gap-1">
                                  {d.hours && (
                                    <span className="rounded-md bg-stone-100 px-1.5 py-0.5 text-[9.5px] font-medium text-stone-600">
                                      {d.hours}
                                    </span>
                                  )}
                                  {d.note && (
                                    <span className="rounded-md bg-amber-50 px-1.5 py-0.5 text-[9.5px] font-medium text-amber-800">
                                      {d.note}
                                    </span>
                                  )}
                                  <div className="flex gap-0.5">
                                    {[...new Set(dayItems.map((s) => s.sub))].map((k) => (
                                      <span
                                        key={k}
                                        style={{ color: C[k as SubjectKey].dot }}
                                        className="flex items-center"
                                      >
                                        <SubjectIcon sub={k as SubjectKey} size={11} strokeWidth={2} />
                                      </span>
                                    ))}
                                  </div>
                                  {dayItems.length > 0 && (
                                    <span
                                      className={`rounded-md px-1.5 py-0.5 text-[9.5px] font-medium tabular-nums ${
                                        doneTasks === dayItems.length && dayItems.length > 0
                                          ? "bg-emerald-100 text-emerald-800"
                                          : "bg-stone-100 text-stone-600"
                                      }`}
                                    >
                                      {doneTasks}/{dayItems.length}
                                    </span>
                                  )}
                                  {catchupOnDay > 0 && (
                                    <span className="flex items-center gap-0.5 rounded-md bg-amber-100 px-1.5 py-0.5 text-[9.5px] font-medium text-amber-800">
                                      <RotateCw size={8} strokeWidth={2.5} />+{catchupOnDay}
                                    </span>
                                  )}
                                  {isPast && skippedOnDay > 0 && (
                                    <span className="flex items-center gap-0.5 rounded-md bg-rose-100 px-1.5 py-0.5 text-[9.5px] font-medium text-rose-800">
                                      <X size={8} strokeWidth={2.5} />{skippedOnDay} saltato{skippedOnDay > 1 ? "i" : ""}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>

                            <motion.span
                              animate={{ rotate: isSel ? 180 : 0 }}
                              transition={{ duration: 0.2 }}
                              className="flex-shrink-0 text-stone-400"
                            >
                              <ChevronDown size={13} strokeWidth={2} />
                            </motion.span>
                          </button>

                          {/* Expanded day content */}
                          <AnimatePresence initial={false}>
                            {isSel && dayItems.length > 0 && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.18 }}
                                className="overflow-hidden border-t border-[var(--border-subtle)]"
                              >
                                <div className="space-y-1.5 p-2">
                                  {isExamDay && d.examNote && (
                                    <div className="flex gap-2 rounded-lg border border-amber-200/70 bg-amber-50/60 p-2.5 text-[11.5px] text-amber-900">
                                      <MapPin size={12} strokeWidth={2} className="mt-0.5 flex-shrink-0 text-amber-600" />
                                      {d.examNote}
                                    </div>
                                  )}

                                  {dayItems.map((s) => {
                                    const done = s.done
                                    const isCatchup = s.kind === "catchup"
                                    const docKey = isCatchup ? s.catchupId! : `${dayStr}_${s.plannedIdx!}`
                                    return (
                                      <motion.div
                                        key={isCatchup ? `c_${s.catchupId}` : `p_${s.plannedIdx}`}
                                        className="relative overflow-hidden rounded-lg border border-[var(--border-subtle)] p-2.5 text-left transition-colors"
                                        style={{
                                          background: done
                                            ? "#F0FDF4"
                                            : isCatchup
                                              ? "#FFFBEB"
                                              : "white",
                                          borderLeftWidth: 3,
                                          borderLeftColor: C[s.sub].dot,
                                        }}
                                      >
                                        <button
                                          onClick={() => {
                                            if (isCatchup && s.catchupId) toggleCatchupDone(s.catchupId)
                                            else if (s.plannedIdx !== undefined) toggleDaily(dayStr, s.plannedIdx)
                                          }}
                                          className="flex w-full items-start gap-2 text-left"
                                        >
                                          <span
                                            className={`mt-0.5 flex h-4.5 w-4.5 flex-shrink-0 items-center justify-center rounded-full transition-colors ${
                                              done
                                                ? "bg-emerald-500"
                                                : "border border-stone-300 bg-white"
                                            }`}
                                            style={{ width: 18, height: 18 }}
                                          >
                                            {done && (
                                              <Check size={10} className="text-white" strokeWidth={3} />
                                            )}
                                          </span>
                                          <span className="flex-1 min-w-0">
                                            <span
                                              className="flex flex-wrap items-center gap-1 text-[10px] font-medium"
                                              style={{ color: C[s.sub].text }}
                                            >
                                              <SubjectIcon sub={s.sub} size={10} strokeWidth={2} />
                                              <span>{SUBJECTS[s.sub].short}</span>
                                              <span className="text-stone-400">· {s.dur}</span>
                                              {isCatchup && (
                                                <span className="inline-flex items-center gap-0.5 rounded bg-amber-100 px-1 py-0.5 text-[8.5px] font-medium uppercase tracking-wider text-amber-800">
                                                  <RotateCw size={7} strokeWidth={2.5} />
                                                  Recupero
                                                </span>
                                              )}
                                            </span>
                                            <span
                                              className={`mt-0.5 block text-[11.5px] leading-snug ${
                                                done
                                                  ? "text-stone-400 line-through"
                                                  : "text-stone-700"
                                              }`}
                                            >
                                              {s.topic}
                                              {isCatchup && s.origDay && (
                                                <span className="ml-1.5 text-[10px] text-amber-700">
                                                  ↺ da {DAILY[s.origDay]?.label ?? s.origDay}
                                                </span>
                                              )}
                                            </span>
                                          </span>
                                        </button>
                                        <StudyDocViewer
                                          sessionKey={docKey}
                                          sub={s.sub}
                                          doc={data.docs?.[docKey]}
                                          onAttach={attachDoc}
                                          onRemove={removeDoc}
                                        />
                                      </motion.div>
                                    )
                                  })}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      )
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.article>
        )
      })}
    </div>
  )
}
