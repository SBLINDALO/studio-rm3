import { TODAY_STR } from "./data"

export const fmtTime = (s: number) => {
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`
}

export const fmtDuration = (min: number) => {
  const h = Math.floor(min / 60)
  const m = min % 60
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

export const daysUntil = (iso: string | undefined): number | null => {
  if (!iso) return null
  const today = new Date(TODAY_STR)
  const target = new Date(iso)
  return Math.ceil((target.getTime() - today.getTime()) / 86_400_000)
}
