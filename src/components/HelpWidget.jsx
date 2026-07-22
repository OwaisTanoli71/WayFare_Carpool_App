import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// 4 Prompt Tiles (Compact & Centered)
const AI_TILES = [
  {
    id: 'find_ride',
    title: 'AI Route Finder',
    desc: 'Islamabad to Lahore rides',
    icon: (
      <svg className="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
      </svg>
    ),
    bgColor: 'bg-purple-500/10 hover:bg-purple-500/20 border-purple-500/30',
    prompt: 'Find available rides from Islamabad to Lahore today.'
  },
  {
    id: 'fare_calc',
    title: 'Fare & Fuel Splitter',
    desc: 'Calculate exact cost per seat',
    icon: (
      <svg className="w-4 h-4 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    ),
    bgColor: 'bg-rose-500/10 hover:bg-rose-500/20 border-rose-500/30',
    prompt: 'How does Wayfare calculate fuel sharing and fare per passenger seat?'
  },
  {
    id: 'safety_check',
    title: 'Safety & Verification',
    desc: 'CNIC, License & Liveness',
    icon: (
      <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    bgColor: 'bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/30',
    prompt: 'How does driver document verification and liveness selfie check work?'
  },
  {
    id: 'offer_ride',
    title: 'Offer Carpool Trip',
    desc: 'Driver trip posting guide',
    icon: (
      <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
      </svg>
    ),
    bgColor: 'bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/30',
    prompt: 'How do I post a new ride offer as a driver on Wayfare?'
  }
]

export default function HelpWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [inputQuery, setInputQuery] = useState('')
  const [messages, setMessages] = useState([])
  const [isThinking, setIsThinking] = useState(false)
  const chatEndRef = useRef(null)

  useEffect(() => {
    if (messages.length > 0) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  const handleSendMessage = (textToSend) => {
    const query = textToSend || inputQuery
    if (!query.trim()) return

    const userMsg = { id: Date.now(), sender: 'user', text: query }
    setMessages(prev => [...prev, userMsg])
    setInputQuery('')
    setIsThinking(true)

    // Professional AI Response Handler
    setTimeout(() => {
      let botAnswer = "Hello! I am Wayfare AI, your personal carpool assistant. I can help you search for available rides, estimate fare costs, guide you through profile verification, or post a new carpool offer."
      
      const lower = query.toLowerCase()
      if (lower.includes('lahore') || lower.includes('find') || lower.includes('route')) {
        botAnswer = "Active carpools are available on popular intercity routes, including Islamabad to Lahore, Rawalpindi to Multan, and Karachi to Hyderabad. You can view departure schedules and book seats under the Find Ride section."
      } else if (lower.includes('fare') || lower.includes('cost') || lower.includes('fuel')) {
        botAnswer = "Fares are computed per passenger seat based on trip distance and fuel costs. You can conveniently pay the driver directly via cash or digital wallets like JazzCash and Easypaisa."
      } else if (lower.includes('verif') || lower.includes('cnic') || lower.includes('license')) {
        botAnswer = "To verify your profile, open your Profile page and select Start Verification. Upload a clear photo of your CNIC, a selfie, and your driving license. Our admin team usually reviews and approves documents within 5 to 10 minutes."
      } else if (lower.includes('offer') || lower.includes('post')) {
        botAnswer = "To offer a ride, select Post Ride from the navigation bar. Choose your pickup location, destination, departure date and time, available seats, and fare per seat."
      }

      setMessages(prev => [...prev, { id: Date.now() + 1, sender: 'bot', text: botAnswer }])
      setIsThinking(false)
    }, 600)
  }

  const handleClose = () => {
    setIsOpen(false)
  }

  return (
    <div className="fixed right-6 z-50 bottom-[24px] md:bottom-[24px] max-md:bottom-[80px]">
      {/* FLOATING POPUP DRAWER */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            style={{
              position: 'absolute', bottom: '72px', right: '0', 
              width: '370px', maxWidth: 'calc(100vw - 32px)',
              height: '520px', maxHeight: 'calc(100vh - 100px)',
              background: '#121722', border: '1px solid #232B3B', borderRadius: '24px',
              boxShadow: '0 20px 50px rgba(0,0,0,0.6)', overflow: 'hidden', display: 'flex', flexDirection: 'column'
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyBetween: 'space-between', padding: '14px 18px', borderBottom: '1px solid #232B3B', background: '#0F1420' }} className="flex items-center justify-between font-display">
              <div style={{ fontSize: '15px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '10px', color: '#FFFFFF' }} className="font-display tracking-tight">
                <img 
                  src="/Wayfare_favicon.jpeg" 
                  alt="Wayfare Logo" 
                  style={{ width: '28px', height: '28px', borderRadius: '8px', objectFit: 'cover', border: '1px solid rgba(245,158,11,0.3)' }} 
                />
                Wayfare<span style={{ color: '#F59E0B' }}>.ai</span>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {messages.length > 0 && (
                  <button 
                    onClick={() => setMessages([])}
                    style={{ background: '#1C2333', border: '1px solid #2D374D', color: '#94A3B8', fontSize: '11px', padding: '3px 8px', borderRadius: '8px', cursor: 'pointer' }}
                    className="font-body font-semibold"
                  >
                    New Chat
                  </button>
                )}
                <button onClick={handleClose} style={{ background: 'none', border: 'none', color: '#8B9298', cursor: 'pointer', fontSize: '16px' }}>✕</button>
              </div>
            </div>

            {/* Popup Container Content */}
            <div style={{ background: '#121722', flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              {messages.length === 0 ? (
                /* HERO SCREEN WITH 4 PROMPT TILES (Fits perfectly inside drawer) */
                <div style={{ padding: '16px 16px 12px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '14px' }}>
                  {/* Centered Logo (Shifted higher up) */}
                  <div className="mt-2">
                    <img 
                      src="/Wayfare_favicon.jpeg" 
                      alt="Wayfare Logo" 
                      style={{ 
                        width: '56px', height: '56px', borderRadius: '16px', 
                        objectFit: 'cover', border: '1px solid rgba(255,255,255,0.12)',
                        boxShadow: '0 4px 16px rgba(0,0,0,0.4)'
                      }} 
                    />
                  </div>

                  <p style={{ fontSize: '11px', color: '#94A3B8', margin: 0, lineHeight: '1.4', maxWidth: '240px' }} className="font-body">
                    Your intelligent carpool assistant for fares, ride matching, and safety checks.
                  </p>

                  {/* 4 Quick Prompt Cards Grid (Center Aligned Icons & Text) */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }} className="w-full max-w-[310px] mx-auto mt-1">
                    {AI_TILES.map((tile) => (
                      <button
                        key={tile.id}
                        onClick={() => handleSendMessage(tile.prompt)}
                        className={`p-3 rounded-xl border ${tile.bgColor} transition-all flex flex-col items-center justify-center text-center gap-1.5 h-[84px] hover:scale-[1.02] shadow-sm relative group`}
                      >
                        <div className="p-1.5 rounded-lg bg-ink-900/60 flex items-center justify-center">
                          {tile.icon}
                        </div>
                        <div className="w-full">
                          <div className="font-display font-bold text-[11.5px] text-white truncate px-1 tracking-tight">{tile.title}</div>
                          <div className="font-body text-[9.5px] text-ink-400 truncate px-1">{tile.desc}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                /* CONVERSATION MESSAGES STREAM */
                <div style={{ flex: 1, padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto' }}>
                  {messages.map((m) => (
                    <div key={m.id} style={{ 
                      alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start',
                      maxWidth: '85%', padding: '10px 14px', 
                      borderRadius: m.sender === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px', 
                      background: m.sender === 'user' ? 'linear-gradient(155deg, #F59E0B, #d98206)' : '#1C2333', 
                      color: m.sender === 'user' ? '#14181C' : '#F1EDE5', 
                      fontWeight: m.sender === 'user' ? 600 : 400,
                      fontSize: '13px', lineHeight: 1.45, boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                      border: m.sender === 'user' ? 'none' : '1px solid #2A354B'
                    }}>
                      {m.text ? m.text.replaceAll('**', '') : ''}
                    </div>
                  ))}

                  {isThinking && (
                    <div style={{ alignSelf: 'flex-start', padding: '10px 14px', borderRadius: '18px', background: '#1C2333', color: '#94A3B8', fontSize: '12px' }}>
                      ⚡ Wayfare AI is thinking...
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>
              )}
            </div>

            {/* BOTTOM INPUT BAR (Clean & Compact) */}
            <div style={{ padding: '10px 12px', borderTop: '1px solid #232B3B', background: '#0F1420' }}>
              <div style={{ borderRadius: '16px', background: '#161C28', border: '1px solid #2A354B', padding: '6px 10px', display: 'flex', itemsCenter: 'center', gap: '8px' }} className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Ask Wayfare AI anything..."
                  value={inputQuery}
                  onChange={(e) => setInputQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  style={{ background: 'transparent', border: 'none', color: '#FFF', fontSize: '12px', outline: 'none', width: '100%' }}
                  className="flex-1"
                />

                <button 
                  onClick={() => handleSendMessage()}
                  disabled={!inputQuery.trim()}
                  style={{ 
                    padding: '6px 14px', borderRadius: '20px', fontSize: '11px', fontWeight: 800, color: '#FFF',
                    background: 'linear-gradient(135deg, #F59E0B, #EF4444)', border: 'none', cursor: 'pointer',
                    opacity: !inputQuery.trim() ? 0.4 : 1, shrink: 0
                  }}
                  className="shrink-0"
                >
                  Send ↑
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ORIGINAL FLOATING TRIGGER BUTTON (Chat Bubble Icon) */}
      <button
        onClick={() => isOpen ? handleClose() : setIsOpen(true)}
        style={{
          width: '56px', height: '56px', borderRadius: '50%',
          background: 'linear-gradient(155deg, #E8A33D, #c9821f)', border: 'none',
          color: '#14181C', display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 16px rgba(232, 163, 61, 0.3)', cursor: 'pointer',
          transition: 'transform 0.2s', transform: isOpen ? 'rotate(90deg)' : 'none'
        }}
      >
        {isOpen ? (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15a2 2 0 1 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        )}
      </button>
    </div>
  )
}
