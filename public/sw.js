/* eslint-disable */
/**
 * Service Worker — Pianificatore Studio RM3
 *
 * Strategia di caching:
 *   - Navigation requests (HTML):    Network-first con fallback cache
 *   - Static assets (JS/CSS/font):   Stale-while-revalidate
 *   - Next.js data (/_next/data):    Network-first con fallback cache
 *   - Tutto il resto:                Network passthrough
 *
 * Le richieste API (/api/*) NON vengono mai messe in cache: le chiamate
 * ai modelli AI devono sempre raggiungere la rete, e se la rete manca
 * l'app mostra un errore gestito lato client.
 */

const VERSION = "rm3-planner-v1"
const STATIC_CACHE = `static-${VERSION}`
const RUNTIME_CACHE = `runtime-${VERSION}`

const PRECACHE_URLS = [
  "/",
  "/manifest.webmanifest",
  "/icon.svg",
  "/apple-icon.png",
  "/icon-light-32x32.png",
  "/icon-dark-32x32.png",
]

// ─── Install: pre-cache del guscio dell'app ────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS).catch(() => {
        // Se uno dei precache fallisce non blocchiamo l'install,
        // il runtime cache recupererà dopo.
      }))
      .then(() => self.skipWaiting()),
  )
})

// ─── Activate: pulizia delle vecchie versioni ──────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== STATIC_CACHE && k !== RUNTIME_CACHE)
          .map((k) => caches.delete(k)),
      ),
    ).then(() => self.clients.claim()),
  )
})

// ─── Fetch: routing per tipo di richiesta ──────────────────────────────────
self.addEventListener("fetch", (event) => {
  const req = event.request

  // Solo GET. POST/PUT/DELETE passano sempre diretti.
  if (req.method !== "GET") return

  const url = new URL(req.url)

  // Stessa origine soltanto
  if (url.origin !== self.location.origin) return

  // API route: mai cached, sempre diretto alla rete
  if (url.pathname.startsWith("/api/")) return

  // Navigazione HTML: network-first
  if (req.mode === "navigate" || req.headers.get("accept")?.includes("text/html")) {
    event.respondWith(networkFirst(req))
    return
  }

  // Asset statici Next.js: stale-while-revalidate
  if (url.pathname.startsWith("/_next/") || url.pathname.match(/\.(?:js|css|woff2?|ttf|png|jpg|svg|webp|ico)$/)) {
    event.respondWith(staleWhileRevalidate(req))
    return
  }

  // Default: network-first leggero
  event.respondWith(networkFirst(req))
})

// ─── Strategie ─────────────────────────────────────────────────────────────

async function networkFirst(req) {
  const cache = await caches.open(RUNTIME_CACHE)
  try {
    const fresh = await fetch(req)
    // Copia la risposta prima di metterla in cache
    if (fresh && fresh.status === 200) {
      cache.put(req, fresh.clone())
    }
    return fresh
  } catch (err) {
    const cached = await cache.match(req)
    if (cached) return cached
    // Fallback finale: servi la home cached se esiste (offline landing)
    const homeCached = await caches.match("/")
    if (homeCached) return homeCached
    throw err
  }
}

async function staleWhileRevalidate(req) {
  const cache = await caches.open(RUNTIME_CACHE)
  const cached = await cache.match(req)
  const networkPromise = fetch(req)
    .then((res) => {
      if (res && res.status === 200) cache.put(req, res.clone())
      return res
    })
    .catch(() => cached)
  return cached || networkPromise
}

// ─── Messaging: permette all'app di forzare un aggiornamento ───────────────
const notificationTimers = new Map()

function clearNotificationTimers() {
  notificationTimers.forEach((timerId) => clearTimeout(timerId))
  notificationTimers.clear()
}

function scheduleNotification({ id, time, title, body, tag }) {
  const delay = time - Date.now()
  if (delay <= 0) return

  const timerId = setTimeout(() => {
    self.registration.showNotification(title, {
      body,
      icon: "/icon.svg",
      badge: "/icon-light-32x32.png",
      tag: tag || id,
      renotify: true,
    })
    notificationTimers.delete(id)
  }, delay)

  notificationTimers.set(id, timerId)
}

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting()
    return
  }

  if (event.data?.type === "SCHEDULE_NOTIFICATIONS") {
    clearNotificationTimers()
    const payload = event.data.payload
    if (Array.isArray(payload?.notifications)) {
      payload.notifications.forEach((entry) => scheduleNotification(entry))
    }
    return
  }
})

self.addEventListener("notificationclick", (event) => {
  event.notification.close()
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      if (clients.length > 0) {
        return clients[0].focus()
      }
      return self.clients.openWindow("/")
    }),
  )
})

// ─── Push Notifications ────────────────────────────────────────────────────

self.addEventListener("push", (event) => {
  if (!event.data) return

  try {
    const data = event.data.json()
    const options = {
      body: data.body,
      icon: "/icon.svg",
      badge: "/icon-light-32x32.png",
      tag: data.tag || "study-reminder",
      renotify: true,
      data: data.data || {},
      actions: data.actions || []
    }

    event.waitUntil(
      self.registration.showNotification(data.title || "Promemoria Studio", options)
    )
  } catch (error) {
    console.error("Error handling push event:", error)
    event.waitUntil(
      self.registration.showNotification("Promemoria Studio", {
        body: "È ora di studiare!",
        icon: "/icon.svg",
        badge: "/icon-light-32x32.png",
        tag: "study-reminder"
      })
    )
  }
})

// ─── Push Subscription Change ──────────────────────────────────────────────

self.addEventListener("pushsubscriptionchange", (event) => {
  console.log("Push subscription changed")
  // TODO: Handle subscription renewal if needed
})
