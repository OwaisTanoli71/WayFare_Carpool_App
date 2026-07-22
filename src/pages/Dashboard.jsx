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

  useEffect(() => {
    async function fetchUpcoming() {
      if (!user) return
      
      // If user is driver, fetch their posted ride
      const { data, error } = await supabase
        .from('rides')
        .select(`*, driver:users(name, avatar, verified)`)
        .eq('driver_id', user.id)
        .eq('status', 'open')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()
      
      if (data) setUpcomingRide(data)
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
            <Calendar size={18} className="text-warning" /> Your upcoming ride
          </span>
          <button className="panel-link">View all</button>
        </div>
        {upcomingRide ? (
          <div 
            className="ride-card" 
            onClick={() => navigate(`/ride/${upcomingRide.id}`)} 
            style={{ cursor: 'pointer', transition: 'all 0.3s ease', borderRadius: '16px', border: '1px solid #252B31' }}
            onMouseEnter={e => { e.currentTarget.style.background = '#20262C'; e.currentTarget.style.borderColor = '#363F47'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = '#252B31'; }}
          >
            <div className="ride-route">
              <div className="route-line">{upcomingRide.from_location} &rarr; {upcomingRide.to_location}</div>
              <div className="route-track2">
                <div className="dash teal"></div><div className="dash teal"></div><div className="dash teal"></div><div className="dash teal"></div>
                <div className="dash teal"></div><div className="dash dim"></div><div className="dash dim"></div><div className="dash dim"></div>
              </div>
              <div className="route-meta">{new Date(upcomingRide.date).toLocaleDateString()} &middot; with you &middot; {upcomingRide.seats} seats</div>
            </div>
            <span className="ride-status" style={{ background: 'rgba(79, 189, 186, 0.1)', color: '#4FBDBA', padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 600 }}>Open</span>
          </div>
        ) : (
          <div style={{ padding: '40px 20px', color: '#8B9298', textAlign: 'center', background: '#1B2025', borderRadius: '16px', border: '1px dashed #252B31' }}>
            No upcoming rides scheduled.
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
