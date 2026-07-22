import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useApp } from '../context/AppContext';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const AppReviewModal = ({ isOpen, onClose }) => {
  const { user } = useApp();
  const [rating, setRating] = useState(5);
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.error('You must be logged in to submit a review.');
      return;
    }
    if (content.trim().length < 10) {
      toast.error('Review must be at least 10 characters long.');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('app_reviews')
        .insert({
          user_id: user.id,
          rating,
          content: content.trim()
        });

      if (error) throw error;
      
      setSubmitted(true);
      toast.success('Review submitted successfully!');
    } catch (err) {
      console.error('Error submitting review:', err);
      toast.error('Failed to submit review.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeModal = () => {
    setSubmitted(false);
    setContent('');
    setRating(5);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
        {/* Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closeModal}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative bg-[#14181C] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl"
        >
          {submitted ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-[#FFB238]/20 text-[#FFB238] rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Thank you!</h3>
              <p className="text-ink-400 mb-6 text-sm">
                Your review has been submitted successfully and is currently pending admin approval. It will appear on the platform once approved.
              </p>
              <button 
                onClick={closeModal}
                className="w-full bg-white/10 hover:bg-white/20 text-white font-semibold py-3 rounded-xl transition-colors"
              >
                Close
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white tracking-tight">Write a Review</h2>
                <button 
                  onClick={closeModal}
                  className="p-2 text-ink-500 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-ink-300 mb-3">Rating</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className={`transition-colors ${star <= rating ? 'text-[#FFB238]' : 'text-ink-700 hover:text-ink-500'}`}
                      >
                        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 .587l3.668 7.568 8.332 1.151-6.064 5.828 1.48 8.279-7.416-3.967-7.417 3.967 1.481-8.279-6.064-5.828 8.332-1.151z"/>
                        </svg>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink-300 mb-2">Your Experience</label>
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Tell us what you love about Wayfare..."
                    className="w-full bg-[#0A0D14] border border-white/10 rounded-xl p-4 text-white placeholder-ink-600 focus:outline-none focus:border-[#FFB238] transition-colors resize-none h-32 text-sm"
                    required
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 text-white font-semibold rounded-xl transition-colors text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || content.trim().length < 10}
                    className="flex-1 px-4 py-3 bg-[#FFB238] hover:bg-[#FFC565] disabled:opacity-50 disabled:cursor-not-allowed text-ink-900 font-bold rounded-xl transition-colors shadow-lg shadow-[#FFB238]/20 text-sm"
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Review'}
                  </button>
                </div>
              </form>
            </>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default AppReviewModal;
