"use client"

import { useCallback, useEffect, useState } from "react"
import type { ArchivedExam, CustomExam, DynamicExam, PlannerData, SubjectKey, TopicStatus, LoggedSession, StudyDoc } from "@/lib/planner/types"
import { SUBJECTS, TOPICS } from "@/lib/planner/data"
import { getTodayStr } from "@/lib/planner/helpers"
import { useSupabaseSync } from "./use-supabase-sync"
import { getAllExams, addCustomExam as addExamToSupabase, removeExam as removeExamFromSupabase, archiveExam as archiveExamToSupabase, restoreExam as restoreExamFromSupabase, updateExamMaterial as updateExamInSupabase } from "@/lib/supabase/exams"
import { getStudyProgress, updateChapterProgress as updateChapterProgressInSupabase, getDailyStats, getStreak } from "@/lib/supabase/study-progress"
import type { StudyProgress } from "@/lib/supabase/client"

const STORAGE_KEY = "planner5v3"

const initialData: PlannerData = {
  topics: {},
  daily: {},
  notes: {},
  conf: {},
  check: {},
  sessions: [],
  quiz: {},
  docs: {},
  customExams: [],
  archivedExams: [],
  dynamicExams: [],
  // customExams e archivedExams sono gestiti da Supabase
  studyProgress: [],
}

export function usePlanner() {
  const [data, setData] = useState<PlannerData>(initialData)
  const [loaded, setLoaded] = useState(false)
  const [dailyStats, setDailyStats] = useState({ chaptersCompleted: 0, totalTimeSpent: 0, examsStudied: [] as string[] })
  const [streak, setStreak] = useState(0)
  const { syncTopic, syncTopicQuiz, loadProgressFromSupabase, syncDaily, syncNote, syncConf, syncCheck, syncSession, loadDailyFromSupabase, loadNotesFromSupabase, loadConfFromSupabase, loadCheckFromSupabase, loadSessionsFromSupabase } = useSupabaseSync()

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
          if (!parsed.quiz) parsed.quiz = {}
          if (!parsed.docs) parsed.docs = {}
          // Non caricare customExams e archivedExams da localStorage
        }

        // Carica tutti i dati da Supabase e unisci
        const [supabaseProgress, supabaseDaily, supabaseNotes, supabaseConf, supabaseCheck, supabaseSessions] = await Promise.all([
          loadProgressFromSupabase(),
          loadDailyFromSupabase(),
          loadNotesFromSupabase(),
          loadConfFromSupabase(),
          loadCheckFromSupabase(),
          loadSessionsFromSupabase(),
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

        // Carica esami da Supabase
        const userId = "test-user"
        try {
          const { customExams, archivedExams, dynamicExams } = await getAllExams()
          parsed.customExams = customExams
          parsed.archivedExams = archivedExams
          parsed.dynamicExams = dynamicExams
        } catch (examError) {
          console.error('Error loading exams from Supabase:', examError)
          // Imposta valori di default se Supabase fallisce
          parsed.customExams = []
          parsed.archivedExams = []
        }

        // Carica study progress da Supabase
        try {
          // Per ora, carica tutto; in futuro, filtra per esami attivi
          const allProgress: StudyProgress[] = []
          for (const exam of parsed.customExams) {
            const progress = await getStudyProgress(userId, exam.id)
            allProgress.push(...progress)
          }
          parsed.studyProgress = allProgress
        } catch (progressError) {
          console.error('Error loading study progress:', progressError)
          parsed.studyProgress = []
        }

        setData(parsed)
        setLoaded(true)

        // Calcola statistiche giornaliere e streak
        try {
          const [stats, streakValue] = await Promise.all([
            getDailyStats(userId, getTodayStr()),
            getStreak(userId)
          ])
          setDailyStats(stats)
          setStreak(streakValue)
        } catch (statsError) {
          console.error('Error loading stats:', statsError)
        }
      } catch (error) {
        console.error('Error loading data:', error)
        setLoaded(true)
      }
    }
    loadData()
  }, [loadProgressFromSupabase, loadDailyFromSupabase, loadNotesFromSupabase, loadConfFromSupabase, loadCheckFromSupabase, loadSessionsFromSupabase])

  const save = useCallback((next: PlannerData) => {
    // Non salvare customExams e archivedExams su localStorage, sono gestiti da Supabase
    const { customExams, archivedExams, ...dataToSave } = next
    setData(next)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave))
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
      const todayKey = getTodayStr()
      const s: LoggedSession = { ...session, id: Date.now(), date: todayKey }
      save({ ...data, sessions: [...(data.sessions || []), s] })
      
      // Sincronizza con Supabase
      syncSession(s).catch(() => {
        // Fallback già gestito
      })
    },
    [data, save, syncSession],
  )

  const addCustomExam = useCallback(
    async (exam: Omit<DynamicExam, "id" | "createdAt">) => {
      // Non intercettare l'errore qui: deve propagarsi al chiamante (form) per essere mostrato all'utente
      const result = await addExamToSupabase(exam)
      setData(prev => ({ ...prev, ...result }))
    },
    [],
  )

  const updateExam = useCallback(
    async (
      exam: DynamicExam,
      updates: Partial<Pick<DynamicExam, "name" | "examDate" | "startDate" | "material" | "examType" | "cfu" | "status">>,
    ) => {
      const result = await updateExamInSupabase(exam, updates)
      setData(prev => ({ ...prev, ...result }))
    },
    [],
  )

  const cleanExamDocs = useCallback(
    (id: string) => {
      const nextDocs = { ...data.docs }
      Object.keys(nextDocs).forEach((key) => {
        if (key.startsWith(`exam_${id}`)) {
          delete nextDocs[key]
        }
      })
      return nextDocs
    },
    [data.docs],
  )

  const removeExam = useCallback(
    async (id: string) => {
      // Non intercettare l'errore qui: deve propagarsi al chiamante per mostrare un errore reale, mai un successo finto
      const { customExams, archivedExams, dynamicExams } = await removeExamFromSupabase(id)
      setData(prev => ({
        ...prev,
        customExams,
        archivedExams,
        dynamicExams,
        docs: cleanExamDocs(id),
      }))
    },
    [cleanExamDocs],
  )

  const archiveExam = useCallback(
    async (id: string) => {
      // Non intercettare l'errore qui: deve propagarsi al chiamante per mostrare un errore reale, mai un successo finto
      const { customExams, archivedExams, dynamicExams } = await archiveExamToSupabase(id)
      setData(prev => ({
        ...prev,
        customExams,
        archivedExams,
        dynamicExams,
        docs: cleanExamDocs(id),
      }))
    },
    [cleanExamDocs],
  )

  const restoreExam = useCallback(
    async (id: string) => {
      try {
        const { customExams, archivedExams, dynamicExams } = await restoreExamFromSupabase(id)
        setData(prev => ({
          ...prev,
          customExams,
          archivedExams,
          dynamicExams,
        }))
      } catch (error) {
        console.error('Error restoring exam:', error)
      }
    },
    [],
  )

  const updateChapterProgress = useCallback(
    async (examId: string, chapterId: string, status: "not_started" | "in_progress" | "completed", timeSpent?: number) => {
      try {
        const userId = "test-user"
        const updatedProgress = await updateChapterProgressInSupabase(userId, examId, chapterId, status, timeSpent)
        setData(prev => ({
          ...prev,
          studyProgress: prev.studyProgress.map(p => p.id === updatedProgress.id ? updatedProgress : p)
        }))
        // Ricarica statistiche
        const [stats, streakValue] = await Promise.all([
          getDailyStats(userId, getTodayStr()),
          getStreak(userId)
        ])
        setDailyStats(stats)
        setStreak(streakValue)
      } catch (error) {
        console.error('Error updating chapter progress:', error)
      }
    },
    [],
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

  const attachDoc = useCallback(
    (key: string, doc: StudyDoc) => {
      save({ ...data, docs: { ...data.docs, [key]: doc } })
    },
    [data, save],
  )

  const removeDoc = useCallback(
    (key: string) => {
      const nextDocs = { ...data.docs }
      delete nextDocs[key]
      save({ ...data, docs: nextDocs })
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
    attachDoc,
    removeDoc,
    addCustomExam,
    updateExam,
    removeExam,
    archiveExam,
    restoreExam,
    updateChapterProgress,
    dailyStats,
    streak,
  }
}
