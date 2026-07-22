import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Button from './Button'

export default function RideCirclePrompt({ driver, onDismiss }) {
  const [added, setAdded] = useState(false)

  const handleAdd = () => {
    const saved = JSON.parse(localStorage.getItem('wayfare_circles') || '[]')
    if (!saved.find(c => c.id === driver.id)) {
      saved.push(driver)
      localStorage.setItem('wayfare_circles', JSON.stringify(saved))
    }
    setAdded(true)
    setTimeout(() => {
      onDismiss()
    }, 2000)
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="mb-6 overflow-hidden rounded-2xl border border-verified/30 bg-verified/5 p-4 shadow-card"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="font-display font-medium text-verified">Trip completed!</div>
            <div className="text-sm text-ink-100">
              {added ? `Added ${driver.name} to your Ride Circle.` : `Add ${driver.name} to your Ride Circle?`}
            </div>
          </div>
          {!added ? (
            <div className="flex items-center gap-2">
              <Button variant="ghost" onClick={onDismiss} className="px-3 text-xs">Skip</Button>
              <Button variant="primary" onClick={handleAdd} className="px-3 text-xs bg-verified text-ink-900 border-none hover:bg-verified/90">Add</Button>
            </div>
          ) : (
            <div className="text-xl">✨</div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
