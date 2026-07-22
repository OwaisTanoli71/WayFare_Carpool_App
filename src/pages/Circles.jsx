import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Circles() {
  const [circles, setCircles] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('wayfare_circles') || '[]')
    setCircles(saved)
  }, [])

  return (
    <>
      {circles.length > 0 ? (
        <div className="form-grid">
          {circles.map((driver) => (
            <div key={driver.name} className="panel">
              <div className="panel-head">
                <span className="panel-title">{driver.name}</span>
                <span className="tag">Circle</span>
              </div>
              <div className="flex items-center gap-3 mb-4">
                <div className="avatar">{driver.avatar}</div>
                <div className="text-xs text-[#8B9298]">&#9733; {driver.rating}</div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <button className="submit-btn" style={{ padding: '8px', fontSize: '13px' }} onClick={() => navigate('/find-ride')}>Find ride</button>
                <button className="pill" style={{ width: '100%', textAlign: 'center' }} onClick={() => navigate('/chat')}>Message</button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-icon">
            <svg viewBox="0 0 24 24">
              <circle cx="9" cy="8" r="3"/>
              <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/>
              <circle cx="17" cy="9" r="2.5"/>
              <path d="M15.5 14.2c2.6.4 4.5 2.6 4.5 5.3"/>
            </svg>
          </div>
          <h2 className="empty-title">Your Ride Circle is empty</h2>
          <p className="empty-text">Add drivers you trust after completing a ride. We'll prioritize matching you with them.</p>
          <button className="empty-cta" onClick={() => navigate('/find-ride')}>Find a ride to get started</button>
        </div>
      )}
    </>
  )
}
