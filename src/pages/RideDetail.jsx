import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate, useParams } from 'react-router-dom'
import RouteLine from '../components/RouteLine'
import Button from '../components/Button'
import SOSButton from '../components/SOSButton'
import { supabase } from '../lib/supabase'
import { useApp } from '../context/AppContext'

export default function RideDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useApp()
  
  const [ride, setRide] = useState(null)
  const [loadingRide, setLoadingRide] = useState(true)

  // States: 'initial', 'pending', 'approved', 'starting', 'verified', 'completed'
  const [bookingState, setBookingState] = useState('initial') 
  const [pin, setPin] = useState(null)
  const [enteredPin, setEnteredPin] = useState('')
  const [stats, setStats] = useState({ rating: 0, tags: [], completed_rides: 0 })
  const [errorMsg, setErrorMsg] = useState('')
  
  // Tracking
  const [rideData, setRideData] = useState({
    requestedAt: null,
    approvedAt: null,
    startedAt: null,
    endedAt: null,
    pickupLocation: null,
    dropoffLocation: null
  })

  const [booking, setBooking] = useState(null)

  // Fetch ride from DB with relational + direct fallback
  useEffect(() => {
    async function fetchRide() {
      setLoadingRide(true)
      try {
        // 1. Relational Query
        let { data, error } = await supabase
          .from('rides')
          .select(`*, driver:users(name, avatar, verified, rating, gender, role)`)
          .eq('id', id)
          .maybeSingle()

        // 2. Direct Query Fallback
        if (!data) {
          const { data: directData } = await supabase
            .from('rides')
            .select('*')
            .eq('id', id)
            .maybeSingle()

          if (directData) {
            data = directData
            if (data.driver_id) {
              const { data: driverUser } = await supabase
                .from('users')
                .select('name, avatar, verified, rating, gender, role')
                .eq('id', data.driver_id)
                .maybeSingle()
              if (driverUser) data.driver = driverUser
            }
          }
        }

        // 3. Mock Ride Fallback for demo routes
        if (!data) {
          data = {
            id: id,
            from_location: 'Islamabad',
            to_location: 'Lahore',
            type: 'intercity',
            price: 350,
            seats: 3,
            date: new Date().toISOString(),
            status: 'open',
            driver: { name: user?.name || 'Driver', avatar: 'D', verified: true, rating: 4.9, role: 'driver' }
          }
        }

        setRide(data)
      } catch (err) {
        console.error("Error loading ride:", err)
      } finally {
        setLoadingRide(false)
      }
    }
    fetchRide()
  }, [id, user])

  useEffect(() => {
    if (!ride) return
    async function fetchStats() {
      const driverId = ride.driver_id || '00000000-0000-0000-0000-000000000000'
      const { data, error } = await supabase.rpc('get_driver_stats', { driver_uuid: driverId })
      if (!error && data) {
        setStats(data)
      }
    }
    fetchStats()
  }, [ride])

  // Fetch Booking Status
  useEffect(() => {
    if (!ride || !user) return
    async function fetchBooking() {
      const { data } = await supabase
        .from('bookings')
        .select('*')
        .eq('ride_id', ride.id)
        .eq('rider_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()
      
      if (data) {
        setBooking(data)
        setBookingState(data.status)
      }
    }
    fetchBooking()

    const channel = supabase.channel(`booking_${ride.id}_${user.id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'bookings', filter: `ride_id=eq.${ride.id}` }, (payload) => {
        if (payload.new.rider_id === user.id) {
          setBooking(payload.new)
          setBookingState(payload.new.status)
        }
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [ride, user])

  const handleBook = async () => {
    if (ride.gender_pref === 'female_only' && user?.gender !== 'female') {
      setErrorMsg("This ride is restricted to women only by the driver.")
      return
    }
    if (ride.gender_pref === 'male_only' && user?.gender !== 'male') {
      setErrorMsg("This ride is restricted to men only by the driver.")
      return
    }

    setBookingState('pending')
    setRideData(prev => ({ ...prev, requestedAt: new Date().toISOString() }))
    setErrorMsg('')
    
    // INSERT to Supabase
    const { data, error } = await supabase.from('bookings').insert({
      ride_id: ride.id,
      rider_id: user.id,
      status: 'pending'
    }).select().single()
    
    if (data) setBooking(data)
    if (error) setErrorMsg(error.message)
  }

  // Demo: Simulates driver accepting the ride
  const handleDriverAccept = async () => {
    if (!booking) return
    setBookingState('approved')
    setRideData(prev => ({ ...prev, approvedAt: new Date().toISOString() }))
    
    await supabase.from('bookings')
      .update({ status: 'approved' })
      .eq('id', booking.id)
  }

  const handleStartRide = async () => {
    setPin(Math.floor(1000 + Math.random() * 9000).toString()) // 4-digit PIN
    setBookingState('starting')
    
    if (booking) {
      await supabase.from('bookings').update({ status: 'starting' }).eq('id', booking.id)
    }
  }

  const handleVerify = async () => {
    if (enteredPin === pin) {
      setBookingState('verified')
      setErrorMsg('')
      
      if (booking) {
        await supabase.from('bookings').update({ status: 'verified' }).eq('id', booking.id)
      }
      
      const timeNow = new Date().toISOString()
      
      // Capture Geolocation for Pickup
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setRideData(prev => ({
              ...prev,
              startedAt: timeNow,
              pickupLocation: { lat: position.coords.latitude, lng: position.coords.longitude }
            }))
          },
          (err) => {
            console.warn("Location permission denied", err)
            setRideData(prev => ({ ...prev, startedAt: timeNow }))
          }
        )
      } else {
        setRideData(prev => ({ ...prev, startedAt: timeNow }))
      }
      
    } else {
      setErrorMsg("Incorrect PIN. Please try again.")
    }
  }

  const handleCompleteRide = async () => {
    setBookingState('completed')
    
    if (booking) {
      await supabase.from('bookings').update({ status: 'completed' }).eq('id', booking.id)
    }
    
    const timeNow = new Date().toISOString()
    
    // Capture Geolocation for Dropoff
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = { lat: position.coords.latitude, lng: position.coords.longitude }
          setRideData(prev => ({
            ...prev,
            endedAt: timeNow,
            dropoffLocation: coords
          }))
          
          if (booking) {
            supabase.from('bookings').update({ dropoff_location: JSON.stringify(coords) }).eq('id', booking.id)
          }
        },
        (err) => {
          console.warn("Location permission denied", err)
          setRideData(prev => ({ ...prev, endedAt: timeNow }))
        }
      )
    } else {
      setRideData(prev => ({ ...prev, endedAt: timeNow }))
    }
  }

  // Driver Control Actions
  const handleDriverCompleteRide = async () => {
    const { error } = await supabase.from('rides').update({ status: 'completed' }).eq('id', ride.id)
    if (!error) {
      setRide(prev => ({ ...prev, status: 'completed' }))
      alert("✅ Ride marked as completed! Driver statistics updated.")
    } else {
      alert("Error: " + error.message)
    }
  }

  const handleDriverCancelRide = async () => {
    if (!window.confirm("Are you sure you want to cancel this ride offer? Passengers will be notified.")) return
    const { error } = await supabase.from('rides').update({ status: 'cancelled' }).eq('id', ride.id)
    if (!error) {
      setRide(prev => ({ ...prev, status: 'cancelled' }))
      alert("Ride status set to cancelled.")
    }
  }

  const handleDriverDeleteRide = async () => {
    // Threshold Check: Check active bookings
    const { count } = await supabase.from('bookings').select('id', { count: 'exact', head: true }).eq('ride_id', ride.id)
    
    if (count && count > 0) {
      const confirmDelete = window.confirm(
        `⚠️ Active Passengers Alert:\n\nThis ride currently has ${count} passenger booking(s).\nDeleting this ride will cancel all bookings for passengers.\n\nAre you sure you want to delete this trip?`
      )
      if (!confirmDelete) return
    } else {
      if (!window.confirm("Are you sure you want to delete this ride offer?")) return
    }

    const { error } = await supabase.from('rides').update({ status: 'deleted' }).eq('id', ride.id)
    if (!error) {
      alert("Ride successfully deleted.")
      navigate('/dashboard')
    } else {
      alert("Error deleting ride: " + error.message)
    }
  }

  if (loadingRide) return <div style={{ color: '#8B9298', padding: '40px', textAlign: 'center' }}>Loading ride details...</div>
  if (!ride) return <div style={{ color: '#8B9298', padding: '40px', textAlign: 'center' }}>Ride not found or has been deleted.</div>

  const rideDateObj = new Date(ride.date)

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto', paddingTop: '10px' }}>
      <button onClick={() => navigate(-1)} className="panel-link" style={{ marginBottom: '20px', display: 'inline-block' }}>
        &larr; Back to results
      </button>

      {/* DRIVER / ADMIN RIDE CONTROL PANEL */}
      {user && (user.id === ride.driver_id || user.role === 'admin' || user.email === 'admin@wayfare.com') && (
        <div className="mb-6 p-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 space-y-3 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <span>🚗</span> Driver & Admin Trip Management
            </span>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-ink-900 text-white uppercase border border-ink-700">
              {ride.status || 'open'}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            {ride.status !== 'completed' && (
              <button
                onClick={handleDriverCompleteRide}
                className="px-3.5 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
              >
                ✓ Mark Completed
              </button>
            )}

            {ride.status === 'open' && (
              <button
                onClick={handleDriverCancelRide}
                className="px-3.5 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/30 text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
              >
                ⚠️ Cancel Ride
              </button>
            )}

            <button
              onClick={handleDriverDeleteRide}
              className="px-3.5 py-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm ml-auto"
            >
              🗑️ Delete Ride Offer
            </button>
          </div>
        </div>
      )}

      <div className="panel">
        <div className="flex flex-col sm:flex-row gap-4 sm:justify-between sm:items-start mb-8">
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <div className="avatar lg">{ride.driver?.name?.charAt(0) || 'U'}</div>
            <div>
              <div style={{ fontSize: '20px', fontWeight: 600, fontFamily: 'Fraunces, serif', marginBottom: '2px' }}>
                {ride.driver?.name || 'Unknown'} {ride.driver?.verified && <span style={{ fontSize: '12px', background: '#1E3A39', color: '#4FBDBA', padding: '2px 8px', borderRadius: '10px', marginLeft: '6px', verticalAlign: 'middle' }}>✓ Verified</span>}
              </div>
              <div style={{ color: '#8B9298', fontSize: '13px' }}>
                ★ {stats.rating > 0 ? stats.rating : (ride.driver?.rating || 'New')} &middot; {stats.completed_rides} trips &middot; {ride.car}
              </div>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '28px', color: '#E8A33D', fontWeight: 600, fontFamily: 'Fraunces, serif' }}>Rs {ride.price}</div>
            <div style={{ fontSize: '11px', color: '#5C646B', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '4px' }}>For 1 seat</div>
          </div>
        </div>

        <div style={{ marginBottom: '30px', padding: '20px', background: '#20262C', borderRadius: '16px', border: '1px solid #252B31' }}>
          <RouteLine from={ride.from_location} to={ride.to_location} />
        </div>

        <div className="flex flex-col sm:flex-row gap-4 sm:gap-5 mb-8">
          <div style={{ flex: 1, padding: '16px', background: '#20262C', borderRadius: '14px', border: '1px solid #252B31' }}>
            <div style={{ fontSize: '11px', color: '#8B9298', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Date &amp; Time</div>
            <div style={{ fontSize: '14.5px', fontWeight: 500, marginTop: '6px' }}>{rideDateObj.toLocaleDateString()} &middot; <span style={{ color: '#E8A33D' }}>{rideDateObj.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span></div>
          </div>
          <div style={{ flex: 1, padding: '16px', background: '#20262C', borderRadius: '14px', border: '1px solid #252B31' }}>
            <div style={{ fontSize: '11px', color: '#8B9298', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Seats Available</div>
            <div style={{ fontSize: '14.5px', fontWeight: 500, marginTop: '6px' }}>{ride.seats} remaining</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '16px', background: '#1E3A39', border: '1px solid #2c5352', borderRadius: '12px', marginBottom: '30px' }}>
          <div style={{ fontSize: '16px' }}>🛡️</div>
          <div style={{ fontSize: '13.5px', color: '#BFE6E4' }}>
            {ride.gender_pref === 'female_only' ? 'This driver rides with women only' : ride.gender_pref === 'male_only' ? 'This driver rides with men only' : 'Open to all riders'}
          </div>
        </div>

        {errorMsg && (
          <div style={{ padding: '12px 16px', background: 'rgba(255, 100, 100, 0.1)', border: '1px solid rgba(255, 100, 100, 0.3)', borderRadius: '12px', color: '#ff8a8a', fontSize: '14px', marginBottom: '20px', display: 'flex', gap: '10px', alignItems: 'center' }}>
            <span>⚠️</span> {errorMsg}
          </div>
        )}

        {/* Pending Approval State */}
        {bookingState === 'pending' && (
          <div style={{ padding: '24px', background: '#1B2025', border: '1px dashed #5C646B', borderRadius: '16px', textAlign: 'center', marginBottom: '30px' }}>
            <h3 style={{ color: '#F1EDE5', margin: '0 0 8px', fontSize: '16px' }}>Waiting for Approval</h3>
            <p style={{ color: '#8B9298', fontSize: '13px', margin: '0 0 16px' }}>Your request has been sent to {ride.driver?.name?.split(' ')[0] || 'the driver'}. Waiting for them to accept.</p>
            
            <div style={{ borderTop: '1px solid #252B31', paddingTop: '16px' }}>
              <p style={{ color: '#8B9298', fontSize: '11px', margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: '1px' }}>Driver Simulation</p>
              <button onClick={handleDriverAccept} style={{ padding: '8px 16px', borderRadius: '8px', background: '#20262C', color: '#E8A33D', border: '1px solid #E8A33D', fontSize: '13px', cursor: 'pointer' }}>
                Accept Request
              </button>
            </div>
          </div>
        )}

        {/* Starting / PIN State */}
        {bookingState === 'starting' && pin && (
          <div style={{ padding: '24px', background: '#20262C', border: '1px solid #E8A33D', borderRadius: '16px', textAlign: 'center', marginBottom: '30px' }}>
            <h3 style={{ color: '#E8A33D', margin: '0 0 8px', fontSize: '16px' }}>Ride PIN Generated</h3>
            <p style={{ color: '#8B9298', fontSize: '13px', margin: '0 0 16px' }}>Say this PIN to the driver before getting in:</p>
            <div style={{ fontSize: '40px', fontWeight: 700, letterSpacing: '8px', color: '#F1EDE5', fontFamily: 'monospace', marginBottom: '24px' }}>{pin}</div>
            
            <div style={{ borderTop: '1px solid #252B31', paddingTop: '20px' }}>
              <p style={{ color: '#8B9298', fontSize: '12px', margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: '1px' }}>Driver Verification (Demo)</p>
              <div style={{ display: 'flex', gap: '10px', maxWidth: '300px', margin: '0 auto' }}>
                <input 
                  type="text" 
                  value={enteredPin}
                  onChange={(e) => setEnteredPin(e.target.value)}
                  placeholder="Enter PIN" 
                  maxLength={4}
                  style={{ flex: 1, padding: '12px', borderRadius: '10px', border: '1px solid #2A3138', background: '#14181C', color: '#F1EDE5', fontSize: '16px', textAlign: 'center', letterSpacing: '4px' }}
                />
                <button 
                  onClick={handleVerify}
                  style={{ padding: '0 20px', borderRadius: '10px', background: '#E8A33D', color: '#14181C', fontWeight: 600, border: 'none', cursor: 'pointer' }}
                >
                  Verify
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Verified (In Progress) State */}
        {bookingState === 'verified' && (
          <div style={{ padding: '24px', background: '#1E3A39', border: '1px solid #4FBDBA', borderRadius: '16px', textAlign: 'center', marginBottom: '30px' }}>
            <div style={{ fontSize: '40px', marginBottom: '10px' }}>🛡️</div>
            <h3 style={{ color: '#BFE6E4', margin: '0 0 8px', fontSize: '18px' }}>Ride in Progress!</h3>
            <p style={{ color: '#4FBDBA', fontSize: '14px', margin: '0 0 16px' }}>You are securely matched. Location tracking is active.</p>
            <button 
              onClick={handleCompleteRide}
              style={{ padding: '10px 24px', borderRadius: '10px', background: '#BFE6E4', color: '#1E3A39', fontWeight: 600, border: 'none', cursor: 'pointer' }}
            >
              Complete Ride (Demo)
            </button>
          </div>
        )}

        {/* Completed State */}
        {bookingState === 'completed' && (
          <div style={{ padding: '24px', background: '#20262C', border: '1px solid #252B31', borderRadius: '16px', marginBottom: '30px' }}>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div style={{ fontSize: '40px', marginBottom: '10px' }}>✅</div>
              <h3 style={{ color: '#F1EDE5', margin: '0 0 4px', fontSize: '18px' }}>Ride Completed</h3>
              <p style={{ color: '#8B9298', fontSize: '13px', margin: '0' }}>Summary of your trip.</p>
            </div>
            
            <div style={{ background: '#14181C', borderRadius: '12px', padding: '16px', fontSize: '12px', color: '#8B9298', display: 'grid', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Requested</span>
                <span style={{ color: '#F1EDE5' }}>{rideData.requestedAt ? new Date(rideData.requestedAt).toLocaleTimeString() : '--'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Started</span>
                <span style={{ color: '#F1EDE5' }}>{rideData.startedAt ? new Date(rideData.startedAt).toLocaleTimeString() : '--'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Completed</span>
                <span style={{ color: '#F1EDE5' }}>{rideData.endedAt ? new Date(rideData.endedAt).toLocaleTimeString() : '--'}</span>
              </div>
              <div style={{ borderTop: '1px solid #252B31', margin: '4px 0' }}></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Pickup Location</span>
                <span style={{ color: '#E8A33D' }}>{rideData.pickupLocation ? `${rideData.pickupLocation.lat.toFixed(4)}, ${rideData.pickupLocation.lng.toFixed(4)}` : 'Location Denied'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Dropoff Location</span>
                <span style={{ color: '#E8A33D' }}>{rideData.dropoffLocation ? `${rideData.dropoffLocation.lat.toFixed(4)}, ${rideData.dropoffLocation.lng.toFixed(4)}` : 'Location Denied'}</span>
              </div>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row gap-4">
          {bookingState === 'initial' && (
            <button className="submit-btn" style={{ flex: 1 }} onClick={handleBook}>
              Request to book
            </button>
          )}
          {bookingState === 'approved' && (
            <button className="submit-btn" style={{ flex: 1 }} onClick={handleStartRide}>
              Start Ride
            </button>
          )}
          {(bookingState === 'pending' || bookingState === 'starting' || bookingState === 'verified') && (
            <button className="submit-btn" style={{ flex: 1, background: '#252B31', color: '#F1EDE5' }} onClick={() => navigate('/chat')}>
              Open chat with {ride.driver?.name?.split(' ')[0] || 'Driver'} &rarr;
            </button>
          )}
          {bookingState === 'completed' && (
            <button className="submit-btn" style={{ flex: 1 }} onClick={() => navigate('/')}>
              Return Home
            </button>
          )}
          
          <button style={{ padding: '15px 24px', borderRadius: '12px', background: 'transparent', border: '1px solid #252B31', color: '#8B9298', fontWeight: 600, cursor: 'pointer' }}>
            Report
          </button>
        </div>
      </div>
    </div>
  )
}
