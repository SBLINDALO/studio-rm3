import { convertToModelMessages, streamText, type UIMessage } from "ai"
import type { AiSnapshot } from "@/lib/planner/ai-context"
import { renderSnapshotAsMarkdown } from "@/lib/planner/ai-context"

export const maxDuration = 30

/**
 * FAST coach — streaming chat (openai/gpt-5-mini via Vercel AI Gateway).
 * Optimised for low latency tactical answers.
 */
export async function POST(req: Request) {
  const { messages, snapshot }: { messages: UIMessage[]; snapshot: AiSnapshot } = await req.json()

  const contextMd = renderSnapshotAsMarkdown(snapshot)

  const system = `Sei "Coach", assistente di studio personale per uno studente di Roma Tre.
Parli SEMPRE in italiano, in modo diretto, empatico e concreto. Eviti elenchi lunghissimi.
Risposte brevi (max 4-6 frasi o 5 bullet). Non fare disclaimer inutili.
Quando l'utente chiede cosa studiare oggi, basa la risposta sul piano qui sotto.
Quando menziona un argomento arretrato, proponi un micro-piano concreto con minuti.
Se ti mancano dati, chiedi una conferma rapida invece di inventare.

--- CONTESTO ATTUALE DELLO STUDENTE ---
${contextMd}
--- FINE CONTESTO ---`

  const result = streamText({
    model: "openai/gpt-5-mini",
    system,
    messages: await convertToModelMessages(messages),
    temperature: 0.5,
  })

  return result.toUIMessageStreamResponse()
}
