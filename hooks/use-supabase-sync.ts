import { useCallback, useEffect, useState } from "react"
import { supabase, type UserProgress } from "@/lib/supabase/client"
import type { SubjectKey } from "@/lib/planner/types"

type SyncStatus = "idle" | "syncing" | "error"

/**
 * Hook per sincronizzare il progresso con Supabase
 * Fallback su localStorage se non si riesce a connettersi
 */
export function useSupabaseSync() {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("idle")
  const [isOnline, setIsOnline] = useState(true)

  // Rileva la connessione online/offline
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  /**
   * Sincronizza un tema con Supabase (upsert)
   * Se fallisce, salva in localStorage come backup
   */
  const syncTopic = useCallback(
    async (subject: SubjectKey, topicIndex: number, status: "done" | "review") => {
      if (!isOnline) {
        // Offline: salva solo in localStorage
        saveToLocalStorage(subject, topicIndex, status)
        return
      }

      try {
        setSyncStatus("syncing")

        const { data: user } = await supabase.auth.getUser()

        // Se non loggato, usa localStorage
        if (!user.user) {
          saveToLocalStorage(subject, topicIndex, status)
          setSyncStatus("idle")
          return
        }

        // Upsert su Supabase
        const { error } = await supabase.from("user_progress").upsert(
          {
            user_id: user.user.id,
            subject_key: subject,
            topic_index: topicIndex,
            is_completed: status === "done",
            review_status: status === "review" ? "review" : null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id, subject_key, topic_index" }
        )

        if (error) {
          console.warn("Supabase sync error, fallback to localStorage:", error)
          saveToLocalStorage(subject, topicIndex, status)
        }

        setSyncStatus("idle")
      } catch (err) {
        console.error("Sync error:", err)
        saveToLocalStorage(subject, topicIndex, status)
        setSyncStatus("error")
      }
    },
    [isOnline]
  )

  /**
   * Carica i progressi da Supabase (da eseguire all'avvio)
   */
  const loadProgressFromSupabase = useCallback(
    async (): Promise<Record<string, UserProgress>> => {
      try {
        const { data: user } = await supabase.auth.getUser()

        // Se non loggato, restituisci empty
        if (!user.user) return {}

        const { data, error } = await supabase
          .from("user_progress")
          .select("*")
          .eq("user_id", user.user.id)

        if (error) {
          console.warn("Could not load progress from Supabase:", error)
          return {}
        }

        // Trasforma in mappa: "subject_topicIndex" -> UserProgress
        const result: Record<string, UserProgress> = {}
        if (data) {
          for (const row of data) {
            const key = `${row.subject_key}_${row.topic_index}`
            result[key] = row
          }
        }

        return result
      } catch (err) {
        console.error("Load progress error:", err)
        return {}
      }
    },
    []
  )

  /**
   * Sincronizza il daily session
   */
  const syncDailySession = useCallback(
    async (dayStr: string, sessionIndex: number, isDone: boolean) => {
      if (!isOnline) {
        saveDailyToLocalStorage(dayStr, sessionIndex, isDone)
        return
      }

      try {
        const { data: user } = await supabase.auth.getUser()
        if (!user.user) {
          saveDailyToLocalStorage(dayStr, sessionIndex, isDone)
          return
        }

        // Nota: questa è una tabella separata (se implementata)
        // Per ora usiamo localStorage come backup
        saveDailyToLocalStorage(dayStr, sessionIndex, isDone)
      } catch (err) {
        console.error("Daily sync error:", err)
        saveDailyToLocalStorage(dayStr, sessionIndex, isDone)
      }
    },
    [isOnline]
  )

  return {
    syncTopic,
    loadProgressFromSupabase,
    syncDailySession,
    syncStatus,
    isOnline,
  }
}

/**
 * Salva in localStorage come backup/offline storage
 */
function saveToLocalStorage(subject: SubjectKey, topicIndex: number, status: "done" | "review") {
  try {
    const storage = localStorage.getItem("planner.sync.backup") || "{}"
    const data = JSON.parse(storage)
    const key = `${subject}_${topicIndex}`
    data[key] = { status, timestamp: new Date().toISOString() }
    localStorage.setItem("planner.sync.backup", JSON.stringify(data))
  } catch {
    // Silently fail
  }
}

/**
 * Salva daily session in localStorage
 */
function saveDailyToLocalStorage(dayStr: string, sessionIndex: number, isDone: boolean) {
  try {
    const storage = localStorage.getItem("planner.daily.backup") || "{}"
    const data = JSON.parse(storage)
    const key = `${dayStr}_${sessionIndex}`
    data[key] = { isDone, timestamp: new Date().toISOString() }
    localStorage.setItem("planner.daily.backup", JSON.stringify(data))
  } catch {
    // Silently fail
  }
}
