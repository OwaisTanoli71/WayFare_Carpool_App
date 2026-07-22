import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function OfflineIndicator() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine)

  useEffect(() => {
    const handleOnline = () => setIsOffline(false)
    const handleOffline = () => setIsOffline(true)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return (
    <AnimatePresence>
      {isOffline && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="fixed top-16 left-0 right-0 z-40 mx-auto max-w-sm rounded-b-2xl border-b border-x border-warning/30 bg-warning/10 p-2 text-center shadow-lg backdrop-blur-md"
        >
          <div className="text-xs font-medium text-warning flex items-center justify-center gap-2">
            <span>📡</span> You're offline — showing your last synced data.
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
