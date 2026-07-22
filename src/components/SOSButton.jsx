import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { sendSOSAlert } from '../lib/sos'
import { useApp } from '../context/AppContext'

export default function SOSButton() {
  const [isPressing, setIsPressing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [triggered, setTriggered] = useState(false)
  const { user } = useApp()

  useEffect(() => {
    let interval
    if (isPressing && !triggered) {
      interval = setInterval(() => {
        setProgress((p) => {
          if (p >= 100) {
            clearInterval(interval)
            triggerSOS()
            return 100
          }
          return p + (100 / 30) // 3 seconds = 30 * 100ms
        })
      }, 100)
    } else {
      setProgress(0)
    }
    return () => clearInterval(interval)
  }, [isPressing, triggered])

  const triggerSOS = async () => {
    setTriggered(true)
    setIsPressing(false)
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude, longitude } = pos.coords
          await sendSOSAlert(user?.email || 'anonymous', { latitude, longitude }, 'danger')
        },
        async () => {
          await sendSOSAlert(user?.email || 'anonymous', { error: 'Location denied' }, 'danger')
        }
      )
    } else {
      await sendSOSAlert(user?.email || 'anonymous', { error: 'Geolocation not supported' }, 'danger')
    }
  }

  const handlePointerDown = (e) => {
    // Prevent default touch behavior (like scrolling) during long press
    if(e.pointerType === 'touch') {
       e.target.setPointerCapture(e.pointerId);
    }
    setIsPressing(true)
  }

  const handlePointerUp = (e) => {
    if(e.pointerType === 'touch') {
       e.target.releasePointerCapture(e.pointerId);
    }
    setIsPressing(false)
  }

  return (
    <>
      <div className="relative inline-flex items-center justify-center">
        {/* Progress Ring */}
        <svg className="absolute -inset-2 h-[calc(100%+1rem)] w-[calc(100%+1rem)] -rotate-90">
          <circle
            cx="50%"
            cy="50%"
            r="40%"
            className="fill-none stroke-ink-800 stroke-[3px]"
          />
          <motion.circle
            cx="50%"
            cy="50%"
            r="40%"
            className="fill-none stroke-danger stroke-[3px]"
            style={{ 
              pathLength: progress / 100,
              filter: progress > 0 ? 'drop-shadow(0 0 4px rgba(255, 107, 107, 0.6))' : 'none'
            }}
            strokeLinecap="round"
          />
        </svg>

        <motion.button
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          onContextMenu={(e) => e.preventDefault()}
          whileTap={{ scale: 0.95 }}
          className={`focus-ring relative z-10 flex h-12 w-12 items-center justify-center rounded-full border-2 font-display font-bold transition-colors ${
            triggered
              ? 'border-danger bg-danger text-white shadow-glow'
              : 'border-beacon text-beacon hover:bg-beacon/10'
          }`}
        >
          SOS
        </motion.button>
      </div>

      <AnimatePresence>
        {triggered && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/90 p-6 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              className="w-full max-w-sm rounded-3xl bg-ink-800 p-6 shadow-card"
            >
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-danger/20 mx-auto">
                <div className="h-8 w-8 rounded-full bg-danger animate-pulse" />
              </div>
              <h2 className="text-center font-display text-2xl font-bold text-white mb-2">SOS Triggered</h2>
              <p className="text-center text-sm text-ink-100 mb-6">
                Your trusted contacts have been notified with your live location. Audio metadata recording has started.
              </p>
              
              <div className="space-y-3 mb-6">
                <a href="tel:15" className="flex w-full items-center justify-between rounded-xl bg-ink-700 p-4 transition-colors hover:bg-ink-600">
                  <span className="font-semibold text-white">Police (Pakistan)</span>
                  <span className="font-mono text-lg text-beacon">15</span>
                </a>
                <a href="tel:1122" className="flex w-full items-center justify-between rounded-xl bg-ink-700 p-4 transition-colors hover:bg-ink-600">
                  <span className="font-semibold text-white">Ambulance</span>
                  <span className="font-mono text-lg text-beacon">1122</span>
                </a>
              </div>

              <button
                onClick={() => setTriggered(false)}
                className="w-full rounded-xl border border-ink-600 py-3 text-sm font-semibold text-ink-100 transition-colors hover:bg-ink-700 hover:text-white"
              >
                Dismiss
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
