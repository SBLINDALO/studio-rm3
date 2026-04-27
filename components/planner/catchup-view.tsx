"use client"

import { useMemo, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  X, AlertTriangle, Check, CalendarPlus, Trash2, Sparkles,
  ArrowRight, RotateCw, CheckCircle2, Clock, GraduationCap,
} from "lucide-react"
import { C, DAILY, SUBJECTS } from "@/lib/planner/data"
import {
  buildCatchupItems, dayLabel, proposeReschedule, scanSkipped, summarizeProposal,
} from "@/lib/planner/catchup"
import type { CatchupItem, PlannerData, SkippedItem } from "@/lib/planner/types"
import { daysUntil } from "@/lib/planner/helpers"
import { SubjectIcon } from "./subject-icon"

interface Props {
  open: boolean
  onClose: () => void
  data: PlannerData
  onMarkRecovered: (origDay: string, origIdx: number) => void
  onDismissSkipped: (origDay: string, origIdx: number) => void
  onAcceptCatchup: (items: CatchupItem[]) => void
  onRemoveCatchupItem: (id: string) => void
  onShowToast: (msg: string, tone?: "success" | "warn" | "info" | "default") => void
}

export function CatchupView({
  open, onClose, data,
  onMarkRecovered, onDismissSkipped, onAcceptCatchup, onRemoveCatchupItem, onShowToast,
}: Props) {
  const [mode, setMode] = useState<"skipped" | "scheduled">("skipped")

  const skipped = useMemo(() => scanSkipped(data), [data])
  const { proposal, orphaned } = useMemo(() => proposeReschedule(skipped, data), [skipped, data])
  const summary = useMemo(() => summarizeProposal(skipped, proposal), [skipped, proposal])
  const scheduledCatchup = useMemo(
    () => [...(data.catchup ?? [])].sort((a, b) => a.targetDay.localeCompare(b.targetDay)),
    [data.catchup],
  )

  const handleAcceptAll = () => {
    const items = buildCatchupItems(skipped, proposal)
    if (items.length === 0) { onShowToast("Nessun argomento da riprogrammare", "info"); return }
    onAcceptCatchup(items)
    onShowToast(`${items.length} ${items.length === 1 ? "argomento riprogrammato" : "argomenti riprogrammati"}`, "success")
  }

  const handleRescheduleOne = (item: SkippedItem) => {
    const target = proposal[item.id]
    if (!target) { onShowToast("Nessun giorno libero prima dell'esame", "warn"); return }
    const [built] = buildCatchupItems([item], { [item.id]: target })
    onAcceptCatchup([built])
    onShowToast(`Spostato a ${dayLabel(target)}`, "success")
  }

  const handleRecover = (item: SkippedItem) => { onMarkRecovered(item.origDay, item.origIdx); onShowToast("Segnato come recuperato", "success") }
  const handleDismiss = (item: SkippedItem) => { onDismissSkipped(item.origDay, item.origIdx); onShowToast("Argomento ignorato", "info") }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", stiffness: 300, damping: 32 }}
          className="fixed inset-0 z-[60] mx-auto flex h-full max-w-[680px] flex-col bg-[var(--bg)]"
          role="dialog"
          aria-modal="true"
          aria-label="Piano di recupero"
        >
          {/* Header */}
          <header className="sticky top-0 z-10 border-b border-[var(--border-subtle)] bg-amber-50/80 px-4 py-3.5 backdrop-blur-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                  <AlertTriangle size={17} strokeWidth={2} />
                </span>
                <div>
                  <div className="text-[10px] font-medium uppercase tracking-[0.14em] text-amber-800">Recupero</div>
                  <div className="text-[16px] font-semibold leading-tight text-stone-900">
                    {skipped.length} {skipped.length === 1 ? "argomento arretrato" : "argomenti arretrati"}
                  </div>
                  {scheduledCatchup.length > 0 && (
                    <div className="mt-0.5 text-[11px] text-amber-800">
                      {scheduledCatchup.length} già in programma di recupero
                    </div>
                  )}
                </div>
              </div>
              <button
                onClick={onClose}
                className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-stone-200 bg-white text-stone-600 transition-colors hover:bg-stone-50"
                aria-label="Chiudi"
              >
                <X size={15} strokeWidth={2} />
              </button>
            </div>

            <div className="mt-3 flex gap-1.5">
              <ToggleTab active={mode === "skipped"} onClick={() => setMode("skipped")} label="Da recuperare" count={skipped.length} />
              <ToggleTab active={mode === "scheduled"} onClick={() => setMode("scheduled")} label="Pianificati" count={scheduledCatchup.length} />
            </div>
          </header>

          {/* Body */}
          <div className="scrollbar-thin flex-1 overflow-y-auto px-4 py-4 pb-28">
            {mode === "skipped" ? (
              <SkippedList skipped={skipped} proposal={proposal} orphaned={orphaned} summary={summary}
                onRecover={handleRecover} onReschedule={handleRescheduleOne} onDismiss={handleDismiss} />
            ) : (
              <ScheduledList items={scheduledCatchup}
                onRemove={(id) => { onRemoveCatchupItem(id); onShowToast("Riprogrammazione annullata", "info") }} />
            )}
          </div>

          {/* Footer */}
          {mode === "skipped" && skipped.length > 0 && (
            <footer className="sticky bottom-0 border-t border-[var(--border-subtle)] bg-white px-4 py-3 pb-[max(12px,env(safe-area-inset-bottom))]">
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={handleAcceptAll}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-[13.5px] font-medium text-white shadow-sm transition-colors hover:bg-emerald-700"
              >
                <Sparkles size={14} strokeWidth={2} />
                Riprogramma tutto ({Object.keys(proposal).length})
              </motion.button>
              {orphaned.length > 0 && (
                <div className="mt-2 text-center text-[11px] text-rose-700">
                  {orphaned.length} argomento/i senza spazio prima dell&apos;esame
                </div>
              )}
            </footer>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function ToggleTab({ active, onClick, label, count }: { active: boolean; onClick: () => void; label: string; count: number }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-[12px] font-medium transition-all ${
        active ? "bg-stone-900 text-white shadow-sm" : "bg-white text-stone-600 border border-stone-200 hover:bg-stone-50"
      }`}
    >
      {label}
      <span className={`flex h-4.5 min-w-[18px] items-center justify-center rounded-full px-1.5 text-[10px] font-semibold tabular-nums ${
        active ? "bg-white/20 text-white" : "bg-stone-100 text-stone-600"
      }`} style={{ height: 18 }}>
        {count}
      </span>
    </button>
  )
}

function SkippedList({ skipped, proposal, orphaned, summary, onRecover, onReschedule, onDismiss }: {
  skipped: SkippedItem[]; proposal: Record<string, string>; orphaned: string[]
  summary: { day: string; items: SkippedItem[] }[]
  onRecover: (item: SkippedItem) => void; onReschedule: (item: SkippedItem) => void; onDismiss: (item: SkippedItem) => void
}) {
  if (skipped.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        className="mt-10 flex flex-col items-center justify-center gap-3 rounded-2xl border border-emerald-200/70 bg-emerald-50/60 p-8 text-center"
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
          <CheckCircle2 size={24} strokeWidth={2} />
        </div>
        <div>
          <div className="text-[16px] font-semibold text-emerald-900">Tutto in regola!</div>
          <p className="mt-1 text-[12px] leading-relaxed text-emerald-800">
            Nessun argomento saltato. Il sistema controlla automaticamente ogni giorno le sessioni non completate e ti propone un piano di recupero intelligente.
          </p>
        </div>
      </motion.div>
    )
  }

  return (
    <div className="space-y-5">
      {summary.length > 0 && (
        <section>
          <h3 className="mb-2 flex items-center gap-1.5 px-0.5 text-[10px] font-medium uppercase tracking-[0.14em] text-stone-500">
            <Sparkles size={11} strokeWidth={2} /> Piano proposto
          </h3>
          <div className="space-y-2">
            {summary.map(({ day, items }, i) => (
              <motion.div key={day} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                className="card-quiet p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-[12.5px] font-medium text-stone-900">
                    <CalendarPlus size={13} strokeWidth={2} className="text-emerald-600" />
                    {dayLabel(day)}
                  </div>
                  <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-[9.5px] font-medium text-emerald-800">
                    +{items.length} recupero
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {items.map((it) => (
                    <span key={it.id} className="flex items-center gap-1 rounded-lg px-2 py-1 text-[10.5px] font-medium"
                      style={{ background: C[it.sub].bg, color: C[it.sub].text }}>
                      <SubjectIcon sub={it.sub} size={10} strokeWidth={2} />
                      {SUBJECTS[it.sub].short}
                    </span>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      <section>
        <h3 className="mb-2 flex items-center gap-1.5 px-0.5 text-[10px] font-medium uppercase tracking-[0.14em] text-stone-500">
          <Clock size={11} strokeWidth={2} /> Ordinati per urgenza esame
        </h3>
        <div className="space-y-2.5">
          {skipped.map((item, i) => (
            <SkippedItemCard key={item.id} item={item} target={proposal[item.id]}
              isOrphan={orphaned.includes(item.id)} index={i}
              onRecover={() => onRecover(item)} onReschedule={() => onReschedule(item)} onDismiss={() => onDismiss(item)} />
          ))}
        </div>
      </section>
    </div>
  )
}

function SkippedItemCard({ item, target, isOrphan, index, onRecover, onReschedule, onDismiss }: {
  item: SkippedItem; target: string | undefined; isOrphan: boolean; index: number
  onRecover: () => void; onReschedule: () => void; onDismiss: () => void
}) {
  const col = C[item.sub]
  const days = daysUntil(item.examISO)
  const entry = DAILY[item.origDay]

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className="card-quiet relative overflow-hidden"
    >
      <div className="absolute left-0 top-0 h-full w-[3px]" style={{ background: col.dot }} aria-hidden />
      <div className="p-3.5 pl-4">
        <div className="flex items-start gap-1">
          <div className="flex-1">
            <div className="flex items-center gap-1.5 text-[10.5px] font-medium" style={{ color: col.text }}>
              <SubjectIcon sub={item.sub} size={11} strokeWidth={2} />
              {SUBJECTS[item.sub].short}
              <span className="text-stone-400">· {item.dur}</span>
            </div>
            <div className="mt-1 text-[13.5px] font-medium leading-snug text-stone-900">{item.topic}</div>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <span className="flex items-center gap-1 rounded-md bg-rose-100 px-1.5 py-0.5 text-[9.5px] font-medium text-rose-800">
                <X size={8} strokeWidth={2.5} /> Saltato · {entry?.label ?? item.origDay}
              </span>
              {days !== null && (
                <span className="flex items-center gap-1 rounded-md bg-stone-100 px-1.5 py-0.5 text-[9.5px] text-stone-600">
                  <GraduationCap size={9} strokeWidth={2} /> esame tra {days}g
                </span>
              )}
            </div>
          </div>
        </div>

        {target ? (
          <div className="mt-2.5 flex items-center gap-1.5 rounded-lg border border-emerald-200/70 bg-emerald-50/60 px-2.5 py-1.5 text-[11.5px] font-medium text-emerald-800">
            <ArrowRight size={11} strokeWidth={2} /> Proposto per <span className="font-semibold">{dayLabel(target)}</span>
          </div>
        ) : isOrphan ? (
          <div className="mt-2.5 flex items-center gap-1.5 rounded-lg border border-rose-200/70 bg-rose-50/60 px-2.5 py-1.5 text-[11.5px] font-medium text-rose-800">
            <AlertTriangle size={11} strokeWidth={2} /> Nessun giorno libero prima dell&apos;esame
          </div>
        ) : null}

        <div className="mt-3 grid grid-cols-3 gap-1.5">
          <ActionBtn onClick={onRecover} tone="success" icon={<Check size={11} strokeWidth={2.5} />} label="Recuperato" />
          <ActionBtn onClick={onReschedule} tone="info" disabled={!target} icon={<CalendarPlus size={11} strokeWidth={2} />} label="Sposta" />
          <ActionBtn onClick={onDismiss} tone="muted" icon={<Trash2 size={11} strokeWidth={2} />} label="Ignora" />
        </div>
      </div>
    </motion.div>
  )
}

function ActionBtn({ onClick, tone, icon, label, disabled }: {
  onClick: () => void; tone: "success" | "info" | "muted"; icon: React.ReactNode; label: string; disabled?: boolean
}) {
  const styles = {
    success: "bg-emerald-600 text-white hover:bg-emerald-700",
    info: "bg-indigo-600 text-white hover:bg-indigo-700",
    muted: "border border-stone-200 bg-stone-50 text-stone-600 hover:bg-stone-100",
  }[tone]

  return (
    <motion.button
      whileTap={{ scale: disabled ? 1 : 0.96 }}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={`flex items-center justify-center gap-1 rounded-lg px-2 py-2 text-[10.5px] font-medium shadow-sm transition-colors ${styles} ${
        disabled ? "cursor-not-allowed opacity-35" : ""
      }`}
    >
      {icon} {label}
    </motion.button>
  )
}

function ScheduledList({ items, onRemove }: { items: CatchupItem[]; onRemove: (id: string) => void }) {
  if (items.length === 0) {
    return (
      <div className="mt-10 flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-stone-300 bg-white p-8 text-center">
        <RotateCw size={24} className="text-stone-400" strokeWidth={1.75} />
        <div className="text-[13.5px] font-medium text-stone-700">Nessun recupero pianificato</div>
        <p className="text-[12px] text-stone-500">Le sessioni riprogrammate appariranno qui.</p>
      </div>
    )
  }

  const groups = items.reduce<Record<string, CatchupItem[]>>((acc, it) => {
    if (!acc[it.targetDay]) acc[it.targetDay] = []
    acc[it.targetDay].push(it)
    return acc
  }, {})

  return (
    <div className="space-y-3">
      {Object.keys(groups).sort().map((day) => (
        <div key={day} className="card-quiet p-3.5">
          <div className="mb-2.5 flex items-center gap-1.5 text-[12.5px] font-medium text-stone-900">
            <CalendarPlus size={13} strokeWidth={2} className="text-emerald-600" />
            {dayLabel(day)}
          </div>
          <div className="space-y-2">
            {groups[day].map((c) => {
              const col = C[c.sub]
              return (
                <div key={c.id} className="relative flex items-start gap-2 overflow-hidden rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-2.5">
                  <div className="absolute left-0 top-0 h-full w-[3px]" style={{ background: col.dot }} aria-hidden />
                  <div className="flex-1 pl-1">
                    <div className="flex items-center gap-1 text-[10.5px] font-medium" style={{ color: col.text }}>
                      <SubjectIcon sub={c.sub} size={10} strokeWidth={2} />
                      {SUBJECTS[c.sub].short}
                      <span className="text-stone-400">· {c.dur}</span>
                    </div>
                    <div className="mt-0.5 text-[12px] font-medium leading-snug text-stone-800">{c.topic}</div>
                    <div className="mt-1 text-[9.5px] uppercase tracking-wider text-stone-400">da {dayLabel(c.origDay)}</div>
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => onRemove(c.id)}
                    className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg border border-stone-200 bg-white text-stone-500 transition-colors hover:bg-rose-50 hover:text-rose-600"
                    aria-label="Rimuovi dal piano di recupero"
                  >
                    <Trash2 size={12} strokeWidth={2} />
                  </motion.button>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
