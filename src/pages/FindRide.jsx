import { useState, useMemo, useEffect } from 'react'
import RouteSelector from '../components/RouteSelector'
import Dropdown from '../components/Dropdown'
import { INTERCITY_ROUTES } from '../data/routes'
import { useApp } from '../context/AppContext'
import { supabase } from '../lib/supabase'

const tabs = [
  { id: 'all', label: 'All rides' },
  { id: 'in-city', label: 'In-city' },
  { id: 'out-city', label: 'Intercity' }
]

const genderOptions = ['Any', 'Male only', 'Female only']

export default function FindRide() {
  const { user } = useApp()
  const [tab, setTab] = useState('all')
  const [query, setQuery] = useState('')
  const [genderPref, setGenderPref] = useState('Any')
  const [city, setCity] = useState('Islamabad')
  const [dbRides, setDbRides] = useState([])

  useEffect(() => {
    setQuery('')
  }, [tab])

  // Fetch from Supabase and Subscribe to Realtime Changes
  useEffect(() => {
    const fetchRides = async () => {
      const { data, error } = await supabase
        .from('rides')
        .select(`
          *,
          driver:users(name, avatar, verified, role, gender)
        `)
        .eq('status', 'open')
        .order('created_at', { ascending: false })
        
      if (data) {
        setDbRides(data)
      } else if (error) {
        console.error("Error fetching rides:", error)
      }
    }

    fetchRides()

    const channel = supabase.channel('realtime_rides')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rides' }, (payload) => {
        fetchRides() // Refetch on any change to keep driver joins accurate
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const rides = useMemo(() => {
    const circles = JSON.parse(localStorage.getItem('wayfare_circles') || '[]').map(c => c.name)
    const filtered = dbRides.filter((r) => {
      // 1. Strict Auth Gender Filtering (Hide restricted rides)
      let matchesAuthGender = true
      if (user?.gender) {
        if (r.gender_pref === 'female_only' && user.gender !== 'female') matchesAuthGender = false
        if (r.gender_pref === 'male_only' && user.gender !== 'male') matchesAuthGender = false
      }
      
      // Filter out dummy/mock data
      if (r.driver?.name?.includes('Mock')) return false


      // 2. User Search Filters
      const matchesTab = tab === 'all' || r.type === tab
      const matchesQuery = !query || r.from_location?.toLowerCase().includes(query.toLowerCase()) || r.to_location?.toLowerCase().includes(query.toLowerCase())
      
      const prefMap = { 'Any': 'any', 'Female only': 'female_only', 'Male only': 'male_only' }
      const matchesGenderToggle = genderPref === 'Any' || r.gender_pref === prefMap[genderPref]
      
      return matchesAuthGender && matchesTab && matchesQuery && matchesGenderToggle
    })
    
    return filtered.sort((a, b) => {
      const aInCircle = circles.includes(a.driver?.name)
      const bInCircle = circles.includes(b.driver?.name)
      if (aInCircle && !bInCircle) return -1
      if (!aInCircle && bInCircle) return 1
      return 0
    })
  }, [tab, query, genderPref, user, dbRides])

  return (
    <>
      <section className="panel">
        <div className="panel-head"><span className="panel-title">Search Rides</span></div>
        <div className="form-grid">
          {tab === 'in-city' && (
            <div style={{ gridColumn: '1 / -1' }}>
              <Dropdown label="City" value={city} options={INTERCITY_ROUTES} onChange={setCity} />
            </div>
          )}
          <div style={{ gridColumn: '1 / -1' }}>
            <RouteSelector 
              label={tab === 'in-city' ? "Pickup/Dropoff Area" : "Destination, city, or area"} 
              placeholder={tab === 'in-city' ? "e.g. F-11 Markaz" : "e.g. Lahore"}
              value={query}
              onChange={setQuery}
              type={tab === 'in-city' ? 'in-city' : 'intercity'}
            />
          </div>
        </div>
        
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', marginTop: '24px' }}>
          <div style={{ flex: '1 1 200px' }}>
            <div className="section-label" style={{ marginTop: '0', marginBottom: '10px' }}>Filter by type</div>
            <div className="seat-options">
              {tabs.map(t => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`pill ${tab === t.id ? 'selected' : ''}`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          
          <div style={{ flex: '1 1 200px' }}>
            <div className="section-label" style={{ marginTop: '0', marginBottom: '10px' }}>Gender preference</div>
            <div className="seat-options">
              {['Any', 'Male only', 'Female only'].map(pref => (
                <button
                  key={pref}
                  onClick={() => setGenderPref(pref)}
                  className={`pill ${genderPref === pref ? 'selected' : ''}`}
                >
                  {pref}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="panel-head">
          <span className="panel-title">Available Rides</span>
          <span style={{ fontSize: '12px', color: '#4FBDBA' }}>&bull; Live updates active</span>
        </div>
        
        {rides.length > 0 ? (
          rides.map((ride, i) => (
            <div 
              key={ride.id} 
              className="ride-card" 
              onClick={() => window.location.href = `/ride/${ride.id}`}
              style={{ 
                borderBottom: i < rides.length - 1 ? '1px solid #252B31' : 'none',
                cursor: 'pointer', transition: 'background 0.2s', borderRadius: '12px'
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#20262C'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <div className="avatar" style={{ marginRight: '10px' }}>{ride.driver?.name?.charAt(0) || 'U'}</div>
              <div className="ride-route">
                <div className="route-line">{ride.from_location} &rarr; {ride.to_location}</div>
                <div className="route-track2">
                  <div className="dash teal"></div><div className="dash teal"></div><div className="dash teal"></div><div className="dash teal"></div>
                  <div className="dash teal"></div><div className="dash dim"></div><div className="dash dim"></div><div className="dash dim"></div>
                </div>
                <div className="route-meta">{new Date(ride.date).toLocaleDateString()} &middot; with {ride.driver?.name || 'Unknown'} &middot; {ride.seats} seats available</div>
              </div>
              <span className="ride-status">Rs {ride.price}</span>
            </div>
          ))
        ) : (
          <div className="empty-state">
            <div className="empty-title">No rides found</div>
            <div className="empty-text">Try a broader area or check back soon. Rides appear instantly.</div>
          </div>
        )}
      </section>
    </>
  )
}
