"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Bell, BellOff, Settings, X } from "lucide-react"
import { usePushNotifications } from "@/hooks/use-push-notifications"

interface Props {
  isOpen: boolean
  onClose: () => void
}

export function NotificationSettings({ isOpen, onClose }: Props) {
  const { isSupported, enabled, permission, requestPermission, toggleEnabled } = usePushNotifications()
  const [loading, setLoading] = useState(false)

  const handleToggle = async () => {
    if (permission === 'default') {
      const granted = await requestPermission()
      if (granted) {
        setLoading(true)
        await toggleEnabled()
        setLoading(false)
      }
    } else if (permission === 'granted') {
      setLoading(true)
      await toggleEnabled()
      setLoading(false)
    }
  }

  if (!isSupported) {
    return (
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
            onClick={onClose}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="card-quiet m-4 max-w-sm p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-stone-900">Impostazioni Notifiche</h3>
                <button onClick={onClose} className="p-1">
                  <X size={20} className="text-stone-500" />
                </button>
              </div>
              <p className="text-stone-600">
                Le notifiche push non sono supportate su questo browser.
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    )
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="card-quiet m-4 max-w-sm p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-stone-900">Impostazioni Notifiche</h3>
              <button onClick={onClose} className="p-1">
                <X size={20} className="text-stone-500" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-stone-900">Notifiche Studio</div>
                  <div className="text-sm text-stone-600">
                    Reminder giornaliero e promemoria esami
                  </div>
                </div>
                <button
                  onClick={handleToggle}
                  disabled={loading}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    enabled ? 'bg-blue-600' : 'bg-stone-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      enabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                  {loading && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="h-3 w-3 animate-spin rounded-full border border-white border-t-transparent" />
                    </div>
                  )}
                </button>
              </div>

              {permission === 'denied' && (
                <div className="rounded-lg bg-red-50 p-3">
                  <div className="flex items-center gap-2">
                    <BellOff size={16} className="text-red-600" />
                    <span className="text-sm font-medium text-red-900">
                      Permesso negato
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-red-700">
                    Abilita le notifiche nelle impostazioni del browser per ricevere promemoria.
                  </p>
                </div>
              )}

              {enabled && (
                <div className="rounded-lg bg-green-50 p-3">
                  <div className="flex items-center gap-2">
                    <Bell size={16} className="text-green-600" />
                    <span className="text-sm font-medium text-green-900">
                      Notifiche attive
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-green-700">
                    Riceverai reminder alle 9:00 e promemoria per gli esami.
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}