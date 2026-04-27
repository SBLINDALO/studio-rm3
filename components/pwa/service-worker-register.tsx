"use client"

import { useEffect } from "react"

/**
 * Registers the service worker on production builds.
 *
 * On iOS Safari the registration must happen after the page is interactive.
 * We also wire a simple "controllerchange" listener so that when a new SW
 * takes over (after an update), we force-reload exactly once to show the
 * fresh version of the app.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return
    if (!("serviceWorker" in navigator)) return
    if (process.env.NODE_ENV !== "production") return

    const onLoad = () => {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .catch(() => {
          // Registration failures are non-fatal: the app still works online.
        })
    }

    // Reload once when a waiting SW activates
    let reloaded = false
    const onControllerChange = () => {
      if (reloaded) return
      reloaded = true
      window.location.reload()
    }
    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange)

    if (document.readyState === "complete") onLoad()
    else window.addEventListener("load", onLoad, { once: true })

    return () => {
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange)
    }
  }, [])

  return null
}
