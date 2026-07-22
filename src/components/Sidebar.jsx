import { Link, useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useApp } from '../context/AppContext'

export default function Sidebar({ isOpen, onClose }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useApp()

  const handleLogout = async (e) => {
    e.preventDefault()
    await supabase.auth.signOut()
    navigate('/')
  }

  const navLink = (path, iconPaths, label, exact = false) => {
    const isActive = exact ? location.pathname === path : location.pathname.startsWith(path)
    return (
      <Link to={path} className={`nav-item ${isActive ? 'active' : ''}`} onClick={onClose}>
        <svg viewBox="0 0 24 24">{iconPaths}</svg>
        <span>{label}</span>
      </Link>
    )
  }

  return (
    <>
      <div className={`backdrop ${isOpen ? 'show' : ''}`} onClick={onClose}></div>
      <aside className={`sidebar ${isOpen ? 'open' : ''}`} id="sidebar">
        <div className="brand-logo">
          <img src="/Wayfare_favicon.jpeg" alt="Wayfare" className="w-12 h-12 rounded-xl object-cover shadow-md" />
        </div>

        <div className="nav-scroll custom-scrollbar">
          <div className="nav-section">
            <div className="nav-heading">Main</div>
            {navLink('/dashboard', <>
              <path d="M4 11.5 12 4l8 7.5"/>
              <path d="M6 10v9h5v-5h2v5h5v-9"/>
            </>, 'Dashboard', true)}
          </div>

          <div className="nav-section">
            <div className="nav-heading">Account</div>
            {navLink('/profile', <>
              <circle cx="12" cy="8" r="4"/>
              <path d="M4 20c0-4.4 3.6-7 8-7s8 2.6 8 7"/>
            </>, 'Profile')}
          </div>

          <div className="nav-section">
            <div className="nav-heading">Rides</div>
            {navLink('/find-ride', <>
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.3-4.3"/>
            </>, 'Find a ride')}
            {(user?.role === 'driver' || user?.role === 'both') && navLink('/post-ride', <>
              <circle cx="12" cy="12" r="8"/>
              <circle cx="12" cy="12" r="2"/>
              <path d="M12 6v4M7.5 15.5 10 13M16.5 15.5 14 13"/>
            </>, 'Offer a ride')}
            {navLink('/chat', <>
              <path d="M4 5h16v11H8l-4 4V5z"/>
            </>, 'Messages')}
            {(user?.role === 'driver' || user?.role === 'both') && navLink('/earnings', <>
              <rect x="3" y="6" width="18" height="13" rx="2"/>
              <path d="M3 10h18"/>
              <circle cx="16.5" cy="14" r="1"/>
            </>, 'Earnings')}
          </div>

          <div className="nav-section">
            <div className="nav-heading">Community</div>
            {navLink('/circles', <>
              <circle cx="9" cy="8" r="3"/>
              <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/>
              <circle cx="17" cy="9" r="2.5"/>
              <path d="M15.5 14.2c2.6.4 4.5 2.6 4.5 5.3"/>
            </>, 'My circles')}
            {navLink('/trusted-contacts', <>
              <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z"/>
              <path d="M9 12l2 2 4-4"/>
            </>, 'Trusted contacts')}
          </div>
        </div>

        <div className="sidebar-foot">
          <a className="logout" href="#" onClick={handleLogout}>
            <svg viewBox="0 0 24 24">
              <path d="M9 4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h4"/>
              <path d="M16 17l5-5-5-5"/>
              <path d="M21 12H9"/>
            </svg>
            <span>Log out</span>
          </a>
        </div>
      </aside>
    </>
  )
}
