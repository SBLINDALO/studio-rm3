import type { jsPDF } from "jspdf"
import type { DynamicExam } from "@/lib/planner/types"
import { computeExamProgress, daysRemaining, materialTopics } from "@/components/exams/exam-utils"

const MARGIN = 14
const PAGE_WIDTH = 210

function drawHeader(doc: jsPDF, title: string, subtitle: string) {
  doc.setFont("helvetica", "bold")
  doc.setFontSize(18)
  doc.text(title, MARGIN, 20)
  doc.setFont("helvetica", "normal")
  doc.setFontSize(10)
  doc.setTextColor(120)
  doc.text(subtitle, MARGIN, 27)
  doc.setDrawColor(220)
  doc.line(MARGIN, 31, PAGE_WIDTH - MARGIN, 31)
  doc.setTextColor(20)
}

function drawExamSection(doc: jsPDF, exam: DynamicExam, y: number): number {
  const progress = computeExamProgress(exam)
  const remaining = daysRemaining(exam)
  const topics = materialTopics(exam.material)

  doc.setFont("helvetica", "bold")
  doc.setFontSize(13)
  doc.text(exam.name, MARGIN, y)
  y += 6

  doc.setFont("helvetica", "normal")
  doc.setFontSize(10)
  doc.setTextColor(90)
  doc.text(`Data esame: ${exam.examDate}  ·  ${remaining >= 0 ? `${remaining} giorni rimanenti` : "esame passato"}`, MARGIN, y)
  y += 5
  doc.text(`Completamento piano: ${progress.completionPct}% (${progress.daysDone}/${progress.daysTotal} giorni)`, MARGIN, y)
  y += 5
  if (progress.pagesTotal > 0) {
    doc.text(`Pagine: ${progress.pagesDone}/${progress.pagesTotal}`, MARGIN, y)
    y += 5
  }
  if (progress.topicsTotal > 0) {
    doc.text(`Argomenti: ${progress.topicsDone}/${progress.topicsTotal}`, MARGIN, y)
    y += 5
  }
  if (topics.length > 0) {
    doc.text(`Materiale: ${topics.length} argomenti in programma`, MARGIN, y)
    y += 5
  }

  // Progress bar
  const barWidth = PAGE_WIDTH - MARGIN * 2
  doc.setFillColor(230, 230, 230)
  doc.roundedRect(MARGIN, y, barWidth, 3, 1.5, 1.5, "F")
  doc.setFillColor(16, 185, 129)
  doc.roundedRect(MARGIN, y, (barWidth * progress.completionPct) / 100, 3, 1.5, 1.5, "F")
  y += 10
  doc.setTextColor(20)

  return y
}

export async function exportExamReportPdf(exam: DynamicExam) {
  const { jsPDF } = await import("jspdf")
  const doc = new jsPDF()
  drawHeader(doc, "Report Esame", `Generato il ${new Date().toLocaleDateString("it-IT")}`)
  drawExamSection(doc, exam, 42)
  doc.save(`${exam.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-report.pdf`)
}

export async function exportFullProgressReportPdf(exams: DynamicExam[]) {
  const { jsPDF } = await import("jspdf")
  const doc = new jsPDF()
  drawHeader(doc, "Report di Progresso", `Generato il ${new Date().toLocaleDateString("it-IT")} · ${exams.length} esami attivi`)

  let y = 42
  const pageHeight = 297
  for (const exam of [...exams].sort((a, b) => a.examDate.localeCompare(b.examDate))) {
    if (y > pageHeight - 45) {
      doc.addPage()
      y = 20
    }
    y = drawExamSection(doc, exam, y)
  }

  if (exams.length === 0) {
    doc.setFontSize(11)
    doc.text("Nessun esame attivo da riportare.", MARGIN, y)
  }

  doc.save("report-progresso.pdf")
}
