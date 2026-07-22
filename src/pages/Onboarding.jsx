import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { supabase } from '../lib/supabase'
import Button from '../components/Button'

const steps = ['role', 'preference', 'details']

function OptionCard({ selected, onClick, title, desc }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative w-full overflow-hidden rounded-2xl border p-4 text-left transition-all duration-300 hover:-translate-y-0.5 ${
        selected ? 'border-beacon bg-beacon/10 shadow-[inset_0_0_20px_rgba(255,178,56,0.1)]' : 'border-ink-700 bg-ink-800/50 hover:border-ink-500 hover:bg-ink-800'
      }`}
    >
      <div className="relative z-10">
        <div className={`font-display text-[15px] font-semibold tracking-wide transition-colors ${selected ? 'text-beacon' : 'text-ink-50'}`}>{title}</div>
        <div className="mt-0.5 text-xs leading-relaxed text-ink-100/80">{desc}</div>
      </div>
      {selected && (
         <div className="absolute top-0 right-0 h-32 w-32 -translate-y-16 translate-x-16 rounded-full bg-beacon/20 blur-3xl pointer-events-none" />
      )}
    </button>
  )
}

export default function Onboarding() {
  const [stepIndex, setStepIndex] = useState(0)
  const [form, setForm] = useState({ 
    role: '', 
    genderPref: '',
    phone: '',
    age: '',
    city: 'Islamabad',
    house: '',
    street: '',
    landmark: ''
  })
  const { user, setUser } = useApp()
  const navigate = useNavigate()
  const step = steps[stepIndex]

  async function next() {
    if (stepIndex < steps.length - 1) setStepIndex(stepIndex + 1)
    else {
      const updatedUser = { 
        ...user, 
        ...form, 
        verified: false 
      }
      
      setUser(updatedUser)
      
      // Save to Supabase (if connected)
      if (user?.id) {
        const { error } = await supabase.from('users').update({
          role: form.role,
          gender_pref: form.genderPref,
          age: parseInt(form.age) || null,
          city: form.city
        }).eq('id', user.id)

        if (error) {
          console.warn("Could not save to DB (schema might be missing). Using fallback.", error)
        }
      }
      
      // Fallback: Save to localStorage so they don't get stuck in a loop if DB fails
      localStorage.setItem('wayfare_role', form.role)
      localStorage.setItem('wayfare_gender_pref', form.genderPref)
      localStorage.setItem('wayfare_phone', form.phone)
      localStorage.setItem('wayfare_age', form.age)
      localStorage.setItem('wayfare_city', form.city)
      localStorage.setItem('wayfare_house', form.house)
      localStorage.setItem('wayfare_street', form.street)
      localStorage.setItem('wayfare_landmark', form.landmark)
      
      navigate('/dashboard')
    }
  }

  const canContinue =
    (step === 'role' && form.role) ||
    (step === 'preference' && form.genderPref) ||
    (step === 'details' && form.phone && form.age && form.city && form.house && form.street)

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-ink-900 px-6 py-16">
      {/* Top Left Floating Back Button */}
      <button
        onClick={() => {
          if (stepIndex === 0) {
            const confirmDiscard = window.confirm("Are you sure you want to discard your account creation and go back to login?")
            if (confirmDiscard) {
              supabase.auth.signOut()
              setUser(null)
              navigate('/login')
            }
          } else {
            setStepIndex(stepIndex - 1)
          }
        }}
        className="absolute top-6 left-6 z-50 flex items-center gap-2 rounded-full border border-ink-700/50 bg-ink-800/50 py-2 pl-3 pr-4 text-sm font-medium text-ink-100 shadow-sm backdrop-blur-md transition-all hover:bg-ink-700/80 hover:text-white focus-ring"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Back
      </button>

      {/* Background glow and motif */}
      <div className="absolute inset-0 bg-radial-glow opacity-40 pointer-events-none" />
      <svg viewBox="0 0 800 800" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150vw] md:w-[100vw] opacity-10 pointer-events-none">
          <circle cx="400" cy="400" r="300" fill="none" stroke="#FFB238" strokeWidth="1" strokeDasharray="8 8" className="animate-[spin_120s_linear_infinite]" />
          <path d="M100 400 Q400 100 700 400 T1300 400" fill="none" stroke="url(#routeGrad)" strokeWidth="2" strokeDasharray="16 16" className="animate-dash" />
          <defs>
            <linearGradient id="routeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#FFB238" />
              <stop offset="100%" stopColor="#2FE1B8" />
            </linearGradient>
          </defs>
      </svg>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-xl rounded-3xl border border-ink-700/60 bg-ink-800/80 p-6 sm:p-8 shadow-card shadow-inner backdrop-blur-xl"
      >
        <div className="mb-6 text-center">
            <img src="/Wayfare_favicon.jpeg" alt="Wayfare Logo" className="mx-auto mb-4 h-10 w-10 object-cover rounded-xl shadow-glow" />
            <div className="flex items-center gap-2 justify-center w-48 mx-auto">
              {steps.map((s, i) => (
                <div key={s} className={`h-1.5 flex-1 rounded-full transition-colors duration-500 ${i <= stepIndex ? 'bg-beacon shadow-[0_0_8px_rgba(255,178,56,0.5)]' : 'bg-ink-700'}`} />
              ))}
            </div>
        </div>

        <AnimatePresence mode="wait">
          {step === 'role' && (
            <motion.div key="role" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} className="space-y-4">
              <div className="text-center">
                <h1 className="font-display text-2xl font-semibold tracking-tight text-white">How will you use Wayfare?</h1>
                <p className="mt-1 text-xs text-ink-100">You can always add the other role later.</p>
              </div>
              <div className="space-y-3">
                <OptionCard title="Travel as a Passenger" desc="Find and book seats on matched routes" selected={form.role === 'rider'} onClick={() => setForm({ ...form, role: 'rider' })} />
                <OptionCard title="Drive & offer seats" desc="Post routes and earn from empty seats — requires ID + license verification" selected={form.role === 'driver'} onClick={() => setForm({ ...form, role: 'driver' })} />
                <OptionCard title="Both" desc="Switch between riding and driving anytime" selected={form.role === 'both'} onClick={() => setForm({ ...form, role: 'both' })} />
              </div>
            </motion.div>
          )}

          {step === 'preference' && (
            <motion.div key="preference" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} className="space-y-4">
              <div className="text-center">
                <h1 className="font-display text-2xl font-semibold tracking-tight text-white">Who are you comfortable riding with?</h1>
                <p className="mt-1 text-xs text-ink-100">This is a preference, not a restriction — you can change it anytime in settings.</p>
              </div>
              <div className="space-y-3">
                <OptionCard title="Same gender only" desc="Only match me with the same gender" selected={form.genderPref === 'same'} onClick={() => setForm({ ...form, genderPref: 'same' })} />
                <OptionCard title="Open to all" desc="Match me with anyone on a compatible route" selected={form.genderPref === 'any'} onClick={() => setForm({ ...form, genderPref: 'any' })} />
              </div>
            </motion.div>
          )}

          {step === 'details' && (
            <motion.div key="details" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} className="space-y-5">
              <div className="text-center">
                <h1 className="font-display text-2xl font-semibold tracking-tight text-white">Complete your profile</h1>
                <p className="mt-1 text-xs text-ink-100">Help build trust in the community by providing your details.</p>
              </div>
              
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-white ml-1">Phone Number</label>
                    <input type="tel" required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="0300 1234567" className="w-full rounded-xl border border-ink-700/60 bg-[#0F131C] px-3 py-2.5 text-sm text-white placeholder-ink-400 focus:border-beacon focus:outline-none focus:ring-1 focus:ring-beacon" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-white ml-1">Age</label>
                    <input type="number" required value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} placeholder="e.g. 25" className="w-full rounded-xl border border-ink-700/60 bg-[#0F131C] px-3 py-2.5 text-sm text-white placeholder-ink-400 focus:border-beacon focus:outline-none focus:ring-1 focus:ring-beacon" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-white ml-1">City</label>
                  <input required value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="e.g. Islamabad" className="w-full rounded-xl border border-ink-700/60 bg-[#0F131C] px-3 py-2.5 text-sm text-white placeholder-ink-400 focus:border-beacon focus:outline-none focus:ring-1 focus:ring-beacon" />
                </div>

                <div className="pt-2 border-t border-ink-700/50">
                  <h3 className="text-xs font-semibold text-white mb-2 ml-1">Address Details</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-medium text-ink-300 ml-1">House / Flat No.</label>
                      <input required value={form.house} onChange={(e) => setForm({ ...form, house: e.target.value })} placeholder="House 12" className="w-full rounded-xl border border-ink-700/60 bg-[#0F131C] px-3 py-2.5 text-sm text-white placeholder-ink-400 focus:border-beacon focus:outline-none focus:ring-1 focus:ring-beacon" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-medium text-ink-300 ml-1">Street</label>
                      <input required value={form.street} onChange={(e) => setForm({ ...form, street: e.target.value })} placeholder="Street 4" className="w-full rounded-xl border border-ink-700/60 bg-[#0F131C] px-3 py-2.5 text-sm text-white placeholder-ink-400 focus:border-beacon focus:outline-none focus:ring-1 focus:ring-beacon" />
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-medium text-ink-300 ml-1">Nearby Landmark (Optional)</label>
                  <input value={form.landmark} onChange={(e) => setForm({ ...form, landmark: e.target.value })} placeholder="Near Super Market..." className="w-full rounded-xl border border-ink-700/60 bg-[#0F131C] px-3 py-2.5 text-sm text-white placeholder-ink-400 focus:border-beacon focus:outline-none focus:ring-1 focus:ring-beacon" />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-6 flex items-center justify-end">
          <Button variant="primary" onClick={next} disabled={!canContinue} className="px-6 py-2.5">
            {stepIndex === steps.length - 1 ? 'Finish setup' : 'Continue'}
          </Button>
        </div>
      </motion.div>
    </div>
  )
}
