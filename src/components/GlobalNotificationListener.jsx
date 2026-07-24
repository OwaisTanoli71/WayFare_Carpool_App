import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useApp } from '../context/AppContext'
import { sendSystemNotification } from '../lib/pushNotifications'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'

export default function GlobalNotificationListener() {
  const { user } = useApp()
  const navigate = useNavigate()
  const [toasts, setToasts] = useState([])

  const addToast = (title, body, url) => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, title, body, url }])
    
    // Auto remove after 6 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 6000)
    
    // Try native notification as well
    sendSystemNotification({ title, body, url })
  }

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }

  const handleToastClick = (toast) => {
    removeToast(toast.id)
    if (toast.url) {
      navigate(toast.url)
    }
  }

  useEffect(() => {
    if (!user) return

    // 1. Listen for new bookings on rides where the current user is the driver
    const bookingsChannel = supabase.channel('global_bookings_listener')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'bookings' }, async (payload) => {
        const booking = payload.new
        if (booking.rider_id === user.id) return

        const { data: ride } = await supabase.from('rides').select('driver_id, from_location, to_location').eq('id', booking.ride_id).single()
        
        if (ride && ride.driver_id === user.id) {
          const { data: rider } = await supabase.from('users').select('name').eq('id', booking.rider_id).single()
          addToast(
            '🚗 New Booking Request!',
            `${rider?.name || 'A passenger'} requested a seat from ${ride.from_location} to ${ride.to_location}.`,
            `/ride/${ride.id}`
          )
        }
      })
      .subscribe()

    // 2. Listen for booking approvals for the current user
    const approvalsChannel = supabase.channel('global_approvals_listener')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'bookings' }, async (payload) => {
        const newBooking = payload.new
        const oldBooking = payload.old
        
        if (newBooking.rider_id === user.id && newBooking.status === 'approved' && oldBooking.status !== 'approved') {
          const { data: ride } = await supabase.from('rides').select('id, driver_id, to_location').eq('id', newBooking.ride_id).single()
          if (ride) {
            const { data: driver } = await supabase.from('users').select('name').eq('id', ride.driver_id).single()
            addToast(
              '✅ Ride Approved!',
              `${driver?.name || 'The driver'} accepted your request for the ride to ${ride.to_location}.`,
              `/ride/${ride.id}`
            )
          }
        }
      })
      .subscribe()

    // 3. Listen for new messages in chats
    const messagesChannel = supabase.channel('global_messages_listener')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, async (payload) => {
        const msg = payload.new
        if (msg.sender_id === user.id) return

        const { data: ride } = await supabase.from('rides').select('driver_id').eq('id', msg.ride_id).single()
        let amIInvolved = false
        
        if (ride && ride.driver_id === user.id) {
          amIInvolved = true
        } else {
          const { data: myBooking } = await supabase.from('bookings').select('id').eq('ride_id', msg.ride_id).eq('rider_id', user.id).single()
          if (myBooking) amIInvolved = true
        }

        if (amIInvolved && !window.location.pathname.includes('/chat')) {
          const { data: sender } = await supabase.from('users').select('name').eq('id', msg.sender_id).single()
          addToast(
            `💬 New Message from ${sender?.name || 'Someone'}`,
            msg.text.length > 50 ? msg.text.substring(0, 50) + '...' : msg.text,
            `/chat`
          )
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(bookingsChannel)
      supabase.removeChannel(approvalsChannel)
      supabase.removeChannel(messagesChannel)
    }
  }, [user])

  if (toasts.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 pointer-events-none w-full max-w-[340px] px-4 sm:px-0">
      <AnimatePresence>
        {toasts.map(toast => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
            className="pointer-events-auto bg-[#14181C]/95 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl cursor-pointer hover:bg-[#1A2026] hover:border-amber-500/30 transition-all flex items-start gap-4"
            onClick={() => handleToastClick(toast)}
            layout
          >
            <div className="flex-1 min-w-0">
              <h4 className="text-white font-bold text-sm mb-1">{toast.title}</h4>
              <p className="text-ink-400 text-xs leading-relaxed line-clamp-2">{toast.body}</p>
            </div>
            <button 
              onClick={(e) => { e.stopPropagation(); removeToast(toast.id) }}
              className="text-ink-500 hover:text-white transition-colors shrink-0 p-1 -mr-2 -mt-2 bg-transparent border-none"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
