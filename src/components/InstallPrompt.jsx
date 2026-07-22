import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Button from './Button'

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [showPrompt, setShowPrompt] = useState(false)

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault()
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e)
      
      // Check if user has completed a booking or is engaged
      // We don't want to show it immediately on first visit
      const hasEngaged = localStorage.getItem('wayfare_engaged') === 'true'
      if (hasEngaged) {
        setShowPrompt(true)
      }
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    // Mark engaged after 30 seconds as a fallback if they don't explicitly do an action
    const timer = setTimeout(() => {
      localStorage.setItem('wayfare_engaged', 'true')
      if (deferredPrompt) setShowPrompt(true)
    }, 30000)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      clearTimeout(timer)
    }
  }, [deferredPrompt])

  const handleInstall = async () => {
    if (!deferredPrompt) return
    
    // Show the install prompt
    deferredPrompt.prompt()
    
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice
    
    if (outcome === 'accepted') {
      setDeferredPrompt(null)
      setShowPrompt(false)
    }
  }

  if (!showPrompt) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        className="fixed bottom-24 sm:bottom-6 left-4 right-4 z-[95] mx-auto max-w-sm rounded-2xl border border-amber-500/30 bg-[#141824]/95 p-4 shadow-[0_10px_40px_rgba(0,0,0,0.6)] backdrop-blur-xl"
      >
        <div className="flex items-start gap-4">
          <img src="/Wayfare_favicon.jpeg" alt="Wayfare" className="h-12 w-12 rounded-xl object-cover shadow-sm" />
          <div className="flex-1">
            <h3 className="font-display text-sm font-medium text-white">Install Wayfare</h3>
            <p className="mt-0.5 text-xs text-ink-300">Add to your home screen for a faster, app-like experience.</p>
            <div className="mt-3 flex gap-2">
              <Button variant="secondary" className="flex-1 py-1.5 text-xs" onClick={() => setShowPrompt(false)}>Later</Button>
              <Button variant="primary" className="flex-1 py-1.5 text-xs" onClick={handleInstall}>Install</Button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
