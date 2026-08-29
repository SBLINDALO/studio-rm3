"use client"

import { motion } from "framer-motion"
import { LayoutDashboard, Calendar, CheckCircle2, ClipboardList, Timer, BarChart3 } from "lucide-react"
import { SPRING_SHEET } from "@/lib/planner/motion"

export type TabId = "today" | "schedule" | "tracker" | "review" | "timer" | "progress"

const TABS: { id: TabId; label: string; Icon: typeof LayoutDashboard }[] = [
  { id: "today", label: "Oggi", Icon: LayoutDashboard },
  { id: "schedule", label: "Piano", Icon: Calendar },
  { id: "tracker", label: "Tracker", Icon: CheckCircle2 },
  { id: "review", label: "Verifica", Icon: ClipboardList },
  { id: "timer", label: "Timer", Icon: Timer },
  { id: "progress", label: "Progressi", Icon: BarChart3 },
]

export function TabsNav({ tab, onChange }: { tab: TabId; onChange: (t: TabId) => void }) {
  return (
    <div
      className="fixed inset-x-0 bottom-0 z-50 flex justify-center px-3"
      style={{ paddingBottom: "max(14px, env(safe-area-inset-bottom))" }}
    >
      <nav
        aria-label="Navigazione principale"
        className="glass-strong flex w-full max-w-[560px] items-stretch justify-between gap-0.5 rounded-full px-2 py-1.5"
      >
        {TABS.map(({ id, label, Icon }) => {
          const active = tab === id
          return (
            <button
              key={id}
              onClick={() => onChange(id)}
              className="relative flex flex-1 flex-col items-center justify-center gap-0.5 rounded-full px-1 py-1.5 transition-transform active:scale-95"
              aria-current={active ? "page" : undefined}
            >
              {active && (
                <motion.span
                  layoutId="tab-indicator"
                  transition={SPRING_SHEET}
                  className="absolute inset-x-1.5 inset-y-0.5 rounded-full bg-[var(--fg)]/[0.06] shadow-[inset_0_0_0_1px_var(--border-subtle)]"
                />
              )}
              <span
                className={`relative z-10 transition-colors ${
                  active ? "text-stone-900 dark:text-white" : "text-stone-400"
                }`}
              >
                <Icon size={19} strokeWidth={active ? 2.4 : 1.8} />
              </span>
              <span
                className={`relative z-10 text-[10px] font-medium tracking-tight transition-colors ${
                  active ? "text-stone-900 dark:text-white" : "text-stone-500"
                }`}
              >
                {label}
              </span>
            </button>
          )
        })}
      </nav>
    </div>
  )
}

