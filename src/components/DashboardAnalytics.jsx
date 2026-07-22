import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Car, Star, Wallet } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useApp } from '../context/AppContext'

export default function DashboardAnalytics() {
  const { user } = useApp()
  const [stats, setStats] = useState({
    rides: 0,
    earnings: 0,
    rating: 0,
    loading: true
  })
  
  useEffect(() => {
    async function fetchDashboardStats() {
      if (!user) return
      
      let rides = 0
      let earnings = 0
      let rating = 0

      try {
        // 1. Fetch completed rides
        const { data: driverStats } = await supabase.rpc('get_driver_stats', { driver_uuid: user.id })
        if (driverStats) {
          rides = driverStats.completed_rides
        }

        // 2. Fetch Earnings
        const { data: bookings } = await supabase
          .from('bookings')
          .select(`
            fare,
            ride:ride_id (driver_id)
          `)
          .eq('status', 'completed')

        if (bookings) {
          // Filter in JS since foreign table filtering is complex in supabase JS client sometimes
          const validBookings = bookings.filter(b => b.ride && b.ride.driver_id === user.id)
          earnings = validBookings.reduce((sum, b) => sum + (Number(b.fare) || 0), 0)
        }

        // 3. Fetch Rating
        const { data: rep } = await supabase.rpc('get_user_reputation', { target_user_id: user.id })
        if (rep) {
          rating = rep.rating
        }
      } catch (error) {
        console.error("Failed to load analytics:", error)
      } finally {
        setStats({ rides, earnings, rating, loading: false })
      }
    }

    fetchDashboardStats()
  }, [user])

  const cards = [
    { title: 'Total Rides', value: stats.rides, icon: Car, color: 'text-[#4FBDBA]', bg: 'bg-[#4FBDBA]/10', glow: 'bg-[#4FBDBA]' },
    { title: 'Total Earnings', value: `Rs ${stats.earnings.toLocaleString()}`, icon: Wallet, color: 'text-[#FFB238]', bg: 'bg-[#FFB238]/10', glow: 'bg-[#FFB238]' },
    { title: 'Current Rating', value: stats.rating || '--', icon: Star, color: 'text-[#E8654F]', bg: 'bg-[#E8654F]/10', glow: 'bg-[#E8654F]' }
  ]

  if (stats.loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className={`rounded-[24px] border border-white/5 bg-[#1A2026]/50 p-6 h-[140px] animate-pulse ${i === 3 ? 'col-span-2 md:col-span-1' : ''}`}></div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
      {cards.map((card, i) => (
        <motion.div
          key={card.title}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1, duration: 0.4 }}
          className={`rounded-[20px] border border-white/5 bg-gradient-to-b from-[#1E252C] to-[#14181C] p-4 sm:p-5 shadow-[0_4px_20px_rgba(0,0,0,0.2)] flex flex-row items-center justify-between group hover:border-white/10 hover:-translate-y-0.5 transition-all duration-300 ${i === 2 ? 'col-span-2 md:col-span-1' : ''}`}
        >
          <div>
            <div className="text-[11px] sm:text-[12px] font-semibold text-[#8B9298] uppercase tracking-[0.5px] mb-1">{card.title}</div>
            <div className="text-[22px] sm:text-[26px] font-display font-medium text-white tracking-tight">{card.value}</div>
          </div>
          <div className={`h-10 w-10 sm:h-12 sm:w-12 rounded-[12px] sm:rounded-[14px] ${card.bg} flex items-center justify-center ${card.color} border border-white/5 shrink-0 shadow-inner group-hover:scale-105 transition-transform`}>
            <card.icon className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={2} />
          </div>
        </motion.div>
      ))}
    </div>
  )
}
