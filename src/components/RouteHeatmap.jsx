import { motion } from 'framer-motion'

export default function RouteHeatmap({ onRouteSelect }) {
  const famousRoutes = [
    { from: 'Islamabad', to: 'Peshawar', count: 42, intensity: 1.0 },
    { from: 'Islamabad', to: 'Mansehra', count: 35, intensity: 0.8 },
    { from: 'Islamabad', to: 'Haripur', count: 28, intensity: 0.6 },
    { from: 'F-7 Markaz, Islamabad', to: 'Bahria Town, Rawalpindi', count: 45, intensity: 1.0, type: 'In-city' },
    { from: 'G-11 Markaz, Islamabad', to: 'Blue Area, Islamabad', count: 38, intensity: 0.9, type: 'In-city' },
  ]

  return (
    <div className="rounded-2xl border border-ink-700 bg-ink-800/50 p-5 shadow-inner">
      <h3 className="font-display text-sm font-medium text-white mb-4 flex items-center gap-2">
        <span className="text-beacon">🔥</span> High Demand Routes
      </h3>
      
      <div className="space-y-4">
        {famousRoutes.map((item, i) => (
          <div 
            key={i} 
            className="relative cursor-pointer group"
            onClick={() => onRouteSelect && onRouteSelect(item.from, item.to)}
          >
            <div className="flex justify-between items-center text-xs font-medium text-ink-100 mb-1">
              <span className="truncate pr-4 group-hover:text-white transition-colors">{item.from} → {item.to}</span>
              <div className="flex items-center gap-2">
                {item.type && <span className="bg-ink-700 text-[10px] px-2 py-0.5 rounded-md text-ink-300">{item.type}</span>}
                <span className="shrink-0 text-ink-400 group-hover:text-beacon transition-colors">Select Route</span>
              </div>
            </div>
            <div className="h-1.5 w-full rounded-full bg-ink-700 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${item.intensity * 100}%` }}
                transition={{ duration: 1, ease: "easeOut", delay: i * 0.1 }}
                className="h-full bg-gradient-to-r from-beacon to-verified group-hover:brightness-125"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
