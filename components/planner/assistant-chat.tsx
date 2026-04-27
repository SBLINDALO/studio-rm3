"use client"

import { useEffect, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Send, Mic, MicOff, Sparkles, Loader2 } from "lucide-react"
import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport, type UIMessage } from "ai"
import { useSpeechRecognition } from "@/hooks/use-speech-recognition"
import type { AiSnapshot } from "@/lib/planner/ai-context"

interface Props {
  snapshot: AiSnapshot
  suggestedPrompts: string[]
  seedPrompt: string | null
  onSeedConsumed: () => void
}

function getUIMessageText(msg: UIMessage): string {
  if (!msg.parts || !Array.isArray(msg.parts)) return ""
  return msg.parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("")
}

export function AssistantChat({ snapshot, suggestedPrompts, seedPrompt, onSeedConsumed }: Props) {
  const [input, setInput] = useState("")
  const scrollerRef = useRef<HTMLDivElement>(null)
  const snapshotRef = useRef(snapshot)
  useEffect(() => { snapshotRef.current = snapshot }, [snapshot])

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/coach",
      prepareSendMessagesRequest: ({ messages }) => ({
        body: { messages, snapshot: snapshotRef.current },
      }),
    }),
  })

  const speech = useSpeechRecognition("it-IT")

  useEffect(() => {
    if (speech.transcript) {
      setInput((prev) => (prev ? prev + " " : "") + speech.transcript)
      speech.reset()
    }
  }, [speech.transcript, speech])

  useEffect(() => {
    scrollerRef.current?.scrollTo({ top: scrollerRef.current.scrollHeight, behavior: "smooth" })
  }, [messages, status])

  useEffect(() => {
    if (seedPrompt) {
      sendMessage({ text: seedPrompt })
      onSeedConsumed()
    }
  }, [seedPrompt, sendMessage, onSeedConsumed])

  const submit = () => {
    const text = input.trim()
    if (!text || status === "streaming" || status === "submitted") return
    sendMessage({ text })
    setInput("")
  }

  const isBusy = status === "streaming" || status === "submitted"

  return (
    <div className="flex h-full flex-col bg-[var(--bg)]">
      {/* Messages */}
      <div ref={scrollerRef} className="scrollbar-thin flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {/* Welcome card */}
        {messages.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="card-quiet p-3.5"
          >
            <div className="flex items-center gap-1.5 text-[10.5px] font-medium text-stone-600">
              <Sparkles size={12} strokeWidth={2} className="text-amber-500" />
              Coach AI · Contesto caricato
            </div>
            <p className="mt-1.5 text-[13.5px] leading-snug text-stone-800">
              Ciao! Ho il tuo piano sotto gli occhi:{" "}
              <strong className="font-semibold">{snapshot.progress.global.pct}% completato</strong>,{" "}
              {snapshot.skipped.length > 0
                ? `${snapshot.skipped.length} argomenti arretrati.`
                : "nessun arretrato."}{" "}
              Cosa ti aiuto a capire?
            </p>
          </motion.div>
        )}

        {/* Chat messages */}
        {messages.map((m) => {
          const text = getUIMessageText(m)
          const isUser = m.role === "user"
          return (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${isUser ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[13.5px] leading-snug ${
                  isUser
                    ? "bg-stone-900 text-white"
                    : "card-quiet text-stone-900"
                }`}
              >
                {text || (
                  <span className="flex items-center gap-1 text-[12px] text-stone-400">
                    <Loader2 size={11} className="animate-spin" /> in ascolto…
                  </span>
                )}
              </div>
            </motion.div>
          )
        })}

        {/* Typing indicator */}
        {status === "submitted" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <div className="card-quiet flex items-center gap-1.5 px-4 py-3">
              {[0, 0.15, 0.3].map((delay, i) => (
                <motion.span
                  key={i}
                  animate={{ scale: [0.8, 1.15, 0.8] }}
                  transition={{ duration: 0.9, repeat: Infinity, delay }}
                  className="h-1.5 w-1.5 rounded-full bg-stone-400"
                />
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Suggested prompts */}
      <AnimatePresence>
        {messages.length === 0 && suggestedPrompts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            className="no-scrollbar flex gap-1.5 overflow-x-auto border-t border-[var(--border-subtle)] bg-white px-4 py-3"
          >
            {suggestedPrompts.map((p, i) => (
              <button
                key={i}
                onClick={() => sendMessage({ text: p })}
                className="flex-shrink-0 rounded-full border border-stone-200 bg-white px-3 py-1.5 text-[11.5px] font-medium text-stone-700 shadow-xs transition-colors hover:bg-stone-50 active:scale-95"
              >
                {p}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input bar */}
      <div className="border-t border-[var(--border-subtle)] bg-white p-3">
        {speech.listening && (
          <div className="mb-2 flex items-center gap-2 rounded-xl border border-rose-200/70 bg-rose-50 px-3 py-1.5 text-[11.5px] font-medium text-rose-800">
            <motion.span
              animate={{ opacity: [1, 0.4, 1] }}
              transition={{ duration: 0.8, repeat: Infinity }}
              className="h-1.5 w-1.5 rounded-full bg-rose-600"
            />
            In ascolto…{speech.interim && <span className="italic opacity-70"> {speech.interim}</span>}
          </div>
        )}
        <div className="flex items-end gap-2">
          {speech.supported && (
            <button
              type="button"
              onClick={() => (speech.listening ? speech.stop() : speech.start())}
              aria-label={speech.listening ? "Interrompi dettatura" : "Dettatura vocale"}
              className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border transition-colors ${
                speech.listening
                  ? "border-rose-200 bg-rose-500 text-white"
                  : "border-stone-200 bg-stone-50 text-stone-600 hover:bg-stone-100"
              }`}
            >
              {speech.listening ? <MicOff size={14} strokeWidth={2} /> : <Mic size={14} strokeWidth={2} />}
            </button>
          )}
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                submit()
              }
            }}
            placeholder="Chiedi al coach…"
            rows={1}
            className="flex-1 resize-none rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-[13px] text-stone-900 placeholder:text-stone-400 transition-colors focus:border-stone-400 focus:bg-white focus:outline-none"
          />
          <button
            type="button"
            onClick={submit}
            disabled={!input.trim() || isBusy}
            aria-label="Invia"
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-stone-900 text-white shadow-sm transition-opacity disabled:opacity-30"
          >
            {isBusy ? (
              <Loader2 size={14} className="animate-spin" strokeWidth={2} />
            ) : (
              <Send size={14} strokeWidth={2} />
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
