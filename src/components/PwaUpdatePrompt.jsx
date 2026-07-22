import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, RefreshCw, X } from 'lucide-react'

export default function PwaUpdatePrompt() {
  const [needRefresh, setNeedRefresh] = useState(false)
  const [offlineReady, setOfflineReady] = useState(false)

  useEffect(() => {
    // Check if Service Worker is supported
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        // Check for SW updates every 30 seconds
        setInterval(() => {
          registration.update().catch(err => console.log('SW update check:', err))
        }, 30000)

        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                setNeedRefresh(true)
              }
            })
          }
        })
      })

      // Listen for controllerchange (when new SW activates)
      let refreshing = false
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          refreshing = true
          window.location.reload()
        }
      })
    }
  }, [])

  const handleUpdate = () => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        if (registration.waiting) {
          registration.waiting.postMessage({ type: 'SKIP_WAITING' })
        }
      })
    }
    window.location.reload(true)
  }

  if (!needRefresh) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -50, scale: 0.95 }}
        className="fixed top-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-[100] p-4 rounded-2xl bg-[#141824] border border-amber-500/40 text-white shadow-[0_10px_40px_rgba(245,158,11,0.25)] backdrop-blur-xl flex items-center justify-between gap-3"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="text-xs font-bold font-display text-amber-400 uppercase tracking-wider">
              ✨ New Wayfare Update Ready
            </div>
            <div className="text-xs text-ink-200 mt-0.5">
              New features & fixes deployed. Reload to update.
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleUpdate}
            className="px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-ink-950 text-xs font-extrabold flex items-center gap-1.5 shadow-md transition-all active:scale-95"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Reload
          </button>
          <button
            onClick={() => setNeedRefresh(false)}
            className="p-1.5 rounded-lg text-ink-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
