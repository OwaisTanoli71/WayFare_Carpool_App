import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'

export default function TrustedContacts() {
  const [contacts, setContacts] = useState([])
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const { user } = useApp()

  useEffect(() => {
    if (!user) return
    loadContacts()
  }, [user])

  const loadContacts = async () => {
    if (!user?.id) return
    const saved = localStorage.getItem('wayfare_trusted_contacts')
    if (saved) {
      setContacts(JSON.parse(saved))
    }
  }

  const addContact = (e) => {
    e.preventDefault()
    setError('')
    if (!email.includes('@')) {
      setError('Please enter a valid email address')
      return
    }
    if (contacts.length >= 3) {
      setError('You can only add up to 3 trusted contacts.')
      return
    }
    if (contacts.includes(email)) {
      setError('This email is already in your trusted contacts.')
      return
    }

    const newContacts = [...contacts, email]
    setContacts(newContacts)
    localStorage.setItem('wayfare_trusted_contacts', JSON.stringify(newContacts))
    setEmail('')
  }

  const removeContact = (contactToRemove) => {
    const newContacts = contacts.filter((c) => c !== contactToRemove)
    setContacts(newContacts)
    localStorage.setItem('wayfare_trusted_contacts', JSON.stringify(newContacts))
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="px-4 pb-12 max-w-[1000px] mx-auto"
    >
      {/* Header */}
      <div className="relative mb-10 mt-4 sm:mt-0">
        <div className="absolute -top-10 -left-10 w-48 h-48 bg-[#FFB238]/10 rounded-full blur-[60px] pointer-events-none"></div>
        <h1 className="text-3xl sm:text-[32px] font-display font-semibold text-white mb-2 relative z-10">Trusted Contacts</h1>
        <p className="text-ink-100 text-[15px] relative z-10">Keep your loved ones in the loop while you travel.</p>
      </div>

      <div className="grid lg:grid-cols-[1fr_1.4fr] gap-6 sm:gap-8">
        
        {/* Left Column: Info & Benefits */}
        <div className="flex flex-col gap-6 order-2 lg:order-1">
          <section className="relative overflow-hidden flex flex-col h-full rounded-[24px] p-6 sm:p-8 border border-[#FFB238]/20 bg-gradient-to-br from-[#2A2218] to-[#14181C] shadow-[0_8px_32px_rgba(255,178,56,0.05)]">
             <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-[#FFB238]/10 rounded-full blur-[50px] pointer-events-none"></div>
             
             <div className="w-14 h-14 rounded-[18px] bg-gradient-to-br from-[#FFB238]/20 to-[#FFB238]/5 flex items-center justify-center text-[#FFB238] mb-6 shadow-[0_0_20px_rgba(255,178,56,0.15)] border border-[#FFB238]/20 backdrop-blur-md">
               <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
             </div>
             
             <h2 className="text-[22px] font-semibold text-[#FFB238] mb-3">Peace of Mind</h2>
             <p className="text-[#8B9298] text-[15px] leading-[1.6] mb-8 relative z-10">
               Adding trusted contacts ensures your safety on every journey. We automatically share your live location and ride details with these contacts whenever you start a trip.
             </p>
             
             <div className="flex flex-col gap-4 relative z-10 mt-auto">
               <div className="flex items-center gap-3">
                 <div className="w-6 h-6 rounded-full bg-[#FFB238]/10 flex items-center justify-center text-[#FFB238] border border-[#FFB238]/20">
                   <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                 </div>
                 <span className="text-[#F1EDE5] text-[15px]">Live GPS tracking link</span>
               </div>
               <div className="flex items-center gap-3">
                 <div className="w-6 h-6 rounded-full bg-[#FFB238]/10 flex items-center justify-center text-[#FFB238] border border-[#FFB238]/20">
                   <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                 </div>
                 <span className="text-[#F1EDE5] text-[15px]">Instant SOS alerts</span>
               </div>
               <div className="flex items-center gap-3">
                 <div className="w-6 h-6 rounded-full bg-[#FFB238]/10 flex items-center justify-center text-[#FFB238] border border-[#FFB238]/20">
                   <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                 </div>
                 <span className="text-[#F1EDE5] text-[15px]">Automatic arrival notifications</span>
               </div>
             </div>
          </section>
        </div>

        {/* Right Column: Add & List Contacts */}
        <div className="flex flex-col gap-6 order-1 lg:order-2">
          
          {/* Add Contact Card */}
          <section className="bg-gradient-to-b from-[#1A2026] to-[#14181C] rounded-[24px] p-6 sm:p-8 border border-white/5 shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
            <h3 className="text-[18px] text-white font-medium mb-1">Add new contact</h3>
            <p className="text-[#8B9298] text-[14px] mb-6">You can add up to {3 - contacts.length} more contacts.</p>
            
            <form onSubmit={addContact} className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-ink-500">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Contact's email address"
                  disabled={contacts.length >= 3}
                  className="w-full pl-[44px] pr-4 py-3.5 rounded-xl border border-white/10 bg-[#0F131C] text-white text-[15px] focus:outline-none focus:border-[#FFB238]/50 focus:ring-1 focus:ring-[#FFB238]/50 transition-all disabled:opacity-50"
                />
              </div>
              <button 
                type="submit" 
                disabled={contacts.length >= 3} 
                className="py-3.5 sm:py-0 px-8 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-[#FFB238] text-[#14181C] hover:bg-[#e69a25] shadow-[0_4px_16px_rgba(255,178,56,0.2)] hover:shadow-[0_4px_20px_rgba(255,178,56,0.4)]"
              >
                Add Contact
              </button>
            </form>
            <AnimatePresence>
              {error && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="text-[#E8654F] text-[13px] mt-3 font-medium flex items-center gap-2">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                  {error}
                </motion.div>
              )}
            </AnimatePresence>
          </section>

          {/* List Contacts Card */}
          <section className="bg-[#1A2026] rounded-[24px] p-6 sm:p-8 border border-white/5 flex-1 shadow-[0_8px_32px_rgba(0,0,0,0.2)] flex flex-col min-h-[300px]">
            <h3 className="text-[18px] text-white font-medium mb-6">Your Trusted Circle</h3>
            
            <div className="flex flex-col gap-3 flex-1">
              <AnimatePresence>
                {contacts.map((contact) => (
                  <motion.div 
                    key={contact} 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95, height: 0, marginBottom: 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex flex-col sm:flex-row sm:items-center gap-4 bg-[#14181C] p-4 rounded-2xl border border-white/5 hover:border-white/10 transition-colors group"
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FFB238]/20 to-[#FFB238]/5 flex items-center justify-center text-[#FFB238] group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(255,178,56,0.1)]">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-white text-[15px] font-medium mb-0.5 truncate">{contact.split('@')[0]}</div>
                      <div className="text-[#8B9298] text-[13px] truncate">{contact}</div>
                    </div>
                    <button 
                      onClick={() => removeContact(contact)} 
                      className="w-full sm:w-auto px-4 py-2 rounded-xl text-[13px] font-medium text-[#E8654F] bg-[#E8654F]/5 border border-[#E8654F]/20 hover:bg-[#E8654F]/10 hover:border-[#E8654F]/40 transition-all"
                    >
                      Remove
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
              
              {contacts.length === 0 && (
                <motion.div 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center text-center py-8 flex-1"
                >
                   <div className="w-16 h-16 rounded-full bg-gradient-to-br from-white/5 to-white/0 flex items-center justify-center text-[#8B9298] mb-4 border border-white/5">
                     <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M19 8v6"/><path d="M22 11h-6"/></svg>
                   </div>
                   <div className="text-white text-[16px] font-medium mb-2">No contacts added</div>
                   <div className="text-[#8B9298] text-[14px] max-w-xs mx-auto leading-relaxed">Add someone you trust to share your live ride status with.</div>
                </motion.div>
              )}
            </div>
          </section>

        </div>
      </div>
    </motion.div>
  )
}
