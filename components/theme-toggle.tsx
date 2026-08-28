"use client"

import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])
  if (!mounted) return <span className="h-8 w-8" aria-hidden="true" />

  const dark = resolvedTheme === "dark"
  return (
    <button
      type="button"
      onClick={() => setTheme(dark ? "light" : "dark")}
      className="rounded-full border border-white/15 bg-white/10 p-2 text-white hover:bg-white/15"
      aria-label={dark ? "Attiva tema chiaro" : "Attiva tema scuro"}
      title={dark ? "Tema chiaro" : "Tema scuro"}
    >
      {dark ? <Sun size={14} /> : <Moon size={14} />}
    </button>
  )
}
