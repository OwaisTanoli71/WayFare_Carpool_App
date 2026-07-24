import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useApp } from '../context/AppContext'
import { supabase } from '../lib/supabase'

export default function MyRides() {
  const navigate = useNavigate()
  const { user } = useApp()
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('all') // all, pending, progress, completed

  useEffect(() => {
    async function fetchMyRides() {
      if (!user) return
      
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          id, status, created_at,
          ride:rides (*, driver:users(name, avatar, verified))
        `)
        .eq('rider_id', user.id)
        .order('created_at', { ascending: false })
      
      if (!error && data) {
        setBookings(data)
      }
      setLoading(false)
    }
    
    fetchMyRides()
  }, [user])

  const filteredBookings = bookings.filter(b => {
    if (activeTab === 'all') return true
    if (activeTab === 'pending') return b.status === 'pending'
    if (activeTab === 'progress') return ['approved', 'starting', 'verified'].includes(b.status)
    if (activeTab === 'completed') return b.status === 'completed'
    return true
  })

  if (loading) {
    return <div className="p-8 text-center text-ink-400">Loading your rides...</div>
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-4xl mx-auto pb-20"
    >
      {/* Tabs */}
      {bookings.length > 0 && (
        <div className="flex overflow-x-auto hide-scrollbar gap-2 mb-6 pb-2">
          {['all', 'pending', 'progress', 'completed'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${
                activeTab === tab 
                  ? 'bg-amber-500 text-ink-950 shadow-[0_0_15px_rgba(245,158,11,0.3)]' 
                  : 'bg-ink-800 text-ink-400 hover:text-white hover:bg-ink-700'
              }`}
            >
              {tab === 'all' ? 'All Rides' : 
               tab === 'pending' ? 'Waiting Approval' : 
               tab === 'progress' ? 'In Progress' : 'Completed'}
            </button>
          ))}
        </div>
      )}

      {filteredBookings.length === 0 ? (
        <div className="bg-ink-900 border border-ink-800 rounded-3xl p-12 text-center">
          <div className="w-20 h-20 bg-ink-800 rounded-full flex items-center justify-center mx-auto mb-6 text-ink-400">
            <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          </div>
          <h3 className="text-xl font-bold text-white mb-2">No rides booked yet</h3>
          <p className="text-ink-300 mb-8 max-w-sm mx-auto">You haven't booked any rides as a passenger yet. Ready to hit the road?</p>
          <button 
            onClick={() => navigate('/find-ride')}
            className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-ink-950 font-bold transition-all shadow-[0_0_20px_rgba(245,158,11,0.2)]"
          >
            Find a Ride
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBookings.map(booking => (
            <div 
              key={booking.id}
              onClick={() => navigate(`/ride/${booking.ride.id}`)}
              className="cursor-pointer group relative overflow-hidden rounded-[1.5rem] bg-ink-800/40 border border-ink-700/60 hover:bg-ink-800/60 hover:border-amber-500/40 transition-all duration-300 shadow-sm hover:shadow-[0_0_20px_rgba(245,158,11,0.05)] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-5"
            >
              <div className="flex-1 space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-amber-500/10 flex items-center justify-center border border-amber-500/20 text-amber-500 font-bold text-lg font-display">
                      {booking.ride.driver?.name?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <span className="text-base font-bold text-white tracking-wide font-display block">
                        {booking.ride.from_location} &rarr; {booking.ride.to_location}
                      </span>
                      <span className="text-xs text-ink-400">Driver: {booking.ride.driver?.name || 'Unknown'}</span>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider shrink-0 ${
                    booking.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                    booking.status === 'cancelled' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 
                    booking.status === 'approved' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                    'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  }`}>
                    {booking.status}
                  </span>
                </div>
                
                <div className="grid grid-cols-3 gap-2 bg-ink-900/50 rounded-xl p-3 border border-ink-800/50">
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase text-ink-500 font-bold tracking-wider mb-0.5">Fare</span>
                    <span className="text-sm font-semibold text-amber-400">Rs {booking.ride.price}</span>
                  </div>
                  <div className="flex flex-col border-l border-ink-700/50 pl-3">
                    <span className="text-[10px] uppercase text-ink-500 font-bold tracking-wider mb-0.5">Date</span>
                    <span className="text-sm font-semibold text-white">{new Date(booking.ride.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric'})}</span>
                  </div>
                  <div className="flex flex-col border-l border-ink-700/50 pl-3">
                    <span className="text-[10px] uppercase text-ink-500 font-bold tracking-wider mb-0.5">Booked On</span>
                    <span className="text-sm font-semibold text-white">{new Date(booking.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric'})}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end">
                <svg className="w-6 h-6 text-ink-500 group-hover:text-amber-500 group-hover:translate-x-1 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  )
}
