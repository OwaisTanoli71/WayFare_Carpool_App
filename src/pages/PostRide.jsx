import { useState, useEffect } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import RouteSelector from '../components/RouteSelector'
import Dropdown from '../components/Dropdown'
import { INTERCITY_ROUTES } from '../data/routes'
import { useApp } from '../context/AppContext'
import { supabase } from '../lib/supabase'

export default function PostRide() {
  const navigate = useNavigate()
  const { user } = useApp()
  const [seats, setSeats] = useState(3)
  const [price, setPrice] = useState('')
  const [genderPref, setGenderPref] = useState('Male only')
  const [loading, setLoading] = useState(false)
  
  if (user?.role === 'rider') {
    return <Navigate to="/dashboard" replace />
  }

  if (!(user?.user_metadata?.verified || user?.verified)) {
    return (
      <div style={{
        maxWidth: '480px',
        margin: '60px auto',
        padding: '40px 32px',
        borderRadius: '32px',
        background: 'linear-gradient(145deg, #1A2026, #14181C)',
        border: '1px solid rgba(255, 178, 56, 0.15)',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.4), 0 0 40px rgba(255, 178, 56, 0.05) inset',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Glow effect in background */}
        <div style={{
          position: 'absolute', top: '-50px', left: '50%', transform: 'translateX(-50%)',
          width: '150px', height: '150px', background: 'rgba(255, 178, 56, 0.15)',
          filter: 'blur(50px)', borderRadius: '50%', pointerEvents: 'none'
        }}></div>

        <div style={{
          width: '80px', height: '80px', borderRadius: '50%',
          background: 'linear-gradient(145deg, rgba(255, 178, 56, 0.15), rgba(255, 178, 56, 0.05))',
          border: '1px solid rgba(255, 178, 56, 0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '36px', marginBottom: '24px',
          boxShadow: '0 0 20px rgba(255, 178, 56, 0.2)'
        }}>
          🛡️
        </div>

        <h2 style={{
          fontSize: '28px', color: '#FFB238', fontWeight: '700',
          fontFamily: 'Fraunces, serif', marginBottom: '16px', letterSpacing: '-0.5px',
          position: 'relative'
        }}>
          Verification Required
        </h2>

        <p style={{
          fontSize: '15px', color: '#8B9298', lineHeight: '1.6', marginBottom: '32px', position: 'relative'
        }}>
          To ensure community safety, all drivers must be verified by an admin before offering rides. 
          Upload your CNIC and license to unlock your driver profile.
        </p>

        <button 
          onClick={() => navigate('/profile')}
          style={{
            background: '#FFB238', color: '#14181C',
            padding: '16px 32px', borderRadius: '16px',
            fontSize: '16px', fontWeight: '600', border: 'none',
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
            boxShadow: '0 8px 24px rgba(255, 178, 56, 0.3)',
            transition: 'all 0.2s ease',
            width: '100%', justifyContent: 'center',
            position: 'relative'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'translateY(-2px)'
            e.currentTarget.style.boxShadow = '0 12px 28px rgba(255, 178, 56, 0.4)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = '0 8px 24px rgba(255, 178, 56, 0.3)'
          }}
        >
          Go to Profile to Verify
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
        </button>
      </div>
    )
  }
  
  const [rideType, setRideType] = useState('in-city')
  const [city, setCity] = useState('Islamabad')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [date, setDate] = useState('Today')

  useEffect(() => {
    setFrom('')
    setTo('')
  }, [rideType])
  const [time, setTime] = useState('08:00 AM')

  const timeOptions = []
  for (let i = 0; i < 24; i++) {
    for (let m of ['00', '30']) {
      let h = i % 12 || 12
      let ampm = i < 12 ? 'AM' : 'PM'
      timeOptions.push(`${h < 10 ? '0'+h : h}:${m} ${ampm}`)
    }
  }

  const dateOptions = ['Today', 'Tomorrow']
  for (let i = 2; i < 7; i++) {
    const d = new Date()
    d.setDate(d.getDate() + i)
    dateOptions.push(d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }))
  }

  const handlePostRide = async () => {
    if (!from || !to || !price) {
      alert("Please fill all required fields")
      return
    }

    // Security Fix [No Input Validation]: Validate range and type for price and available seats
    const numPrice = Number(price)
    if (isNaN(numPrice) || numPrice <= 0 || numPrice > 50000) {
      alert("Please enter a valid price between Rs. 1 and 50,000")
      return
    }
    if (seats < 1 || seats > 8) {
      alert("Available seats must be between 1 and 8")
      return
    }

    setLoading(true)
    const prefMap = { 'Any': 'any', 'Female only': 'female_only', 'Male only': 'male_only' }
    
    const { error: sbError } = await supabase.from('rides').insert({
      driver_id: user.id,
      from_location: from,
      to_location: to,
      type: rideType,
      date: new Date().toISOString(), // using current timestamp for now
      seats: seats,
      price: parseInt(price),
      gender_pref: prefMap[genderPref] || 'any',
      car: 'Toyota Corolla (Default)'
    })

    setLoading(false)

    if (sbError) {
      alert("Error posting ride: " + sbError.message)
    } else {
      navigate('/dashboard')
    }
  }

  return (
    <>
      <div className="panel form-panel" style={{ maxWidth: '760px', margin: '0 auto' }}>
        <div className="panel-head" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '16px' }}>
          <span className="panel-title">Ride Preferences</span>
          <div className="seat-options" style={{ marginTop: 0 }}>
            {['Male only', 'Female only', 'Any'].map(pref => (
              <button 
                key={pref} 
                className={`pill ${genderPref === pref ? 'selected' : ''}`}
                onClick={() => setGenderPref(pref)}
              >
                {pref}
              </button>
            ))}
          </div>
        </div>

        <div className="panel-head">
          <span className="panel-title">Route details</span>
          <div className="seat-options" style={{ marginTop: 0 }}>
             <button className={`pill ${rideType === 'in-city' ? 'selected' : ''}`} onClick={() => setRideType('in-city')}>In-city</button>
             <button className={`pill ${rideType === 'intercity' ? 'selected' : ''}`} onClick={() => setRideType('intercity')}>Intercity</button>
          </div>
        </div>
        <div className="form-grid">
          {rideType === 'in-city' && (
            <div style={{ gridColumn: '1 / -1' }}>
              <Dropdown label="City" value={city} options={INTERCITY_ROUTES} onChange={setCity} />
            </div>
          )}
          <RouteSelector label="From" placeholder={rideType === 'in-city' ? "e.g. NUST Gate 1" : "e.g. Islamabad"} value={from} onChange={setFrom} type={rideType} />
          <RouteSelector label="To" placeholder={rideType === 'in-city' ? "e.g. F-11 Markaz" : "e.g. Lahore"} value={to} onChange={setTo} type={rideType} />
          
          <div>
            <Dropdown label="Date" value={date} options={dateOptions} onChange={setDate} />
          </div>
          <div>
            <Dropdown label="Time" value={time} options={timeOptions} onChange={setTime} />
          </div>
          
          <div className="field">
            <label>Available Seats</label>
            <div className="stepper" style={{ marginTop: '8px' }}>
              <button className="step-btn" onClick={() => setSeats(Math.max(1, seats - 1))}>&minus;</button>
              <span>{seats}</span>
              <button className="step-btn" onClick={() => setSeats(Math.min(10, seats + 1))}>+</button>
            </div>
          </div>
          
          <div className="field">
            <label>Price per seat (Rs)</label>
            <input 
              type="number" 
              placeholder="e.g. 1500" 
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              min="0"
              style={{ marginTop: '8px' }}
            />
          </div>
        </div>


        
        <div className="tip-card">
          <div className="tip-icon">&#128161;</div>
          <div className="tip-text"><b>Pro tip:</b> Fill in exact locations. It helps our matching algorithm find riders perfectly on your way.</div>
        </div>
        
        <button 
          className="submit-btn" 
          onClick={handlePostRide}
          disabled={loading}
        >
          {loading ? 'Posting...' : 'Post Ride'}
        </button>
      </div>
    </>
  )
}
