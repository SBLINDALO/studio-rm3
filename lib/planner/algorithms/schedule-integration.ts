import { getAvailableStudyHours, isStudyDay } from "@/lib/planner/weekly-schedule"

/**
 * Disponibilità di studio reale per un singolo giorno, calcolata a partire
 * dagli impegni settimanali (lib/planner/weekly-schedule.ts).
 */
export interface DailyAvailability {
  date: Date
  availableHours: number // già cappate al max giornaliero (default 4h)
  isStudyDay: boolean
}

/**
 * Calcola la disponibilità di studio reale per un intervallo di giorni,
 * da usare al posto dei valori fissi hoursPerDay/studyDaysPerWeek.
 * Pura: nessuna chiamata a Supabase/DB.
 */
export function getAvailabilityForRange(startDate: Date, endDate: Date, maxDailyHours = 4): DailyAvailability[] {
  const days: DailyAvailability[] = []
  const cursor = new Date(startDate)
  while (cursor <= endDate) {
    const date = new Date(cursor)
    days.push({
      date,
      availableHours: getAvailableStudyHours(date, maxDailyHours),
      isStudyDay: isStudyDay(date),
    })
    cursor.setDate(cursor.getDate() + 1)
  }
  return days
}
