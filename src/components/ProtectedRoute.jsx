import { Navigate, useLocation } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { motion } from 'framer-motion'

export default function ProtectedRoute({ children, requireOnboarding = true }) {
  const { user, loading } = useApp()
  const location = useLocation()

  if (loading) {
    return (
      <div style={{ height: '100vh', overflow: 'hidden', background: '#14181C', display: 'flex' }}>
        {/* Sidebar Skeleton */}
        <div style={{ width: '260px', padding: '24px 20px', borderRight: '1px solid #252B31', background: '#171B20', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '40px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'linear-gradient(135deg, #FFB238, #2FE1B8)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#14181C', fontWeight: 900, fontSize: '20px' }}>W</div>
            <div style={{ fontSize: '22px', fontWeight: 700, color: '#F1EDE5', letterSpacing: '-0.5px' }}>Wayfare</div>
          </div>
          
          <div style={{ flex: 1 }}>
            <div className="skeleton" style={{ width: '80%', height: '44px', borderRadius: '12px', marginBottom: '12px' }}></div>
            <div className="skeleton" style={{ width: '90%', height: '44px', borderRadius: '12px', marginBottom: '12px' }}></div>
            <div className="skeleton" style={{ width: '75%', height: '44px', borderRadius: '12px', marginBottom: '12px' }}></div>
          </div>
        </div>

        {/* Main Content Skeleton */}
        <main style={{ flex: 1, padding: '32px 40px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px' }}>
            <div>
               <div className="skeleton" style={{ width: '280px', height: '36px', borderRadius: '8px', marginBottom: '12px' }}></div>
               <div className="skeleton" style={{ width: '200px', height: '16px', borderRadius: '6px' }}></div>
            </div>
            <div style={{ display: 'flex', gap: '16px' }}>
               <div className="skeleton" style={{ width: '44px', height: '44px', borderRadius: '12px' }}></div>
               <div className="skeleton" style={{ width: '44px', height: '44px', borderRadius: '50%' }}></div>
            </div>
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', gap: '20px', marginBottom: '24px' }}>
               <div className="skeleton" style={{ flex: 1, height: '140px', borderRadius: '20px' }}></div>
               <div className="skeleton" style={{ flex: 1, height: '140px', borderRadius: '20px' }}></div>
            </div>
            
            <div className="skeleton" style={{ height: '220px', borderRadius: '20px', width: '100%', marginBottom: '24px' }}></div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
              <div className="skeleton" style={{ height: '100px', borderRadius: '16px' }}></div>
              <div className="skeleton" style={{ height: '100px', borderRadius: '16px' }}></div>
              <div className="skeleton" style={{ height: '100px', borderRadius: '16px' }}></div>
              <div className="skeleton" style={{ height: '100px', borderRadius: '16px' }}></div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (!user) {
    // Save the location they were trying to go to
    localStorage.setItem('wayfare_redirect', location.pathname + location.search)
    return <Navigate to="/login" replace />
  }

  // Admins should only be in the admin portal
  if (user.role === 'admin') {
    return <Navigate to="/admin" replace />
  }

  // Check both genderPref (local state) and gender_pref (database state)
  const hasGenderPref = user.genderPref || user.gender_pref

  if (requireOnboarding && (!user.role || !hasGenderPref)) {
    // If they haven't finished onboarding, force them to do so
    // Only save redirect if it's not the onboarding page itself
    if (location.pathname !== '/onboarding') {
      localStorage.setItem('wayfare_redirect', location.pathname + location.search)
    }
    return <Navigate to="/onboarding" replace />
  }

  return children
}
