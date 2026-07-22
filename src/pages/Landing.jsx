import { useRef, useEffect, useState } from 'react'
import { motion, useScroll, useTransform, useInView, animate, AnimatePresence } from 'framer-motion'
import { useNavigate, Link } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import Navbar from '../components/Navbar'
import Button from '../components/Button'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'
import AppReviewModal from '../components/AppReviewModal'

function FAQAccordion({ faq }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div 
      className="bg-ink-800/40 border border-ink-700/50 rounded-2xl p-6 transition-all cursor-pointer hover:bg-ink-800/80"
      onClick={() => setIsOpen(!isOpen)}
    >
      <h3 className="font-semibold text-lg text-white flex items-center justify-between">
        {faq.q}
        <motion.svg 
          animate={{ rotate: isOpen ? 180 : 0 }} 
          className="w-5 h-5 text-ink-400" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </motion.svg>
      </h3>
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <p className="text-ink-400 text-sm leading-relaxed mt-4 pt-4 border-t border-ink-700/50">{faq.a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Reusable Counter component for Stats
function AnimatedCounter({ from, to, label, prefix = '', suffix = '' }) {
  const nodeRef = useRef(null)
  const inView = useInView(nodeRef, { once: true, margin: "-100px" })

  useEffect(() => {
    if (inView && nodeRef.current) {
      const controls = animate(from, to, {
        duration: 2.5,
        ease: "easeOut",
        onUpdate(value) {
          if (nodeRef.current) {
            nodeRef.current.textContent = `${prefix}${Math.floor(value).toLocaleString()}${suffix}`
          }
        }
      })
      return () => controls.stop()
    }
  }, [inView, from, to, prefix, suffix])

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <span ref={nodeRef} className="text-4xl font-display font-bold bg-route-gradient bg-clip-text text-transparent">
        {from}
      </span>
      <span className="text-sm text-ink-400 mt-2 uppercase tracking-widest font-medium">{label}</span>
    </div>
  )
}

const staggerContainer = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.15 } }
}

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } }
}

export default function Landing() {
  const navigate = useNavigate()
  const { user, loading } = useApp()
  const { scrollYProgress } = useScroll()
  const scaleProgress = useTransform(scrollYProgress, [0, 1], [0, 1])

  const [appReviews, setAppReviews] = useState([]);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const { data, error } = await supabase
          .from('app_reviews')
          .select('*, user:users(name, city, avatar)')
          .eq('status', 'approved')
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        const formatted = data.map(r => ({
          n: r.user?.name || 'Anonymous',
          c: r.user?.city || 'Verified User',
          q: `"${r.content}"`,
          r: r.rating,
          a: r.user?.avatar
        }));

        const mockData = [
          { n: 'Ayesha K.', c: 'Islamabad', q: '"Found a ride to Bahria Town in under two minutes. Driver was verified and the whole trip felt incredibly safe."', r: 5 },
          { n: 'Sana M.', c: 'Rawalpindi', q: '"As a female rider, the gender matched preference actually made me comfortable using a carpool app for the first time."', r: 5 },
          { n: 'Bilal A.', c: 'Lahore', q: '"Switched from ride-hailing apps for my daily commute. Much cheaper and I always ride with the same great small group now."', r: 5 },
          { n: 'Omar T.', c: 'Karachi', q: '"The SOS feature and live tracking gives my family peace of mind. Best commuter app in Pakistan right now."', r: 5 },
          { n: 'Fatima Z.', c: 'Islamabad', q: '"I offer rides every morning. It covers my fuel costs and I\'ve met some wonderful people along the way."', r: 5 },
          { n: 'Hassan R.', c: 'Peshawar', q: '"The identity verification is strict, which is exactly what you want in a carpool app. 10/10 experience."', r: 5 },
        ];

        setAppReviews([...formatted, ...mockData]);
      } catch (err) {
        console.error('Error fetching app reviews:', err);
      }
    };
    fetchReviews();
  }, []);

  useEffect(() => {
    if (appReviews.length === 0) return;
    const interval = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % Math.ceil(appReviews.length / 3));
    }, 6000);
    return () => clearInterval(interval);
  }, [appReviews.length]);

  const handleWriteReview = () => {
    if (!user) {
      toast.error('You must be logged in to write a review.');
      navigate('/login');
    } else {
      setIsReviewModalOpen(true);
    }
  };

  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard', { replace: true })
    }
  }, [user, loading, navigate])

  return (
    <div className="min-h-full bg-ink-900 text-white relative">
      {/* Global Polish: Scroll Progress Bar */}
      <motion.div 
        className="fixed top-0 left-0 right-0 h-1 bg-route-gradient z-50 origin-left"
        style={{ scaleX: scaleProgress }}
      />
      
      {/* Global Polish: Subtle Noise Texture */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-0" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }} />

      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden px-6 pt-24 pb-32 sm:pt-32 sm:pb-40 flex flex-col items-center">
        {/* Animated Background Glow */}
        <motion.div 
          animate={{ x: [-20, 20, -20], y: [-20, 20, -20] }}
          transition={{ repeat: Infinity, duration: 15, ease: "linear" }}
          className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[200%] sm:w-[800px] h-[300px] sm:h-[400px] bg-beacon/10 blur-[120px] rounded-full pointer-events-none z-0"
        />

        <motion.div variants={staggerContainer} initial="hidden" animate="show" className="relative z-10 w-full max-w-5xl text-center">
          <motion.div variants={fadeUp} className="mx-auto mb-8 flex w-fit items-center gap-2.5 rounded-full border border-ink-600 bg-ink-800/80 backdrop-blur-md px-5 py-2 text-xs font-medium text-ink-100 shadow-xl">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-verified opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-verified"></span>
            </span>
            ID-verified drivers &amp; riders, every trip
          </motion.div>

          <motion.h1 variants={fadeUp} className="text-balance font-display text-5xl font-semibold leading-[1.05] tracking-tight sm:text-7xl lg:text-8xl">
            Your next ride,
            <br />
            <span className="bg-route-gradient bg-clip-text text-transparent">already going your way.</span>
          </motion.h1>

          <motion.p variants={fadeUp} className="mx-auto mt-8 max-w-2xl text-balance text-lg sm:text-xl text-ink-100 leading-relaxed">
            Wayfare matches you with verified drivers headed the same direction —
            in your city or across it — with gender-matched preferences and a
            safety layer built into every step.
          </motion.p>

          <motion.div variants={fadeUp} className="mt-12 flex flex-wrap items-center justify-center gap-5">
            <Button 
              variant="primary" 
              className="px-8 py-4 text-base group hover:scale-105 shadow-[0_0_20px_rgba(47,225,184,0.3)] transition-all" 
              onClick={() => navigate(user ? '/dashboard' : '/login')}
            >
              {user ? 'Go to Dashboard' : 'Find a ride'}
              <svg className="w-4 h-4 ml-2 inline-block transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
            </Button>
            {!user && (
              <Button 
                variant="outline" 
                className="px-8 py-4 text-base hover:scale-105 hover:border-beacon hover:text-white transition-all bg-ink-800/50 backdrop-blur-sm" 
                onClick={() => navigate('/login')}
              >
                Become a driver
              </Button>
            )}
          </motion.div>
        </motion.div>

        {/* Floating Stat Chips (Desktop only) */}
        <motion.div 
          initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1, duration: 1 }}
          className="hidden lg:flex absolute top-1/3 left-[5%] xl:left-[10%] items-center gap-3 bg-ink-800/60 backdrop-blur-md border border-ink-700 p-3 rounded-2xl shadow-2xl"
        >
          <div className="h-10 w-10 rounded-full bg-warning/20 flex items-center justify-center text-warning font-bold text-lg">⭐</div>
          <div>
            <div className="font-display font-bold text-white leading-tight">4.8/5</div>
            <div className="text-[10px] text-ink-400 uppercase tracking-wide">Average Rating</div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.2, duration: 1 }}
          className="hidden lg:flex absolute top-1/2 right-[5%] xl:right-[10%] items-center gap-3 bg-ink-800/60 backdrop-blur-md border border-ink-700 p-3 rounded-2xl shadow-2xl"
        >
          <div className="h-10 w-10 rounded-full bg-verified/20 flex items-center justify-center text-verified font-bold text-lg">✓</div>
          <div>
            <div className="font-display font-bold text-white leading-tight">100%</div>
            <div className="text-[10px] text-ink-400 uppercase tracking-wide">ID Verified</div>
          </div>
        </motion.div>

        {/* Modern Map Route Card */}
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.6, duration: 0.8, ease: "easeOut" }}
          className="relative w-full mx-auto mt-24 max-w-4xl rounded-[2rem] border border-ink-700 bg-ink-900/80 p-1 shadow-2xl backdrop-blur-md overflow-hidden group"
        >
          {/* Subtle Grid Background Pattern */}
          <div className="absolute inset-0 z-0 opacity-20 group-hover:opacity-40 transition-opacity duration-700" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%232C3363\' fill-opacity=\'0.4\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }} />
          
          <div className="relative bg-ink-800/90 rounded-[1.8rem] p-8 overflow-hidden">
            <div className="absolute inset-0 -z-10 bg-radial-glow opacity-30 group-hover:opacity-60 transition-opacity duration-700" />
            
            {/* Map Interface Overlay */}
            <svg viewBox="0 0 800 180" className="w-full relative z-10 drop-shadow-xl">
              <defs>
                <linearGradient id="routeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#FFB238" />
                  <stop offset="50%" stopColor="#4A90E2" />
                  <stop offset="100%" stopColor="#2FE1B8" />
                </linearGradient>
                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="4" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#2C3363" strokeWidth="1" strokeOpacity="0.15" />
                </pattern>
              </defs>

              {/* City Grid Background */}
              <rect width="100%" height="100%" fill="url(#grid)" />

              {/* Topographic Map Features (Rivers / Roads) */}
              <path d="M 0 160 Q 200 180 400 60 T 800 -20" fill="none" stroke="#38BDF8" strokeWidth="30" strokeOpacity="0.04" strokeLinecap="round" />
              <path d="M 0 160 Q 200 180 400 60 T 800 -20" fill="none" stroke="#38BDF8" strokeWidth="10" strokeOpacity="0.06" strokeLinecap="round" />
              
              <path d="M -50 40 Q 150 100 300 20 T 850 60" fill="none" stroke="#2C3363" strokeWidth="1" strokeOpacity="0.4" />
              <path d="M -50 140 Q 250 80 400 160 T 850 100" fill="none" stroke="#2C3363" strokeWidth="1" strokeOpacity="0.4" />

              {/* Core Route Path (Zig-Zag S-Curve) */}
              <path d="M 60 120 C 140 120, 180 40, 260 40 S 380 140, 460 140 S 660 60, 740 60" fill="none" stroke="#1A1F36" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M 60 120 C 140 120, 180 40, 260 40 S 380 140, 460 140 S 660 60, 740 60" fill="none" stroke="url(#routeGrad)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="12 12" className="animate-dash" />

              {/* Waypoints */}
              {/* Origin: F-7, Islamabad */}
              <g transform="translate(60, 120)">
                <circle r="14" fill="#FFB238" fillOpacity="0.2" className="animate-ping" style={{ animationDuration: '3s' }} />
                <circle r="6" fill="#FFB238" filter="url(#glow)" />
                <circle r="2.5" fill="#141724" />
                <text y="28" textAnchor="middle" fill="#A7ADD1" fontSize="13" fontFamily="Inter" fontWeight="600">F-7, Islamabad</text>
              </g>

              {/* Stop 1: Faizabad */}
              <g transform="translate(260, 40)">
                <circle r="8" fill="#1A1F36" stroke="#6B72A0" strokeWidth="2" />
                <circle r="3" fill="#6B72A0" />
                <text y="-16" textAnchor="middle" fill="#6B72A0" fontSize="12" fontFamily="Inter" fontWeight="500">Faizabad</text>
              </g>

              {/* Stop 2: Rawat */}
              <g transform="translate(460, 140)">
                <circle r="8" fill="#1A1F36" stroke="#6B72A0" strokeWidth="2" />
                <circle r="3" fill="#6B72A0" />
                <text y="24" textAnchor="middle" fill="#6B72A0" fontSize="12" fontFamily="Inter" fontWeight="500">Rawat</text>
              </g>

              {/* Destination: Bahria Town */}
              <g transform="translate(740, 60)">
                <circle r="18" fill="#2FE1B8" fillOpacity="0.2" className="animate-ping" style={{ animationDuration: '3s', animationDelay: '1s' }} />
                <circle r="6" fill="#2FE1B8" filter="url(#glow)" />
                <circle r="2.5" fill="#141724" />
                <text y="28" textAnchor="middle" fill="#A7ADD1" fontSize="13" fontFamily="Inter" fontWeight="600">Bahria Town</text>
              </g>

              {/* Modern Car Indicator animating along the curve */}
              <g>
                <animateMotion dur="20s" repeatCount="indefinite" path="M 60 120 C 140 120, 180 40, 260 40 S 380 140, 460 140 S 660 60, 740 60" rotate="auto" />
                {/* Drop Shadow */}
                <rect x="-20" y="-12" width="40" height="24" rx="8" fill="#000" fillOpacity="0.4" filter="url(#glow)" />
                {/* Car Chassis */}
                <path d="M -16 -9 L 12 -9 C 16 -9 18 -6 18 -4 L 18 4 C 18 6 16 9 12 9 L -16 9 C -20 9 -20 -9 -16 -9 Z" fill="#F8FAFC" />
                {/* Panoramic Glass Roof */}
                <rect x="-6" y="-7" width="14" height="14" rx="3" fill="#0F172A" />
                {/* Headlights */}
                <circle cx="16" cy="-6" r="4" fill="#FFB238" fillOpacity="0.5" filter="url(#glow)" />
                <circle cx="16" cy="6" r="4" fill="#FFB238" fillOpacity="0.5" filter="url(#glow)" />
                {/* Taillights */}
                <rect x="-17" y="-7" width="3" height="4" rx="1" fill="#EF4444" />
                <rect x="-17" y="3" width="3" height="4" rx="1" fill="#EF4444" />
              </g>
            </svg>

            <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-ink-700/50 pt-6">
              <div className="flex -space-x-3">
                <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=64&h=64&fit=crop" className="w-10 h-10 rounded-full border-2 border-ink-800" alt="Rider" />
                <img src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=64&h=64&fit=crop" className="w-10 h-10 rounded-full border-2 border-ink-800" alt="Rider" />
                <img src="https://images.unsplash.com/photo-1517841905240-472988babdf9?w=64&h=64&fit=crop" className="w-10 h-10 rounded-full border-2 border-ink-800" alt="Rider" />
                <div className="w-10 h-10 rounded-full border-2 border-ink-800 bg-ink-700 flex items-center justify-center text-xs font-medium text-white">+2</div>
              </div>
              <span className="text-sm font-medium text-ink-100 bg-ink-900/50 px-4 py-2 rounded-full border border-ink-700">5 riders matched today</span>
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-beacon opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-beacon"></span>
                </span>
                <span className="font-mono text-beacon bg-beacon/10 border border-beacon/20 px-4 py-2 rounded-full text-sm font-medium">~32 min · Rs 350/seat</span>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Social Proof / Stats Bar */}
      <section className="border-y border-ink-700/50 bg-ink-900 px-6 py-12 relative z-10">
        <div className="mx-auto max-w-6xl grid grid-cols-2 lg:grid-cols-4 gap-8 divide-x divide-ink-800">
          <AnimatedCounter from={0} to={50000} label="Riders Matched" suffix="+" />
          <AnimatedCounter from={0} to={45} label="Cities Covered" suffix="+" />
          <AnimatedCounter from={0} to={4} label="Average Rating" prefix="" suffix=".8" />
          <AnimatedCounter from={0} to={8500} label="Verified Drivers" suffix="+" />
        </div>
      </section>

      {/* Feature Cards Section */}
      <section id="safety" className="px-6 py-32 relative">
          <div className="mx-auto max-w-5xl">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 justify-center items-stretch">
              {[
                { t: 'ID & Selfie Verified', d: 'Every driver and rider passes a government ID and liveness check before their first ride. No anonymous accounts, ever.', icon: '🛡️' },
                { t: 'Gender-Matched', d: 'Set a preference for who you ride with — respected on every match, never forced. Total control over your comfort.', icon: '👥' },
                { t: 'Live Trip Sharing', d: 'Share your exact route and real-time location with someone you trust with one tap, for the duration of the whole ride.', icon: '📍' }
              ].map((f, i) => (
                <motion.div
                  key={f.t}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ delay: i * 0.15, duration: 0.6 }}
                  className="group relative overflow-hidden rounded-[2rem] border border-ink-700 bg-ink-800/30 p-8 hover:-translate-y-2 transition-all duration-300 hover:border-beacon/50 hover:bg-ink-800/60 hover:shadow-2xl flex flex-col items-center justify-center text-center"
                >
                  <div className="text-4xl mb-5 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300">{f.icon}</div>
                  <h3 className="font-display text-xl font-semibold text-white mb-3 text-center">{f.t}</h3>
                  <p className="text-ink-100 leading-relaxed text-center text-sm">{f.d}</p>
                  <div className="absolute inset-0 -z-10 bg-gradient-to-br from-beacon/0 to-beacon/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </motion.div>
              ))}
            </div>
          </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="px-6 py-32 bg-ink-800/20 border-y border-ink-700/50">
        <div className="mx-auto max-w-6xl">
           <div className="text-center mb-20">
            <h2 className="font-display text-3xl sm:text-5xl font-semibold mb-4">How Wayfare works</h2>
            <p className="text-ink-100 text-lg">Four simple steps to a better commute.</p>
          </div>
          
          <div className="relative">
            {/* Connecting line */}
            <div className="hidden lg:block absolute top-12 left-0 w-full h-0.5 bg-ink-700" />
            <motion.div 
              initial={{ scaleX: 0 }} whileInView={{ scaleX: 1 }} viewport={{ once: true }} transition={{ duration: 1.5, ease: "easeInOut" }}
              className="hidden lg:block absolute top-12 left-0 w-full h-0.5 bg-route-gradient origin-left" 
            />

            <div className="grid lg:grid-cols-4 gap-12 relative z-10">
              {[
                { step: '01', title: 'Create Profile', desc: 'Sign up and verify your identity securely.' },
                { step: '02', title: 'Set Route', desc: 'Enter your daily commute or one-off trip details.' },
                { step: '03', title: 'Get Matched', desc: 'Our algorithm finds the best verified matches.' },
                { step: '04', title: 'Ride & Rate', desc: 'Share the cost, enjoy the ride, and leave a review.' }
              ].map((s, i) => (
                <motion.div 
                  key={s.step}
                  initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.2, duration: 0.5 }}
                  className="relative flex flex-col items-center text-center lg:items-start lg:text-left"
                >
                  <div className="w-24 h-24 rounded-full bg-ink-900 border-4 border-ink-800 flex items-center justify-center font-display text-3xl font-bold text-beacon mb-6 shadow-xl relative z-10">
                    {s.step}
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">{s.title}</h3>
                  <p className="text-ink-100">{s.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Carousel */}
      <section id="testimonials" className="py-32 overflow-hidden relative">
        <div className="mx-auto max-w-6xl px-6 mb-16 text-center">
          <h2 className="font-display text-3xl sm:text-5xl font-semibold mb-4">Riders and drivers love Wayfare</h2>
          <p className="text-ink-100 text-lg mb-8">Join thousands of verified commuters.</p>
          <button 
            onClick={handleWriteReview}
            className="bg-[#FFB238] hover:bg-[#FFC565] text-[#14181C] font-semibold px-6 py-3 rounded-xl transition-colors shadow-lg shadow-[#FFB238]/20 inline-flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            Write a Review
          </button>
        </div>

        <div className="mx-auto max-w-6xl px-6">
          <div className="overflow-hidden">
            <motion.div 
              className="flex"
              animate={{ x: `-${currentSlide * 100}%` }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              {Array.from({ length: Math.ceil(appReviews.length / 3) }).map((_, chunkIdx) => (
                <div key={chunkIdx} className="w-full shrink-0 flex flex-col md:flex-row gap-6">
                  {appReviews.slice(chunkIdx * 3, chunkIdx * 3 + 3).map((r, i) => (
                    <div key={i} className="flex-1 rounded-3xl border border-ink-700 bg-ink-800/40 p-6 sm:p-8 backdrop-blur-sm flex flex-col">
                      <div className="flex text-warning mb-4">{'★'.repeat(r.r)}</div>
                      <p className="text-ink-50 text-base md:text-lg mb-6 leading-relaxed line-clamp-4 flex-1">{r.q}</p>
                      <div className="flex items-center gap-4 mt-auto">
                        {r.a ? (
                          <img src={r.a} alt={r.n} className="w-12 h-12 rounded-full object-cover" />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-route-gradient flex items-center justify-center font-bold text-ink-900 text-lg shadow-inner">
                            {r.n.charAt(0)}
                          </div>
                        )}
                        <div>
                          <div className="font-semibold text-white">{r.n}</div>
                          <div className="text-sm text-ink-400">{r.c}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {/* Fill empty spots if less than 3 in chunk to keep grid aligned on desktop */}
                  {Array.from({ length: 3 - appReviews.slice(chunkIdx * 3, chunkIdx * 3 + 3).length }).map((_, i) => (
                    <div key={`empty-${i}`} className="flex-1 hidden md:block" />
                  ))}
                </div>
              ))}
            </motion.div>
          </div>
        </div>

        {/* Carousel Indicators */}
        {appReviews.length > 3 && (
          <div className="flex justify-center mt-10 gap-2">
            {Array.from({ length: Math.ceil(appReviews.length / 3) }).map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentSlide(idx)}
                className={`h-2 rounded-full transition-all ${
                  currentSlide === idx ? 'bg-[#FFB238] w-8' : 'bg-ink-700 hover:bg-ink-500 w-2'
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </section>

      {/* Our Mission */}
      <section className="px-6 py-24 relative z-10">
        <div className="mx-auto max-w-6xl">
          <div className="bg-ink-800/40 border border-ink-700/50 rounded-[2.5rem] p-8 md:p-16 grid md:grid-cols-2 gap-12 items-center relative overflow-hidden backdrop-blur-xl">
            {/* Background elements */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-[#FFB238] opacity-[0.03] blur-3xl rounded-full translate-x-1/3 -translate-y-1/3" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#2FE1B8] opacity-[0.03] blur-3xl rounded-full -translate-x-1/3 translate-y-1/3" />
            
            <div className="relative z-10">
              <h2 className="font-display text-4xl sm:text-5xl font-bold mb-6 text-white tracking-tight">Our Mission</h2>
              <p className="text-ink-200 leading-relaxed mb-6">
                At <strong className="text-[#FFB238]">Wayfare</strong>, we believe that commuting should be the most effortless part of a person's day.
              </p>
              <p className="text-ink-400 leading-relaxed text-sm">
                In today's fast-paced world, daily travel is often plagued by congestion, high costs, and environmental impact. We built Wayfare to provide a safe, engaging, and premium digital environment where modern technology meets eco-friendly commuting. Our goal is to nurture a culture of shared mobility and trust in the hearts of the next generation of commuters.
              </p>
            </div>

            <div className="relative z-10 flex justify-center md:justify-end">
              <div className="bg-white rounded-[2rem] w-64 h-64 flex flex-col items-center justify-center shadow-[0_0_50px_rgba(255,178,56,0.1)] relative transition-transform hover:scale-105 duration-500">
                <div className="absolute inset-2 border-2 border-dashed border-ink-200/60 rounded-[1.75rem]" />
                <img src="/Wayfare_favicon.jpeg" alt="Wayfare Logo" className="h-28 w-28 object-cover rounded-3xl shadow-xl transform rotate-3" />
                <div className="mt-4 font-display text-ink-900 font-bold text-xl tracking-tight">Wayfare</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="px-6 py-32 relative">
        <div className="mx-auto max-w-4xl">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl sm:text-5xl font-semibold mb-4 text-white tracking-tight">Frequently Asked Questions</h2>
            <p className="text-ink-400 text-lg">Everything you need to know about riding and driving with Wayfare.</p>
          </div>

          <div className="grid gap-4">
            {[
              {
                q: "How are drivers and riders verified?",
                a: "Safety is our absolute priority. Every user must verify their official government ID, provide a live selfie, and confirm their phone number before they can book or offer a ride."
              },
              {
                q: "How does the pricing work?",
                a: "Prices are automatically calculated based on distance, route demand, and fuel costs to ensure a fair contribution. Drivers are not allowed to negotiate or overcharge."
              },
              {
                q: "What is the Women-Only feature?",
                a: "Female users can toggle on a specific preference to only match with other female riders and drivers, ensuring complete peace of mind during their commute."
              },
              {
                q: "Can I cancel a ride?",
                a: "Yes! You can cancel up to 2 hours before the scheduled departure time without any penalty. Late cancellations may incur a small fee to compensate the driver's time."
              }
            ].map((faq, i) => (
              <FAQAccordion key={i} faq={faq} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-ink-800/30" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-3xl h-[400px] bg-route-gradient opacity-10 blur-[150px] pointer-events-none" />
        
        <div className="relative z-10 mx-auto max-w-3xl text-center">
          <h2 className="font-display text-4xl font-semibold sm:text-6xl mb-6 text-white">Ready when your route is.</h2>
          <p className="text-xl text-ink-100 mb-10">{user ? 'Dive into your dashboard to find matches.' : 'Set up your profile in under two minutes.'}</p>
          
          <div className="relative inline-block group">
            <div className="absolute -inset-1 bg-route-gradient rounded-full blur opacity-50 group-hover:opacity-100 transition duration-500"></div>
            <Button variant="primary" className="relative px-10 py-5 text-lg font-semibold" onClick={() => navigate(user ? '/dashboard' : '/login')}>
              {user ? 'Go to Dashboard' : 'Create your profile'}
            </Button>
          </div>

          <div className="mt-12 flex flex-wrap justify-center gap-6 text-sm text-ink-400 font-medium">
            <span className="flex items-center gap-2">✓ No spam calls</span>
            <span className="flex items-center gap-2">✓ ID verified only</span>
            <span className="flex items-center gap-2">✓ Cancel anytime</span>
          </div>
        </div>
      </section>

      <footer className="border-t border-ink-700 bg-[#0B0F19] px-5 py-8 md:px-8 md:py-16 lg:px-12 relative z-10 w-full">
        <div className="flex flex-col md:grid md:grid-cols-3 gap-8 md:gap-12 w-full mb-8 md:mb-16 max-w-7xl mx-auto">
          
          {/* Column 1: Brand & Bio */}
          <div className="flex flex-col gap-3 md:gap-0">
            <Link to="/" className="flex items-center gap-2 md:gap-3 mb-0 md:mb-4">
              <img src="/Wayfare_favicon.jpeg" alt="Wayfare Logo" className="h-6 w-6 md:h-8 md:w-8 object-cover rounded-md md:rounded-lg" />
              <span className="font-display text-lg md:text-xl font-semibold tracking-tight text-white">Wayfare</span>
            </Link>
            <p className="text-ink-400 text-[12px] md:text-sm leading-relaxed max-w-[220px] md:max-w-sm mb-2 md:mb-6">
              A smart, verified, and eco-friendly carpool platform where safe journeys meet great company.
            </p>
            <div className="flex items-center gap-4 md:gap-5 text-ink-500 mt-1 md:mt-0">
              <a href="#" className="hover:text-beacon transition-colors"><svg className="w-4 h-4 md:w-5 md:h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/></svg></a>
              <a href="#" className="hover:text-beacon transition-colors"><svg className="w-4 h-4 md:w-5 md:h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg></a>
              <a href="#" className="hover:text-beacon transition-colors"><svg className="w-4 h-4 md:w-5 md:h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg></a>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div className="hidden md:block md:px-8 mt-2 md:mt-0">
            <h4 className="font-semibold text-white mb-3 md:mb-6 tracking-wide text-[13px] md:text-base">Quick Links</h4>
            <ul className="space-y-2.5 md:space-y-4 text-[12px] md:text-sm text-ink-400">
              <li><a href="/#how-it-works" className="hover:text-white transition-colors">Find a ride</a></li>
              <li><a href="/#how-it-works" className="hover:text-white transition-colors">Offer a ride</a></li>
              <li><a href="/#testimonials" className="hover:text-white transition-colors">Circles</a></li>
              <li><a href="#safety" className="hover:text-white transition-colors">Safety</a></li>
            </ul>
          </div>

          {/* Column 3: Get in Touch & Newsletter */}
          <div className="mt-2 md:mt-0">
            <h4 className="font-semibold text-white mb-6 tracking-wide hidden md:block">Get in Touch</h4>
            <div className="hidden md:flex items-center gap-3 text-sm text-ink-400 mb-8 hover:text-white transition-colors cursor-pointer w-fit">
              <svg className="w-5 h-5 text-ink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              support@wayfare.com
            </div>

            <h4 className="font-semibold text-white mb-3 md:mb-4 text-[11px] md:text-[10px] uppercase tracking-wider text-ink-500 md:text-ink-400">Join Our Newsletter</h4>
            
            {/* Desktop Newsletter */}
            <div className="hidden md:flex flex-col sm:flex-row gap-3">
              <input 
                type="email" 
                placeholder="Email address" 
                className="w-full bg-ink-800 border border-ink-700/60 rounded-lg px-4 py-2.5 text-sm text-white placeholder-ink-500 focus:outline-none focus:border-beacon transition-colors"
              />
              <button className="bg-[#FFB238] hover:bg-[#FFB238]/90 text-ink-900 font-bold px-6 py-2.5 rounded-lg text-sm transition-colors whitespace-nowrap">
                Subscribe
              </button>
            </div>

            {/* Mobile Newsletter (Ultra Compact) */}
            <div className="relative flex md:hidden items-center w-full max-w-[320px]">
              <input 
                type="email" 
                placeholder="Email address" 
                className="w-full bg-[#1A2026] border border-white/5 rounded-full pl-4 pr-24 py-2.5 text-[12px] text-white focus:outline-none focus:border-[#FFB238]/50"
              />
              <button className="absolute right-1 bg-[#FFB238] text-[#14181C] font-semibold px-4 py-1.5 rounded-full text-[11px]">
                Subscribe
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Strip */}
        <div className="border-t border-ink-800 pt-5 md:pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-[10px] md:text-xs text-ink-500 w-full max-w-7xl mx-auto">
          <div className="order-2 md:order-1">© {new Date().getFullYear()} Wayfare. All rights reserved.</div>
          <div className="flex gap-6 order-1 md:order-2">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
          </div>
        </div>
      </footer>

      {/* App Review Modal */}
      <AppReviewModal 
        isOpen={isReviewModalOpen} 
        onClose={() => setIsReviewModalOpen(false)} 
      />
    </div>
  )
}
