import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'

export default function SessionTimeout() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-[#0C1017] text-white flex items-center justify-center p-4 relative overflow-hidden font-body">
      {/* Background Decorative Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-teal/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Main Glassmorphic Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md bg-[#131823]/90 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 sm:p-10 shadow-2xl relative z-10 text-center"
      >
        {/* Top Wayfare Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <img src="/Wayfare_favicon.jpeg" alt="Wayfare Logo" className="w-8 h-8 rounded-xl object-cover shadow-md" />
          <span className="font-display font-extrabold text-lg text-white tracking-tight">Wayfare.ai</span>
        </div>

        {/* Security Shield Icon Badge */}
        <div className="relative mx-auto w-20 h-20 mb-6 flex items-center justify-center">
          <div className="absolute inset-0 bg-amber-500/20 rounded-2xl blur-lg animate-pulse" />
          <div className="relative w-full h-full rounded-2xl bg-gradient-to-b from-[#1E2536] to-[#161C2A] border border-amber-500/30 flex items-center justify-center shadow-lg">
            <svg className="w-10 h-10 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
        </div>

        {/* Status Pill */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[11px] font-extrabold uppercase tracking-wider mb-4">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
          Session Expired (5 Min Inactivity)
        </div>

        {/* Heading & Explanation */}
        <h1 className="font-display text-2xl sm:text-3xl font-black text-white tracking-tight mb-3">
          You've been logged out
        </h1>
        <p className="text-xs sm:text-sm text-ink-300 leading-relaxed mb-8">
          To protect your privacy and account security, your Wayfare session was automatically ended due to 5 minutes of inactivity.
        </p>

        {/* Security Bullet Points */}
        <div className="bg-[#0F131D] rounded-2xl border border-white/5 p-4 mb-8 text-left space-y-2.5">
          <div className="flex items-center gap-3 text-xs text-ink-200">
            <svg className="w-4 h-4 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Auth tokens safely revoked</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-ink-200">
            <svg className="w-4 h-4 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Active ride states preserved securely</span>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={() => navigate('/login')}
          className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-ink-950 font-display font-bold text-sm tracking-wide shadow-[0_0_25px_rgba(245,158,11,0.3)] transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
        >
          <span>Sign In Again</span>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </button>

        {/* Back to Home Link */}
        <button
          onClick={() => navigate('/')}
          className="mt-4 text-xs font-medium text-ink-400 hover:text-white transition-colors"
        >
          Return to Homepage
        </button>
      </motion.div>
    </div>
  )
}
