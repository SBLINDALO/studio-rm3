"use client"

import { useEffect, useRef } from "react"
import { DAILY } from "@/lib/planner/data"
import { TOPICS } from "@/lib/planner/data"
import { getTodayStr } from "@/lib/planner/helpers"

function formatDateKey(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function getTodayKey() {
  const now = new Date()
  const todayKey = formatDateKey(now)
  return todayKey in DAILY ? todayKey : getTodayStr()
}

function getTodayChapters() {
  const today = DAILY[getTodayKey()]
  if (!today?.sessions?.length) {
    return "Nessun capitolo in programma oggi."
  }
  return today.sessions.map((session) => session.topic).join(", ")
}

function getCurrentProgressPct() {
  try {
    const raw = localStorage.getItem("planner5v3")
    if (!raw) return 0
    const parsed = JSON.parse(raw)
    const topics = parsed?.topics ?? {}
    const total = Object.values(TOPICS).reduce((sum, list) => sum + list.length, 0)
    const done = Object.values(topics).filter((value) => value === "done").length
    return total === 0 ? 0 : Math.round((done / total) * 100)
  } catch {
    return 0
  }
}

function getNextFireTime(hour: number, minute: number) {
  const now = new Date()
  const target = new Date(now)
  target.setHours(hour, minute, 0, 0)
  if (target.getTime() <= now.getTime()) {
    target.setDate(target.getDate() + 1)
  }
  return target
}

function msUntil(date: Date) {
  return Math.max(date.getTime() - Date.now(), 0)
}

function buildNotificationPayload() {
  const todayChapters = getTodayChapters()
  const progressPct = getCurrentProgressPct()
  const morningTarget = getNextFireTime(10, 0)
  const afternoonTarget = getNextFireTime(15, 30)

  return {
    notifications: [
      {
        id: "morning-study-reminder",
        time: morningTarget.getTime(),
        title: "Buongiorno!",
        body: `Oggi in programma: ${todayChapters}`,
        tag: "study-morning",
      },
      {
        id: "afternoon-progress-reminder",
        time: afternoonTarget.getTime(),
        title: "Continua così!",
        body: `Sei al ${progressPct}% del tuo obiettivo.`,
        tag: "study-afternoon",
      },
    ],
  }
}

async function postMessageToServiceWorker(message: any) {
  if (!("serviceWorker" in navigator)) return
  try {
    const registration = await navigator.serviceWorker.ready
    if (registration.active) {
      registration.active.postMessage(message)
    }
  } catch {
    // ignore
  }
}

function scheduleLocalNotification(id: string, delayMs: number, title: string, body: string) {
  return window.setTimeout(async () => {
    try {
      if (!("serviceWorker" in navigator)) return
      const registration = await navigator.serviceWorker.ready
      registration.showNotification(title, {
        body,
        icon: "/icon.svg",
        badge: "/icon-light-32x32.png",
        tag: id,
        renotify: true,
      })
    } catch {
      // ignore
    }
  }, delayMs)
}

export function BrowserNotifications() {
  const timers = useRef<number[]>([])
  const midnightTimer = useRef<number | null>(null)

  useEffect(() => {
    if (typeof window === "undefined") return
    if (!("serviceWorker" in navigator) || !("Notification" in window)) return

    const clearAll = () => {
      timers.current.forEach((id) => window.clearTimeout(id))
      timers.current = []
      if (midnightTimer.current) {
        window.clearTimeout(midnightTimer.current)
        midnightTimer.current = null
      }
    }

    const scheduleDay = async () => {
      if (Notification.permission !== "granted") return

      const payload = buildNotificationPayload()
      await postMessageToServiceWorker({ type: "SCHEDULE_NOTIFICATIONS", payload })

      clearAll()
      for (const item of payload.notifications) {
        const delayMs = msUntil(new Date(item.time))
        timers.current.push(scheduleLocalNotification(item.id, delayMs, item.title, item.body))
      }

      const now = new Date()
      const midnight = new Date(now)
      midnight.setHours(24, 0, 0, 0)
      midnightTimer.current = window.setTimeout(() => {
        scheduleDay().catch(() => {})
      }, midnight.getTime() - now.getTime() + 1000)
    }

    const init = async () => {
      if (Notification.permission === "default") {
        try {
          await Notification.requestPermission()
        } catch {
          return
        }
      }

      if (Notification.permission === "granted") {
        await scheduleDay()
      }
    }

    init().catch(() => {})

    return () => {
      clearAll()
    }
  }, [])

  return null
}
