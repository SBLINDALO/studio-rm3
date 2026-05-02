import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase environment variables. Check .env.local for NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY"
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Tipo per le righe di user_progress
export type UserProgress = {
  id: string
  user_id: string
  subject_key: string
  topic_index: number
  is_completed: boolean
  review_status: "review" | null
  confidence: number | null
  note: string | null
  notes_data?: { questions: { id: string; question: string; answer: string }[] } | null
  updated_at: string
}

// Tipo per user_daily
export type UserDaily = {
  id: string
  user_id: string
  day_str: string
  session_index: number
  is_done: boolean
  updated_at: string
}

// Tipo per user_notes
export type UserNote = {
  id: string
  user_id: string
  week_index: number
  note: string
  updated_at: string
}

// Tipo per user_conf
export type UserConf = {
  id: string
  user_id: string
  conf_key: string
  value: number
  updated_at: string
}

// Tipo per user_check
export type UserCheck = {
  id: string
  user_id: string
  check_key: string
  value: number
  updated_at: string
}

// Tipo per user_sessions
export type UserSession = {
  id: string
  user_id: string
  session_id: number
  date: string
  subject: string | null
  duration: number
  mode: string
  start_time: string
  created_at: string
}

// Tipo per user_catchup
export type UserCatchup = {
  id: string
  user_id: string
  catchup_id: string
  orig_day: string
  orig_idx: number
  sub: string
  dur: string
  topic: string
  target_day: string
  done: boolean
  created_at: string
  updated_at: string
}

// Tipo per exams
export type Exam = {
  id: string
  user_id: string
  name: string
  short: string
  exam_date: string
  exam_time: string
  exam_type: "Scritto" | "Orale"
  exam_iso: string
  color_bg: string
  color_border: string
  color_text: string
  color_dot: string
  color_soft: string
  material?: string
  subject_key?: string // per esami fissi
  archived: boolean
  created_at: string
  updated_at: string
}

// Tipo per study_progress
export type StudyProgress = {
  id: string
  user_id: string
  exam_id: string
  chapter_id: string
  date: string
  status: "not_started" | "in_progress" | "completed"
  time_spent: number // in minuti
  created_at: string
  updated_at: string
}

// Tipo per push_subscriptions
export type PushSubscription = {
  id: string
  user_id: string
  subscription: any // JSON object della subscription
  enabled: boolean
  created_at: string
  updated_at: string
}
