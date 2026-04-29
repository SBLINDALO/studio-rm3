"use client"

import { useCallback, useEffect, useState } from "react"
import type { CatchupItem, PlannerData, SubjectKey, TopicStatus, LoggedSession } from "@/lib/planner/types"
import { SUBJECTS, TOPICS, TODAY_STR } from "@/lib/planner/data"
import { useSupabaseSync } from "./use-supabase-sync"

const STORAGE_KEY = "planner5v3"

const initialData: PlannerData = {
  topics: {},
  daily: {},
  notes: {},
  conf: {},
  check: {},
  sessions: [],
  catchup: [],
  quiz: {},
  dismissedSkips: {},
}

export function usePlanner() {
  const [data, setData] = useState<PlannerData>(initialData)
  const [loaded, setLoaded] = useState(false)
  const { syncTopic, syncTopicQuiz, loadProgressFromSupabase, syncDaily, syncNote, syncConf, syncCheck, syncSession, syncCatchup, loadDailyFromSupabase, loadNotesFromSupabase, loadConfFromSupabase, loadCheckFromSupabase, loadSessionsFromSupabase, loadCatchupFromSupabase } = useSupabaseSync()

  useEffect(() => {
    const loadData = async () => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY)
        let parsed = initialData
        if (raw) {
          parsed = JSON.parse(raw) as PlannerData
          if (!parsed.sessions) parsed.sessions = []
          if (!parsed.topics) parsed.topics = {}
          if (!parsed.daily) parsed.daily = {}
          if (!parsed.notes) parsed.notes = {}
          if (!parsed.conf) parsed.conf = {}
          if (!parsed.check) parsed.check = {}
          if (!parsed.catchup) parsed.catchup = []
          if (!parsed.quiz) parsed.quiz = {}
          if (!parsed.dismissedSkips) parsed.dismissedSkips = {}
        }

        // Carica tutti i dati da Supabase e unisci
        const [supabaseProgress, supabaseDaily, supabaseNotes, supabaseConf, supabaseCheck, supabaseSessions, supabaseCatchup] = await Promise.all([
          loadProgressFromSupabase(),
          loadDailyFromSupabase(),
          loadNotesFromSupabase(),
          loadConfFromSupabase(),
          loadCheckFromSupabase(),
          loadSessionsFromSupabase(),
          loadCatchupFromSupabase(),
        ])

        // Unisci topics
        const mergedTopics = { ...parsed.topics }
        const mergedQuiz = { ...parsed.quiz }
        for (const [key, progress] of Object.entries(supabaseProgress)) {
          const status: TopicStatus = progress.is_completed ? "done" : progress.review_status === "review" ? "review" : null
          mergedTopics[key] = status

          if (!mergedQuiz[key] && progress.notes_data?.questions?.length) {
            mergedQuiz[key] = {
              questions: Array.isArray(progress.notes_data.questions)
                ? progress.notes_data.questions.map((question: any) => ({
                    id: question.id || `${key}-${Math.random().toString(36).slice(2, 8)}`,
                    question: question.question ?? "",
                    answer: question.answer ?? "",
                  }))
                : [],
            }
          }
        }
        parsed.topics = mergedTopics
        parsed.quiz = mergedQuiz

        // Unisci daily
        parsed.daily = { ...parsed.daily, ...supabaseDaily }

        // Unisci notes
        parsed.notes = { ...parsed.notes, ...supabaseNotes }

        // Unisci conf
        parsed.conf = { ...parsed.conf, ...supabaseConf }

        // Unisci check
        parsed.check = { ...parsed.check, ...supabaseCheck }

        // Unisci sessions (merge senza duplicati)
        const existingSessionIds = new Set(parsed.sessions.map(s => s.id))
        const newSessions = supabaseSessions.filter(s => !existingSessionIds.has(s.id))
        parsed.sessions = [...parsed.sessions, ...newSessions]

        // Unisci catchup (merge senza duplicati)
        const existingCatchupIds = new Set(parsed.catchup.map(c => c.id))
        const newCatchup = supabaseCatchup.filter(c => !existingCatchupIds.has(c.id))
        parsed.catchup = [...parsed.catchup, ...newCatchup]

        setData(parsed)
      } catch {
        // ignore
      }
      setLoaded(true)
    }
    loadData()
  }, [loadProgressFromSupabase, loadDailyFromSupabase, loadNotesFromSupabase, loadConfFromSupabase, loadCheckFromSupabase, loadSessionsFromSupabase, loadCatchupFromSupabase])

  const save = useCallback((next: PlannerData) => {
    setData(next)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    } catch {
      // ignore
    }
  }, [])

  const toggleTopic = useCallback(
    (sub: SubjectKey, i: number, status: Exclude<TopicStatus, null>) => {
      const k = `${sub}_${i}`
      const cur = data.topics[k]
      const ns: TopicStatus = cur === status ? null : status
      const topics = { ...data.topics, [k]: ns }
      if (!ns) delete topics[k]
      save({ ...data, topics })
      
      // Sincronizza con Supabase (non bloccare l'UI)
      if (ns) {
        syncTopic(sub, i, status).catch(() => {
          // Fallback già gestito in useSupabaseSync
        })

        const quizData = data.quiz[k]
        if (quizData?.questions?.length) {
          syncTopicQuiz(sub, i, quizData).catch(() => {
            // Fallback già gestito in useSupabaseSync
          })
        }
      }
    },
    [data, save, syncTopic, syncTopicQuiz],
  )

  const toggleDaily = useCallback(
    (dayStr: string, ti: number) => {
      const k = `${dayStr}_${ti}`
      const isDone = !data.daily[k]
      save({ ...data, daily: { ...data.daily, [k]: isDone } })
      
      // Sincronizza con Supabase
      syncDaily(dayStr, ti, isDone).catch(() => {
        // Fallback già gestito
      })
    },
    [data, save, syncDaily],
  )

  const setNote = useCallback(
    (weekIdx: number, value: string) => {
      save({ ...data, notes: { ...data.notes, [weekIdx]: value } })
      
      // Sincronizza con Supabase
      syncNote(weekIdx, value).catch(() => {
        // Fallback già gestito
      })
    },
    [data, save, syncNote],
  )

  const setCheck = useCallback(
    (key: string, value: number) => {
      save({ ...data, check: { ...data.check, [key]: value } })
      
      // Sincronizza con Supabase
      syncCheck(key, value).catch(() => {
        // Fallback già gestito
      })
    },
    [data, save, syncCheck],
  )

  const setConf = useCallback(
    (key: string, value: number) => {
      save({ ...data, conf: { ...data.conf, [key]: value } })
      
      // Sincronizza con Supabase
      syncConf(key, value).catch(() => {
        // Fallback già gestito
      })
    },
    [data, save, syncConf],
  )

  const logSession = useCallback(
    (session: Omit<LoggedSession, "id" | "date">) => {
      const s: LoggedSession = { ...session, id: Date.now(), date: TODAY_STR }
      save({ ...data, sessions: [...(data.sessions || []), s] })
      
      // Sincronizza con Supabase
      syncSession(s).catch(() => {
        // Fallback già gestito
      })
    },
    [data, save, syncSession],
  )

  const saveTopicQuiz = useCallback(
    (sub: SubjectKey, i: number, quizEntry: { questions: { id: string; question: string; answer: string }[] }) => {
      const key = `${sub}_${i}`
      const nextQuiz = { ...data.quiz }
      if (quizEntry.questions.length) {
        nextQuiz[key] = quizEntry
      } else {
        delete nextQuiz[key]
      }
      save({ ...data, quiz: nextQuiz })

      syncTopicQuiz(sub, i, quizEntry).catch(() => {
        // Fallback già gestito in useSupabaseSync
      })
    },
    [data, save, syncTopicQuiz],
  )

  const getProgress = useCallback(
    (sub: SubjectKey) => {
      const total = TOPICS[sub].length
      const done = TOPICS[sub].filter((_, i) => data.topics[`${sub}_${i}`] === "done").length
      return { done, total, pct: total === 0 ? 0 : Math.round((done / total) * 100) }
    },
    [data.topics],
  )

  const globalProgress = useCallback(() => {
    const r = (Object.keys(SUBJECTS) as SubjectKey[]).reduce(
      (a, s) => {
        const p = getProgress(s)
        return { done: a.done + p.done, total: a.total + p.total }
      },
      { done: 0, total: 0 },
    )
    return { ...r, pct: r.total === 0 ? 0 : Math.round((r.done / r.total) * 100) }
  }, [getProgress])

  // Mark a skipped item as "retroactively done" (recovered)
  const markRecovered = useCallback(
    (origDay: string, origIdx: number) => {
      save({
        ...data,
        daily: { ...data.daily, [`${origDay}_${origIdx}`]: true },
      })
    },
    [data, save],
  )

  // Permanently dismiss a skipped item (user gives up on it)
  const dismissSkipped = useCallback(
    (origDay: string, origIdx: number) => {
      save({
        ...data,
        dismissedSkips: { ...data.dismissedSkips, [`${origDay}_${origIdx}`]: true },
      })
    },
    [data, save],
  )

  // Undo a dismissal (bring item back into the skipped queue)
  const undoDismiss = useCallback(
    (origDay: string, origIdx: number) => {
      const next = { ...data.dismissedSkips }
      delete next[`${origDay}_${origIdx}`]
      save({ ...data, dismissedSkips: next })
    },
    [data, save],
  )

  // Append new catchup items (from an accepted proposal)
  const addCatchupItems = useCallback(
    (items: CatchupItem[]) => {
      if (items.length === 0) return
      const newCatchup = [...(data.catchup ?? []), ...items]
      save({ ...data, catchup: newCatchup })
      
      // Sincronizza con Supabase
      items.forEach(item => {
        syncCatchup(item).catch(() => {
          // Fallback già gestito
        })
      })
    },
    [data, save, syncCatchup],
  )

  // Toggle the done state of a catchup item (user completed the rescheduled work)
  const toggleCatchupDone = useCallback(
    (id: string) => {
      const next = (data.catchup ?? []).map((c) =>
        c.id === id ? { ...c, done: !c.done } : c,
      )
      save({ ...data, catchup: next })
      
      // Sincronizza con Supabase
      const updatedItem = next.find(c => c.id === id)
      if (updatedItem) {
        syncCatchup(updatedItem).catch(() => {
          // Fallback già gestito
        })
      }
    },
    [data, save, syncCatchup],
  )

  // Remove a rescheduled catchup item (brings it back into the skipped queue)
  const removeCatchupItem = useCallback(
    (id: string) => {
      save({ ...data, catchup: (data.catchup ?? []).filter((c) => c.id !== id) })
    },
    [data, save],
  )

  return {
    data,
    loaded,
    save,
    toggleTopic,
    saveTopicQuiz,
    toggleDaily,
    setNote,
    setCheck,
    setConf,
    logSession,
    getProgress,
    globalProgress,
    markRecovered,
    dismissSkipped,
    undoDismiss,
    addCatchupItems,
    toggleCatchupDone,
    removeCatchupItem,
  }
}
