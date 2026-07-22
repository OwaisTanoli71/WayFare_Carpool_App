import { useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useApp } from '../context/AppContext'

const INACTIVITY_LIMIT_MS = 5 * 60 * 1000 // 5 minutes in milliseconds

export default function InactivityTracker() {
  const { user, logout } = useApp()
  const navigate = useNavigate()
  const location = useLocation()
  const timerRef = useRef(null)

  useEffect(() => {
    // Only track inactivity if a user is actively authenticated
    if (!user) return

    // Exempt public or auth routes from triggering timeout
    const publicRoutes = ['/session-timeout', '/login', '/reset-password', '/']
    if (publicRoutes.includes(location.pathname)) return

    const resetTimer = () => {
      if (timerRef.current) clearTimeout(timerRef.current)

      timerRef.current = setTimeout(async () => {
        console.warn('User idle for 5 minutes. Triggering security logout...')
        await logout()
        navigate('/session-timeout', { replace: true })
      }, INACTIVITY_LIMIT_MS)
    }

    // Events to monitor for user activity
    const activityEvents = [
      'mousemove',
      'keydown',
      'click',
      'scroll',
      'touchstart',
      'pointerdown'
    ]

    // Start timer on mount
    resetTimer()

    // Attach activity listeners
    activityEvents.forEach((evt) => {
      window.addEventListener(evt, resetTimer, { passive: true })
    })

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      activityEvents.forEach((evt) => {
        window.removeEventListener(evt, resetTimer)
      })
    }
  }, [user, location.pathname, logout, navigate])

  return null
}
