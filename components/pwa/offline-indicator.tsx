"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { WifiOff } from "lucide-react"

/**
 * Offline indicator. Appears as a small pill at the top of the screen
 * when the device loses connectivity. The app keeps working thanks to
 * the service worker, but AI features (coach and analyst) require the
 * network and the user needs to know when they are degraded.
 */
export function OfflineIndicator() {
  const [online, setOnline] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    if (typeof navigator === "undefined") return
    setOnline(navigator.onLine)

    const onOnline = () => setOnline(true)
    const onOffline = () => setOnline(false)
    window.addEventListener("online", onOnline)
    window.addEventListener("offline", onOffline)
    return () => {
      window.removeEventListener("online", onOnline)
      window.removeEventListener("offline", onOffline)
    }
  }, [])

  if (!mounted) return null

  return (
    <AnimatePresence>
      {!online && (
        <motion.div
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -30, opacity: 0 }}
          transition={{ duration: 0.2 }}
          role="status"
          aria-live="polite"
          className="fixed inset-x-0 top-0 z-[70] flex justify-center pt-[max(env(safe-area-inset-top),8px)]"
        >
          <div className="flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50/95 px-3 py-1 text-[11px] font-medium text-amber-900 shadow-sm backdrop-blur-md">
            <WifiOff size={11} strokeWidth={2.25} />
            Offline — i progressi vengono salvati
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
