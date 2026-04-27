"use client"

import { motion } from "framer-motion"
import { LayoutDashboard, Calendar, CheckCircle2, ClipboardList, Timer } from "lucide-react"

export type TabId = "today" | "schedule" | "tracker" | "review" | "timer"

const TABS: { id: TabId; label: string; Icon: typeof LayoutDashboard }[] = [
  { id: "today", label: "Oggi", Icon: LayoutDashboard },
  { id: "schedule", label: "Piano", Icon: Calendar },
  { id: "tracker", label: "Tracker", Icon: CheckCircle2 },
  { id: "review", label: "Verifica", Icon: ClipboardList },
  { id: "timer", label: "Timer", Icon: Timer },
]

export function TabsNav({ tab, onChange }: { tab: TabId; onChange: (t: TabId) => void }) {
  return (
    <nav
      aria-label="Navigazione principale"
      className="glass fixed bottom-0 left-1/2 z-50 w-full max-w-[680px] -translate-x-1/2 border-t border-[var(--border-subtle)] px-3 pb-[max(10px,env(safe-area-inset-bottom))] pt-2"
    >
      <div className="flex items-stretch justify-between gap-0.5">
        {TABS.map(({ id, label, Icon }) => {
          const active = tab === id
          return (
            <button
              key={id}
              onClick={() => onChange(id)}
              className="relative flex flex-1 flex-col items-center justify-center gap-1 rounded-xl py-1.5 transition-colors"
              aria-current={active ? "page" : undefined}
            >
              {active && (
                <motion.span
                  layoutId="tab-indicator"
                  transition={{ type: "spring", stiffness: 420, damping: 34 }}
                  className="absolute inset-0 rounded-xl bg-stone-900/[0.04]"
                />
              )}
              <span
                className={`relative z-10 transition-colors ${
                  active ? "text-stone-900" : "text-stone-400"
                }`}
              >
                <Icon size={19} strokeWidth={active ? 2.4 : 1.8} />
              </span>
              <span
                className={`relative z-10 text-[10px] font-medium tracking-tight transition-colors ${
                  active ? "text-stone-900" : "text-stone-500"
                }`}
              >
                {label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
