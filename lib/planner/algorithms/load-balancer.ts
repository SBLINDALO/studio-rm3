import type { BalancedSchedule, DayLoad, DynamicExam } from "@/lib/planner/types"

const MAX_HOURS_PER_DAY = 4

function roundDownToHundredth(value: number): number {
  return Math.floor(value * 100) / 100
}

// READ-ONLY: somma pagine/ore pianificate per giorno senza modificare né persistere nulla.
// Usata dalla tab "Oggi" per il banner di overload: aprire la tab non scrive mai su Supabase.
export function computeBalancedSchedule(exams: DynamicExam[]): BalancedSchedule {
  const allDates = new Set<string>()
  exams.forEach((exam) => Object.keys(exam.studyPlan.dailySchedule).forEach((date) => allDates.add(date)))

  const balancedDays: BalancedSchedule = {}
  allDates.forEach((date) => {
    let totalPages = 0
    let totalHours = 0
    const examsThisDay: DayLoad["exams"] = []

    exams.forEach((exam) => {
      const daySchedule = exam.studyPlan.dailySchedule[date]
      if (!daySchedule) return
      totalPages += daySchedule.pages ?? 0
      totalHours += daySchedule.hours.max
      examsThisDay.push({ examName: exam.name, pages: daySchedule.pages ?? 0, hours: daySchedule.hours })
    })

    balancedDays[date] = { totalPages, totalHours, isOverload: totalHours > MAX_HOURS_PER_DAY, exams: examsThisDay }
  })
  return balancedDays
}

// Pura: calcola il ribilanciamento del carico (max MAX_HOURS_PER_DAY/giorno, le ore manuali
// restano invariate) e restituisce SOLO gli esami il cui piano cambierebbe.
// Nessuna scrittura: la persistenza è responsabilità del chiamante
// (lib/supabase/exams.ts la esegue solo dopo add/update/complete, mai nel render).
export function computeRebalancedExams(exams: DynamicExam[]): DynamicExam[] {
  const updatedExams = new Map<string, DynamicExam>()
  const allDates = new Set<string>()
  exams.forEach((exam) => Object.keys(exam.studyPlan.dailySchedule).forEach((date) => allDates.add(date)))

  for (const date of allDates) {
    const entries = exams.map((exam) => ({ exam, day: (updatedExams.get(exam.id) ?? exam).studyPlan.dailySchedule[date] })).filter((entry) => entry.day)
    const totalHours = entries.reduce((sum, entry) => sum + entry.day.hours.max, 0)
    if (totalHours <= MAX_HOURS_PER_DAY) continue

    const manualHours = entries.filter((entry) => entry.day.manual).reduce((sum, entry) => sum + entry.day.hours.max, 0)
    const automaticEntries = entries.filter((entry) => !entry.day.manual)
    const automaticHours = automaticEntries.reduce((sum, entry) => sum + entry.day.hours.max, 0)
    if (!automaticHours) continue

    const scale = Math.max(0, (MAX_HOURS_PER_DAY - manualHours) / automaticHours)
    automaticEntries.forEach(({ exam, day }) => {
      const currentExam = updatedExams.get(exam.id) ?? exam
      const hours = { min: roundDownToHundredth(day.hours.min * scale), max: roundDownToHundredth(day.hours.max * scale) }
      if (hours.min === day.hours.min && hours.max === day.hours.max) return
      updatedExams.set(exam.id, {
        ...currentExam,
        studyPlan: {
          ...currentExam.studyPlan,
          dailySchedule: { ...currentExam.studyPlan.dailySchedule, [date]: { ...day, hours } },
        },
      })
    })
  }

  return Array.from(updatedExams.values())
}