import { NextRequest, NextResponse } from "next/server"

interface AnalyzeRequest {
  examId: string
  existingTopics: string[]
  summaryText: string
}

interface AnalyzeResponse {
  matchedTopics: string[]
  newTopics: string[]
  flashcards: { question: string; answer: string }[]
}

const SYSTEM_PROMPT = `Sei un assistente che analizza riassunti di studio universitari in italiano.
Ricevi: una lista di argomenti già noti per l'esame, e un testo di riassunto appena studiato.
Devi rispondere SOLO con un oggetto JSON valido, senza testo prima o dopo, senza backtick markdown, con questa struttura esatta:
{
  "matchedTopics": string[],
  "newTopics": string[],
  "flashcards": [{ "question": string, "answer": string }]
}
Sii conservativo su matchedTopics: marca un argomento come coperto solo se il riassunto lo tratta davvero, non per somiglianza superficiale del nome.`

export async function POST(req: NextRequest) {
  const body: AnalyzeRequest = await req.json()

  if (!body.summaryText?.trim()) {
    return NextResponse.json({ error: "summaryText mancante" }, { status: 400 })
  }

  const userPrompt = `Argomenti già noti per l'esame:
${body.existingTopics.map((topic) => `- ${topic}`).join("\n") || "(nessuno)"}

Riassunto da analizzare:
"""
${body.summaryText}
"""`

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY!,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 2000,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
    }),
  })

  if (!response.ok) {
    return NextResponse.json({ error: "Errore chiamata AI" }, { status: 502 })
  }

  const data = await response.json()
  const rawText = data.content?.find((content: { type?: string; text?: string }) => content.type === "text")?.text ?? "{}"

  let parsed: AnalyzeResponse
  try {
    const clean = rawText.replace(/```json|```/g, "").trim()
    parsed = JSON.parse(clean)
  } catch {
    return NextResponse.json({ error: "Risposta AI non in formato JSON valido" }, { status: 502 })
  }

  return NextResponse.json(parsed)
}