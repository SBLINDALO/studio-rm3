import type { SubjectKey, Subject, Topics, DailySchedule, Week, Booking, PaletteEntry } from "./types"

export const SUBJECTS: Record<SubjectKey, Subject> = {
  psico: {
    name: "Psicologia della Comunicazione",
    short: "Psicologia",
    examDate: "Ven 5 Giu",
    examTime: "09:00",
    examType: "Orale",
    examISO: "2026-06-05",
  },
  radio: {
    name: "Storia Radio & TV",
    short: "Radio & TV",
    examDate: "Mar 9 Giu",
    examTime: "10:00",
    examType: "Scritto",
    examISO: "2026-06-09",
  },
  est: {
    name: "Estetica",
    short: "Estetica",
    examDate: "Gio 11 Giu",
    examTime: "16:00",
    examType: "Scritto",
    examISO: "2026-06-11",
  },
  scog: {
    name: "Scienze Cognitive",
    short: "Scienze Cog.",
    examDate: "Ven 12 Giu",
    examTime: "10:00",
    examType: "Scritto",
    examISO: "2026-06-12",
  },
  genere: {
    name: "Sociologia Media, Genere e Identità",
    short: "Genere & Media",
    examDate: "Lun 8 Giu",
    examTime: "14:00",
    examType: "Scritto",
    examISO: "2026-06-08",
  },
}

// "Quiet Study" palette — refined neutrals with subject-level identity
// Each entry provides:
//   - bg: subtle tinted surface for cards (barely saturated)
//   - border: soft border that pairs with the background
//   - text: accessible text color on white backgrounds (WCAG AA)
//   - dot: saturated accent for progress bars, dots, active states
//   - soft: ultralight tint for backgrounds when layered on white
export const C: Record<SubjectKey | "gen", PaletteEntry> = {
  psico:  { bg: "#FFF5F6", border: "#F4D4D8", text: "#9F1239", dot: "#E11D48", soft: "#FFFAFB" },
  radio:  { bg: "#F2F5FD", border: "#D5DBF4", text: "#1E3A8A", dot: "#4F46E5", soft: "#F8FAFE" },
  est:    { bg: "#FEF8EC", border: "#F1E0B8", text: "#92400E", dot: "#D97706", soft: "#FFFCF4" },
  scog:   { bg: "#F0F9F4", border: "#CCE5D4", text: "#065F46", dot: "#059669", soft: "#F7FCF9" },
  genere: { bg: "#F7F4FB", border: "#DDD3EF", text: "#5B21B6", dot: "#7C3AED", soft: "#FBF9FD" },
  gen:    { bg: "#F7F6F4", border: "#E7E5E1", text: "#44403C", dot: "#78716C", soft: "#FBFAF8" },
}

export const PHASE_COLOR = {
  1: "#64748B", // slate — foundational
  2: "#D97706", // amber — intensive
  3: "#059669", // emerald — final
} as const

export const TOPICS: Topics = {
  psico: [
    "Introduzione + Modalità comunicative",
    "Gesti — tipi, parametri, Cherologia",
    "Sguardi — Optologia, parametri formazionali",
    "Credenze, Inferenze, Rete esplicativa",
    "Emozioni — Darwin / Ekman / Lewis",
    "Influenzamento e Persuasione",
    "Inganno — forme, condizioni, smascheramento",
    "Dibattito politico — Ethos, Dominanza, Discredito",
    "Ironia + Contagio emotivo + Empatia",
    "Insulti e Ridicolizzazione",
    "Manuale: Scopi / Credenze / Risorse",
    "Manuale: Comunicazione indiretta (sovrascopi)",
    "Manuale: Potere, Immagine, Relazioni sociali",
    "Manuale: Influenzamento + Comunicazione politica",
    "Manuale: Ridere e deridere",
  ],
  radio: [
    "Radiodays Cap. 1-2 — Marconi, nascita radio, EIAR",
    "Radiodays Cap. 3-4 — Radio e fascismo, propaganda",
    "Radiodays Cap. 5-6 — Dopoguerra, RAI, Alto Gradimento",
    "Radiodays Cap. 7-8 — Radio libere, 202/1976, web radio",
    "Televisioni Cap. 1 — Origini TV 1938-1954",
    "Televisioni Cap. 2 — Anni '60-'70, servizio pubblico",
    "Televisioni Cap. 3 — Anni '80, Berlusconi, Fininvest",
    "Televisioni Cap. 4 — Anni '90-2010, digitale terrestre",
  ],
  est: [
    "Lady Sapiens 1 — Metodi scientifici (bacino, coclea, DNA)",
    "Lady Sapiens 2 — Artigianato, ago, ipotesi donna artista",
    "Lady Sapiens 3 — Man the Hunter sfatato, cacciatrici",
    "Dissonanze — Intro + Schema radiale 6 categorie",
    "Il Bello — da Pitagora a Duchamp",
    "Il Brutto — da Platone ad Abramovic, Lessing, Herder",
    "L'Interessante — Schlegel, Kierkegaard, Moda",
    "Il Sublime — Burke, Kant, Schiller, Land Art",
    "Il Kitsch — Broch, Greenberg, Eco, Camp, Koons",
    "Orrore e Terrore — Sontag, Theresienstadt, 11 settembre",
  ],
  scog: [
    "Cap. 1 — Introspezione + Comportamentismo (Pavlov, Watson, Skinner)",
    "Cap. 1 — Svolta cognitivista: Tolman, Chomsky",
    "Cap. 2 — Marr: tre livelli di spiegazione",
    "Cap. 2 — Algoritmi della visione, stadi, vincoli",
    "Cap. 4 — Fodor: modularità della mente",
    "Cap. 4 — Cognizione centrale e tre soluzioni",
    "Cap. 5 — Neuroscienza cognitiva: fMRI, PET, ERP",
    "Cap. 5 — Riduzionismo, funzionalismo, neomeccanicismo (Craver)",
  ],
  genere: [
    "Inq. Visuale Cap. 1 — Eco-visioni, media ecology (Postman)",
    "Inq. Visuale Cap. 2 — Serialità TV, femminismo neoliberista",
    "Inq. Visuale Cap. 3 — Immaginari ibridi, cyborg (Haraway)",
    "Inq. Visuale Cap. 4 — Attivismo digitale, synopticon",
    "Inq. Visuale Cap. 5 — Fotografia: studium/punctum (Barthes)",
    "Inq. Visuale Cap. 6 — Corpi femminili nello sport, framing power",
    "Inq. Visuale Cap. 7 — Culture jamming: subvertising",
    "Inq. Visuale Cap. 8 — Moda e identità, trickle down, Rana Plaza",
    "Media Digitali Cap. 1 — Network Society (Castells)",
    "Media Digitali Cap. 2 — Genere e sessualità: Butler, queer",
    "Media Digitali Cap. 3-4 — Turkle, gender swapping, cybersex",
    "Media Digitali Cap. 5-6 — Pornografizzazione + dating online",
    "Media Digitali Cap. 7-9 — Biomediatizzazione + femvertising",
    "Media Digitali Cap. 10-11 — Femminilità digitale + maschilità",
    "Media Digitali Cap. 12-13 — Gender mainstreaming, double bind",
    "Media Digitali Cap. 14-16 — Attivismo connettivo, meme",
    "Media Digitali Cap. 17-19 — Cyberfemminismo, violenza online",
    "Richardson Parte 1 — Binario sesso/genere, de Beauvoir",
    "Richardson Parte 2 — Sesso come costruzione sociale, Butler",
    "Richardson Parte 3 — Cinque approcci + glossario 50 termini",
  ],
}
const WEEKS = [
  { id:0, label:"Settimana 0", phase:1, dates:"27 Apr–3 Mag", phaseLabel:"FASE 1 — Studio di Base" },
  { id:1, label:"Settimana 2", phase:1, dates:"4–10 Mag", phaseLabel:"FASE 1 — Studio di Base" },
  { id:2, label:"Settimana 3", phase:2, dates:"11–17 Mag", phaseLabel:"FASE 2 — Ripasso Intensivo", focus:"Focus: Psicologia" },
  { id:3, label:"Settimana 4", phase:2, dates:"18–24 Mag", phaseLabel:"FASE 2 — Ripasso Intensivo", focus:"Focus: Radio & TV" },
  { id:4, label:"Settimana 5", phase:2, dates:"25–31 Mag", phaseLabel:"FASE 2 — Ripasso Intensivo", focus:"Focus: Estetica + Scienze Cog. + Genere" },
  { id:5, label:"Settimana 6", phase:3, dates:"1–5 Giu", phaseLabel:"FASE 3 — Ripasso Finale", focus:"🎓 Psicologia 5 Giu" },
  { id:6, label:"Settimana 7", phase:3, dates:"7–12 Giu", phaseLabel:"FASE 3 — Ripasso Finale", focus:"🎓 Genere 8 · Radio 9 · Estetica 11 · Scienze 12" },
]

export const DAILY: DailySchedule = "2026-04-27":
  "2026-04-27": {
    label: "Lun 27 Apr",
    hours: "5–6h",
    week: 0,
    sessions: [
      { sub: "psico", dur: "1.5h", topic: "Influenzamento e Persuasione — Aristotele (ethos, pathos, logos)" },
      { sub: "radio", dur: "1.5h", topic: "Radiodays Cap. 5-6 — Dopoguerra, RAI, Alto Gradimento" },
      { sub: "est", dur: "1h", topic: "Lady Sapiens 1 — Metodi scientifici (bacino, coclea, DNA)" },
      { sub: "genere", dur: "1.5h", topic: "Inq. Visuale Cap. 4 — Attivismo digitale, synopticon (Mathiesen)" },
    ],
  },
  "2026-04-28": {
    label: "Mar 28 Apr",
    hours: "3–4h",
    note: "Serata libera",
    week: 0,
    sessions: [
      { sub: "psico", dur: "2h", topic: "Inganno + Dibattito politico (Ethos, Dominanza, Discredito)" },
      { sub: "radio", dur: "2h", topic: "Radiodays Cap. 7-8 — Radio libere, sentenza 202/1976, web radio" },
    ],
  },
  "2026-04-29": {
    label: "Mer 29 Apr",
    hours: "5–6h",
    week: 0,
    sessions: [
      { sub: "psico", dur: "1.5h", topic: "Ironia + Contagio + Empatia + Insulti e Ridicolizzazione" },
      { sub: "radio", dur: "1.5h", topic: "Televisioni Cap. 2 — Anni '60-'70, servizio pubblico RAI" },
      { sub: "scog", dur: "1h", topic: "Cap. 1 — Svolta cognitivista: Tolman + Chomsky (GU)" },
      { sub: "genere", dur: "1.5h", topic: "Inq. Visuale Cap. 5 — Fotografia: studium/punctum" },
    ],
  },
  "2026-04-30": {
    label: "Gio 30 Apr",
    hours: "3–4h",
    note: "Serata libera",
    week: 0,
    sessions: [
      { sub: "psico", dur: "2h", topic: "Manuale B1-B3 — Scopi/Credenze/Risorse, Potere e Immagine" },
      { sub: "est", dur: "1.5h", topic: "Lady Sapiens 2-3 — Ago, donna artista, cacciatrici" },
    ],
  },
  "2026-05-01": { label: "Ven 1 Mag", busy: true, week: 1 },
  "2026-05-02": { label: "Sab 2 Mag", busy: true, week: 1 },
  "2026-05-03": {
    label: "Dom 3 Mag",
    hours: "3h",
    sunday: true,
    week: 0,
    sessions: [
      { sub: "psico", dur: "1h", topic: "Simulazione orale Sett. 2 — 5 domande casuali" },
      { sub: "radio", dur: "1h", topic: "Ripasso Radiodays completo Cap. 1-8" },
      { sub: "genere", dur: "0.5h", topic: "Ripasso Inq. Visuale Cap. 4-5" },
      { sub: "est", dur: "0.5h", topic: "Verifica settimanale" },
    ],
  },
  "2026-05-04": {
    label: "Lun 4 Mag",
    hours: "5–6h",
    week: 2,
    sessions: [
      { sub: "psico", dur: "1.5h", topic: "Manuale B4-B5 — Comunicazione indiretta, Influenzamento" },
      { sub: "radio", dur: "1.5h", topic: "Televisioni Cap. 3 — Anni '80, Berlusconi, Fininvest" },
      { sub: "scog", dur: "1h", topic: "Cap. 2 — Marr e i tre livelli di spiegazione" },
      { sub: "genere", dur: "1.5h", topic: "Inq. Visuale Cap. 6-7 — Sport, framing + Culture jamming" },
    ],
  },
  "2026-05-05": {
    label: "Mar 5 Mag",
    hours: "3–4h",
    note: "Serata libera",
    week: 2,
    sessions: [
      { sub: "psico", dur: "2h", topic: "Manuale B6-B7 — Comunicazione politica + Ridere e deridere" },
      { sub: "est", dur: "1.5h", topic: "Dissonanze Intro + Il Bello: da Pitagora a Duchamp" },
    ],
  },
  "2026-05-06": {
    label: "Mer 6 Mag",
    hours: "5–6h",
    week: 2,
    sessions: [
      { sub: "psico", dur: "1.5h", topic: "Manuale B8 — Prima simulazione orale totale (13 aree)" },
      { sub: "radio", dur: "1.5h", topic: "Televisioni Cap. 4 — Anni '90-2010, digitale terrestre" },
      { sub: "genere", dur: "1.5h", topic: "Inq. Visuale Cap. 8 — Moda, Rana Plaza, Slow Fashion" },
      { sub: "scog", dur: "1h", topic: "Cap. 2 — Algoritmi visione: schizzo primario, 2½-D, 3D" },
    ],
  },
  "2026-05-07": {
    label: "Gio 7 Mag",
    hours: "3–4h",
    note: "Serata libera",
    week: 2,
    sessions: [
      { sub: "radio", dur: "2h", topic: "Ripasso incrociato Radiodays ↔ Televisioni" },
      { sub: "genere", dur: "1.5h", topic: "Media Digitali Cap. 1 — Network Society, affordance" },
    ],
  },
  "2026-05-08": { label: "Ven 8 Mag", busy: true, week: 2 },
  "2026-05-09": { label: "Sab 9 Mag", busy: true, week: 2 },
  "2026-05-10": {
    label: "Dom 10 Mag",
    hours: "3h",
    sunday: true,
    week: 2,
    sessions: [
      { sub: "psico", dur: "1h", topic: "Simulazione orale totale (13 aree + manuale)" },
      { sub: "genere", dur: "1h", topic: "Ripasso Inq. Visuale completo (Cap. 1-8)" },
      { sub: "scog", dur: "0.5h", topic: "Ripasso Cap. 1-2 — comportamentismo + Marr" },
      { sub: "radio", dur: "0.5h", topic: "Verifica settimanale" },
    ],
  },
  "2026-05-11": {
    label: "Lun 11 Mag",
    hours: "5–6h",
    week: 3,
    sessions: [
      { sub: "psico", dur: "3h", topic: "FOCUS — Ripasso totale appunti: 13 aree con schema riassuntivo" },
      { sub: "radio", dur: "1.5h", topic: "Televisioni Cap. 1-2 — Ripasso con flashcard" },
      { sub: "genere", dur: "1h", topic: "Media Digitali Cap. 2 — Butler, teoria queer" },
    ],
  },
  "2026-05-12": {
    label: "Mar 12 Mag",
    hours: "3–4h",
    note: "Serata libera",
    week: 3,
    sessions: [
      { sub: "psico", dur: "2h", topic: "FOCUS — Manuale B1-B8 completo con risposte articolate" },
      { sub: "radio", dur: "1.5h", topic: "Radiodays Cap. 1-4 — Ripasso con mappe" },
    ],
  },
  "2026-05-13": {
    label: "Mer 13 Mag",
    hours: "5–6h",
    week: 3,
    sessions: [
      { sub: "psico", dur: "3h", topic: "FOCUS — Simulazione orale approfondita. Registra e riascolta" },
      { sub: "radio", dur: "1.5h", topic: "Radiodays Cap. 5-8 — Ripasso con timeline" },
      { sub: "genere", dur: "1h", topic: "Media Digitali Cap. 3-4 — Turkle, gender swapping, cybersex" },
    ],
  },
  "2026-05-14": {
    label: "Gio 14 Mag",
    hours: "3–4h",
    note: "Serata libera",
    week: 3,
    sessions: [
      { sub: "psico", dur: "2h", topic: "FOCUS — Flashcard veloci: definizioni precise, punti critici" },
      { sub: "est", dur: "1.5h", topic: "Dissonanze — Il Brutto + L'Interessante" },
    ],
  },
  "2026-05-15": { label: "Ven 15 Mag", busy: true, week: 3 },
  "2026-05-16": { label: "Sab 16 Mag", busy: true, week: 3 },
  "2026-05-17": {
    label: "Dom 17 Mag",
    hours: "3h",
    sunday: true,
    week: 3,
    sessions: [
      { sub: "psico", dur: "1.5h", topic: "Simulazione orale finale settimana — domande a sorpresa" },
      { sub: "genere", dur: "1h", topic: "Ripasso Media Digitali Cap. 1-4" },
      { sub: "radio", dur: "0.5h", topic: "Verifica settimanale" },
    ],
  },
  "2026-05-18": {
    label: "Lun 18 Mag",
    hours: "5–6h",
    week: 4,
    sessions: [
      { sub: "radio", dur: "3h", topic: "FOCUS — Radiodays Cap. 1-8: ripasso totale con flashcard" },
      { sub: "scog", dur: "1.5h", topic: "Cap. 4 — Fodor: modularità, sistemi di input" },
      { sub: "genere", dur: "1h", topic: "Media Digitali Cap. 5-6 — Pornografizzazione + dating" },
    ],
  },
  "2026-05-19": {
    label: "Mar 19 Mag",
    hours: "3–4h",
    note: "Serata libera",
    week: 4,
    sessions: [
      { sub: "radio", dur: "2.5h", topic: "FOCUS — Televisioni Cap. 1-4: ripasso completo" },
      { sub: "genere", dur: "1h", topic: "Media Digitali Cap. 7-9 — Biomediatizzazione + femvertising" },
    ],
  },
  "2026-05-20": {
    label: "Mer 20 Mag",
    hours: "5–6h",
    week: 4,
    sessions: [
      { sub: "radio", dur: "3h", topic: "FOCUS — Ripasso incrociato: mappa unificata" },
      { sub: "scog", dur: "1.5h", topic: "Cap. 4 — Cognizione centrale: isotropia, moduli darwiniani" },
      { sub: "genere", dur: "1h", topic: "Media Digitali Cap. 10-11 — Femminilità digitale + maschilità" },
    ],
  },
  "2026-05-21": {
    label: "Gio 21 Mag",
    hours: "3–4h",
    note: "Serata libera",
    week: 4,
    sessions: [
      { sub: "radio", dur: "2.5h", topic: "FOCUS — Simulazione scritto: 3 domande tipo" },
      { sub: "est", dur: "1.5h", topic: "Dissonanze — Il Sublime + Land Art + Body Art" },
    ],
  },
  "2026-05-22": { label: "Ven 22 Mag", busy: true, week: 4 },
  "2026-05-23": { label: "Sab 23 Mag", busy: true, week: 4 },
  "2026-05-24": {
    label: "Dom 24 Mag",
    hours: "3h",
    sunday: true,
    week: 4,
    sessions: [
      { sub: "radio", dur: "1.5h", topic: "Simulazione scritto Radio&TV + autocorrezione" },
      { sub: "genere", dur: "1h", topic: "Ripasso Media Digitali Cap. 5-11" },
      { sub: "scog", dur: "0.5h", topic: "Verifica settimanale" },
    ],
  },
  "2026-05-25": {
    label: "Lun 25 Mag",
    hours: "5–6h",
    week: 5,
    sessions: [
      { sub: "est", dur: "2h", topic: "FOCUS — Dissonanze: 6 categorie complete con autori" },
      { sub: "scog", dur: "2h", topic: "FOCUS — Cap. 5: neuroscienza cognitiva, riduzionismo" },
      { sub: "genere", dur: "1.5h", topic: "Media Digitali Cap. 12-13 — gender mainstreaming" },
    ],
  },
  "2026-05-26": {
    label: "Mar 26 Mag",
    hours: "3–4h",
    note: "Serata libera",
    week: 5,
    sessions: [
      { sub: "est", dur: "2h", topic: "FOCUS — 8 domande ripasso Lady Sapiens + Dissonanze" },
      { sub: "genere", dur: "1.5h", topic: "Media Digitali Cap. 14-16 — attivismo connettivo, meme" },
    ],
  },
  "2026-05-27": {
    label: "Mer 27 Mag",
    hours: "5–6h",
    week: 5,
    sessions: [
      { sub: "est", dur: "2.5h", topic: "FOCUS — Simulazione scritto Estetica" },
      { sub: "scog", dur: "2h", topic: "FOCUS — Ripasso Cap. 1-3: comportamentismo, cognitivismo, Marr" },
      { sub: "genere", dur: "1h", topic: "Media Digitali Cap. 17-19 — cyberfemminismo, violenza online" },
    ],
  },
  "2026-05-28": {
    label: "Gio 28 Mag",
    hours: "3–4h",
    note: "Serata libera",
    week: 5,
    sessions: [
      { sub: "scog", dur: "2h", topic: "FOCUS — Simulazione scritto: Fodor vs Churchland vs Craver" },
      { sub: "genere", dur: "1.5h", topic: "Richardson Parte 1 — Binario sesso/genere" },
    ],
  },
  "2026-05-29": { label: "Ven 29 Mag", busy: true, week: 5 },
  "2026-05-30": { label: "Sab 30 Mag", busy: true, week: 5 },
  "2026-05-31": {
    label: "Dom 31 Mag",
    hours: "3h",
    sunday: true,
    week: 5,
    sessions: [
      { sub: "est", dur: "1h", topic: "Ripasso finale Estetica — Lady Sapiens + Dissonanze" },
      { sub: "genere", dur: "1h", topic: "Richardson Parte 2-3 — costruzione sociale, Butler" },
      { sub: "scog", dur: "0.5h", topic: "Glossario completo Scienze Cog" },
      { sub: "est", dur: "0.5h", topic: "Verifica settimanale" },
    ],
  },
  "2026-06-01": {
    label: "Lun 1 Giu",
    hours: "5–6h",
    week: 6,
    sessions: [
      { sub: "psico", dur: "3h", topic: "FINALE — Ripasso totale: 13 aree + manuale B1-B8" },
      { sub: "genere", dur: "1.5h", topic: "Ripasso Genere — Inquinamento Visuale completo (Cap. 1-8)" },
      { sub: "radio", dur: "1h", topic: "Mantenimento Radio&TV — flashcard veloci" },
    ],
  },
  "2026-06-02": {
    label: "Mar 2 Giu",
    hours: "3–4h",
    note: "Serata libera",
    week: 6,
    sessions: [
      { sub: "psico", dur: "2.5h", topic: "FINALE — Simulazione orale totale a sorpresa" },
      { sub: "genere", dur: "1h", topic: "Ripasso Genere — Media Digitali Cap. 1-9" },
    ],
  },
  "2026-06-03": {
    label: "Mer 3 Giu",
    hours: "5–6h",
    week: 6,
    sessions: [
      { sub: "psico", dur: "2.5h", topic: "FINALE — Ripasso mirato aree deboli" },
      { sub: "psico", dur: "1.5h", topic: "FINALE — Ultima simulazione orale: registra e riascolta" },
      { sub: "genere", dur: "1.5h", topic: "Ripasso Genere — Media Digitali Cap. 10-19" },
    ],
  },
  "2026-06-04": {
    label: "Gio 4 Giu",
    hours: "2h",
    note: "Pomeriggio libero",
    week: 6,
    sessions: [
      { sub: "psico", dur: "1h", topic: "LEGGERO — Solo schemi e mappe concettuali" },
      { sub: "genere", dur: "1h", topic: "Ripasso Genere — Richardson + glossario 50 termini" },
    ],
  },
  "2026-06-05": {
    label: "Ven 5 Giu",
    exam: true,
    sub: "psico",
    examLabel: "ESAME PSICOLOGIA DELLA COMUNICAZIONE",
    time: "09:00",
    type: "Orale",
    week: 6,
  },
  "2026-06-06": { label: "Sab 6 Giu", busy: true, week: 6 },
  "2026-06-07": {
    label: "Dom 7 Giu",
    hours: "3h",
    sunday: true,
    week: 7,
    sessions: [
      { sub: "genere", dur: "1.5h", topic: "FINALE GENERE — Simulazione scritto sui tre testi" },
      { sub: "radio", dur: "1h", topic: "Ripasso Radio&TV (domani esame Genere, dopo Radio!)" },
      { sub: "est", dur: "0.5h", topic: "Mantenimento Estetica — schema 6 categorie" },
    ],
  },
  "2026-06-08": {
    label: "Lun 8 Giu",
    exam: true,
    sub: "genere",
    examLabel: "ESAME SOCIOLOGIA MEDIA, GENERE E IDENTITÀ",
    time: "14:00",
    type: "Scritto",
    examNote: "Via Ostiense 139, Aula parco · Mattina: 2h ripasso Radio & TV (esame domani!)",
    week: 7,
    sessions: [{ sub: "radio", dur: "2h", topic: "MATTINA — Ripasso finale Radio&TV prima dell'esame" }],
  },
  "2026-06-09": {
    label: "Mar 9 Giu",
    exam: true,
    sub: "radio",
    examLabel: "ESAME STORIA RADIO & TV",
    time: "10:00",
    type: "Scritto",
    week: 7,
  },
  "2026-06-10": {
    label: "Mer 10 Giu",
    hours: "5–6h",
    week: 7,
    sessions: [
      { sub: "est", dur: "2.5h", topic: "FINALE ESTETICA — Lady Sapiens + Dissonanze" },
      { sub: "scog", dur: "2.5h", topic: "FINALE SCOG — Confronto autori Fodor/Churchland/Craver" },
    ],
  },
  "2026-06-11": {
    label: "Gio 11 Giu",
    exam: true,
    sub: "est",
    examLabel: "ESAME ESTETICA",
    time: "16:00",
    type: "Scritto",
    examNote: "Mattina: 2h ripasso Scienze Cognitive (esame domani ore 10:00)",
    week: 7,
    sessions: [{ sub: "scog", dur: "2h", topic: "MATTINA — Ripasso finale Scienze Cognitive" }],
  },
  "2026-06-12": {
    label: "Ven 12 Giu",
    exam: true,
    sub: "scog",
    examLabel: "ESAME SCIENZE COGNITIVE",
    time: "10:00",
    type: "Scritto",
    week: 7,
  },
}


export const BOOKINGS: Booking[] = [
  { date: "2026-05-01", label: "Apertura prenotazioni tutti gli esami", urgent: false },
  { date: "2026-06-02", label: "Scadenza prenotazione Psicologia (orale 5 Giu)", urgent: true },
  { date: "2026-06-05", label: "Scadenza prenotazione Genere & Media (scritto 8 Giu)", urgent: true },
  { date: "2026-06-06", label: "Scadenza prenotazione Radio & TV (scritto 9 Giu)", urgent: true },
  { date: "2026-06-08", label: "Scadenza prenotazione Estetica (scritto 11 Giu)", urgent: true },
  { date: "2026-06-09", label: "Scadenza prenotazione Scienze Cog. (scritto 12 Giu)", urgent: true },
]

export const TODAY_STR = "2026-04-27"
export const DAILY_GOAL_MIN = 300 // 5 hours
