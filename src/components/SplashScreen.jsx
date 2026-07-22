import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ShieldCheck, Sparkles, Navigation } from 'lucide-react'

export default function SplashScreen({ onFinish }) {
  const [progress, setProgress] = useState(0)
  const [statusText, setStatusText] = useState('Initializing Wayfare Engine...')
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    // Smooth progress bar animation over 2.2 seconds
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval)
          return 100
        }
        const next = prev + Math.floor(Math.random() * 15) + 8
        return next > 100 ? 100 : next
      })
    }, 150)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (progress < 35) {
      setStatusText('Initializing Wayfare Safety Engine...')
    } else if (progress < 70) {
      setStatusText('Verifying Secure Encrypted Session...')
    } else if (progress < 95) {
      setStatusText('Connecting to Live Rides Network...')
    } else {
      setStatusText('Welcome to Wayfare!')
      const timer = setTimeout(() => {
        setIsVisible(false)
        if (onFinish) onFinish()
      }, 400)
      return () => clearTimeout(timer)
    }
  }, [progress, onFinish])

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.05, transition: { duration: 0.5, ease: 'easeInOut' } }}
          className="fixed inset-0 z-[9999] bg-[#0B0E17] text-white flex flex-col items-center justify-between p-8 overflow-hidden select-none"
        >
          {/* Animated Background Radial Glows */}
          <motion.div 
            animate={{ scale: [1, 1.2, 1], opacity: [0.15, 0.3, 0.15] }}
            transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
            className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] sm:w-[500px] h-[350px] sm:h-[500px] bg-gradient-to-tr from-amber-500/30 to-teal-400/20 blur-[130px] rounded-full pointer-events-none z-0"
          />

          <div className="w-full flex justify-between items-center z-10 opacity-70">
            <div className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-widest text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" /> Safety First
            </div>
            <div className="text-[11px] font-mono text-ink-400">v2.4 Pro</div>
          </div>

          {/* CENTER HERO BRAND AREA */}
          <div className="flex flex-col items-center text-center z-10 my-auto space-y-6">
            
            {/* Animated Logo Container with Glowing Ring */}
            <motion.div
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="relative group"
            >
              {/* Outer Ambient Glow Circle */}
              <div className="absolute -inset-4 bg-gradient-to-r from-amber-500 to-teal-400 rounded-[2.5rem] blur-xl opacity-50 group-hover:opacity-80 transition-opacity animate-pulse" />
              
              {/* Logo Card */}
              <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-[2rem] border border-white/20 bg-ink-900/90 p-3 shadow-2xl backdrop-blur-xl flex items-center justify-center overflow-hidden">
                <img 
                  src="/Wayfare_favicon.jpeg" 
                  alt="Wayfare App Logo" 
                  className="w-full h-full object-cover rounded-[1.4rem] shadow-md"
                />
              </div>

              {/* Verified Badge Overlay */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5, type: 'spring', stiffness: 200 }}
                className="absolute -bottom-2 -right-2 bg-emerald-500 text-ink-950 p-2 rounded-full shadow-lg border-2 border-[#0B0E17]"
              >
                <ShieldCheck className="w-5 h-5 stroke-[2.5]" />
              </motion.div>
            </motion.div>

            {/* Brand Title & Tagline */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="space-y-2"
            >
              <h1 className="font-display text-4xl sm:text-5xl font-extrabold tracking-tight">
                <span className="bg-gradient-to-r from-white via-amber-200 to-amber-400 bg-clip-text text-transparent">
                  Wayfare
                </span>
                <span className="text-teal font-light">.</span>
              </h1>
              <p className="text-xs sm:text-sm text-ink-300 font-medium max-w-[260px] sm:max-w-xs mx-auto leading-relaxed">
                Your next ride, <span className="text-amber-400">already going your way.</span>
              </p>
            </motion.div>
          </div>

          {/* BOTTOM PROGRESS BAR & STATUS */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="w-full max-w-xs space-y-3 z-10 mb-4 text-center"
          >
            {/* Status text */}
            <div className="flex items-center justify-center gap-2 text-xs font-semibold text-ink-300">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" />
              <span>{statusText}</span>
            </div>

            {/* Progress Bar Container */}
            <div className="w-full h-2 rounded-full bg-ink-800/80 border border-ink-700/80 p-0.5 overflow-hidden shadow-inner">
              <motion.div 
                className="h-full rounded-full bg-gradient-to-r from-amber-500 via-amber-400 to-teal shadow-[0_0_12px_rgba(245,158,11,0.6)]"
                initial={{ width: '0%' }}
                animate={{ width: `${progress}%` }}
                transition={{ ease: 'easeOut', duration: 0.2 }}
              />
            </div>

            <div className="text-[10px] text-ink-400 font-mono tracking-wider">
              {progress}% COMPLETED
            </div>
          </motion.div>

        </motion.div>
      )}
    </AnimatePresence>
  )
}
