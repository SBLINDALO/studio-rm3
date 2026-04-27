"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, MessageCircle, Sparkles, LineChart } from "lucide-react"
import type { PlannerData } from "@/lib/planner/types"
import { buildAiSnapshot } from "@/lib/planner/ai-context"
import { AssistantChat } from "./assistant-chat"
import { AssistantInsights } from "./assistant-insights"
import type { StudyInsights } from "@/app/api/insights/route"

interface Props {
  open: boolean
  onClose: () => void
  data: PlannerData
}

type Tab = "chat" | "insights"

/**
 * DUAL-AI FUSION:
 * 1. Both /api/coach (fast streaming chat) and /api/insights (deep structured analysis)
 *    receive the SAME AiSnapshot built here. Single source of truth → coherent outputs.
 * 2. On drawer open, /api/insights is fired in parallel with the first user chat message.
 * 3. Clicking an insight "action" seeds the chat with that prompt → cross-AI handoff:
 *    structured result from deep model → free-form follow-up from fast model.
 */
export function AssistantDrawer({ open, onClose, data }: Props) {
  const [tab, setTab] = useState<Tab>("chat")
  const [insights, setInsights] = useState<StudyInsights | null>(null)
  const [loadingInsights, setLoadingInsights] = useState(false)
  const [insightsError, setInsightsError] = useState<string | null>(null)
  const [seedPrompt, setSeedPrompt] = useState<string | null>(null)
  const firedRef = useRef(false)

  // Snapshot is recomputed on every data change — BOTH AIs consume this exact object,
  // so their outputs are guaranteed to reference the same facts.
  const snapshot = useMemo(() => buildAiSnapshot(data), [data])
  const snapshotRef = useRef(snapshot)
  useEffect(() => {
    snapshotRef.current = snapshot
  }, [snapshot])

  const fetchInsights = useCallback(async () => {
    setLoadingInsights(true)
    setInsightsError(null)
    try {
      const res = await fetch("/api/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ snapshot: snapshotRef.current }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = (await res.json()) as StudyInsights
      setInsights(json)
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Errore sconosciuto"
      setInsightsError(msg)
    } finally {
      setLoadingInsights(false)
    }
  }, [])

  // First open → parallel fetch of deep analysis (chat is ready immediately).
  useEffect(() => {
    if (open && !firedRef.current) {
      firedRef.current = true
      void fetchInsights()
    }
  }, [open, fetchInsights])

  // Context-aware suggested prompts derived from the current snapshot.
  const suggestedPrompts = useMemo(() => {
    const out: string[] = []
    if (snapshot.todayPlan.some((t) => !t.done)) {
      out.push("Cosa devo studiare adesso?")
    }
    if (snapshot.skipped.length > 0) {
      out.push(`Come recupero i ${snapshot.skipped.length} argomenti arretrati?`)
    }
    const weakest = [...snapshot.progress.bySubject]
      .filter((s) => s.total > 0)
      .sort((a, b) => a.pct - b.pct)[0]
    if (weakest && weakest.pct < 60) {
      out.push(`Spiegami in breve ${weakest.name}`)
    }
    if (snapshot.nextExam) {
      out.push(`Piano per i prossimi ${snapshot.nextExam.daysUntil} giorni`)
    }
    if (out.length < 3) {
      out.push("Dammi una tecnica di memorizzazione veloce")
    }
    return out.slice(0, 4)
  }, [snapshot])

  const handleInsightAction = useCallback((prompt: string) => {
    setTab("chat")
    setSeedPrompt(prompt)
  }, [])

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            className="glass fixed inset-y-0 right-0 z-50 flex w-full flex-col border-l border-[var(--border-subtle)] shadow-xl md:w-[440px]"
            role="dialog"
            aria-label="Coach AI"
          >
            {/* Header */}
            <div className="flex items-center gap-3 border-b border-[var(--border-subtle)] bg-white/80 p-3.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-stone-900 text-white shadow-sm">
                <Sparkles size={14} strokeWidth={2} fill="currentColor" />
              </div>
              <div className="flex-1">
                <div className="text-[10px] font-medium uppercase tracking-[0.14em] text-stone-500">
                  Coach AI
                </div>
                <div className="text-[14px] font-semibold text-stone-900 leading-tight">
                  Studia con intelligenza
                </div>
              </div>
              <button
                onClick={onClose}
                aria-label="Chiudi"
                className="flex h-8 w-8 items-center justify-center rounded-full border border-stone-200 bg-white text-stone-600 transition-colors hover:bg-stone-50"
              >
                <X size={14} strokeWidth={2} />
              </button>
            </div>

            {/* Tab switcher */}
            <div className="flex gap-1.5 border-b border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-2">
              <button
                onClick={() => setTab("chat")}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-[12px] font-medium transition-all ${
                  tab === "chat"
                    ? "bg-stone-900 text-white shadow-sm"
                    : "text-stone-600 hover:bg-stone-100"
                }`}
              >
                <MessageCircle size={12} strokeWidth={2} />
                Chat
              </button>
              <button
                onClick={() => setTab("insights")}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-[12px] font-medium transition-all ${
                  tab === "insights"
                    ? "bg-stone-900 text-white shadow-sm"
                    : "text-stone-600 hover:bg-stone-100"
                }`}
              >
                <LineChart size={12} strokeWidth={2} />
                Analisi
                {loadingInsights && (
                  <motion.span
                    animate={{ opacity: [1, 0.3, 1] }}
                    transition={{ duration: 1.2, repeat: Infinity }}
                    className="ml-0.5 h-1.5 w-1.5 rounded-full bg-current"
                  />
                )}
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-hidden">
              {tab === "chat" ? (
                <AssistantChat
                  snapshot={snapshot}
                  suggestedPrompts={suggestedPrompts}
                  seedPrompt={seedPrompt}
                  onSeedConsumed={() => setSeedPrompt(null)}
                />
              ) : (
                <div className="h-full overflow-y-auto">
                  <AssistantInsights
                    insights={insights}
                    loading={loadingInsights}
                    error={insightsError}
                    onRefresh={fetchInsights}
                    onAskCoach={handleInsightAction}
                  />
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
