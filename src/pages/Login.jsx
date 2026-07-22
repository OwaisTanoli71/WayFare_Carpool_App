import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate, Navigate, Link } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { supabase } from '../lib/supabase'
import Button from '../components/Button'
import InputField from '../components/InputField'

const PAK_CITIES = [
  "Islamabad", "Rawalpindi", "Lahore", "Karachi", "Peshawar", "Quetta", 
  "Abbottabad", "Mansehra", "Haripur", "Wah Cantt", "Taxila", "Multan", 
  "Faisalabad", "Sialkot", "Gujranwala", "Hyderabad", "Bahawalpur", "Sukkur", "Sargodha"
]

export default function Login() {
  const [isSignUp, setIsSignUp] = useState(false)
  const [name, setName] = useState('')
  const [gender, setGender] = useState('male')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [msg, setMsg] = useState('')
  const [loadingLocal, setLoadingLocal] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const { user, loading, logout } = useApp()
  const navigate = useNavigate()

  useEffect(() => {
    // If auth state changes while on this page, handle redirect
    if (!loading && user) {
      if (user.role === 'admin') {
        logout()
        setError('Admins must log in through the Admin Portal.')
        return
      }

      let redirect = localStorage.getItem('wayfare_redirect')
      if (!redirect) {
        redirect = '/dashboard'
      }
      localStorage.removeItem('wayfare_redirect')
      navigate(redirect, { replace: true })
    }
  }, [user, loading, navigate, logout])

  // Removing the 'return null' so the screen doesn't go blank if logout takes a moment

  async function handleAuth(e) {
    e.preventDefault()
    setError('')
    setMsg('')
    setLoadingLocal(true)
    
    if (!email.includes('@')) {
      setError('Please enter a valid email address')
      setLoadingLocal(false)
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      setLoadingLocal(false)
      return
    }
    // Security Fix [LpDos]: Limit password length to 128 chars to prevent CPU exhaustion on hash evaluation
    if (password.length > 128) {
      setError('Password cannot exceed 128 characters')
      setLoadingLocal(false)
      return
    }

    if (isSignUp) {
      if (!name) {
        setError('Please enter your full name')
        setLoadingLocal(false)
        return
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match')
        setLoadingLocal(false)
        return
      }
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            gender
          }
        }
      })
      if (error) {
        setError(error.message)
      } else {
        if (data?.session) {
          // Auto-logged in! The useEffect will handle the redirect.
          setMsg('Account created! Logging you in...')
        } else {
          setMsg('Account created! Please check your email to verify your account.')
        }
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) {
        if (error.message === 'Email not confirmed' || error.message.includes('Email not confirmed')) {
          setError('Check your inbox to confirm your email first.')
        } else {
          setError(error.message)
        }
      }
    }
    
    setLoadingLocal(false)
  }

  const handleResetPassword = async (e) => {
    e.preventDefault()
    if (!email) {
      setError('Please enter your email to reset password')
      return
    }
    setLoadingLocal(true)
    setError('')
    setMsg('')
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (error) {
      setError(error.message)
    } else {
      setMsg('Check your email for the password reset link.')
    }
    setLoadingLocal(false)
  }

  return (
    <div className="flex min-h-screen">
      {/* Left Pane - Branding/Visual (Hidden on mobile) */}
      <div className="hidden w-1/2 relative lg:flex flex-col justify-between overflow-hidden border-r border-ink-700 bg-ink-900/50 p-12">
        <div className="absolute inset-0 bg-radial-glow opacity-60" />
        
        {/* Animated Background Motif */}
        <svg viewBox="0 0 400 400" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] opacity-20 pointer-events-none">
          <circle cx="200" cy="200" r="100" fill="none" stroke="#FFB238" strokeWidth="1" strokeDasharray="4 4" className="animate-[spin_60s_linear_infinite]" />
          <circle cx="200" cy="200" r="150" fill="none" stroke="#2FE1B8" strokeWidth="1" strokeDasharray="8 8" className="animate-[spin_90s_linear_infinite_reverse]" />
          <path d="M50 200 Q200 50 350 200 T650 200" fill="none" stroke="url(#routeGrad)" strokeWidth="2" strokeDasharray="12 12" className="animate-dash" />
          <defs>
            <linearGradient id="routeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#FFB238" />
              <stop offset="100%" stopColor="#2FE1B8" />
            </linearGradient>
          </defs>
        </svg>

        <Link to="/" className="relative z-10 flex items-center gap-3 w-fit hover:opacity-80 transition-opacity">
          <img src="/Wayfare_favicon.jpeg" alt="Wayfare Logo" className="h-10 w-10 object-cover rounded-xl shadow-glow" />
          <span className="font-display text-2xl font-semibold tracking-tight text-white">Wayfare</span>
        </Link>

        <div className="relative z-10 max-w-md">
          <h2 className="font-display text-4xl font-semibold leading-[1.1] tracking-tight text-white">
            Safer journeys,<br />
            <span className="text-ink-400">shared by choice.</span>
          </h2>
          <p className="mt-6 text-base text-ink-100 leading-relaxed">
            Join the community of verified commuters. Share costs, reduce your footprint, and ride with people you trust.
          </p>
        </div>
      </div>

      <div className="flex w-full lg:w-1/2 flex-col items-center justify-center px-6 py-4 lg:py-0 bg-ink-900/20 max-h-screen overflow-y-auto relative">
        
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-sm rounded-[2rem] border border-ink-700/50 bg-[#121620] p-5 sm:p-7 shadow-[0_0_50px_rgba(0,0,0,0.5)] mt-12 lg:mt-0"
        >
          <div className="mb-4 text-center flex flex-col items-center">
            <Link to="/" className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-[0_0_40px_rgba(255,255,255,0.15)] transition-transform hover:scale-105 p-0.5">
              <img src="/Wayfare_favicon.jpeg" alt="Wayfare" className="h-full w-full object-cover rounded-xl" />
            </Link>
            <h1 className="font-display text-xl font-black tracking-tight text-white mb-1">
              {isSignUp ? 'Create account' : 'Welcome back'}
            </h1>
            <p className="text-[11px] text-ink-300 font-medium">
              {isSignUp ? 'Join Wayfare to start carpooling' : 'Log in to continue the journey.'}
            </p>
          </div>

        <AnimatePresence mode="wait">
          <motion.form
            key={isSignUp ? 'signup' : 'signin'}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            onSubmit={handleAuth}
            className="space-y-2"
          >
            {isSignUp && (
              <>
                <InputField
                  label="Full Name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your full name"
                  icon={<svg className="h-4 w-4 text-ink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>}
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <InputField
                    label="Email address"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    icon={<svg className="h-3.5 w-3.5 text-ink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>}
                  />
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-white ml-1">Gender</label>
                    <select required value={gender} onChange={(e) => setGender(e.target.value)} className="w-full rounded-xl border border-ink-700/60 bg-[#0F131C] px-3 py-2.5 text-xs text-white shadow-inner transition-colors focus:border-[#F59E0B] focus:outline-none focus:ring-1 focus:ring-[#F59E0B] appearance-none">
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <InputField
                    label="Password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 6 chars"
                    icon={<svg className="h-3.5 w-3.5 text-ink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>}
                  />
                  <InputField
                    label="Confirm"
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm"
                    icon={<svg className="h-3.5 w-3.5 text-ink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>}
                  />
                </div>
              </>
            )}

            {!isSignUp && (
              <>
                <InputField
                  label="Email address"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  icon={<svg className="h-4 w-4 text-ink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>}
                />
                <InputField
                  label="Password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  icon={<svg className="h-4 w-4 text-ink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>}
                  rightElement={
                    <button type="button" onClick={() => setShowPassword(!showPassword)}>
                      <svg className="h-4 w-4 text-ink-400 hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                  }
                />
                <div className="flex justify-start mt-2">
                  <button type="button" onClick={handleResetPassword} className="text-[10px] font-medium text-ink-300 hover:text-white transition-colors">Forgot password?</button>
                </div>
              </>
            )}

            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -6, scale: 0.95 }} 
                animate={{ 
                  opacity: 1, 
                  y: 0, 
                  scale: 1,
                  x: [0, -6, 6, -4, 4, 0]
                }} 
                exit={{ opacity: 0, y: -6 }} 
                transition={{ duration: 0.35, ease: 'easeOut' }}
                className="mt-3 overflow-hidden"
              >
                <div className="flex items-center gap-2.5 rounded-xl border border-red-500/40 bg-red-500/10 px-3.5 py-2.5 text-xs text-red-400 shadow-[0_0_20px_rgba(239,68,68,0.15)] font-medium">
                  <svg className="w-4 h-4 flex-shrink-0 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span className="flex-1 text-left">{error}</span>
                </div>
              </motion.div>
            )}
            {msg && (
              <motion.div 
                initial={{ opacity: 0, y: -4 }} 
                animate={{ opacity: 1, y: 0 }} 
                className="mt-3 flex items-center gap-2.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3.5 py-2.5 text-xs text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.15)] font-medium"
              >
                <svg className="w-4 h-4 flex-shrink-0 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="flex-1 text-left">{msg}</span>
              </motion.div>
            )}

            <div className="pt-4">
              <button 
                type="submit" 
                disabled={loadingLocal}
                className="w-full py-2.5 bg-[#F59E0B] hover:bg-[#F59E0B]/90 text-ink-900 font-bold rounded-xl shadow-[0_0_20px_rgba(245,158,11,0.25)] transition-all hover:shadow-[0_0_30px_rgba(245,158,11,0.4)] disabled:opacity-50 text-sm"
              >
                {loadingLocal ? 'Please wait…' : isSignUp ? 'Create account' : 'Log In'}
              </button>
            </div>
          </motion.form>
        </AnimatePresence>

        <div className="mt-3 text-center">
          <button
            onClick={() => {
              setIsSignUp(!isSignUp)
              setError('')
              setMsg('')
            }}
            className="group text-xs text-ink-100 transition-colors hover:text-white px-2 py-1"
          >
            {isSignUp ? (
              <>Already have an account? <span className="font-bold text-white group-hover:underline">Log In</span></>
            ) : (
              <>Don't have an account? <span className="font-bold text-white group-hover:underline">Sign up</span></>
            )}
          </button>
        </div>

        <div className="mt-4 pt-4 border-t border-ink-700/50 flex flex-col items-center gap-3 w-full max-w-xs">
          <p className="text-center text-[10px] text-ink-400 leading-relaxed">
            By continuing, you agree to Wayfare's <a href="#" className="hover:text-ink-100 underline decoration-ink-600">Terms of Service</a> and <a href="#" className="hover:text-ink-100 underline decoration-ink-600">Safety Guidelines</a>.
          </p>
        </div>

        {/* Go to Admin Portal Link */}
        <div className="mt-4 text-center pb-4">
          <Link to="/admin-login" className="inline-flex items-center gap-1.5 text-[11px] text-ink-400 hover:text-white transition-colors">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            Go to Admin Portal
          </Link>
        </div>
        </motion.div>
      </div>
    </div>
  )
}
