"use client"

import { useCallback, useEffect, useState } from "react"
import { savePushSubscription, getPushSubscription, updatePushSubscriptionEnabled } from "@/lib/supabase/push-subscriptions"
import { getUserId } from "@/lib/supabase/session"

export function usePushNotifications() {
  const [isSupported, setIsSupported] = useState(false)
  const [subscription, setSubscription] = useState<PushSubscriptionJSON | null>(null)
  const [enabled, setEnabled] = useState(false)
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return

    // Check if push notifications are supported
    const supported = 'serviceWorker' in navigator && 'PushManager' in window
    setIsSupported(supported)

    if (supported) {
      // Check current permission
      setPermission(Notification.permission)

      // Get existing subscription
      navigator.serviceWorker.ready.then(async (registration) => {
        const existingSubscription = await registration.pushManager.getSubscription()
        setSubscription(existingSubscription)

        if (existingSubscription) {
          // Check if enabled in database
          try {
            const userId = await getUserId()
            const dbSubscription = await getPushSubscription(userId)
            setEnabled(dbSubscription?.enabled ?? false)
          } catch (error) {
            console.error('Error checking subscription status:', error)
          }
        }
      })
    }
  }, [])

  const requestPermission = useCallback(async () => {
    if (!isSupported) return false

    try {
      const result = await Notification.requestPermission()
      setPermission(result)
      return result === 'granted'
    } catch (error) {
      console.error('Error requesting notification permission:', error)
      return false
    }
  }, [isSupported])

  const subscribe = useCallback(async () => {
    if (!isSupported || permission !== 'granted') return false

    try {
      setError(null)
      const registration = await navigator.serviceWorker.ready
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY

      if (!vapidKey) {
        console.error('VAPID public key not found')
        setError("Notifiche non configurate correttamente. Riprova più tardi.")
        return false
      }

      const newSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey)
      })

      // Salva su database prima di aggiornare lo stato locale: mai un successo "finto"
      const userId = await getUserId()
      await savePushSubscription(userId, newSubscription.toJSON())

      setSubscription(newSubscription)
      setEnabled(true)

      return true
    } catch (error) {
      console.error('Error subscribing to push notifications:', error)
      setError(error instanceof Error ? error.message : "Impossibile attivare le notifiche. Riprova.")
      return false
    }
  }, [isSupported, permission])

  const unsubscribe = useCallback(async () => {
    if (!subscription) return false

    try {
      setError(null)
      await (subscription as PushSubscription).unsubscribe()

      // Aggiorna il database prima di aggiornare lo stato locale
      const userId = await getUserId()
      await updatePushSubscriptionEnabled(userId, false)

      setSubscription(null)
      setEnabled(false)

      return true
    } catch (error) {
      console.error('Error unsubscribing from push notifications:', error)
      setError(error instanceof Error ? error.message : "Impossibile disattivare le notifiche. Riprova.")
      return false
    }
  }, [subscription])

  const toggleEnabled = useCallback(async () => {
    if (!subscription) {
      const success = await subscribe()
      return success
    } else {
      const newEnabled = !enabled
      try {
        setError(null)
        // Aggiorna il database prima di aggiornare lo stato locale: mai un successo "finto"
        const userId = await getUserId()
        await updatePushSubscriptionEnabled(userId, newEnabled)
        setEnabled(newEnabled)
        return newEnabled
      } catch (error) {
        console.error('Error toggling push notifications:', error)
        setError(error instanceof Error ? error.message : "Impossibile aggiornare le notifiche. Riprova.")
        return enabled
      }
    }
  }, [subscription, enabled, subscribe])

  return {
    isSupported,
    subscription,
    enabled,
    permission,
    error,
    requestPermission,
    subscribe,
    unsubscribe,
    toggleEnabled
  }
}

// Utility function to convert VAPID key
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/')

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}