import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import Button from '../components/Button'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-ink-900 px-6 text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <svg className="mx-auto mb-6 h-12 w-32" viewBox="0 0 100 2" preserveAspectRatio="none">
          <motion.line
            x1="0" y1="1" x2="100" y2="1"
            stroke="url(#routeGrad)"
            strokeWidth="2"
            strokeDasharray="4 4"
            className="animate-dash"
          />
          <defs>
            <linearGradient id="routeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#FFB238" />
              <stop offset="100%" stopColor="#FF6B6B" />
            </linearGradient>
          </defs>
        </svg>
        
        <h1 className="font-display text-4xl font-bold text-white">Off route</h1>
        <p className="mt-3 text-ink-100 mb-8 max-w-sm">
          We couldn't find the page you're looking for. It might have been moved or the link is incorrect.
        </p>

        <Link to="/">
          <Button variant="primary">Return home</Button>
        </Link>
      </motion.div>
    </div>
  )
}
