import { supabase } from "./client"

let bootstrapPromise: Promise<void> | null = null

// Supabase persiste la sessione completa (access token, refresh token e user id)
// nel browser. Leggiamo sempre quella sessione prima di creare un nuovo anonimo:
// l'id utente non va ricreato né salvato separatamente in localStorage.
export function ensureAnonymousSession(): Promise<void> {
  if (!bootstrapPromise) {
    bootstrapPromise = (async () => {
      const { data: existing, error: sessionError } = await supabase.auth.getSession()
      if (sessionError) throw sessionError
      if (existing.session?.user) return

      const { data, error } = await supabase.auth.signInAnonymously()
      if (error) throw error
      if (!data.session?.user) {
        throw new Error("Supabase ha creato una sessione anonima non valida")
      }

      // Verifica che il token sia stato davvero scritto nello storage configurato.
      // Se la persistenza è bloccata dal browser, evitiamo di usare un'identità
      // temporanea che cambierebbe al prossimo caricamento.
      const { data: persisted, error: persistedError } = await supabase.auth.getSession()
      if (persistedError) throw persistedError
      if (persisted.session?.user.id !== data.session.user.id) {
        throw new Error("La sessione anonima non è stata persistita dal browser")
      }
    })().catch((error) => {
      bootstrapPromise = null
      throw error
    })
  }
  return bootstrapPromise
}
