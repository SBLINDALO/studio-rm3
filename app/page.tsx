"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { RotateCw } from "lucide-react"

import { usePlanner } from "@/hooks/use-planner"
import { usePersistedState } from "@/hooks/use-persisted-state"
import { TODAY_STR } from "@/lib/planner/data"
import type { SubjectKey, TimerMode } from "@/lib/planner/types"

import { Header } from "@/components/planner/header"
import { TabsNav, type TabId } from "@/components/planner/tabs-nav"
import { TodayTab } from "@/components/planner/today-tab"
import { ScheduleTab } from "@/components/planner/schedule-tab"
import { TrackerTab } from "@/components/planner/tracker-tab"
import { ReviewTab } from "@/components/planner/review-tab"
import { TimerTab } from "@/components/planner/timer-tab"
import { FocusView } from "@/components/planner/focus-view"
import { CatchupView } from "@/components/planner/catchup-view"
import { AssistantFab } from "@/components/planner/assistant-fab"
import { AssistantDrawer } from "@/components/planner/assistant-drawer"
import { ProgressTab } from "@/components/planner/progress-tab"
import { NotificationSettings } from "@/components/planner/notification-settings"
import { scanSkipped } from "@/lib/planner/catchup"

export default function PlannerPage() {
  const {
    data,
    loaded,
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
    addCatchupItems,
    toggleCatchupDone,
    removeCatchupItem,
    attachDoc,
    removeDoc,
    addCustomExam,
    removeExam,
    archiveExam,
    restoreExam,
    updateChapterProgress,
    dailyStats,
    streak,
  } = usePlanner()

  const [tab, setTab] = usePersistedState<TabId>("ui.tab", "today")
  const [toast, setToast] = useState<ToastState | null>(null)
  const [catchupOpen, setCatchupOpen] = useState(false)
  const [assistantOpen, setAssistantOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const skippedNotifiedRef = useRef(false)

  // Timer state
  // Runtime state (not persisted — resets on page reload)
  const [timerRemaining, setTimerRemaining] = useState(25 * 60)
  const [timerTotal, setTimerTotal] = useState(25 * 60)
  const [timerActive, setTimerActive] = useState(false)
  const [timerMode, setTimerMode] = useState<TimerMode>("focus")
  const [focusView, setFocusView] = useState(false)

  // Persisted preferences — survive reloads and home-screen launches
  const [timerSubject, setTimerSubject] = usePersistedState<SubjectKey | null>(
    "timer.subject",
    null,
  )
  const [customMin, setCustomMin] = usePersistedState<number>("timer.customMin", 25)
  const [autoChain, setAutoChain] = usePersistedState<boolean>("timer.autoChain", false)
  const [soundOn, setSoundOn] = usePersistedState<boolean>("timer.soundOn", true)

  const timerTickRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const timerStartAtRef = useRef<number | null>(null)
  const completionHandledRef = useRef<number>(0)
  const autoChainTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const showToast = useCallback((msg: string, tone: ToastState["tone"] = "default") => {
    setToast({ msg, tone })
    setTimeout(() => setToast(null), 2200)
  }, [])

  // Sound feedback
  const playBeep = useCallback(
    (kind: "complete" | "start" = "complete") => {
      if (!soundOn) return
      try {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
        const ctx = new AudioCtx()
        const notes =
          kind === "complete"
            ? [
                { f: 880, d: 0, l: 0.18 },
                { f: 1100, d: 0.22, l: 0.18 },
                { f: 1320, d: 0.45, l: 0.35 },
              ]
            : [{ f: 660, d: 0, l: 0.12 }]
        notes.forEach((n) => {
          const osc = ctx.createOscillator()
          const gain = ctx.createGain()
          osc.connect(gain)
          gain.connect(ctx.destination)
          osc.frequency.value = n.f
          osc.type = "sine"
          gain.gain.setValueAtTime(0, ctx.currentTime + n.d)
          gain.gain.linearRampToValueAtTime(0.25, ctx.currentTime + n.d + 0.02)
          gain.gain.linearRampToValueAtTime(0, ctx.currentTime + n.d + n.l)
          osc.start(ctx.currentTime + n.d)
          osc.stop(ctx.currentTime + n.d + n.l)
        })
      } catch {
        // ignore
      }
    },
    [soundOn],
  )

  // Today stats
  const todaySessions = useMemo(
    () => (data.sessions || []).filter((s) => s.date === TODAY_STR),
    [data.sessions],
  )
  const todayFocusMin = useMemo(
    () => todaySessions.filter((s) => s.mode === "focus").reduce((a, s) => a + s.duration, 0),
    [todaySessions],
  )
  const todayFocusCount = useMemo(
    () => todaySessions.filter((s) => s.mode === "focus").length,
    [todaySessions],
  )

  // Timer tick
  useEffect(() => {
    if (timerActive && timerRemaining > 0) {
      timerTickRef.current = setInterval(() => {
        setTimerRemaining((p) => {
          if (p <= 1) {
            setTimerActive(false)
            return 0
          }
          return p - 1
        })
      }, 1000)
    } else if (timerTickRef.current) {
      clearInterval(timerTickRef.current)
    }
    return () => {
      if (timerTickRef.current) clearInterval(timerTickRef.current)
    }
  }, [timerActive, timerRemaining])

  const handleAutoNext = useCallback(() => {
    const nextMode: TimerMode = timerMode === "focus" ? "break" : "focus"
    let nextMin: number
    if (nextMode === "break") {
      const completedFocus = todayFocusCount + (timerMode === "focus" ? 1 : 0)
      nextMin = completedFocus > 0 && completedFocus % 4 === 0 ? 15 : 5
    } else {
      nextMin = customMin
    }
    setTimerMode(nextMode)
    const secs = nextMin * 60
    setTimerTotal(secs)
    setTimerRemaining(secs)
    timerStartAtRef.current = Date.now()
    setTimerActive(true)
    playBeep("start")
  }, [timerMode, todayFocusCount, customMin, playBeep])

  // Detect completion & log session
  useEffect(() => {
    if (
      timerRemaining === 0 &&
      timerTotal > 0 &&
      !timerActive &&
      completionHandledRef.current !== timerStartAtRef.current &&
      timerStartAtRef.current !== null
    ) {
      completionHandledRef.current = timerStartAtRef.current
      playBeep("complete")
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate([200, 100, 200, 100, 300])
      }

      const mins = Math.round(timerTotal / 60)
      const hh = timerStartAtRef.current
        ? new Date(timerStartAtRef.current).toLocaleTimeString("it-IT", {
            hour: "2-digit",
            minute: "2-digit",
          })
        : ""
      logSession({
        subject: timerSubject,
        duration: mins,
        mode: timerMode,
        startTime: hh,
      })

      if (timerMode === "focus") showToast("Sessione completata!", "success")
      else showToast("Pausa finita, al lavoro", "info")

      if (autoChain) {
        autoChainTimeoutRef.current = setTimeout(() => {
          autoChainTimeoutRef.current = null
          handleAutoNext()
        }, 2500)
      }
    }
  }, [
    timerRemaining,
    timerTotal,
    timerActive,
    autoChain,
    timerMode,
    timerSubject,
    logSession,
    showToast,
    playBeep,
    handleAutoNext,
  ])

  const startTimer = useCallback(() => {
    if (timerRemaining === 0) setTimerRemaining(timerTotal)
    timerStartAtRef.current = Date.now()
    setTimerActive(true)
    playBeep("start")
    if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(40)
  }, [timerRemaining, timerTotal, playBeep])

  const pauseTimer = useCallback(() => {
    setTimerActive(false)
    if (autoChainTimeoutRef.current) {
      clearTimeout(autoChainTimeoutRef.current)
      autoChainTimeoutRef.current = null
    }
    if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(40)
  }, [])

  const resetTimer = useCallback(() => {
    setTimerActive(false)
    setTimerRemaining(timerTotal)
    timerStartAtRef.current = null
    completionHandledRef.current = 0
    if (autoChainTimeoutRef.current) {
      clearTimeout(autoChainTimeoutRef.current)
      autoChainTimeoutRef.current = null
    }
  }, [timerTotal])

  const skipToNext = useCallback(() => {
    completionHandledRef.current = timerStartAtRef.current ?? 0
    setTimerActive(false)
    setTimerRemaining(0)
    setTimeout(() => handleAutoNext(), 300)
  }, [handleAutoNext])

  const applyPreset = useCallback(
    (min: number, mode: TimerMode) => {
      setTimerActive(false)
      setTimerMode(mode)
      const s = min * 60
      setTimerTotal(s)
      setTimerRemaining(s)
      if (mode === "focus") setCustomMin(min)
      completionHandledRef.current = 0
    },
    [],
  )

  const applyCustom = useCallback(
    (min: number) => {
      const clamped = Math.max(5, Math.min(120, min))
      setCustomMin(clamped)
      if (!timerActive) {
        setTimerMode("focus")
        const s = clamped * 60
        setTimerTotal(s)
        setTimerRemaining(s)
        completionHandledRef.current = 0
      }
    },
    [timerActive],
  )

  // Tracker handlers with toast feedback
  const handleToggleTopic = useCallback(
    (sub: SubjectKey, i: number, status: "done" | "review") => {
      toggleTopic(sub, i, status)
      if (status === "done") showToast("Studiato!", "success")
      else showToast("Da ripassare", "warn")
    },
    [toggleTopic, showToast],
  )

  const handleToggleDaily = useCallback(
    (dayStr: string, ti: number) => {
      toggleDaily(dayStr, ti)
      const k = `${dayStr}_${ti}`
      if (!data.daily[k]) showToast("Fatto!", "success")
    },
    [toggleDaily, data.daily, showToast],
  )

  const gp = useMemo(() => globalProgress(), [globalProgress])

  // Compute skipped sessions (auto-detection) and a per-day count for the Schedule badges
  const skippedItems = useMemo(() => scanSkipped(data), [data])
  const skippedByDay = useMemo(() => {
    const acc: Record<string, number> = {}
    for (const s of skippedItems) {
      acc[s.origDay] = (acc[s.origDay] ?? 0) + 1
    }
    return acc
  }, [skippedItems])

  // One-time toast notification when arrears are detected on load
  useEffect(() => {
    if (!loaded || skippedNotifiedRef.current) return
    if (skippedItems.length > 0) {
      skippedNotifiedRef.current = true
      const n = skippedItems.length
      showToast(`${n} ${n === 1 ? "argomento arretrato" : "argomenti arretrati"}`, "warn")
    }
  }, [loaded, skippedItems.length, showToast])

  // Loading state
  if (!loaded) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#FBFBF9]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
        >
          <RotateCw size={32} className="text-neutral-600" strokeWidth={3} />
        </motion.div>
      </div>
    )
  }

  return (
    <div className="relative mx-auto min-h-screen max-w-[680px] overflow-x-hidden bg-[#FBFBF9] pb-24 antialiased">
      <FocusView
        open={focusView}
        timerRemaining={timerRemaining}
        timerTotal={timerTotal}
        timerActive={timerActive}
        timerMode={timerMode}
        timerSubject={timerSubject}
        onToggle={timerActive ? pauseTimer : startTimer}
        onClose={() => setFocusView(false)}
      />

      <CatchupView
        open={catchupOpen}
        onClose={() => setCatchupOpen(false)}
        data={data}
        onMarkRecovered={markRecovered}
        onDismissSkipped={dismissSkipped}
        onAcceptCatchup={addCatchupItems}
        onRemoveCatchupItem={removeCatchupItem}
        onShowToast={showToast}
      />

      <AssistantFab
        onClick={() => setAssistantOpen(true)}
        hidden={assistantOpen || catchupOpen || focusView}
      />
      <AssistantDrawer
        open={assistantOpen}
        onClose={() => setAssistantOpen(false)}
        data={data}
      />

      <Toast toast={toast} />

      <NotificationSettings
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />

      <Header
        globalPct={gp.pct}
        globalDone={gp.done}
        globalTotal={gp.total}
        skippedCount={skippedItems.length}
        onOpenCatchup={() => setCatchupOpen(true)}
        onOpenSettings={() => setSettingsOpen(true)}
        getProgress={getProgress}
      />

      <main className="px-3.5 py-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            {tab === "today" && (
              <TodayTab
                data={data}
                toggleDaily={handleToggleDaily}
                toggleCatchupDone={toggleCatchupDone}
                attachDoc={attachDoc}
                removeDoc={removeDoc}
                addCustomExam={addCustomExam}
                archiveExam={archiveExam}
                removeExam={removeExam}
                restoreExam={restoreExam}
                updateChapterProgress={updateChapterProgress}
                dailyStats={dailyStats}
                streak={streak}
                todayFocusMin={todayFocusMin}
                todayFocusCount={todayFocusCount}
                skippedCount={skippedItems.length}
                onOpenCatchup={() => setCatchupOpen(true)}
                onNavigate={setTab}
              />
            )}
            {tab === "schedule" && (
              <ScheduleTab
                data={data}
                toggleDaily={handleToggleDaily}
                toggleCatchupDone={toggleCatchupDone}
                attachDoc={attachDoc}
                removeDoc={removeDoc}
                skippedByDay={skippedByDay}
              />
            )}
            {tab === "tracker" && (
              <TrackerTab data={data} quiz={data.quiz} toggleTopic={handleToggleTopic} saveTopicQuiz={saveTopicQuiz} getProgress={getProgress} />
            )}
            {tab === "review" && (
              <ReviewTab data={data} setCheck={setCheck} setConf={setConf} setNote={setNote} />
            )}
            {tab === "progress" && (
              <ProgressTab data={data} dailyStats={dailyStats} streak={streak} />
            )}
            {tab === "timer" && (
              <TimerTab
                timerRemaining={timerRemaining}
                timerTotal={timerTotal}
                timerActive={timerActive}
                timerMode={timerMode}
                timerSubject={timerSubject}
                customMin={customMin}
                autoChain={autoChain}
                soundOn={soundOn}
                todayFocusMin={todayFocusMin}
                todayFocusCount={todayFocusCount}
                todaySessions={todaySessions}
                onSubjectChange={setTimerSubject}
                onStart={startTimer}
                onPause={pauseTimer}
                onReset={resetTimer}
                onSkip={skipToNext}
                onApplyPreset={applyPreset}
                onApplyCustom={applyCustom}
                onToggleAutoChain={() => setAutoChain((v) => !v)}
                onToggleSound={() => setSoundOn((v) => !v)}
                onOpenFocus={() => setFocusView(true)}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      <TabsNav tab={tab} onChange={setTab} />
    </div>
  )
}
