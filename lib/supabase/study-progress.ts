import { supabase } from "./client"
import type { StudyProgress } from "./client"

// Funzione per ottenere il progresso di studio per un esame
export async function getStudyProgress(userId: string, examId: string): Promise<StudyProgress[]> {
  try {
    const { data, error } = await supabase
      .from('study_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('exam_id', examId)

    if (error) {
      console.error('Error fetching study progress:', error)
      throw error
    }

    return data || []
  } catch (error) {
    console.error('Error in getStudyProgress:', error)
    throw error
  }
}

// Funzione per aggiornare il progresso di un capitolo
export async function updateChapterProgress(
  userId: string,
  examId: string,
  chapterId: string,
  status: "not_started" | "in_progress" | "completed",
  timeSpent?: number
): Promise<StudyProgress> {
  try {
    const today = new Date().toISOString().split('T')[0]

    // Prima, cerca se esiste già un record per oggi
    const { data: existing, error: fetchError } = await supabase
      .from('study_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('exam_id', examId)
      .eq('chapter_id', chapterId)
      .eq('date', today)
      .single()

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = no rows
      console.error('Error fetching existing progress:', fetchError)
      throw fetchError
    }

    if (existing) {
      // Aggiorna
      const { data, error } = await supabase
        .from('study_progress')
        .update({
          status,
          time_spent: (existing.time_spent || 0) + (timeSpent || 0),
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)
        .select()
        .single()

      if (error) {
        console.error('Error updating progress:', error)
        throw error
      }

      return data
    } else {
      // Inserisci nuovo
      const { data, error } = await supabase
        .from('study_progress')
        .insert({
          user_id: userId,
          exam_id: examId,
          chapter_id: chapterId,
          date: today,
          status,
          time_spent: timeSpent || 0
        })
        .select()
        .single()

      if (error) {
        console.error('Error inserting progress:', error)
        throw error
      }

      return data
    }
  } catch (error) {
    console.error('Error in updateChapterProgress:', error)
    throw error
  }
}

// Funzione per ottenere statistiche giornaliere
export async function getDailyStats(userId: string, date: string): Promise<{
  chaptersCompleted: number
  totalTimeSpent: number
  examsStudied: string[]
}> {
  try {
    const { data, error } = await supabase
      .from('study_progress')
      .select('exam_id, time_spent')
      .eq('user_id', userId)
      .eq('date', date)
      .eq('status', 'completed')

    if (error) {
      console.error('Error fetching daily stats:', error)
      throw error
    }

    const chaptersCompleted = data.length
    const totalTimeSpent = data.reduce((sum, item) => sum + (item.time_spent || 0), 0)
    const examsStudied = [...new Set(data.map(item => item.exam_id))]

    return { chaptersCompleted, totalTimeSpent, examsStudied }
  } catch (error) {
    console.error('Error in getDailyStats:', error)
    throw error
  }
}

// Funzione per calcolare la streak giornaliera
export async function getStreak(userId: string): Promise<number> {
  try {
    // Ottieni le date uniche con almeno un completamento
    const { data, error } = await supabase
      .from('study_progress')
      .select('date')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .order('date', { ascending: false })

    if (error) {
      console.error('Error fetching streak data:', error)
      throw error
    }

    const uniqueDates = [...new Set(data.map(item => item.date))].sort().reverse()

    let streak = 0
    const today = new Date().toISOString().split('T')[0]

    for (let i = 0; i < uniqueDates.length; i++) {
      const date = uniqueDates[i]
      if (i === 0 && date === today) {
        streak++
      } else if (i === 0 && date !== today) {
        // Se oggi non c'è completamento, streak 0
        break
      } else {
        const prevDate = new Date(uniqueDates[i-1])
        const currDate = new Date(date)
        const diffTime = prevDate.getTime() - currDate.getTime()
        const diffDays = diffTime / (1000 * 3600 * 24)
        if (diffDays === 1) {
          streak++
        } else {
          break
        }
      }
    }

    return streak
  } catch (error) {
    console.error('Error in getStreak:', error)
    throw error
  }
}