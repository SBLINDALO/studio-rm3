import { Brain, Radio as RadioIcon, Palette, Microscope, Zap, type LucideProps } from "lucide-react"
import type { SubjectKey } from "@/lib/planner/types"

const MAP = {
  psico: Brain,
  radio: RadioIcon,
  est: Palette,
  scog: Microscope,
  genere: Zap,
} as const

export function SubjectIcon({ sub, ...props }: { sub: SubjectKey } & LucideProps) {
  const Icon = MAP[sub] || Brain
  return <Icon {...props} />
}
