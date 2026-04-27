"use client"

import { useCallback, useEffect, useRef, useState } from "react"

type MinimalRecognition = {
  lang: string
  continuous: boolean
  interimResults: boolean
  start: () => void
  stop: () => void
  abort: () => void
  onresult: ((e: unknown) => void) | null
  onerror: ((e: unknown) => void) | null
  onend: ((e: unknown) => void) | null
}

interface SpeechResultsEvent {
  resultIndex: number
  results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }>
}

export function useSpeechRecognition(lang = "it-IT") {
  const [listening, setListening] = useState(false)
  const [transcript, setTranscript] = useState("")
  const [interim, setInterim] = useState("")
  const [supported, setSupported] = useState(false)
  const recRef = useRef<MinimalRecognition | null>(null)

  useEffect(() => {
    if (typeof window === "undefined") return
    const w = window as unknown as {
      SpeechRecognition?: new () => MinimalRecognition
      webkitSpeechRecognition?: new () => MinimalRecognition
    }
    const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition
    setSupported(!!Ctor)
  }, [])

  const start = useCallback(() => {
    if (listening) return
    const w = window as unknown as {
      SpeechRecognition?: new () => MinimalRecognition
      webkitSpeechRecognition?: new () => MinimalRecognition
    }
    const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition
    if (!Ctor) return
    const rec = new Ctor()
    rec.lang = lang
    rec.continuous = false
    rec.interimResults = true

    let finalText = ""
    rec.onresult = (event: unknown) => {
      const e = event as SpeechResultsEvent
      let running = ""
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i]
        const t = r[0]?.transcript ?? ""
        if (r.isFinal) finalText += t
        else running += t
      }
      setInterim(running)
      if (finalText) setTranscript(finalText)
    }
    rec.onerror = () => {
      setListening(false)
    }
    rec.onend = () => {
      setListening(false)
      setInterim("")
    }

    try {
      rec.start()
      recRef.current = rec
      setListening(true)
      setTranscript("")
      setInterim("")
    } catch {
      setListening(false)
    }
  }, [lang, listening])

  const stop = useCallback(() => {
    try {
      recRef.current?.stop()
    } catch {
      /* ignore */
    }
    setListening(false)
  }, [])

  const reset = useCallback(() => {
    setTranscript("")
    setInterim("")
  }, [])

  return { supported, listening, transcript, interim, start, stop, reset }
}
