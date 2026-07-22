import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import RouteLine from './RouteLine'

const prefLabel = {
  female_only: 'Women only',
  male_only: 'Men only',
  any: 'Open to all'
}

export default function RideCard({ ride, index = 0 }) {
  const navigate = useNavigate()

  return (
    <motion.button
      onClick={() => navigate(`/ride/${ride.id}`)}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -6, scale: 1.01 }}
      className="focus-ring group w-full rounded-2xl border border-ink-700 bg-ink-800/60 p-6 text-left shadow-card shadow-inner transition-all duration-300 hover:border-beacon/40 hover:shadow-card-hover hover:bg-ink-800/80"
    >
      <div className="mb-4 flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-ink-700 font-display text-sm font-semibold text-ink-50 ring-2 ring-ink-600 shadow-inner transition-colors group-hover:ring-beacon/50">
            {ride.driver.avatar}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-medium text-ink-50">{ride.driver.name}</span>
              {ride.driver.verified && (
                <span className="flex items-center gap-1 rounded-full bg-verified/10 px-1.5 py-0.5 text-[10px] font-medium text-verified">
                  ✓ Verified
                </span>
              )}
            </div>
            <div className="text-xs text-ink-400 mt-0.5 font-mono">
              ★ {ride.driver.rating} · {ride.driver.trips} trips · {ride.car}
            </div>
          </div>
        </div>
        <span className="rounded-full bg-ink-700/50 px-3 py-1 text-[10px] font-medium uppercase tracking-wider text-ink-100 shadow-inner">
          {ride.type === 'in-city' ? 'In-city' : 'Intercity'}
        </span>
      </div>

      <RouteLine from={ride.from} to={ride.to} />

      <div className="mt-5 flex items-center justify-between border-t border-ink-700/50 pt-5">
        <div className="font-mono text-xs text-ink-400 group-hover:text-ink-100 transition-colors">
          {ride.date} · <span className="text-beacon/80">{ride.time}</span> · {ride.seats} seats
        </div>
        <div className="text-right">
          <div className="font-display text-xl font-semibold text-beacon tracking-tight">Rs {ride.price}</div>
          <div className="text-[10px] uppercase tracking-wider text-ink-400 mt-0.5">{prefLabel[ride.genderPref]}</div>
        </div>
      </div>
    </motion.button>
  )
}
