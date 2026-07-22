import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useApp } from '../context/AppContext'

export default function EarningsDashboard() {
  const { user } = useApp()
  const [weeklyEarnings, setWeeklyEarnings] = useState(0)
  const [trendData, setTrendData] = useState(Array(8).fill(0))
  const [topRoutes, setTopRoutes] = useState([])

  useEffect(() => {
    async function fetchEarnings() {
      if (!user) return

      const { data: bookings } = await supabase
        .from('bookings')
        .select(`
          fare,
          created_at,
          ride:ride_id (
            from_location,
            to_location
          )
        `)
        .eq('status', 'completed')
        .eq('ride.driver_id', user.id)

      if (bookings) {
        const validBookings = bookings.filter(b => b.ride !== null)
        const now = new Date()
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        
        let thisWeek = 0
        const routeTotals = {}
        const weeks = Array(8).fill(0)

        validBookings.forEach(b => {
          const fare = Number(b.fare) || 0
          const date = new Date(b.created_at)
          
          if (date >= oneWeekAgo) {
            thisWeek += fare
          }

          const diffTime = Math.abs(now - date)
          const diffWeeks = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 7))
          if (diffWeeks < 8) {
            weeks[7 - diffWeeks] += fare
          }

          const routeKey = `${b.ride.from_location} \u2192 ${b.ride.to_location}`
          routeTotals[routeKey] = (routeTotals[routeKey] || 0) + fare
        })

        setWeeklyEarnings(thisWeek)
        setTrendData(weeks)

        const sortedRoutes = Object.entries(routeTotals)
          .map(([route, total]) => ({ route, total }))
          .sort((a, b) => b.total - a.total)
          .slice(0, 5)

        setTopRoutes(sortedRoutes)
      }
    }

    fetchEarnings()
  }, [user])

  const maxWeekly = Math.max(...trendData, 1)

  return (
    <>
      <div className="balance-card">
        <div>
          <div className="balance-eyebrow">Current balance</div>
          <div className="balance-num">Rs {weeklyEarnings.toLocaleString()}</div>
        </div>
        <button className="payout-btn">Request payout</button>
      </div>

      <section className="panel">
        <div className="panel-head"><span className="panel-title">Earnings trend</span></div>
        <div className="bar-chart">
          {trendData.map((val, i) => {
            const height = Math.max(5, (val / maxWeekly) * 100)
            const isHigh = val === Math.max(...trendData) && val > 0
            return (
              <div key={i} className="bar-col">
                <div className={`bar ${isHigh ? 'hi' : ''}`} style={{ height: `${height}%` }}></div>
                <div className="bar-label">W{i + 1}</div>
              </div>
            )
          })}
        </div>
      </section>

      <section className="panel">
        <div className="panel-head"><span className="panel-title">Top earning routes</span></div>
        {topRoutes.length === 0 ? (
          <p className="text-sm text-[#8B9298]">Complete some rides to see your top routes.</p>
        ) : (
          <div>
            {topRoutes.map((route, i) => (
              <div key={i} className="payout-row">
                <div className="payout-route">{route.route}</div>
                <div className="payout-amt">Rs {route.total.toLocaleString()}</div>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  )
}
