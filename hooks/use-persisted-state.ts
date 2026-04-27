"use client"

import { useCallback, useEffect, useRef, useState } from "react"

/**
 * Generic localStorage-backed state hook.
 *
 * Contract:
 *  - Returns the same `[value, setValue]` signature as useState.
 *  - Initial render uses `initialValue` (SSR-safe).
 *  - After mount we hydrate from localStorage synchronously on the client.
 *  - Every setValue call writes back to localStorage.
 *  - If JSON parse or storage access fails, we fall back silently to the
 *    current in-memory value. This avoids crashing the UI on private mode
 *    or on first visit.
 *
 * Usage:
 *   const [soundOn, setSoundOn] = usePersistedState<boolean>("timer.sound", true)
 */
export function usePersistedState<T>(
  key: string,
  initialValue: T,
): [T, (v: T | ((prev: T) => T)) => void] {
  const [value, setValue] = useState<T>(initialValue)
  const hydratedRef = useRef(false)

  // Hydrate from storage on first client render
  useEffect(() => {
    if (hydratedRef.current) return
    hydratedRef.current = true
    try {
      const raw = localStorage.getItem(key)
      if (raw !== null) {
        setValue(JSON.parse(raw) as T)
      }
    } catch {
      // ignore storage errors
    }
  }, [key])

  // Persist on every change (after hydration has happened)
  const update = useCallback(
    (next: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const resolved =
          typeof next === "function" ? (next as (p: T) => T)(prev) : next
        try {
          localStorage.setItem(key, JSON.stringify(resolved))
        } catch {
          // ignore storage errors
        }
        return resolved
      })
    },
    [key],
  )

  return [value, update]
}
