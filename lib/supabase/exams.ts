import { supabase } from "./client"
import type { Exam } from "./client"
import type { CustomExam, ArchivedExam } from "@/lib/planner/types"

// Funzione per ottenere tutti gli esami di un utente
export async function getAllExams(userId: string): Promise<{ customExams: CustomExam[]; archivedExams: ArchivedExam[] }> {
  try {
    const { data, error } = await supabase
      .from('exams')
      .select('*')
      .eq('user_id', userId)

    if (error) {
      console.error('Error fetching exams:', error)
      throw error
    }

    const customExams: CustomExam[] = []
    const archivedExams: ArchivedExam[] = []

    data.forEach((exam: Exam) => {
      if (exam.archived) {
        // Per archived, dobbiamo calcolare topicsTotal, topicsDone, completionPct
        // Per ora, mettiamo valori di default o calcoliamo se possibile
        archivedExams.push({
          id: exam.id,
          name: exam.name,
          short: exam.short,
          examISO: exam.exam_iso,
          examTime: exam.exam_time,
          examType: exam.exam_type,
          color: {
            dot: exam.color_dot,
            text: exam.color_text,
            bg: exam.color_bg,
          },
          completedAt: new Date(exam.updated_at).getTime(),
          topicsTotal: 0, // TODO: calcolare
          topicsDone: 0, // TODO: calcolare
          completionPct: 0, // TODO: calcolare
        })
      } else {
        customExams.push({
          id: exam.id,
          name: exam.name,
          short: exam.short,
          examDate: exam.exam_date,
          examTime: exam.exam_time,
          examType: exam.exam_type,
          examISO: exam.exam_iso,
          color: {
            bg: exam.color_bg,
            border: exam.color_border,
            text: exam.color_text,
            dot: exam.color_dot,
            soft: exam.color_soft,
          },
          material: exam.material,
          createdAt: new Date(exam.created_at).getTime(),
        })
      }
    })

    return { customExams, archivedExams }
  } catch (error) {
    console.error('Error in getAllExams:', error)
    throw error
  }
}

// Funzione per aggiungere un esame personalizzato
export async function addCustomExam(exam: Omit<CustomExam, 'id' | 'createdAt'>, userId: string): Promise<CustomExam[]> {
  try {
    const newExam: Omit<Exam, 'id' | 'created_at' | 'updated_at'> = {
      user_id: userId,
      name: exam.name,
      short: exam.short,
      exam_date: exam.examDate,
      exam_time: exam.examTime,
      exam_type: exam.examType,
      exam_iso: exam.examISO,
      color_bg: exam.color.bg,
      color_border: exam.color.border,
      color_text: exam.color.text,
      color_dot: exam.color.dot,
      color_soft: exam.color.soft,
      material: exam.material,
      archived: false,
    }

    const { data, error } = await supabase
      .from('exams')
      .insert(newExam)
      .select()
      .single()

    if (error) {
      console.error('Error adding exam:', error)
      throw error
    }

    // Ritorna tutti gli esami aggiornati
    const { customExams } = await getAllExams(userId)
    return customExams
  } catch (error) {
    console.error('Error in addCustomExam:', error)
    throw error
  }
}

// Funzione per rimuovere un esame
export async function removeExam(id: string, userId: string): Promise<{ customExams: CustomExam[]; archivedExams: ArchivedExam[] }> {
  try {
    const { error } = await supabase
      .from('exams')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (error) {
      console.error('Error removing exam:', error)
      throw error
    }

    // Ritorna tutti gli esami aggiornati
    return await getAllExams(userId)
  } catch (error) {
    console.error('Error in removeExam:', error)
    throw error
  }
}

// Funzione per archiviare un esame
export async function archiveExam(id: string, userId: string): Promise<{ customExams: CustomExam[]; archivedExams: ArchivedExam[] }> {
  try {
    const { error } = await supabase
      .from('exams')
      .update({ archived: true, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', userId)

    if (error) {
      console.error('Error archiving exam:', error)
      throw error
    }

    // Ritorna tutti gli esami aggiornati
    return await getAllExams(userId)
  } catch (error) {
    console.error('Error in archiveExam:', error)
    throw error
  }
}

// Funzione per ripristinare un esame
export async function restoreExam(id: string, userId: string): Promise<{ customExams: CustomExam[]; archivedExams: ArchivedExam[] }> {
  try {
    const { error } = await supabase
      .from('exams')
      .update({ archived: false, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', userId)

    if (error) {
      console.error('Error restoring exam:', error)
      throw error
    }

    // Ritorna tutti gli esami aggiornati
    return await getAllExams(userId)
  } catch (error) {
    console.error('Error in restoreExam:', error)
    throw error
  }
}