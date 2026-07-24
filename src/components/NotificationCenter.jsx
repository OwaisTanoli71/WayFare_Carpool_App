import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useApp } from '../context/AppContext'
import { Bell, MessageCircle, Car, CheckCircle2, ChevronRight, X } from 'lucide-react'

export default function NotificationCenter() {
  const { user } = useApp()
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const panelRef = useRef(null)

  const fetchNotifications = async () => {
    if (!user) return
    setLoading(true)
    try {
      const notifs = []
      
      // 1. Pending bookings on my rides (I am driver)
      const { data: myRides } = await supabase.from('rides').select('id, from_location, to_location').eq('driver_id', user.id)
      const myRideIds = myRides?.map(r => r.id) || []
      
      if (myRideIds.length > 0) {
        const { data: pendingBookings } = await supabase
          .from('bookings')
          .select('id, created_at, ride_id, users!bookings_rider_id_fkey(name)')
          .in('ride_id', myRideIds)
          .eq('status', 'pending')
          .order('created_at', { ascending: false })
          .limit(5)
        
        pendingBookings?.forEach(b => {
          const ride = myRides.find(r => r.id === b.ride_id)
          notifs.push({
            id: `booking-${b.id}`,
            type: 'booking_request',
            title: 'New Ride Request',
            body: `${b.users?.name || 'A passenger'} requested a seat to ${ride?.to_location}.`,
            time: b.created_at,
            link: `/ride/${b.ride_id}`,
            read: false
          })
        })
      }

      // 2. Approved bookings (I am rider)
      const { data: approvedBookings } = await supabase
        .from('bookings')
        .select('id, updated_at, ride_id, rides(to_location)')
        .eq('rider_id', user.id)
        .eq('status', 'approved')
        .order('updated_at', { ascending: false })
        .limit(3)
      
      approvedBookings?.forEach(b => {
        notifs.push({
          id: `approved-${b.id}`,
          type: 'booking_approved',
          title: 'Ride Approved!',
          body: `Your request to join the ride to ${b.rides?.to_location} was accepted.`,
          time: b.updated_at,
          link: `/ride/${b.ride_id}`,
          read: true // Consider approved as read, but show it for history
        })
      })

      // Sort by time
      notifs.sort((a, b) => new Date(b.time) - new Date(a.time))
      setNotifications(notifs)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      fetchNotifications()
    }
  }, [isOpen, user])

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

  const handleNotificationClick = (n) => {
    setIsOpen(false)
    if (n.link) navigate(n.link)
  }

  const unreadCount = notifications.filter(n => !n.read).length

  if (!user) return null

  return (
    <div className="relative" ref={panelRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex items-center justify-center w-10 h-10 md:w-11 md:h-11 rounded-full text-ink-300 hover:text-white hover:bg-ink-700/50 transition-all border border-transparent hover:border-ink-600 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
      >
        <Bell size={20} className={unreadCount > 0 ? 'text-white' : ''} />
        {unreadCount > 0 && (
          <span className="absolute top-2 right-2.5 w-2.5 h-2.5 bg-amber-500 rounded-full border-2 border-ink-900 shadow-[0_0_10px_rgba(245,158,11,0.6)] animate-pulse" />
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute right-0 top-14 z-50 w-[340px] sm:w-[380px] overflow-hidden rounded-3xl border border-white/10 bg-[#14181C]/95 backdrop-blur-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.7)]"
          >
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4 bg-gradient-to-r from-white/5 to-transparent">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                  <Bell size={16} className="text-amber-500" />
                </div>
                <h3 className="font-display font-bold text-white text-base">Notifications</h3>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-ink-400 hover:text-white transition-colors bg-ink-800/50 p-1.5 rounded-full hover:bg-ink-700">
                <X size={16} />
              </button>
            </div>
            
            <div className="max-h-[420px] overflow-y-auto custom-scrollbar">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-3">
                  <div className="w-8 h-8 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin"></div>
                  <p className="text-sm text-ink-400 font-medium">Loading updates...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="px-6 py-12 flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-full bg-ink-800/50 border border-ink-700/50 flex items-center justify-center mb-4">
                    <Bell size={28} className="text-ink-500" />
                  </div>
                  <h4 className="text-white font-bold text-lg mb-1">You're all caught up!</h4>
                  <p className="text-sm text-ink-400">When passengers request rides or you receive approvals, they'll appear here.</p>
                </div>
              ) : (
                <div className="flex flex-col">
                  {notifications.map((n, i) => (
                    <button
                      key={n.id}
                      onClick={() => handleNotificationClick(n)}
                      className={`w-full text-left flex items-start gap-3.5 px-5 py-4 transition-all hover:bg-white/5 group border-b border-white/5 last:border-0 ${!n.read ? 'bg-amber-500/[0.02]' : ''}`}
                    >
                      <div className={`mt-0.5 w-10 h-10 rounded-full flex items-center justify-center shrink-0 border shadow-sm ${
                        n.type === 'booking_request' ? 'bg-[#FFB238]/10 border-[#FFB238]/20 text-[#FFB238]' :
                        n.type === 'booking_approved' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                        'bg-blue-500/10 border-blue-500/20 text-blue-400'
                      }`}>
                        {n.type === 'booking_request' && <Car size={18} />}
                        {n.type === 'booking_approved' && <CheckCircle2 size={18} />}
                        {n.type === 'message' && <MessageCircle size={18} />}
                      </div>
                      
                      <div className="flex-1 min-w-0 pr-2">
                        <div className="flex justify-between items-start mb-0.5">
                          <p className={`text-sm tracking-wide truncate pr-2 ${!n.read ? 'font-bold text-white' : 'font-semibold text-ink-100'}`}>
                            {n.title}
                          </p>
                          <span className="text-[10px] font-medium text-ink-500 shrink-0 mt-0.5">
                            {new Date(n.time).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                        <p className={`text-[13px] leading-relaxed line-clamp-2 ${!n.read ? 'text-ink-200' : 'text-ink-400'}`}>
                          {n.body}
                        </p>
                      </div>

                      <div className="shrink-0 mt-2 text-ink-600 group-hover:text-amber-500 transition-colors group-hover:translate-x-1 duration-300">
                        <ChevronRight size={16} />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            <div className="border-t border-white/10 bg-[#1A2026] p-3 text-center">
              <button 
                onClick={() => setIsOpen(false)}
                className="text-xs font-bold tracking-wide text-ink-400 hover:text-white transition-colors uppercase"
              >
                Close panel
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
