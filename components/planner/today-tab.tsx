"use client"

import { motion } from "framer-motion"
import { Check, CalendarClock, Timer as TimerIcon, CheckCircle2, RotateCw, ArrowRight } from "lucide-react"
import { SUBJECTS, C, TODAY_STR, BOOKINGS } from "@/lib/planner/data"
import { SubjectIcon } from "./subject-icon"
import { SkippedBanner } from "./skipped-banner"
import { StudyDocViewer } from "./study-doc-viewer"
import { daysUntil, fmtDuration } from "@/lib/planner/helpers"
import { getDayItems } from "@/lib/planner/catchup"
import type { SubjectKey, PlannerData, StudyDoc } from "@/lib/planner/types"
import type { TabId } from "./tabs-nav"

interface Props {
  data: PlannerData
  toggleDaily: (day: string, ti: number) => void
  toggleCatchupDone: (id: string) => void
  attachDoc: (key: string, doc: StudyDoc) => void
  removeDoc: (key: string) => void
  todayFocusMin: number
  todayFocusCount: number
  skippedCount: number
  onOpenCatchup: () => void
  onNavigate: (t: TabId) => void
}

export function TodayTab({
  data,
  toggleDaily,
  toggleCatchupDone,
  attachDoc,
  removeDoc,
  todayFocusMin,
  todayFocusCount,
  skippedCount,
  onOpenCatchup,
  onNavigate,
}: Props) {
  const items = getDayItems(TODAY_STR, data)
  const upcomingBooking = BOOKINGS.find((b) => {
    const d = daysUntil(b.date)
    return d !== null && d >= 0
  })

  return (
    <div className="space-y-5">
      <SkippedBanner count={skippedCount} onOpen={onOpenCatchup} />

      {/* Greeting card */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="card-quiet p-4"
      >
        <div className="text-[10px] font-medium uppercase tracking-[0.14em] text-stone-500">
          Lunedì 20 Aprile · Giorno 1 di 54
        </div>
        <h2 className="mt-1.5 text-[22px] font-semibold tracking-tight text-stone-900">
          Buono studio
        </h2>
        <div className="mt-0.5 text-[12px] text-stone-500">
          Fase 1 — Studio di base · 5 materie · 5–6 ore
        </div>
        {todayFocusMin > 0 && (
          <div className="mt-3 flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-[12px] text-emerald-900">
            <TimerIcon size={13} strokeWidth={2.25} className="text-emerald-600" />
            <span>
              Oggi hai studiato <strong className="font-semibold tabular-nums">{fmtDuration(todayFocusMin)}</strong>
              {" · "}
              <span className="tabular-nums">{todayFocusCount}</span>{" "}
              {todayFocusCount === 1 ? "sessione" : "sessioni"}
            </span>
          </div>
        )}
      </motion.div>

      {/* Countdown grid */}
      <section>
        <h3 className="mb-2 px-0.5 text-[10px] font-medium uppercase tracking-[0.14em] text-stone-500">
          Giorni agli esami
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {(Object.entries(SUBJECTS) as [SubjectKey, (typeof SUBJECTS)[SubjectKey]][]).map(([k, s], i) => {
            const d = daysUntil(s.examISO)
            const urgent = d !== null && d <= 7
            return (
              <motion.div
                key={k}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="card-quiet relative overflow-hidden p-3"
              >
                <div
                  className="absolute left-0 top-0 h-full w-0.5"
                  style={{ background: C[k].dot }}
                  aria-hidden
                />
                <div
                  className="flex items-center gap-1.5 text-[10px] font-medium tracking-tight"
                  style={{ color: C[k].text }}
                >
                  <SubjectIcon sub={k} size={11} strokeWidth={1.75} />
                  <span className="truncate">{s.short}</span>
                </div>
                <div
                  className={`mt-0.5 text-[28px] font-semibold tabular-nums tracking-tight ${
                    urgent ? "text-rose-600" : "text-stone-900"
                  }`}
                >
                  {d ?? "—"}
                </div>
                <div className="text-[10px] text-stone-500">
                  {d !== null ? `giorni · ${s.examDate}` : s.examDate}
                </div>
              </motion.div>
            )
          })}
        </div>
      </section>

      {/* Today's program */}
      <section>
        <h3 className="mb-2 px-0.5 text-[10px] font-medium uppercase tracking-[0.14em] text-stone-500">
          Programma di oggi
        </h3>
        <div className="space-y-1.5">
          {items.map((task, i) => {
            const done = task.done
            const isCatchup = task.kind === "catchup"
            const docKey = isCatchup ? task.catchupId! : `${TODAY_STR}_${task.plannedIdx!}`
            return (
              <motion.div
                key={isCatchup ? `c_${task.catchupId}` : `p_${task.plannedIdx}`}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="card-quiet card-quiet-hover relative flex w-full items-start gap-3 overflow-hidden p-3"
              >
                <div
                  className="absolute left-0 top-0 h-full w-[3px]"
                  style={{ background: C[task.sub].dot }}
                  aria-hidden
                />
                <button
                  onClick={() => {
                    if (isCatchup && task.catchupId) toggleCatchupDone(task.catchupId)
                    else if (task.plannedIdx !== undefined) toggleDaily(TODAY_STR, task.plannedIdx)
                  }}
                  className="flex items-start gap-3 text-left flex-1 min-w-0"
                >
                  <span
                    className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full transition-colors ${
                      done
                        ? "bg-emerald-500"
                        : "border-[1.5px] border-stone-300 bg-white"
                    }`}
                    aria-hidden
                  >
                    {done && <Check size={12} className="text-white" strokeWidth={3} />}
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-1.5 text-[10.5px] font-medium">
                      <span
                        className="flex items-center gap-1"
                        style={{ color: C[task.sub].text }}
                      >
                        <SubjectIcon sub={task.sub} size={11} strokeWidth={1.75} />
                        {SUBJECTS[task.sub].short}
                      </span>
                      <span className="text-stone-400">·</span>
                      <span className="text-stone-500">{task.dur}</span>
                      {isCatchup && (
                        <span className="ml-1 inline-flex items-center gap-0.5 rounded-md bg-amber-100 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider text-amber-800">
                          <RotateCw size={8} strokeWidth={2.5} />
                          Recupero
                        </span>
                      )}
                    </span>
                    <span
                      className={`mt-1 block text-[13px] leading-snug ${
                        done ? "text-stone-400 line-through" : "text-stone-800"
                      }`}
                    >
                      {task.topic}
                    </span>
                  </span>
                </button>
                <StudyDocViewer
                  sessionKey={docKey}
                  sub={task.sub}
                  doc={data.docs?.[docKey]}
                  onAttach={attachDoc}
                  onRemove={removeDoc}
                />
              </motion.div>
            )
          })}
        </div>
      </section>

      {/* Primary actions */}
      <div className="grid grid-cols-2 gap-2">
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => onNavigate("timer")}
          className="group flex items-center justify-center gap-1.5 rounded-xl bg-stone-900 px-4 py-3 text-[13px] font-medium text-white shadow-sm transition-all hover:bg-stone-800 hover:shadow"
        >
          <TimerIcon size={14} strokeWidth={2} />
          <span>Avvia Timer</span>
          <ArrowRight
            size={13}
            strokeWidth={2}
            className="transition-transform group-hover:translate-x-0.5"
          />
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => onNavigate("tracker")}
          className="group flex items-center justify-center gap-1.5 rounded-xl border border-stone-200 bg-white px-4 py-3 text-[13px] font-medium text-stone-800 shadow-sm transition-all hover:border-stone-300 hover:bg-stone-50"
        >
          <CheckCircle2 size={14} strokeWidth={2} />
          <span>Argomenti</span>
        </motion.button>
      </div>

      {/* Next booking deadline — only when approaching */}
      {upcomingBooking && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="rounded-xl border border-amber-200/70 bg-amber-50/60 p-3"
        >
          <div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.12em] text-amber-800">
            <CalendarClock size={11} strokeWidth={2} />
            Prossima scadenza
          </div>
          <div className="mt-1 text-[12.5px] text-stone-800">
            <span className="font-semibold tabular-nums text-amber-900">{daysUntil(upcomingBooking.date)} giorni</span>
            <span className="text-stone-600"> · {upcomingBooking.label}</span>
          </div>
        </motion.div>
      )}
    </div>
  )
}
