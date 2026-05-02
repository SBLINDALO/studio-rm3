"use client"

import { useCallback, useEffect, useState } from "react"
import { savePushSubscription, getPushSubscription, updatePushSubscriptionEnabled } from "@/lib/supabase/push-subscriptions"

export function usePushNotifications() {
  const [isSupported, setIsSupported] = useState(false)
  const [subscription, setSubscription] = useState<PushSubscriptionJSON | null>(null)
  const [enabled, setEnabled] = useState(false)
  const [permission, setPermission] = useState<NotificationPermission>('default')

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
          const userId = "test-user" // TODO: get from auth
          try {
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
      const registration = await navigator.serviceWorker.ready
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY

      if (!vapidKey) {
        console.error('VAPID public key not found')
        return false
      }

      const newSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey)
      })

      setSubscription(newSubscription)

      // Save to database
      const userId = "test-user" // TODO: get from auth
      await savePushSubscription(userId, newSubscription.toJSON())
      setEnabled(true)

      return true
    } catch (error) {
      console.error('Error subscribing to push notifications:', error)
      return false
    }
  }, [isSupported, permission])

  const unsubscribe = useCallback(async () => {
    if (!subscription) return false

    try {
      await subscription.unsubscribe()
      setSubscription(null)
      setEnabled(false)

      // Remove from database
      const userId = "test-user" // TODO: get from auth
      await updatePushSubscriptionEnabled(userId, false)

      return true
    } catch (error) {
      console.error('Error unsubscribing from push notifications:', error)
      return false
    }
  }, [subscription])

  const toggleEnabled = useCallback(async () => {
    if (!subscription) {
      const success = await subscribe()
      return success
    } else {
      const newEnabled = !enabled
      setEnabled(newEnabled)

      // Update in database
      const userId = "test-user" // TODO: get from auth
      await updatePushSubscriptionEnabled(userId, newEnabled)

      return newEnabled
    }
  }, [subscription, enabled, subscribe])

  return {
    isSupported,
    subscription,
    enabled,
    permission,
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