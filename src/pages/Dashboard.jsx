import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { supabase } from '../lib/supabase'
import DashboardAnalytics from '../components/DashboardAnalytics'
import { motion } from 'framer-motion'
import { MapPin, CarFront, Calendar, Clock, ArrowRight } from 'lucide-react'

export default function Dashboard() {
  const navigate = useNavigate()
  const { user } = useApp()
  const [upcomingRide, setUpcomingRide] = useState(null)

  const [driverRides, setDriverRides] = useState([])

  useEffect(() => {
    async function fetchUpcoming() {
      if (!user) return
      
      // 1. Fetch rides posted by this driver
      const { data: postedRides } = await supabase
        .from('rides')
        .select(`*, driver:users(name, avatar, verified)`)
        .eq('driver_id', user.id)
        .order('created_at', { ascending: false })
      
      if (postedRides && postedRides.length > 0) {
        setDriverRides(postedRides)
        setUpcomingRide(postedRides[0])
      } else {
        // 2. Fetch rides booked as passenger
        const { data: userBookings } = await supabase
          .from('bookings')
          .select(`ride_id, rides:rides(*, driver:users(name, avatar, verified))`)
          .eq('rider_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
        
        if (userBookings && userBookings.length > 0) {
          setUpcomingRide(userBookings[0].rides)
        }
      }
    }
    fetchUpcoming()
  }, [user])

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {(user?.role === 'driver' || user?.role === 'both') && (
        <div style={{ marginBottom: '24px' }}>
          <DashboardAnalytics />
        </div>
      )}

      <div className="quick-actions" style={{ marginBottom: '32px' }}>
        {(user?.role === 'driver' || user?.role === 'both') && (
          <button 
            className="qa-card primary" 
            onClick={() => navigate('/post-ride')}
            style={{ position: 'relative', overflow: 'hidden' }}
          >
            <div style={{ position: 'absolute', right: '-10px', bottom: '-20px', opacity: 0.1 }}>
              <CarFront size={120} />
            </div>
            <span className="qa-eyebrow" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CarFront size={14} /> Driving today?
            </span>
            <span className="qa-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              Offer a ride <ArrowRight size={18} />
            </span>
            <span className="qa-sub">Post your route in under a minute</span>
          </button>
        )}
        <button 
          className={`qa-card ${user?.role === 'rider' ? 'primary' : 'secondary'}`} 
          onClick={() => navigate('/find-ride')}
          style={{ position: 'relative', overflow: 'hidden' }}
        >
          <div style={{ position: 'absolute', right: '-10px', bottom: '-20px', opacity: 0.1 }}>
            <MapPin size={120} />
          </div>
          <span className="qa-eyebrow" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <MapPin size={14} /> Need to get somewhere?
          </span>
          <span className="qa-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            Find a ride <ArrowRight size={18} />
          </span>
          <span className="qa-sub">Browse matched drivers near you</span>
        </button>
      </div>

      <section className="panel" style={{ marginBottom: '32px' }}>
        <div className="panel-head">
          <span className="panel-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={18} className="text-warning" /> Your Rides & Trip Offers ({driverRides.length > 0 ? driverRides.length : (upcomingRide ? 1 : 0)})
          </span>
          <button onClick={() => navigate('/find-ride')} className="panel-link">View all</button>
        </div>

        {driverRides.length > 0 ? (
          <div className="space-y-3">
            {driverRides.map(r => (
              <div 
                key={r.id}
                className="p-4 rounded-2xl bg-[#1B2025] border border-[#252B31] flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-amber-500/30 transition-all"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white font-display">{r.from_location} &rarr; {r.to_location}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      r.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' :
                      r.status === 'cancelled' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'
                    }`}>
                      {r.status || 'open'}
                    </span>
                  </div>
                  <div className="text-xs text-ink-400 flex items-center gap-3">
                    <span>Fare: <strong className="text-amber-400">Rs {r.price}</strong></span>
                    <span>•</span>
                    <span>Seats: <strong>{r.seats} available</strong></span>
                    <span>•</span>
                    <span>Date: {new Date(r.date).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => navigate(`/ride/${r.id}`)}
                    className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/30 text-xs font-bold transition-all"
                  >
                    🚗 Manage Trip
                  </button>
                  <button
                    onClick={() => navigate('/chat')}
                    className="px-3 py-1.5 rounded-xl bg-ink-800 hover:bg-ink-700 text-white border border-ink-700 text-xs font-bold transition-all"
                  >
                    💬 Chat
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : upcomingRide ? (
          <div 
            className="ride-card" 
            onClick={() => navigate(`/ride/${upcomingRide.id}`)} 
            style={{ cursor: 'pointer', transition: 'all 0.3s ease', borderRadius: '16px', border: '1px solid #252B31' }}
          >
            <div className="ride-route">
              <div className="route-line">{upcomingRide.from_location} &rarr; {upcomingRide.to_location}</div>
              <div className="route-meta">{new Date(upcomingRide.date).toLocaleDateString()} &middot; with you &middot; {upcomingRide.seats} seats</div>
            </div>
            <span className="ride-status" style={{ background: 'rgba(79, 189, 186, 0.1)', color: '#4FBDBA', padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 600 }}>Open</span>
          </div>
        ) : (
          <div style={{ padding: '30px 20px', color: '#8B9298', textAlign: 'center', background: '#1B2025', borderRadius: '16px', border: '1px dashed #252B31' }}>
            No rides posted yet. Tap <strong>Offer a ride</strong> above to post your route!
          </div>
        )}
      </section>

      <section className="panel" style={{ marginBottom: '32px' }}>
        <div className="panel-head">
          <span className="panel-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Clock size={18} className="text-blue-400" /> Recent activity
          </span>
          <button className="panel-link">View all</button>
        </div>
        <div style={{ padding: '40px 20px', color: '#8B9298', textAlign: 'center', background: '#1B2025', borderRadius: '16px', border: '1px dashed #252B31' }}>
          No recent activity yet.
        </div>
      </section>

      <div className="safety-strip" style={{ borderRadius: '16px' }}>
        <div className="txt"><b>Your Ride Circle is empty.</b> Add drivers you trust so we can notify them if you ever trigger an SOS.</div>
        <button className="safety-cta" onClick={() => navigate('/circles')}>Add contact</button>
      </div>
    </motion.div>
  )
}
