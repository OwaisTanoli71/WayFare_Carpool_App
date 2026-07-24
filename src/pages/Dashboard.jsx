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
      
      let latestActive = null;

      if (postedRides && postedRides.length > 0) {
        const today = new Date();
        today.setHours(0,0,0,0);
        
        const activePosted = postedRides.filter(r => {
          if (['deleted', 'completed', 'cancelled'].includes(r.status)) return false;
          const rideDate = new Date(r.date);
          rideDate.setHours(0,0,0,0);
          return rideDate >= today;
        });

        if (activePosted.length > 0) {
          latestActive = activePosted[0];
          setDriverRides([latestActive]); // Only store the latest one
        } else {
          setDriverRides([]);
        }
      }

      if (latestActive) {
        setUpcomingRide(latestActive);
      } else {
        // 2. Fetch rides booked as passenger
        const { data: userBookings } = await supabase
          .from('bookings')
          .select(`ride_id, status, rides:rides(*, driver:users(name, avatar, verified))`)
          .eq('rider_id', user.id)
          .order('created_at', { ascending: false })
        
        if (userBookings && userBookings.length > 0) {
          const today = new Date();
          today.setHours(0,0,0,0);

          const activeBookings = userBookings.filter(b => {
            if (['deleted', 'completed', 'cancelled'].includes(b.status)) return false;
            const r = b.rides;
            if (!r || ['deleted', 'completed', 'cancelled'].includes(r.status)) return false;
            
            const rideDate = new Date(r.date);
            rideDate.setHours(0,0,0,0);
            return rideDate >= today;
          });

          if (activeBookings.length > 0) {
            setUpcomingRide(activeBookings[0].rides);
          } else {
            setUpcomingRide(null);
          }
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
                className="group relative overflow-hidden rounded-[1.5rem] bg-ink-800/40 border border-ink-700/60 hover:bg-ink-800/60 hover:border-amber-500/40 transition-all duration-300 shadow-sm hover:shadow-[0_0_20px_rgba(245,158,11,0.05)] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-5"
              >
                <div className="flex-1 space-y-3">
                  <div className="flex items-center justify-between sm:justify-start gap-4">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-amber-500/10 flex items-center justify-center border border-amber-500/20 text-amber-500">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                      </div>
                      <span className="text-base font-bold text-white tracking-wide font-display">{r.from_location} &rarr; {r.to_location}</span>
                    </div>
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                      r.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                      r.status === 'cancelled' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
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
                      <span className="text-[10px] uppercase text-ink-500 font-bold tracking-wider mb-0.5">Seats</span>
                      <span className="text-sm font-semibold text-white">{r.seats} left</span>
                    </div>
                    <div className="flex flex-col border-l border-ink-700/50 pl-3">
                      <span className="text-[10px] uppercase text-ink-500 font-bold tracking-wider mb-0.5">Date</span>
                      <span className="text-sm font-semibold text-white">{new Date(r.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric'})}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-row sm:flex-col items-center justify-end gap-2 sm:w-36 shrink-0 mt-1 sm:mt-0">
                  <button
                    onClick={() => navigate(`/ride/${r.id}`)}
                    className="w-full px-4 py-2.5 rounded-xl bg-amber-500 text-ink-900 font-bold text-sm shadow-[0_0_15px_rgba(245,158,11,0.2)] hover:shadow-[0_0_20px_rgba(245,158,11,0.4)] transition-all flex items-center justify-center gap-2 group-hover:-translate-y-0.5"
                  >
                    Manage Trip
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
