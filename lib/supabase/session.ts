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

// Restituisce l'id utente della sessione anonima corrente, garantendo che esista.
// Non deve mai propagare l'errore grezzo di Supabase ("Auth session missing!") all'utente:
// se la sessione manca prova a ristabilirla una volta, poi fallisce con un messaggio chiaro.
export async function getUserId(): Promise<string> {
  const first = await supabase.auth.getUser()
  if (!first.error && first.data.user) return first.data.user.id

  try {
    await ensureAnonymousSession()
  } catch {
    throw new Error("Impossibile connettersi al servizio di salvataggio. Controlla la connessione e riprova.")
  }

  const retry = await supabase.auth.getUser()
  if (retry.error || !retry.data.user) {
    throw new Error("Sessione non disponibile. Ricarica la pagina e riprova.")
  }
  return retry.data.user.id
}
