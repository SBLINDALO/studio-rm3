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
  updated_at: string
}
