import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'

export default function AdminSidebar({ 
  activeTab, 
  setActiveTab, 
  pendingCount = 0, 
  totalUsersCount = 0,
  ridesCount = 0,
  reviewsCount = 0,
  isSuperAdmin = false,
  isOpen, 
  onClose 
}) {
  const navigate = useNavigate()
  const { logout } = useApp()

  const handleLogout = async (e) => {
    e.preventDefault()
    await logout()
    navigate('/login')
  }

  const navItem = (id, iconSvg, label, badge = null, isSuperOnly = false) => {
    const isActive = activeTab === id
    return (
      <button
        key={id}
        onClick={() => {
          setActiveTab(id)
          if (onClose) onClose()
        }}
        className={`nav-item ${isActive ? 'active' : ''} flex items-center justify-between w-full text-left`}
      >
        <div className="flex items-center gap-3">
          <svg viewBox="0 0 24 24" className="w-[18px] h-[18px] flex-shrink-0">
            {iconSvg}
          </svg>
          <span className="truncate">{label}</span>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {isSuperOnly && (
            <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded">
              Super
            </span>
          )}
          {badge !== null && (
            <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
              isActive ? 'bg-ink-900 text-amber-400' : 'bg-ink-700 text-ink-300'
            }`}>
              {badge}
            </span>
          )}
        </div>
      </button>
    )
  }

  return (
    <>
      <div className={`backdrop ${isOpen ? 'show' : ''}`} onClick={onClose} />
      <aside className={`sidebar ${isOpen ? 'open' : ''}`} id="admin-sidebar">
        <div className="brand-logo flex flex-col items-center gap-2 pb-4 mb-4 border-b border-ink-700">
          <Link to="/" className="flex items-center gap-3">
            <img src="/Wayfare_favicon.jpeg" alt="Wayfare Admin" className="w-12 h-12 rounded-xl object-cover shadow-glow" />
          </Link>
          <div className="text-center">
            <div className="font-display text-base font-bold text-white tracking-tight">Wayfare Admin</div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-red-400 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20 mt-1 flex items-center gap-1 justify-center">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
              {isSuperAdmin ? 'Super Admin Console' : 'Admin Console'}
            </div>
          </div>
        </div>

        <div className="nav-scroll custom-scrollbar">
          <div className="nav-section">
            <div className="nav-heading">Analytics</div>
            {navItem('overview', (
              <path d="M4 11v9h16v-9M4 11l8-7 8 7M9 14h6v6H9z" />
            ), 'Overview')}
          </div>

          <div className="nav-section">
            <div className="nav-heading">Safety & Verification</div>
            {navItem('verifications', (
              <>
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="M9 12l2 2 4-4" />
              </>
            ), 'Verifications', pendingCount > 0 ? pendingCount : null)}
          </div>

          <div className="nav-section">
            <div className="nav-heading">Management</div>
            {navItem('users', (
              <>
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </>
            ), 'Platform Users', totalUsersCount)}

            {navItem('rides', (
              <>
                <circle cx="7" cy="17" r="2" />
                <circle cx="17" cy="17" r="2" />
                <path d="M5 17H3v-4l2-5h10l2 5v4h-2" />
              </>
            ), 'Ongoing Rides', ridesCount)}

            {navItem('reviews', (
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            ), 'App Reviews', reviewsCount)}
          </div>

          <div className="nav-section">
            <div className="nav-heading">Super Admin Tools</div>
            {navItem('activity_logs', (
              <>
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </>
            ), 'Activity Logs', null, true)}

            {navItem('admins', (
              <>
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </>
            ), 'Admin Access', null, true)}
          </div>

          <div className="nav-section">
            <div className="nav-heading">Portals</div>
            <Link to="/dashboard" className="nav-item flex items-center gap-3">
              <svg viewBox="0 0 24 24" className="w-[18px] h-[18px]">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              <span>User Portal</span>
            </Link>
          </div>
        </div>

        <div className="sidebar-foot">
          <a className="logout" href="#" onClick={handleLogout}>
            <svg viewBox="0 0 24 24">
              <path d="M9 4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h4" />
              <path d="M16 17l5-5-5-5" />
              <path d="M21 12H9" />
            </svg>
            <span>Log out</span>
          </a>
        </div>
      </aside>
    </>
  )
}
