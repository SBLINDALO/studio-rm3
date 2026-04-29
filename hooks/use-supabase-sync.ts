import { useCallback, useEffect, useState } from "react"
import { supabase, type UserProgress } from "@/lib/supabase/client"
import type { SubjectKey, LoggedSession, CatchupItem } from "@/lib/planner/types"

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
   * Carica daily da Supabase
   */
  const loadDailyFromSupabase = useCallback(
    async (): Promise<Record<string, boolean>> => {
      try {
        const { data: user } = await supabase.auth.getUser()
        if (!user.user) return {}

        const { data, error } = await supabase
          .from("user_daily")
          .select("*")
          .eq("user_id", user.user.id)

        if (error) {
          console.warn("Could not load daily from Supabase:", error)
          return {}
        }

        const result: Record<string, boolean> = {}
        if (data) {
          for (const row of data) {
            const key = `${row.day_str}_${row.session_index}`
            result[key] = row.is_done
          }
        }

        return result
      } catch (err) {
        console.error("Load daily error:", err)
        return {}
      }
    },
    []
  )

  /**
   * Carica notes da Supabase
   */
  const loadNotesFromSupabase = useCallback(
    async (): Promise<Record<string, string>> => {
      try {
        const { data: user } = await supabase.auth.getUser()
        if (!user.user) return {}

        const { data, error } = await supabase
          .from("user_notes")
          .select("*")
          .eq("user_id", user.user.id)

        if (error) {
          console.warn("Could not load notes from Supabase:", error)
          return {}
        }

        const result: Record<string, string> = {}
        if (data) {
          for (const row of data) {
            result[row.week_index] = row.note
          }
        }

        return result
      } catch (err) {
        console.error("Load notes error:", err)
        return {}
      }
    },
    []
  )

  /**
   * Carica conf da Supabase
   */
  const loadConfFromSupabase = useCallback(
    async (): Promise<Record<string, number>> => {
      try {
        const { data: user } = await supabase.auth.getUser()
        if (!user.user) return {}

        const { data, error } = await supabase
          .from("user_conf")
          .select("*")
          .eq("user_id", user.user.id)

        if (error) {
          console.warn("Could not load conf from Supabase:", error)
          return {}
        }

        const result: Record<string, number> = {}
        if (data) {
          for (const row of data) {
            result[row.conf_key] = row.value
          }
        }

        return result
      } catch (err) {
        console.error("Load conf error:", err)
        return {}
      }
    },
    []
  )

  /**
   * Carica check da Supabase
   */
  const loadCheckFromSupabase = useCallback(
    async (): Promise<Record<string, number>> => {
      try {
        const { data: user } = await supabase.auth.getUser()
        if (!user.user) return {}

        const { data, error } = await supabase
          .from("user_check")
          .select("*")
          .eq("user_id", user.user.id)

        if (error) {
          console.warn("Could not load check from Supabase:", error)
          return {}
        }

        const result: Record<string, number> = {}
        if (data) {
          for (const row of data) {
            result[row.check_key] = row.value
          }
        }

        return result
      } catch (err) {
        console.error("Load check error:", err)
        return {}
      }
    },
    []
  )

  /**
   * Carica sessions da Supabase
   */
  const loadSessionsFromSupabase = useCallback(
    async (): Promise<LoggedSession[]> => {
      try {
        const { data: user } = await supabase.auth.getUser()
        if (!user.user) return []

        const { data, error } = await supabase
          .from("user_sessions")
          .select("*")
          .eq("user_id", user.user.id)
          .order("created_at", { ascending: true })

        if (error) {
          console.warn("Could not load sessions from Supabase:", error)
          return []
        }

        const result: LoggedSession[] = []
        if (data) {
          for (const row of data) {
            result.push({
              id: row.session_id,
              date: row.date,
              subject: row.subject,
              duration: row.duration,
              mode: row.mode,
              startTime: row.start_time,
            })
          }
        }

        return result
      } catch (err) {
        console.error("Load sessions error:", err)
        return []
      }
    },
    []
  )

  /**
   * Carica catchup da Supabase
   */
  const loadCatchupFromSupabase = useCallback(
    async (): Promise<CatchupItem[]> => {
      try {
        const { data: user } = await supabase.auth.getUser()
        if (!user.user) return []

        const { data, error } = await supabase
          .from("user_catchup")
          .select("*")
          .eq("user_id", user.user.id)
          .order("created_at", { ascending: true })

        if (error) {
          console.warn("Could not load catchup from Supabase:", error)
          return []
        }

        const result: CatchupItem[] = []
        if (data) {
          for (const row of data) {
            result.push({
              id: row.catchup_id,
              origDay: row.orig_day,
              origIdx: row.orig_idx,
              sub: row.sub,
              dur: row.dur,
              topic: row.topic,
              targetDay: row.target_day,
              done: row.done,
              createdAt: new Date(row.created_at).getTime(),
            })
          }
        }

        return result
      } catch (err) {
        console.error("Load catchup error:", err)
        return []
      }
    },
    []
  )

  /**
   * Sincronizza daily session
   */
  const syncDaily = useCallback(
    async (dayStr: string, sessionIndex: number, isDone: boolean) => {
      if (!isOnline) {
        saveDailyToLocalStorage(dayStr, sessionIndex, isDone)
        return
      }

      try {
        setSyncStatus("syncing")

        const { data: user } = await supabase.auth.getUser()
        if (!user.user) {
          saveDailyToLocalStorage(dayStr, sessionIndex, isDone)
          setSyncStatus("idle")
          return
        }

        const { error } = await supabase.from("user_daily").upsert(
          {
            user_id: user.user.id,
            day_str: dayStr,
            session_index: sessionIndex,
            is_done: isDone,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id, day_str, session_index" }
        )

        if (error) {
          console.warn("Supabase daily sync error:", error)
          saveDailyToLocalStorage(dayStr, sessionIndex, isDone)
        }

        setSyncStatus("idle")
      } catch (err) {
        console.error("Daily sync error:", err)
        saveDailyToLocalStorage(dayStr, sessionIndex, isDone)
        setSyncStatus("error")
      }
    },
    [isOnline]
  )

  /**
   * Sincronizza note settimanali
   */
  const syncNote = useCallback(
    async (weekIdx: number, note: string) => {
      if (!isOnline) {
        saveNoteToLocalStorage(weekIdx, note)
        return
      }

      try {
        setSyncStatus("syncing")

        const { data: user } = await supabase.auth.getUser()
        if (!user.user) {
          saveNoteToLocalStorage(weekIdx, note)
          setSyncStatus("idle")
          return
        }

        const { error } = await supabase.from("user_notes").upsert(
          {
            user_id: user.user.id,
            week_index: weekIdx,
            note: note,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id, week_index" }
        )

        if (error) {
          console.warn("Supabase note sync error:", error)
          saveNoteToLocalStorage(weekIdx, note)
        }

        setSyncStatus("idle")
      } catch (err) {
        console.error("Note sync error:", err)
        saveNoteToLocalStorage(weekIdx, note)
        setSyncStatus("error")
      }
    },
    [isOnline]
  )

  /**
   * Sincronizza confidenza
   */
  const syncConf = useCallback(
    async (key: string, value: number) => {
      if (!isOnline) {
        saveConfToLocalStorage(key, value)
        return
      }

      try {
        setSyncStatus("syncing")

        const { data: user } = await supabase.auth.getUser()
        if (!user.user) {
          saveConfToLocalStorage(key, value)
          setSyncStatus("idle")
          return
        }

        const { error } = await supabase.from("user_conf").upsert(
          {
            user_id: user.user.id,
            conf_key: key,
            value: value,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id, conf_key" }
        )

        if (error) {
          console.warn("Supabase conf sync error:", error)
          saveConfToLocalStorage(key, value)
        }

        setSyncStatus("idle")
      } catch (err) {
        console.error("Conf sync error:", err)
        saveConfToLocalStorage(key, value)
        setSyncStatus("error")
      }
    },
    [isOnline]
  )

  /**
   * Sincronizza check
   */
  const syncCheck = useCallback(
    async (key: string, value: number) => {
      if (!isOnline) {
        saveCheckToLocalStorage(key, value)
        return
      }

      try {
        setSyncStatus("syncing")

        const { data: user } = await supabase.auth.getUser()
        if (!user.user) {
          saveCheckToLocalStorage(key, value)
          setSyncStatus("idle")
          return
        }

        const { error } = await supabase.from("user_check").upsert(
          {
            user_id: user.user.id,
            check_key: key,
            value: value,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id, check_key" }
        )

        if (error) {
          console.warn("Supabase check sync error:", error)
          saveCheckToLocalStorage(key, value)
        }

        setSyncStatus("idle")
      } catch (err) {
        console.error("Check sync error:", err)
        saveCheckToLocalStorage(key, value)
        setSyncStatus("error")
      }
    },
    [isOnline]
  )

  /**
   * Sincronizza sessione loggata
   */
  const syncSession = useCallback(
    async (session: LoggedSession) => {
      if (!isOnline) {
        saveSessionToLocalStorage(session)
        return
      }

      try {
        setSyncStatus("syncing")

        const { data: user } = await supabase.auth.getUser()
        if (!user.user) {
          saveSessionToLocalStorage(session)
          setSyncStatus("idle")
          return
        }

        const { error } = await supabase.from("user_sessions").insert({
          user_id: user.user.id,
          session_id: session.id,
          date: session.date,
          subject: session.subject,
          duration: session.duration,
          mode: session.mode,
          start_time: session.startTime,
          created_at: new Date().toISOString(),
        })

        if (error) {
          console.warn("Supabase session sync error:", error)
          saveSessionToLocalStorage(session)
        }

        setSyncStatus("idle")
      } catch (err) {
        console.error("Session sync error:", err)
        saveSessionToLocalStorage(session)
        setSyncStatus("error")
      }
    },
    [isOnline]
  )

  /**
   * Sincronizza catchup item
   */
  const syncCatchup = useCallback(
    async (catchup: CatchupItem) => {
      if (!isOnline) {
        saveCatchupToLocalStorage(catchup)
        return
      }

      try {
        setSyncStatus("syncing")

        const { data: user } = await supabase.auth.getUser()
        if (!user.user) {
          saveCatchupToLocalStorage(catchup)
          setSyncStatus("idle")
          return
        }

        const { error } = await supabase.from("user_catchup").upsert(
          {
            user_id: user.user.id,
            catchup_id: catchup.id,
            orig_day: catchup.origDay,
            orig_idx: catchup.origIdx,
            sub: catchup.sub,
            dur: catchup.dur,
            topic: catchup.topic,
            target_day: catchup.targetDay,
            done: catchup.done,
            created_at: new Date(catchup.createdAt).toISOString(),
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id, catchup_id" }
        )

        if (error) {
          console.warn("Supabase catchup sync error:", error)
          saveCatchupToLocalStorage(catchup)
        }

        setSyncStatus("idle")
      } catch (err) {
        console.error("Catchup sync error:", err)
        saveCatchupToLocalStorage(catchup)
        setSyncStatus("error")
      }
    },
    [isOnline]
  )

  return {
    syncTopic,
    loadProgressFromSupabase,
    syncDaily,
    syncNote,
    syncConf,
    syncCheck,
    syncSession,
    syncCatchup,
    loadDailyFromSupabase,
    loadNotesFromSupabase,
    loadConfFromSupabase,
    loadCheckFromSupabase,
    loadSessionsFromSupabase,
    loadCatchupFromSupabase,
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

/**
 * Salva note in localStorage
 */
function saveNoteToLocalStorage(weekIdx: number, note: string) {
  try {
    const storage = localStorage.getItem("planner.notes.backup") || "{}"
    const data = JSON.parse(storage)
    data[weekIdx] = { note, timestamp: new Date().toISOString() }
    localStorage.setItem("planner.notes.backup", JSON.stringify(data))
  } catch {
    // Silently fail
  }
}

/**
 * Salva conf in localStorage
 */
function saveConfToLocalStorage(key: string, value: number) {
  try {
    const storage = localStorage.getItem("planner.conf.backup") || "{}"
    const data = JSON.parse(storage)
    data[key] = { value, timestamp: new Date().toISOString() }
    localStorage.setItem("planner.conf.backup", JSON.stringify(data))
  } catch {
    // Silently fail
  }
}

/**
 * Salva check in localStorage
 */
function saveCheckToLocalStorage(key: string, value: number) {
  try {
    const storage = localStorage.getItem("planner.check.backup") || "{}"
    const data = JSON.parse(storage)
    data[key] = { value, timestamp: new Date().toISOString() }
    localStorage.setItem("planner.check.backup", JSON.stringify(data))
  } catch {
    // Silently fail
  }
}

/**
 * Salva session in localStorage
 */
function saveSessionToLocalStorage(session: LoggedSession) {
  try {
    const storage = localStorage.getItem("planner.sessions.backup") || "[]"
    const data = JSON.parse(storage)
    data.push({ ...session, timestamp: new Date().toISOString() })
    localStorage.setItem("planner.sessions.backup", JSON.stringify(data))
  } catch {
    // Silently fail
  }
}

/**
 * Salva catchup in localStorage
 */
function saveCatchupToLocalStorage(catchup: CatchupItem) {
  try {
    const storage = localStorage.getItem("planner.catchup.backup") || "{}"
    const data = JSON.parse(storage)
    data[catchup.id] = { ...catchup, timestamp: new Date().toISOString() }
    localStorage.setItem("planner.catchup.backup", JSON.stringify(data))
  } catch {
    // Silently fail
  }
}
