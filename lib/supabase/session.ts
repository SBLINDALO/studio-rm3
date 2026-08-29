import { supabase } from "./client"

let bootstrapPromise: Promise<void> | null = null

// Crea una sessione anonima Supabase se non ne esiste già una, senza alcuna UI di login.
// Memoizzata: chiamate concorrenti condividono lo stesso tentativo; un fallimento resetta
// la cache così il prossimo chiamante può ritentare.
export function ensureAnonymousSession(): Promise<void> {
  if (!bootstrapPromise) {
    bootstrapPromise = (async () => {
      const { data } = await supabase.auth.getSession()
      if (data.session) return
      const { error } = await supabase.auth.signInAnonymously()
      if (error) throw error
    })().catch((error) => {
      bootstrapPromise = null
      throw error
    })
  }
  return bootstrapPromise
}
