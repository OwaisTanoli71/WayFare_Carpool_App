import { useState, useEffect, useRef } from 'react'
import { sendSOSAlert } from '../lib/sos'
import { useApp } from '../context/AppContext'

// Helper to calculate distance in meters between two coords
function getDistanceFromLatLonInM(lat1, lon1, lat2, lon2) {
  const R = 6371000 // Radius of the earth in m
  const dLat = (lat2 - lat1) * (Math.PI / 180)
  const dLon = (lon2 - lon1) * (Math.PI / 180)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const d = R * c
  return d
}

export function useTripTracker(isActive) {
  const [status, setStatus] = useState('On route') // 'On route' | 'Delayed' | 'Off route'
  const { user } = useApp()
  
  const lastLocation = useRef(null)
  const stallStartTime = useRef(null)
  const deviationStartTime = useRef(null)

  useEffect(() => {
    if (!isActive) return

    const interval = setInterval(() => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const { latitude, longitude } = pos.coords
            
            // For a real app, you would check distance against the expected route geometry.
            // Here we just do a simple stall check (not moving much over 5 mins).
            if (lastLocation.current) {
              const dist = getDistanceFromLatLonInM(
                lastLocation.current.latitude,
                lastLocation.current.longitude,
                latitude,
                longitude
              )

              if (dist < 10) { // Hasn't moved 10 meters
                if (!stallStartTime.current) {
                  stallStartTime.current = Date.now()
                } else if (Date.now() - stallStartTime.current > 5 * 60 * 1000) {
                  // Stalled for 5 mins
                  setStatus('Delayed')
                  sendSOSAlert(user?.email || 'anonymous', { latitude, longitude }, 'warning')
                }
              } else {
                stallStartTime.current = null
                setStatus('On route')
              }
            }
            
            lastLocation.current = { latitude, longitude }
          },
          (err) => console.warn('Geolocation error:', err),
          { enableHighAccuracy: true }
        )
      }
    }, 15000) // Poll every 15s

    return () => clearInterval(interval)
  }, [isActive, user])

  return status
}
