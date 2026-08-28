"use client"

import { ArrowLeft, BookOpen, CalendarDays, Clock3, Download, Edit3, FileText, FileType2, StickyNote } from "lucide-react"
import type { DynamicExam } from "@/lib/planner/types"
import { formatISODate, parseISODate } from "@/lib/planner/utils/dates"
import { computeExamProgress, daysRemaining, materialTopics } from "./exam-utils"
import { MaterialIcon } from "./material-icon"
import { exportExamReportPdf } from "@/lib/planner/pdf-report"

interface Props {
  exam: DynamicExam
  onBack?: () => void
  onEdit?: (exam: DynamicExam) => void
}

function getWeekDates(): Date[] {
  const today = parseISODate(formatISODate(new Date()))
  const mondayOffset = today.getDay() === 0 ? -6 : 1 - today.getDay()
  const monday = new Date(today)
  monday.setDate(today.getDate() + mondayOffset)
  return Array.from({ length: 5 }, (_, index) => {
    const date = new Date(monday)
    date.setDate(monday.getDate() + index)
    return date
  })
}

function materialSummary(exam: DynamicExam) {
  const material = exam.material
  const notes = materialTopics(material)
  const pdfPages = material.files?.length ? material.files.length * 20 : 0
  return {
    pages: (material.totalPages ?? 0) + pdfPages,
    files: material.files?.length ?? 0,
    notes: notes.length,
  }
}

export function ExamDetails({ exam, onBack, onEdit }: Props) {
  const progress = computeExamProgress(exam)
  const material = materialSummary(exam)
  const weekDates = getWeekDates()
  const pagesPlanned = progress.pagesTotal || 1
  const topicsPlanned = progress.topicsTotal || 1
  const pageProgress = Math.round((progress.pagesDone / pagesPlanned) * 100)
  const topicProgress = Math.round((progress.topicsDone / topicsPlanned) * 100)
  const remainingDays = daysRemaining(exam)

  return (
    <section className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          {onBack && (
            <button type="button" onClick={onBack} aria-label="Torna agli esami" className="mt-1 rounded-full p-1.5 text-stone-500 hover:bg-stone-100">
              <ArrowLeft size={18} />
            </button>
          )}
          <div>
            <div className="flex items-center gap-2 text-xs text-stone-500">
              <MaterialIcon type={exam.material.type} size={15} />
              <span>{remainingDays >= 0 ? `${remainingDays} giorni all'esame` : "Esame passato"}</span>
            </div>
            <h1 className="mt-1 text-xl font-semibold text-stone-900">{exam.name}</h1>
          </div>
        </div>
        {onEdit && (
          <button type="button" onClick={() => onEdit(exam)} className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-stone-200 px-3 py-2 text-xs font-medium text-stone-700 hover:bg-stone-50">
            <Edit3 size={14} /> Modifica
          </button>
        )}
        <button type="button" onClick={() => exportExamReportPdf(exam)} className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-stone-200 px-3 py-2 text-xs font-medium text-stone-700 hover:bg-stone-50" aria-label="Esporta report PDF">
          <Download size={14} /> PDF
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-stone-200 bg-white p-3">
          <FileText size={16} className="text-rose-500" />
          <div className="mt-2 text-xs text-stone-500">PDF / pagine</div>
          <div className="text-lg font-semibold text-stone-900">{material.pages}</div>
          <div className="text-[11px] text-stone-400">{material.files} file</div>
        </div>
        <div className="rounded-2xl border border-stone-200 bg-white p-3">
          <StickyNote size={16} className="text-amber-500" />
          <div className="mt-2 text-xs text-stone-500">Note</div>
          <div className="text-lg font-semibold text-stone-900">{material.notes}</div>
          <div className="text-[11px] text-stone-400">righe di argomenti</div>
        </div>
        <div className="rounded-2xl border border-stone-200 bg-white p-3">
          <BookOpen size={16} className="text-emerald-600" />
          <div className="mt-2 text-xs text-stone-500">Argomenti pianificati</div>
          <div className="text-lg font-semibold text-stone-900">{progress.topicsTotal}</div>
          <div className="text-[11px] text-stone-400">{progress.topicsDone} completati</div>
        </div>
      </div>

      <div className="rounded-3xl border border-stone-200 bg-white p-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-stone-900">Questa settimana</h2>
          <span className="text-xs text-stone-500">Lun–Ven</span>
        </div>
        <div className="mt-3 grid grid-cols-5 gap-2">
          {weekDates.map((date) => {
            const key = formatISODate(date)
            const day = exam.studyPlan.dailySchedule[key]
            const isToday = key === formatISODate(new Date())
            return (
              <div key={key} className={`min-h-24 rounded-2xl border p-2 ${day?.isReview ? "border-amber-200 bg-amber-50" : "border-stone-200 bg-stone-50"} ${isToday ? "ring-2 ring-stone-900/10" : ""}`}>
                <div className="text-[10px] font-semibold uppercase text-stone-500">{date.toLocaleDateString("it-IT", { weekday: "short" })}</div>
                <div className="mt-1 text-[10px] text-stone-400">{date.getDate()}/{date.getMonth() + 1}</div>
                {day ? (
                  <>
                    <div className="mt-3 flex items-center gap-1 text-xs font-medium text-stone-800"><Clock3 size={12} /> {day.hours.max}h</div>
                    {day.pages ? <div className="mt-1 text-[11px] text-stone-500">{day.pages} pagine</div> : null}
                    {day.isReview ? <div className="mt-1 text-[10px] font-semibold text-amber-700">Ripasso</div> : null}
                  </>
                ) : <div className="mt-4 text-[11px] text-stone-400">Libero</div>}
              </div>
            )
          })}
        </div>
      </div>

      <div className="rounded-3xl border border-stone-200 bg-white p-4">
        <div className="flex items-center gap-2"><CalendarDays size={16} className="text-amber-600" /><h2 className="text-sm font-semibold text-stone-900">Ripasso finale</h2></div>
        <p className="mt-1 text-xs text-stone-500">Gli ultimi 4 giorni prima dell'esame sono dedicati al ripasso.</p>
        <div className="mt-3 grid grid-cols-4 gap-2">
          {Array.from({ length: 4 }, (_, index) => {
            const date = parseISODate(exam.examDate)
            date.setDate(date.getDate() - 4 + index)
            const day = exam.studyPlan.dailySchedule[formatISODate(date)]
            return <div key={index} className={`rounded-xl border px-2 py-2 text-center text-[11px] ${day?.isReview ? "border-amber-200 bg-amber-50 text-amber-800" : "border-stone-200 text-stone-400"}`}>{date.toLocaleDateString("it-IT", { day: "numeric", month: "short" })}</div>
          })}
        </div>
      </div>

      <div className="rounded-3xl border border-stone-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-stone-900">Progresso</h2>
        <div className="mt-4 space-y-4">
          <ProgressRow icon={<FileType2 size={15} />} label="Pagine" done={progress.pagesDone} planned={progress.pagesTotal} percentage={pageProgress} color="bg-rose-500" />
          <ProgressRow icon={<BookOpen size={15} />} label="Argomenti" done={progress.topicsDone} planned={progress.topicsTotal} percentage={topicProgress} color="bg-emerald-500" />
        </div>
      </div>
    </section>
  )
}

function ProgressRow({ icon, label, done, planned, percentage, color }: { icon: React.ReactNode; label: string; done: number; planned: number; percentage: number; color: string }) {
  return <div><div className="flex items-center justify-between text-xs"><span className="flex items-center gap-2 text-stone-600">{icon}{label}</span><span className="text-stone-500">{done}/{planned} · {Math.min(100, percentage)}%</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-stone-100"><div className={`h-full ${color}`} style={{ width: `${Math.min(100, percentage)}%` }} /></div></div>
}
