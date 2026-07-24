import { useState, useEffect } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import Sidebar from './Sidebar'
import BottomNav from './BottomNav'
import NotificationCenter from './NotificationCenter'
import { useApp } from '../context/AppContext'

export default function DashboardLayout() {
  const { user } = useApp()
  const location = useLocation()
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [location.pathname])

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/dashboard': return `Good evening, ${user?.user_metadata?.first_name || 'Driver'}`
      case '/post-ride': return 'Offer a ride'
      case '/find-ride': return 'Find a ride'
      case '/my-rides': return 'My Rides'
      case '/manage-rides': return 'Manage Rides'
      case '/chat': return 'Messages'
      case '/circles': return 'My circles'
      case '/earnings': return 'Earnings'
      case '/profile': return 'Profile'
      case '/trusted-contacts': return 'Trusted contacts'
      default: return 'Wayfare'
    }
  }

  const getPageSub = () => {
    if (location.pathname === '/dashboard') return "Here's what's happening with your rides today."
    return ""
  }

  return (
    <>
      <Sidebar isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />

      <main className="main">
        <header className="flex items-center justify-between mb-8 w-full gap-3">
          {/* Left: Hamburger & Title */}
          <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
            <button 
              className="md:hidden shrink-0 flex items-center justify-center w-10 h-10 rounded-xl bg-ink-800/80 border border-ink-700 text-ink-200 hover:text-white hover:bg-ink-700 transition-colors shadow-sm"
              onClick={() => setMobileMenuOpen(true)}
            >
              <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="4" y1="12" x2="20" y2="12"></line>
                <line x1="4" y1="6" x2="20" y2="6"></line>
                <line x1="4" y1="18" x2="14" y2="18"></line>
              </svg>
            </button>

            <div className="min-w-0">
              <h1 className="font-display text-xl sm:text-2xl md:text-3xl font-bold text-white truncate">
                {getPageTitle()}
              </h1>
              {getPageSub() && (
                <p className="text-xs md:text-sm text-ink-400 truncate mt-0.5 hidden sm:block">
                  {getPageSub()}
                </p>
              )}
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 md:gap-4 shrink-0">
            <div className="bg-ink-800/50 border border-ink-700/50 rounded-full flex items-center justify-center">
              <NotificationCenter />
            </div>
            <div 
              className="w-10 h-10 md:w-11 md:h-11 rounded-full flex items-center justify-center text-[15px] font-bold cursor-pointer shadow-sm hover:scale-105 transition-transform text-[#14181C]"
              style={{ background: 'linear-gradient(155deg, #4FBDBA, #2c8a87)' }}
              onClick={() => navigate('/profile')}
            >
              {user?.user_metadata?.first_name?.charAt(0) || 'O'}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="page active">
          <Outlet />
        </div>
      </main>
      
      <BottomNav />
    </>
  )
}
