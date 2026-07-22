import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Car, Star, Wallet } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useApp } from '../context/AppContext'

export default function DashboardAnalytics() {
  const { user } = useApp()
  const [stats, setStats] = useState({
    rides: user?.rides_offered || 0,
    earnings: 0,
    rating: user?.rating || 4.9
  })
  
  useEffect(() => {
    async function fetchDashboardStats() {
      if (!user) return
      
      let rides = user?.rides_offered || 0
      let earnings = 0
      let rating = user?.rating || 4.9

      try {
        // 1. Fetch completed rides
        const { data: driverStats } = await supabase.rpc('get_driver_stats', { driver_uuid: user.id })
        if (driverStats) {
          rides = driverStats.completed_rides ?? rides
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
          const validBookings = bookings.filter(b => b.ride && b.ride.driver_id === user.id)
          earnings = validBookings.reduce((sum, b) => sum + (Number(b.fare) || 0), 0)
        }

        // 3. Fetch Rating
        const { data: rep } = await supabase.rpc('get_user_reputation', { target_user_id: user.id })
        if (rep) {
          rating = rep.rating ?? rating
        }
      } catch (error) {
        console.error("Failed to load analytics:", error)
      } finally {
        setStats({ rides, earnings, rating })
      }
    }

    fetchDashboardStats()
  }, [user])

  const cards = [
    { title: 'Total Rides', value: stats.rides, icon: Car, color: 'text-[#4FBDBA]', bg: 'bg-[#4FBDBA]/10' },
    { title: 'Total Earnings', value: `Rs ${stats.earnings.toLocaleString()}`, icon: Wallet, color: 'text-[#FFB238]', bg: 'bg-[#FFB238]/10' },
    { title: 'Current Rating', value: stats.rating ? `${stats.rating} ★` : '4.9 ★', icon: Star, color: 'text-[#E8654F]', bg: 'bg-[#E8654F]/10' }
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
      {cards.map((card, i) => (
        <motion.div
          key={card.title}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.08, duration: 0.3 }}
          className={`rounded-[20px] border border-white/5 bg-gradient-to-b from-[#1E252C] to-[#14181C] p-4 sm:p-5 shadow-[0_4px_20px_rgba(0,0,0,0.2)] flex flex-row items-center justify-between group hover:border-white/10 transition-all duration-300 ${i === 2 ? 'col-span-2 md:col-span-1' : ''}`}
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
