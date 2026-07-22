import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'
import Button from './Button'

const RIDER_TAGS = ['Clean car', 'On time', 'Safe driving', 'Great conversation', 'Followed the agreed route']
const DRIVER_TAGS = ['On time', 'Respectful', 'Easy pickup location']

export default function ReviewModal({ isOpen, onClose, bookingId, revieweeId, reviewerId, role }) {
  const [rating, setRating] = useState(0)
  const [selectedTags, setSelectedTags] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const availableTags = role === 'rider' ? RIDER_TAGS : DRIVER_TAGS

  const toggleTag = (tag) => {
    setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])
  }

  const handleSubmit = async () => {
    if (rating === 0) {
      setError('Please select a rating')
      return
    }

    setLoading(true)
    setError('')

    const { error: insertError } = await supabase.from('reviews').insert({
      booking_id: bookingId,
      reviewer_id: reviewerId,
      reviewee_id: revieweeId,
      rating,
      tags: selectedTags
    })

    if (insertError) {
      // If it's a unique constraint violation, they already reviewed
      if (insertError.code === '23505') {
        setError('You have already submitted a review for this ride.')
      } else {
        setError(insertError.message)
      }
    } else {
      onClose()
    }
    setLoading(false)
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/80 p-4 backdrop-blur-sm"
      >
        <motion.div 
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="w-full max-w-md rounded-[2rem] border border-ink-700/50 bg-[#121620] p-6 shadow-2xl"
        >
          <div className="text-center">
            <h2 className="font-display text-xl font-bold text-white">How was your ride?</h2>
            <p className="mt-1 text-sm text-ink-300">Your feedback helps keep the community safe.</p>
          </div>

          <div className="mt-6 flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                className={`text-4xl transition-transform hover:scale-110 ${rating >= star ? 'text-beacon' : 'text-ink-700'}`}
              >
                ★
              </button>
            ))}
          </div>

          <div className="mt-6">
            <label className="text-xs font-medium text-ink-100">Select all that apply</label>
            <div className="mt-3 flex flex-wrap gap-2">
              {availableTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                    selectedTags.includes(tag) 
                      ? 'border-beacon bg-beacon/10 text-beacon' 
                      : 'border-ink-700 bg-ink-800 text-ink-300 hover:border-ink-500 hover:text-white'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {error && <div className="mt-4 rounded-lg bg-danger/10 p-2 text-center text-xs text-danger">{error}</div>}

          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <Button variant="secondary" onClick={onClose} className="flex-1">Skip</Button>
            <Button variant="primary" onClick={handleSubmit} disabled={loading} className="flex-1">
              {loading ? 'Submitting...' : 'Submit'}
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
