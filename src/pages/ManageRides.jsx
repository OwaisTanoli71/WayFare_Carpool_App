import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useApp } from '../context/AppContext'
import { supabase } from '../lib/supabase'

export default function ManageRides() {
  const navigate = useNavigate()
  const { user } = useApp()
  const [rides, setRides] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchDriverRides() {
      if (!user) return
      
      const { data, error } = await supabase
        .from('rides')
        .select(`*`)
        .eq('driver_id', user.id)
        .order('created_at', { ascending: false })
      
      if (!error && data) {
        setRides(data)
      }
      setLoading(false)
    }
    
    fetchDriverRides()
  }, [user])

  if (loading) {
    return <div className="p-8 text-center text-ink-400">Loading your ride offers...</div>
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-4xl mx-auto pb-20"
    >
      {rides.length === 0 ? (
        <div className="bg-ink-900 border border-ink-800 rounded-3xl p-12 text-center">
          <div className="w-20 h-20 bg-ink-800 rounded-full flex items-center justify-center mx-auto mb-6 text-ink-400">
            <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
          </div>
          <h3 className="text-xl font-bold text-white mb-2">No active ride offers</h3>
          <p className="text-ink-300 mb-8 max-w-sm mx-auto">You haven't posted any rides yet. Share your journey and start earning!</p>
          <button 
            onClick={() => navigate('/post-ride')}
            className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-ink-950 font-bold transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)]"
          >
            Offer a Ride
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {rides.map(r => (
            <div 
              key={r.id}
              onClick={() => navigate(`/ride/${r.id}`)}
              className="cursor-pointer group relative overflow-hidden rounded-[1.5rem] bg-ink-800/40 border border-ink-700/60 hover:bg-ink-800/60 hover:border-amber-500/40 transition-all duration-300 shadow-sm hover:shadow-[0_0_20px_rgba(245,158,11,0.05)] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-5"
            >
              <div className="flex-1 space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 text-emerald-500">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                    </div>
                    <div>
                      <span className="text-base font-bold text-white tracking-wide font-display block">
                        {r.from_location} &rarr; {r.to_location}
                      </span>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider shrink-0 ${
                    r.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                    r.status === 'deleted' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 
                    'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  }`}>
                    {r.status || 'open'}
                  </span>
                </div>
                
                <div className="grid grid-cols-3 gap-2 bg-ink-900/50 rounded-xl p-3 border border-ink-800/50">
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase text-ink-500 font-bold tracking-wider mb-0.5">Fare</span>
                    <span className="text-sm font-semibold text-amber-400">Rs {r.price}</span>
                  </div>
                  <div className="flex flex-col border-l border-ink-700/50 pl-3">
                    <span className="text-[10px] uppercase text-ink-500 font-bold tracking-wider mb-0.5">Date</span>
                    <span className="text-sm font-semibold text-white">{new Date(r.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric'})}</span>
                  </div>
                  <div className="flex flex-col border-l border-ink-700/50 pl-3">
                    <span className="text-[10px] uppercase text-ink-500 font-bold tracking-wider mb-0.5">Seats</span>
                    <span className="text-sm font-semibold text-white">{r.seats} left</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end">
                <svg className="w-6 h-6 text-ink-500 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
