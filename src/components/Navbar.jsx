import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import Button from './Button'
import NotificationCenter from './NotificationCenter'
import { Menu, X } from 'lucide-react'

export default function Navbar() {
  const { user } = useApp()
  const navigate = useNavigate()
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-ink-900/80 backdrop-blur-lg border-b border-ink-700/80 shadow-lg' : 'bg-transparent border-transparent py-2'
      }`}
    >
      <div className="flex w-full items-center justify-between px-4 sm:px-6 py-4 lg:px-12">
        {/* Left: Logo */}
        <div className="flex justify-start items-center">
          <Link to="/" className="group flex items-center gap-3">
            <img src="/Wayfare_favicon.jpeg" alt="Wayfare Logo" className="h-8 w-8 object-cover rounded-lg transition-transform duration-300 group-hover:rotate-6" />
            <span className="font-display text-xl font-bold tracking-tight text-white">Wayfare</span>
          </Link>
        </div>

        {/* Center: Navigation Links */}
        <nav className="hidden justify-center gap-8 text-sm text-ink-100 md:flex">
          <a href="/#how-it-works" className="transition-colors hover:text-beacon">Find a ride</a>
          <a href="/#how-it-works" className="transition-colors hover:text-beacon">Offer a ride</a>
          <a href="/#testimonials" className="transition-colors hover:text-beacon">Circles</a>
          <a href="/#safety" className="transition-colors hover:text-beacon">Safety</a>
          {user?.role === 'admin' && (
            <Link to="/admin" className="flex items-center gap-1.5 rounded-full border border-danger/30 bg-danger/10 px-3 py-1 text-xs font-medium text-danger transition-colors hover:bg-danger/20">
              <span className="h-1.5 w-1.5 rounded-full bg-danger animate-pulseSoft" />
              Admin
            </Link>
          )}
        </nav>

        {/* Right: Auth Buttons */}
        <div className="flex justify-end gap-3 items-center">
          {user ? (
            <div className="flex items-center gap-3">
              <NotificationCenter />
              <button
                onClick={() => navigate('/profile')}
                className="focus-ring flex h-9 w-9 items-center justify-center rounded-full bg-ink-700 text-xs font-semibold text-ink-50 ring-1 ring-ink-600 transition-all hover:ring-beacon"
              >
                {user.avatar || 'U'}
              </button>
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-3">
              <Button variant="ghost" onClick={() => navigate('/login')}>Log in</Button>
              <Button variant="primary" onClick={() => navigate('/login')}>Get started</Button>
            </div>
          )}
          
          {/* Mobile Menu Toggle */}
          <button 
            className="md:hidden p-2 text-ink-100 hover:text-white"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-ink-900 border-b border-ink-800 shadow-xl px-6 py-4 flex flex-col gap-4">
          <a href="/#how-it-works" className="text-ink-100 hover:text-beacon font-medium" onClick={() => setMobileMenuOpen(false)}>Find a ride</a>
          <a href="/#how-it-works" className="text-ink-100 hover:text-beacon font-medium" onClick={() => setMobileMenuOpen(false)}>Offer a ride</a>
          <a href="/#testimonials" className="text-ink-100 hover:text-beacon font-medium" onClick={() => setMobileMenuOpen(false)}>Circles</a>
          <a href="/#safety" className="text-ink-100 hover:text-beacon font-medium" onClick={() => setMobileMenuOpen(false)}>Safety</a>
          {!user && (
            <div className="flex flex-col gap-3 mt-2 pt-4 border-t border-ink-800">
              <Button variant="ghost" className="w-full justify-center" onClick={() => { navigate('/login'); setMobileMenuOpen(false); }}>Log in</Button>
              <Button variant="primary" className="w-full justify-center" onClick={() => { navigate('/login'); setMobileMenuOpen(false); }}>Get started</Button>
            </div>
          )}
        </div>
      )}
    </header>
  )
}
