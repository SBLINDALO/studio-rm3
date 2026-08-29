// Preset di motion condivisi — linguaggio "Liquid Glass": spring fisiche coerenti
// in tutta l'app. La riduzione per prefers-reduced-motion è gestita a livello globale
// da <MotionConfig reducedMotion="user"> in app/page.tsx: Framer Motion sostituisce
// automaticamente le transizioni con transform (scale/translate/rotate) con un fade
// istantaneo quando l'utente ha attivato "riduci movimento" nel sistema operativo.
import type { Transition } from "framer-motion"

/** Spring di default: per apparizione card, stagger, elementi che entrano in scena. */
export const SPRING_DEFAULT: Transition = { type: "spring", stiffness: 380, damping: 32 }

/** Spring più morbida: per barre di progresso e riempimenti continui. */
export const SPRING_FILL: Transition = { type: "spring", stiffness: 120, damping: 20, mass: 0.9 }

/** Spring "scattante": per bottom sheet, drawer, elementi flottanti (FAB, tab indicator). */
export const SPRING_SHEET: Transition = { type: "spring", stiffness: 420, damping: 38 }

/** Spring per micro-interazioni (pulse, badge, celebrazioni). */
export const SPRING_POP: Transition = { type: "spring", stiffness: 280, damping: 18 }

/** Genera una transizione con stagger basato sull'indice, mantenendo la spring di default. */
export function staggerSpring(index: number, delayStep = 0.04): Transition {
  return { ...SPRING_DEFAULT, delay: index * delayStep }
}
