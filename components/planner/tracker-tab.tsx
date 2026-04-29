"use client"

import { type FormEvent, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Check, Undo2, GraduationCap, ChevronDown, BookOpen, Eye, Plus } from "lucide-react"
import { TOPICS, SUBJECTS, C } from "@/lib/planner/data"
import { SubjectIcon } from "./subject-icon"
import type { ActiveRecallQuestion, PlannerData, SubjectKey } from "@/lib/planner/types"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface Props {
  data: PlannerData
  quiz: Record<string, { questions: ActiveRecallQuestion[] }>
  toggleTopic: (sub: SubjectKey, i: number, status: "done" | "review") => void
  saveTopicQuiz: (sub: SubjectKey, i: number, quizEntry: { questions: ActiveRecallQuestion[] }) => void
  getProgress: (sub: SubjectKey) => { done: number; total: number; pct: number }
}

export function TrackerTab({ data, quiz, toggleTopic, saveTopicQuiz, getProgress }: Props) {
  const [expanded, setExpanded] = useState<SubjectKey | null>(null)
  const [activeQuiz, setActiveQuiz] = useState<{
    key: string
    sub: SubjectKey
    index: number
    topic: string
  } | null>(null)
  const [newQuestion, setNewQuestion] = useState("")
  const [newAnswer, setNewAnswer] = useState("")
  const [revealed, setRevealed] = useState<Record<string, boolean>>({})

  const closeQuizModal = () => {
    setActiveQuiz(null)
    setNewQuestion("")
    setNewAnswer("")
    setRevealed({})
  }

  const currentQuestions = activeQuiz ? quiz[activeQuiz.key]?.questions ?? [] : []

  const handleAddQuestion = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!activeQuiz || !newQuestion.trim() || !newAnswer.trim()) return

    const nextQuestion: ActiveRecallQuestion = {
      id: typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      question: newQuestion.trim(),
      answer: newAnswer.trim(),
    }

    const nextQuestions = [...currentQuestions, nextQuestion]
    saveTopicQuiz(activeQuiz.sub, activeQuiz.index, { questions: nextQuestions })
    setNewQuestion("")
    setNewAnswer("")
    setRevealed((prev) => ({ ...prev, [nextQuestion.id]: false }))
  }

  const openQuizModal = (sub: SubjectKey, index: number, topic: string, key: string) => {
    setActiveQuiz({ sub, index, topic, key })
    setRevealed({})
  }

  const toggleReveal = (id: string) => {
    setRevealed((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const handleMarkGood = () => {
    if (!activeQuiz) return
    toggleTopic(activeQuiz.sub, activeQuiz.index, "done")
    closeQuizModal()
  }

  const handleMarkReview = () => {
    if (!activeQuiz) return
    toggleTopic(activeQuiz.sub, activeQuiz.index, "review")
    closeQuizModal()
  }

  return (
    <div className="space-y-3">
      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-[var(--border-subtle)] bg-white px-3 py-2 text-[11.5px] text-stone-600">
        <span className="flex items-center gap-1.5">
          <span className="flex h-4 w-4 items-center justify-center rounded-md bg-emerald-500">
            <Check size={10} className="text-white" strokeWidth={3} />
          </span>
          Studiato
        </span>
        <span className="h-3 w-px bg-stone-200" />
        <span className="flex items-center gap-1.5">
          <span className="flex h-4 w-4 items-center justify-center rounded-md bg-amber-500">
            <Undo2 size={10} className="text-white" strokeWidth={2.5} />
          </span>
          Da ripassare
        </span>
      </div>

      {(Object.entries(TOPICS) as [SubjectKey, string[]][]).map(([sub, topics], si) => {
        const s = SUBJECTS[sub]
        const col = C[sub]
        const { done, total, pct } = getProgress(sub)
        const isEx = expanded === sub
        const reviewCount = topics.filter((_, i) => data.topics[`${sub}_${i}`] === "review").length

        return (
          <motion.article
            key={sub}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: si * 0.03 }}
            className="card-quiet overflow-hidden"
          >
            <button
              onClick={() => setExpanded(isEx ? null : sub)}
              className="w-full p-4 text-left transition-colors"
              style={{ background: col.soft }}
              aria-expanded={isEx}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2.5">
                    <span
                      className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg"
                      style={{ background: col.dot, color: "#fff" }}
                      aria-hidden
                    >
                      <SubjectIcon sub={sub} size={14} strokeWidth={2} />
                    </span>
                    <div className="min-w-0">
                      <div
                        className="text-[14.5px] font-semibold leading-tight"
                        style={{ color: col.text }}
                      >
                        {s.name}
                      </div>
                      <div className="mt-1 flex items-center gap-1.5 text-[10.5px] text-stone-600">
                        <GraduationCap size={11} strokeWidth={2} />
                        {s.examDate} · {s.examTime} · {s.examType}
                      </div>
                      {reviewCount > 0 && (
                        <div className="mt-1 flex items-center gap-1 text-[10.5px] font-medium text-amber-700">
                          <Undo2 size={10} strokeWidth={2.5} />
                          {reviewCount} da ripassare
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1">
                  <div
                    className="text-[22px] font-semibold tabular-nums tracking-tight leading-none"
                    style={{ color: col.text }}
                  >
                    {pct}%
                  </div>
                  <div className="text-[10.5px] tabular-nums text-stone-500">
                    {done}/{total}
                  </div>
                  <motion.span
                    animate={{ rotate: isEx ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="text-stone-400"
                  >
                    <ChevronDown size={14} strokeWidth={2} />
                  </motion.span>
                </div>
              </div>

              <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/70">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  className="h-full rounded-full"
                  style={{ background: col.dot }}
                />
              </div>
            </button>

            <AnimatePresence initial={false}>
              {isEx && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden border-t border-[var(--border-subtle)] bg-white"
                >
                  {topics.map((topic, i) => {
                    const k = `${sub}_${i}`
                    const st = data.topics[k]
                    const rowBg =
                      st === "done"
                        ? "bg-emerald-50/40"
                        : st === "review"
                          ? "bg-amber-50/50"
                          : ""
                    return (
                      <div
                        key={i}
                        className={`flex items-start gap-2 border-b border-[var(--border-subtle)] px-3.5 py-2.5 last:border-b-0 ${rowBg}`}
                      >
                        <span
                          className={`flex-1 pt-0.5 text-[12px] leading-snug ${
                            st === "done"
                              ? "text-emerald-800 line-through"
                              : "text-stone-700"
                          }`}
                        >
                          {topic}
                        </span>
                        <motion.button
                          whileTap={{ scale: 0.92 }}
                          onClick={() => toggleTopic(sub, i, "done")}
                          className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg transition-all ${
                            st === "done"
                              ? "bg-emerald-500 text-white shadow-sm"
                              : "border border-emerald-200 bg-emerald-50/60 text-emerald-600 hover:bg-emerald-100"
                          }`}
                          aria-label="Segna come studiato"
                          aria-pressed={st === "done"}
                        >
                          <Check size={13} strokeWidth={2.75} />
                        </motion.button>
                        <motion.button
                          whileTap={{ scale: 0.92 }}
                          onClick={() => toggleTopic(sub, i, "review")}
                          className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg transition-all ${
                            st === "review"
                              ? "bg-amber-500 text-white shadow-sm"
                              : "border border-amber-200 bg-amber-50/60 text-amber-700 hover:bg-amber-100"
                          }`}
                          aria-label="Segna da ripassare"
                          aria-pressed={st === "review"}
                        >
                          <Undo2 size={13} strokeWidth={2.5} />
                        </motion.button>
                        <motion.button
                          whileTap={{ scale: 0.92 }}
                          onClick={() => openQuizModal(sub, i, topic, k)}
                          className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                          aria-label="Apri il richiamo attivo"
                        >
                          <BookOpen size={14} />
                        </motion.button>
                      </div>
                    )
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.article>
        )
      })}

      <Dialog open={Boolean(activeQuiz)} onOpenChange={(isOpen) => { if (!isOpen) closeQuizModal() }}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Richiamo attivo</DialogTitle>
            <DialogDescription>
              Usa questa sezione per trasformare il capitolo in domande chiuse e verificare la tua risposta.
            </DialogDescription>
          </DialogHeader>

          {activeQuiz && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                <div className="font-medium text-slate-900">{activeQuiz.topic}</div>
                <div className="mt-1 text-slate-600">{quiz[activeQuiz.key]?.questions?.length ?? 0} domande salvate</div>
              </div>

              <div className="space-y-3">
                {(quiz[activeQuiz.key]?.questions ?? []).length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-6 text-sm text-slate-500">
                    Nessuna domanda ancora. Aggiungi una domanda di richiamo e prova a rispondere senza guardare.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {(quiz[activeQuiz.key]?.questions ?? []).map((question) => (
                      <div key={question.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                        <div className="flex items-center justify-between gap-3 text-sm font-medium text-slate-900">
                          <span>{question.question}</span>
                          <button
                            type="button"
                            onClick={() => toggleReveal(question.id)}
                            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-200"
                          >
                            <Eye size={14} />
                            {revealed[question.id] ? "Nascondi" : "Mostra risposta"}
                          </button>
                        </div>
                        {revealed[question.id] && (
                          <div className="mt-3 rounded-2xl bg-slate-50 px-3 py-2 text-sm text-slate-700">
                            {question.answer}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <form onSubmit={handleAddQuestion} className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-900">Domanda</label>
                  <input
                    value={newQuestion}
                    onChange={(event) => setNewQuestion(event.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                    placeholder="Scrivi una domanda chiusa"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-900">Risposta</label>
                  <input
                    value={newAnswer}
                    onChange={(event) => setNewAnswer(event.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                    placeholder="Scrivi la risposta corretta"
                  />
                </div>
                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  <Plus size={14} /> Aggiungi domanda
                </button>
              </form>

              <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:justify-between">
                <div className="flex flex-1 flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handleMarkReview}
                    className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-800 transition hover:bg-amber-100"
                  >
                    Devo ripassare
                  </button>
                  <button
                    type="button"
                    onClick={handleMarkGood}
                    className="rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
                  >
                    Ho ricordato bene
                  </button>
                </div>
                <button
                  type="button"
                  onClick={closeQuizModal}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Chiudi
                </button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
