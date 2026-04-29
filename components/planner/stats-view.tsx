"use client"

import { useMemo } from "react"
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts"
import { SUBJECTS, TOPICS } from "@/lib/planner/data"
import type { LoggedSession, SubjectKey, TopicStatus } from "@/lib/planner/types"

const SUBJECT_COLORS: Record<SubjectKey, string> = {
  psico: "#E11D48",
  radio: "#4F46E5",
  est: "#D97706",
  scog: "#059669",
  genere: "#7C3AED",
}

const SUBJECT_ORDER: SubjectKey[] = ["psico", "radio", "est", "scog", "genere"]

function formatDayLabel(date: Date) {
  return `${date.getDate()}/${date.getMonth() + 1}`
}

function buildLast7Days() {
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date()
    date.setHours(0, 0, 0, 0)
    date.setDate(date.getDate() - (6 - index))
    return date
  })
}

function parseDate(value: string) {
  const parsed = new Date(`${value}T00:00:00`)
  return Number.isNaN(parsed.getTime()) ? new Date(value) : parsed
}

interface StatsViewProps {
  sessions: LoggedSession[]
  topics: Record<string, TopicStatus>
}

export function StatsView({ sessions, topics }: StatsViewProps) {
  const lastWeek = useMemo(() => buildLast7Days(), [])

  const formattedSubjectData = useMemo(() => {
    const totals = SUBJECT_ORDER.reduce<Record<SubjectKey, number>>(
      (acc, subject) => ({ ...acc, [subject]: 0 }),
      {}
    )

    const sessionData = sessions.filter((session) => session.subject && session.mode === "focus")

    sessionData.forEach((session) => {
      if (session.subject) {
        totals[session.subject] += session.duration
      }
    })

    return SUBJECT_ORDER.map((subject) => ({
      subject: SUBJECTS[subject].short,
      hours: Number((totals[subject] / 60).toFixed(1)),
      subjectKey: subject,
    }))
  }, [sessions])

  const dailyTrendData = useMemo(() => {
    const amounts = lastWeek.map((date) => ({
      date,
      label: formatDayLabel(date),
      value: 0,
    }))

    sessions
      .filter((session) => session.mode === "focus" && session.subject)
      .forEach((session) => {
        const sessionDate = parseDate(session.date)
        const index = amounts.findIndex(
          (entry) => entry.date.getFullYear() === sessionDate.getFullYear()
            && entry.date.getMonth() === sessionDate.getMonth()
            && entry.date.getDate() === sessionDate.getDate()
        )
        if (index !== -1) {
          amounts[index].value += session.duration / 60
        }
      })

    return amounts.map((entry) => ({
      ...entry,
      value: Number(entry.value.toFixed(1)),
    }))
  }, [sessions, lastWeek])

  const totalTopics = useMemo(
    () => Object.values(TOPICS).reduce((sum, topics) => sum + topics.length, 0),
    []
  )

  const completedTopics = useMemo(
    () => Object.values(topics).filter((status) => status === "done").length,
    [topics]
  )

  const globalCompletion = useMemo(
    () => Math.round((completedTopics / totalTopics) * 100),
    [completedTopics, totalTopics]
  )

  const pieData = useMemo(
    () => [
      { name: "Completato", value: globalCompletion },
      { name: "Rimanente", value: 100 - globalCompletion },
    ],
    [globalCompletion]
  )

  return (
    <section className="card-quiet p-4">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-stone-500">Statistiche</p>
          <h2 className="mt-2 text-[18px] font-semibold text-stone-900">Analisi ultima settimana</h2>
        </div>
        <div className="rounded-full border border-stone-200 bg-stone-50 px-3 py-2 text-center">
          <div className="text-[12px] uppercase tracking-[0.2em] text-stone-500">Completamento</div>
          <div className="mt-1 text-[28px] font-semibold tabular-nums text-stone-900">{globalCompletion}%</div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4">
          <div className="rounded-[16px] border border-stone-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <div className="text-[12px] font-medium uppercase tracking-[0.16em] text-stone-500">Ore studiate per materia</div>
                <p className="mt-1 text-[12px] text-stone-500">Ultimi 7 giorni</p>
              </div>
            </div>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={formattedSubjectData} margin={{ top: 0, right: 8, left: -10, bottom: 0 }}>
                  <CartesianGrid stroke="#E5E7EB" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="subject" tick={{ fontSize: 12, fill: "#475569" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: "#475569" }} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(value: number) => `${value}h`} />
                  <Bar dataKey="hours" radius={[12, 12, 0, 0]}>
                    {formattedSubjectData.map((entry) => (
                      <Cell key={entry.subject} fill={SUBJECT_COLORS[entry.subjectKey]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-[16px] border border-stone-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <div className="text-[12px] font-medium uppercase tracking-[0.16em] text-stone-500">Trend giornaliero</div>
                <p className="mt-1 text-[12px] text-stone-500">Ore studiate per giorno</p>
              </div>
            </div>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailyTrendData} margin={{ top: 0, right: 8, left: -10, bottom: 0 }}>
                  <CartesianGrid stroke="#E5E7EB" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#475569" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: "#475569" }} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(value: number) => `${value}h`} />
                  <Line type="monotone" dataKey="value" stroke="#4338CA" strokeWidth={3} dot={{ r: 4, fill: "#4338CA" }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-[16px] border border-stone-200 bg-white p-4 shadow-sm">
            <div className="mb-3 text-[12px] font-medium uppercase tracking-[0.16em] text-stone-500">Completamento globale</div>
            <div className="flex items-center justify-center">
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={pieData}
                    innerRadius={72}
                    outerRadius={100}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    <Cell fill="#10B981" />
                    <Cell fill="#E5E7EB" />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-[-72px] text-center">
              <div className="text-[28px] font-semibold tabular-nums text-stone-900">{globalCompletion}%</div>
              <div className="mt-1 text-[12px] text-stone-500">Obiettivo di completamento</div>
            </div>
          </div>

          <div className="rounded-[16px] border border-stone-200 bg-white p-4 shadow-sm">
            <div className="mb-3 text-[12px] font-medium uppercase tracking-[0.16em] text-stone-500">
              Legenda materie
            </div>
            <div className="space-y-2">
              {SUBJECT_ORDER.map((subject) => (
                <div key={subject} className="flex items-center justify-between gap-3 text-[13px] text-stone-700">
                  <div className="flex items-center gap-2">
                    <span className="h-3.5 w-3.5 rounded-full" style={{ backgroundColor: SUBJECT_COLORS[subject] }} />
                    {SUBJECTS[subject].short}
                  </div>
                  <span className="tabular-nums text-stone-900">
                    {formattedSubjectData.find((entry) => entry.subjectKey === subject)?.hours ?? 0}h
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
