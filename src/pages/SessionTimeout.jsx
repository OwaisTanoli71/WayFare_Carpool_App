import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Shield, Lock, ArrowRight, CheckCircle2 } from 'lucide-react'

export default function SessionTimeout() {
  const navigate = useNavigate()

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: "spring", stiffness: 300, damping: 24 }
    }
  }

  return (
    <div className="min-h-screen bg-[#0C1017] text-white flex items-center justify-center p-4 relative overflow-hidden font-body selection:bg-amber-500/30">
      
      {/* Animated Background Elements */}
      <motion.div 
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.1, 0.15, 0.1],
          rotate: [0, 90, 0]
        }}
        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
        className="absolute top-[10%] left-[20%] w-[500px] h-[500px] bg-amber-500/20 rounded-full blur-[120px] pointer-events-none"
      />
      <motion.div 
        animate={{ 
          scale: [1, 1.5, 1],
          opacity: [0.05, 0.1, 0.05],
          rotate: [0, -90, 0]
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="absolute bottom-[10%] right-[10%] w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[150px] pointer-events-none"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md relative z-10"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent rounded-[32px] blur-xl" />
        
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="bg-[#141923]/80 backdrop-blur-3xl border border-white/10 rounded-[32px] p-6 sm:p-8 shadow-2xl relative overflow-hidden"
        >
          {/* Top highlight line */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-[1px] bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />

          {/* Logo */}
          <motion.div variants={itemVariants} className="flex items-center justify-center gap-2.5 mb-6">
            <img src="/Wayfare_favicon.jpeg" alt="Wayfare Logo" className="w-9 h-9 rounded-[10px] object-cover shadow-[0_0_15px_rgba(245,158,11,0.2)]" />
            <span className="font-display font-bold text-xl text-white tracking-tight">Wayfare.ai</span>
          </motion.div>

          {/* Animated Lock Icon */}
          <motion.div variants={itemVariants} className="relative mx-auto w-20 h-20 mb-6 flex items-center justify-center">
            {/* Outer animated rings */}
            <motion.div 
              animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-0 border border-amber-500/30 rounded-full"
            />
            <motion.div 
              animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0, 0.3] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
              className="absolute inset-0 border border-amber-500/20 rounded-full"
            />
            
            {/* Center icon */}
            <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-b from-[#1E2536] to-[#161C2A] border border-white/10 flex items-center justify-center shadow-xl shadow-amber-500/10">
              <motion.div
                initial={{ rotateY: 0 }}
                animate={{ rotateY: [0, 15, -15, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              >
                <Lock className="w-7 h-7 text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]" strokeWidth={2} />
              </motion.div>
            </div>
          </motion.div>

          <div className="text-center">
            <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-bold uppercase tracking-widest mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse shadow-[0_0_5px_rgba(245,158,11,0.8)]" />
              Session Expired
            </motion.div>

            <motion.h1 variants={itemVariants} className="font-display text-[24px] sm:text-[28px] font-bold text-white tracking-tight mb-2 leading-tight">
              You've been logged out
            </motion.h1>
            
            <motion.p variants={itemVariants} className="text-[13px] text-ink-300 leading-relaxed mb-6 px-2">
              For your privacy and security, we automatically ended your session after 5 minutes of inactivity.
            </motion.p>
          </div>

          <motion.div variants={itemVariants} className="bg-black/20 rounded-2xl border border-white/5 p-4 mb-6 space-y-3">
            <div className="flex items-center gap-3 text-[13px] text-ink-200 font-medium">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>Authentication tokens revoked</span>
            </div>
            <div className="flex items-center gap-3 text-[13px] text-ink-200 font-medium">
              <Shield className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>Active ride states preserved securely</span>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="space-y-3">
            <button
              onClick={() => navigate('/login')}
              className="group relative w-full py-3 px-6 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-ink-950 font-display font-bold text-[15px] tracking-wide shadow-[0_4px_20px_rgba(245,158,11,0.25)] transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out rounded-2xl" />
              <span className="relative z-10">Sign In Again</span>
              <ArrowRight className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={() => navigate('/')}
              className="w-full py-2 text-[13px] font-medium text-ink-400 hover:text-white transition-colors"
            >
              Return to Homepage
            </button>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  )
}
