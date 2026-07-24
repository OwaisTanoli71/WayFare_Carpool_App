import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function SplashScreen({ onFinish }) {
  // Only show the splash screen once per session
  const [isVisible, setIsVisible] = useState(() => {
    return sessionStorage.getItem('wayfare_splash_seen') !== 'true'
  })

  useEffect(() => {
    if (!isVisible) {
      if (onFinish) onFinish()
      return
    }

    // Ultra-smooth 1.2s brand splash timing
    const timer = setTimeout(() => {
      setIsVisible(false)
      sessionStorage.setItem('wayfare_splash_seen', 'true')
      if (onFinish) onFinish()
    }, 1200)

    return () => clearTimeout(timer)
  }, [isVisible, onFinish])

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.03, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } }}
          className="fixed inset-0 z-[9999] bg-[#0B0E14] text-white flex flex-col items-center justify-center p-6 select-none overflow-hidden"
        >
          {/* Subtle Ambient Backlight */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-gradient-to-tr from-amber-500/20 via-teal/10 to-transparent blur-[100px] rounded-full pointer-events-none" />

          {/* Luxury Brand Center */}
          <div className="relative flex flex-col items-center text-center space-y-5 z-10">
            {/* Logo Badge */}
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="relative"
            >
              <div className="absolute -inset-2 rounded-3xl bg-gradient-to-r from-amber-500/40 to-teal/40 blur-lg opacity-70" />
              <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl border border-white/15 bg-ink-900/90 p-2.5 shadow-2xl backdrop-blur-xl flex items-center justify-center">
                <img 
                  src="/Wayfare_favicon.jpeg" 
                  alt="Wayfare Logo" 
                  className="w-full h-full object-cover rounded-xl shadow-sm"
                />
              </div>
            </motion.div>

            {/* Brand Title */}
            <motion.div
              initial={{ y: 15, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="space-y-1.5"
            >
              <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
                Wayfare
              </h1>
              <p className="text-xs sm:text-sm font-medium text-ink-300 tracking-wide">
                Shared Journeys. <span className="text-amber-400">Verified Rides.</span>
              </p>
            </motion.div>

            {/* Sleek Line Route Animation */}
            <motion.div 
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 0.3, duration: 0.6, ease: 'easeInOut' }}
              className="w-24 h-0.5 rounded-full bg-gradient-to-r from-amber-500 via-amber-400 to-teal shadow-[0_0_8px_rgba(245,158,11,0.5)] mt-2"
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
