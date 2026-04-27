"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Share, Plus, X } from "lucide-react"

import { usePersistedState } from "@/hooks/use-persisted-state"

/**
 * iOS Install Prompt.
 *
 * iOS Safari does not emit the standard `beforeinstallprompt` event — the
 * only way to install a PWA is via the native Share sheet. We show an
 * onboarding card the first time the app is opened in Safari on a device
 * that is not yet running in standalone mode.
 *
 * The user can dismiss it permanently. We detect Android/desktop installs
 * via `beforeinstallprompt` as a nice-to-have for other browsers.
 */
export function InstallPrompt() {
  const [dismissed, setDismissed] = usePersistedState<boolean>("pwa.installDismissed", false)
  const [mounted, setMounted] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)

  useEffect(() => {
    setMounted(true)
    if (typeof window === "undefined") return

    const ua = window.navigator.userAgent
    const iOS = /iPad|iPhone|iPod/.test(ua) && !(window as unknown as { MSStream?: unknown }).MSStream
    setIsIOS(iOS)

    // Standalone detection: iOS uses navigator.standalone, others use display-mode
    const standalone =
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true ||
      window.matchMedia("(display-mode: standalone)").matches
    setIsStandalone(standalone)
  }, [])

  // Only render after hydration, only on iOS, only if not already installed,
  // and only if the user has not dismissed the prompt.
  const shouldShow = mounted && isIOS && !isStandalone && !dismissed

  return (
    <AnimatePresence>
      {shouldShow && (
        <motion.div
          initial={{ y: 120, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 120, opacity: 0 }}
          transition={{ type: "spring", damping: 24, stiffness: 240 }}
          role="dialog"
          aria-label="Installa l'app sulla schermata Home"
          className="fixed inset-x-3 bottom-20 z-[60] mx-auto max-w-[460px]"
        >
          <div className="relative overflow-hidden rounded-2xl border border-stone-200 bg-white/95 p-4 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] backdrop-blur-xl">
            <button
              onClick={() => setDismissed(true)}
              className="absolute right-2 top-2 rounded-full p-1.5 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-700"
              aria-label="Chiudi"
            >
              <X size={14} strokeWidth={2.5} />
            </button>

            <div className="pr-6">
              <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-stone-500">
                Installa sul telefono
              </div>
              <h3 className="mt-1 text-[15px] font-semibold text-stone-900">
                Usa l&apos;app dalla schermata Home
              </h3>
              <p className="mt-1 text-[12.5px] leading-relaxed text-stone-600">
                Aprila a schermo intero e usala anche senza connessione. I
                progressi restano salvati.
              </p>

              <ol className="mt-3 space-y-2 text-[12.5px] text-stone-700">
                <li className="flex items-center gap-2.5">
                  <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-stone-900 text-[10px] font-bold text-white">
                    1
                  </span>
                  <span className="flex items-center gap-1.5">
                    Tocca
                    <Share size={14} className="text-[#3B82F6]" strokeWidth={2.25} />
                    in basso
                  </span>
                </li>
                <li className="flex items-center gap-2.5">
                  <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-stone-900 text-[10px] font-bold text-white">
                    2
                  </span>
                  <span className="flex items-center gap-1.5">
                    Scegli
                    <span className="inline-flex items-center gap-1 rounded-md bg-stone-100 px-1.5 py-0.5 text-[11px] font-medium text-stone-800">
                      <Plus size={11} strokeWidth={2.5} />
                      Aggiungi alla schermata Home
                    </span>
                  </span>
                </li>
              </ol>

              <button
                onClick={() => setDismissed(true)}
                className="mt-3 text-[11px] font-medium text-stone-500 underline-offset-2 hover:text-stone-800 hover:underline"
              >
                Non mostrare più
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
