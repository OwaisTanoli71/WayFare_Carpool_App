import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useApp } from '../context/AppContext'

export default function PermissionsPrompt() {
  const { user } = useApp()
  const [show, setShow] = useState(false)
  const [needsNotification, setNeedsNotification] = useState(false)
  const [needsLocation, setNeedsLocation] = useState(false)

  useEffect(() => {
    if (!user) return
    if (localStorage.getItem('wayfare_permissions_asked') === 'true') return

    const checkPermissions = async () => {
      let notif = false
      let loc = false

      if ('Notification' in window && Notification.permission === 'default') {
        notif = true
      }

      try {
        if ('permissions' in navigator) {
          const locPerm = await navigator.permissions.query({ name: 'geolocation' })
          if (locPerm.state === 'prompt') loc = true
        } else {
          loc = true
        }
      } catch (e) {
        loc = true
      }

      if (notif || loc) {
        setNeedsNotification(notif)
        setNeedsLocation(loc)
        setTimeout(() => setShow(true), 1500)
      }
    }
    
    checkPermissions()
  }, [user])

  const handleGrant = async () => {
    if (needsNotification && 'Notification' in window) {
      await Notification.requestPermission()
    }
    
    if (needsLocation && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        () => {}, 
        () => {}, 
        { timeout: 5000 }
      )
    }
    
    localStorage.setItem('wayfare_permissions_asked', 'true')
    setShow(false)
  }

  const handleSkip = () => {
    localStorage.setItem('wayfare_permissions_asked', 'true')
    setShow(false)
  }

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-950/80 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            transition={{ type: "spring", bounce: 0.4 }}
            className="w-full max-w-sm bg-ink-900 border border-ink-700/50 rounded-[32px] p-6 shadow-2xl relative overflow-hidden"
          >
            {/* Glossy Gradient Background */}
            <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-amber-500/20 to-transparent pointer-events-none" />

            <div className="relative flex flex-col items-center text-center mt-2">
              <div className="w-16 h-16 bg-gradient-to-tr from-amber-500 to-amber-300 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/20 mb-6 relative">
                {/* Ping animation behind icon */}
                <span className="absolute inline-flex w-full h-full rounded-2xl bg-amber-400 opacity-30 animate-ping" />
                <svg className="w-8 h-8 text-white relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>

              <h2 className="text-2xl font-bold text-white mb-2 font-display">Stay in the Loop</h2>
              <p className="text-sm text-ink-300 mb-6 leading-relaxed">
                We need a couple of permissions to ensure your ride goes smoothly. We promise not to spam you!
              </p>

              <div className="w-full space-y-3 mb-8">
                {needsNotification && (
                  <div className="flex items-center gap-4 bg-ink-800/50 p-4 rounded-2xl border border-ink-700/50">
                    <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                    </div>
                    <div className="text-left flex-1">
                      <p className="text-sm font-bold text-white">Push Notifications</p>
                      <p className="text-xs text-ink-400">Get alerts for ride approvals and chats.</p>
                    </div>
                  </div>
                )}

                {needsLocation && (
                  <div className="flex items-center gap-4 bg-ink-800/50 p-4 rounded-2xl border border-ink-700/50">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    </div>
                    <div className="text-left flex-1">
                      <p className="text-sm font-bold text-white">Location Services</p>
                      <p className="text-xs text-ink-400">Easily find rides matching your exact route.</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="w-full flex flex-col gap-3">
                <button 
                  onClick={handleGrant}
                  className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-ink-950 font-bold tracking-wide transition-all shadow-[0_0_20px_rgba(245,158,11,0.3)] active:scale-95"
                >
                  Enable Permissions
                </button>
                <button 
                  onClick={handleSkip}
                  className="w-full py-3 rounded-xl bg-transparent text-ink-400 font-medium hover:text-white transition-all"
                >
                  Maybe Later
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
