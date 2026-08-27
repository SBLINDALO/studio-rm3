import { FileText, Files, NotebookPen, Layers } from "lucide-react"
import type { DynamicExam } from "@/lib/planner/types"

const MAP = {
  pages: FileText,
  pdf: Files,
  notes: NotebookPen,
  mixed: Layers,
} as const

export function MaterialIcon({ type, ...props }: { type: DynamicExam["material"]["type"]; size?: number } & React.SVGProps<SVGSVGElement>) {
  const Icon = MAP[type] ?? Layers
  return <Icon {...props} />
}
