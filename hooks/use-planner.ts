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
  dismissedSkips: {},
}

export function usePlanner() {
  const [data, setData] = useState<PlannerData>(initialData)
  const [loaded, setLoaded] = useState(false)
  const { syncTopic } = useSupabaseSync()

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as PlannerData
        if (!parsed.sessions) parsed.sessions = []
        if (!parsed.topics) parsed.topics = {}
        if (!parsed.daily) parsed.daily = {}
        if (!parsed.notes) parsed.notes = {}
        if (!parsed.conf) parsed.conf = {}
        if (!parsed.check) parsed.check = {}
        if (!parsed.catchup) parsed.catchup = []
        if (!parsed.dismissedSkips) parsed.dismissedSkips = {}
        setData(parsed)
      }
    } catch {
      // ignore
    }
    setLoaded(true)
  }, [])

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
      }
    },
    [data, save, syncTopic],
  )

  const toggleDaily = useCallback(
    (dayStr: string, ti: number) => {
      const k = `${dayStr}_${ti}`
      save({ ...data, daily: { ...data.daily, [k]: !data.daily[k] } })
    },
    [data, save],
  )

  const setNote = useCallback(
    (weekIdx: number, value: string) => {
      save({ ...data, notes: { ...data.notes, [weekIdx]: value } })
    },
    [data, save],
  )

  const setCheck = useCallback(
    (key: string, value: number) => {
      save({ ...data, check: { ...data.check, [key]: value } })
    },
    [data, save],
  )

  const setConf = useCallback(
    (key: string, value: number) => {
      save({ ...data, conf: { ...data.conf, [key]: value } })
    },
    [data, save],
  )

  const logSession = useCallback(
    (session: Omit<LoggedSession, "id" | "date">) => {
      const s: LoggedSession = { ...session, id: Date.now(), date: TODAY_STR }
      save({ ...data, sessions: [...(data.sessions || []), s] })
    },
    [data, save],
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
      save({ ...data, catchup: [...(data.catchup ?? []), ...items] })
    },
    [data, save],
  )

  // Toggle the done state of a catchup item (user completed the rescheduled work)
  const toggleCatchupDone = useCallback(
    (id: string) => {
      const next = (data.catchup ?? []).map((c) =>
        c.id === id ? { ...c, done: !c.done } : c,
      )
      save({ ...data, catchup: next })
    },
    [data, save],
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
