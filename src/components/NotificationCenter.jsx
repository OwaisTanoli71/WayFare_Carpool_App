import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useApp } from '../context/AppContext'

export default function NotificationCenter() {
  const { user } = useApp()
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const panelRef = useRef(null)

  useEffect(() => {
    if (!user) return

    // Fetch initial notifications
    const fetchNotifications = async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20)

      if (data && !error) {
        setNotifications(data)
        setUnreadCount(data.filter(n => !n.read).length)
      }
    }

    fetchNotifications()

    // Subscribe to realtime updates
    const channel = supabase
      .channel('public:notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        (payload) => {
          setNotifications(prev => [payload.new, ...prev])
          setUnreadCount(prev => prev + 1)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user])

  // Handle outside click to close
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    if (isOpen) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  const handleNotificationClick = async (notification) => {
    // Mark as read
    if (!notification.read) {
      await supabase.from('notifications').update({ read: true }).eq('id', notification.id)
      setNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, read: true } : n))
      setUnreadCount(prev => Math.max(0, prev - 1))
    }
    
    setIsOpen(false)
    if (notification.link) {
      navigate(notification.link)
    }
  }

  const markAllRead = async () => {
    if (unreadCount === 0) return
    await supabase.from('notifications').update({ read: true }).eq('user_id', user.id).eq('read', false)
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    setUnreadCount(0)
  }

  if (!user) return null

  return (
    <div className="relative" ref={panelRef}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="icon-btn"
      >
        <svg viewBox="0 0 24 24">
          <path d="M6 9a6 6 0 1 1 12 0c0 5 2 6 2 6H4s2-1 2-6"/>
          <path d="M10 20a2 2 0 0 0 4 0"/>
        </svg>
        {unreadCount > 0 && <span className="dot"></span>}
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-12 z-50 w-80 sm:w-96 overflow-hidden rounded-2xl border border-ink-700 bg-ink-800 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-ink-700 bg-ink-900/50 px-4 py-3">
              <h3 className="font-display font-medium text-white">Notifications</h3>
              {unreadCount > 0 && (
                <button onClick={markAllRead} className="text-xs text-beacon hover:text-white transition-colors">
                  Mark all read
                </button>
              )}
            </div>
            
            <div className="max-h-[400px] overflow-y-auto overscroll-contain">
              {notifications.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <span className="text-3xl text-ink-600 mb-2 block">📭</span>
                  <p className="text-sm text-ink-300">No notifications yet</p>
                </div>
              ) : (
                <div className="divide-y divide-ink-700/50">
                  {notifications.map((n) => (
                    <button
                      key={n.id}
                      onClick={() => handleNotificationClick(n)}
                      className={`w-full text-left flex items-start gap-3 px-4 py-3 transition-colors hover:bg-ink-700/50 ${!n.read ? 'bg-ink-800/80' : ''}`}
                    >
                      {!n.read && <div className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-beacon shadow-[0_0_8px_rgba(255,178,56,0.5)]" />}
                      <div className={`flex-1 ${n.read ? 'pl-4.5' : ''}`}>
                        <p className={`text-sm ${!n.read ? 'font-medium text-white' : 'text-ink-100'}`}>{n.title}</p>
                        <p className="mt-0.5 text-xs text-ink-300 line-clamp-2">{n.body}</p>
                        <p className="mt-1 text-[10px] text-ink-400">
                          {new Date(n.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            <div className="border-t border-ink-700 bg-ink-900/50 px-4 py-2 text-center">
              <button className="text-[11px] font-medium text-ink-400 hover:text-white transition-colors">
                View notification settings
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
