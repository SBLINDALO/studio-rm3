import { generateText, Output } from "ai"
import { z } from "zod"
import type { AiSnapshot } from "@/lib/planner/ai-context"
import { renderSnapshotAsMarkdown } from "@/lib/planner/ai-context"

export const maxDuration = 45

const InsightSchema = z.object({
  summary: z.string().describe("Riassunto di una frase sullo stato di studio (max 140 caratteri)"),
  mood: z.enum(["great", "steady", "behind", "critical"]).describe("Stato generale"),
  focusSubject: z
    .string()
    .describe("Materia su cui concentrarsi oggi (nome breve, 1-2 parole)"),
  insights: z
    .array(
      z.object({
        kind: z.enum(["strength", "risk", "tip", "nudge"]),
        title: z.string().describe("Titolo sintetico (max 60 char)"),
        detail: z.string().describe("Dettaglio in 1-2 frasi (max 200 char)"),
        action: z.string().describe("Azione concreta immediata (max 80 char, imperativo)"),
      }),
    )
    .min(3)
    .max(5)
    .describe("3-5 insight azionabili, misti fra punti di forza, rischi, consigli e nudge"),
})

export type StudyInsights = z.infer<typeof InsightSchema>

/**
 * DEEP analyst — structured insights (anthropic/claude-opus-4.6 via AI Gateway).
 * Produces a JSON object of actionable insights consumed by the "Analisi" tab.
 * Runs in parallel with the fast coach for data fusion.
 */
export async function POST(req: Request) {
  const { snapshot }: { snapshot: AiSnapshot } = await req.json()
  const contextMd = renderSnapshotAsMarkdown(snapshot)

  const { experimental_output } = await generateText({
    model: "anthropic/claude-opus-4.6",
    temperature: 0.4,
    system: `Sei un coach di studio senior per universitari italiani.
Analizzi i dati grezzi dello studente e produci insight AZIONABILI in italiano.
Regole:
- Niente ovvietà, niente disclaimer.
- Ogni "detail" deve citare un numero concreto dal contesto (giorni, minuti, %).
- "action" deve iniziare con un verbo all'imperativo ("Ripassa", "Blocca 45 minuti", "Salta", ecc.).
- Mix equilibrato: almeno 1 punto di forza, 1 rischio, 1 tip pratico.
- "mood" basato su: % globale, argomenti arretrati, giorni all'esame.`,
    prompt: `Analizza questo stato dello studente e genera gli insight:

${contextMd}`,
    experimental_output: Output.object({ schema: InsightSchema }),
  })

  return Response.json(experimental_output)
}
