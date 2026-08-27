import type { BalancedSchedule, DayLoad, DynamicExam } from "@/lib/planner/types"

const MAX_HOURS_PER_DAY = 1.5

export function balanceStudyLoad(exams: DynamicExam[]): BalancedSchedule {
  const allDates = new Set<string>()
  exams.forEach((exam) => {
    Object.keys(exam.studyPlan.dailySchedule).forEach((date) => allDates.add(date))
  })

  const balancedDays: BalancedSchedule = {}

  allDates.forEach((date) => {
    let totalPages = 0
    let totalHours = 0
    const examsThisDay: DayLoad["exams"] = []

    exams.forEach((exam) => {
      const daySchedule = exam.studyPlan.dailySchedule[date]
      if (daySchedule) {
        totalPages += daySchedule.pages || 0
        totalHours += daySchedule.hours.max || 0
        examsThisDay.push({
          examName: exam.name,
          pages: daySchedule.pages || 0,
          hours: daySchedule.hours,
        })
      }
    })

    balancedDays[date] = {
      totalPages,
      totalHours,
      isOverload: totalHours > MAX_HOURS_PER_DAY,
      exams: examsThisDay,
    }
  })

  return balancedDays
}
