import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, MessageSquare, Compass, ShieldCheck, PlusCircle, Calculator } from 'lucide-react'

const AI_TILES = [
  {
    id: 'route',
    title: 'AI Route Finder',
    desc: 'Islamabad to Lahore rides',
    icon: <Compass className="w-4 h-4 text-beacon" />,
    bgColor: 'bg-beacon/10 border-beacon/20 hover:bg-beacon/20',
    prompt: 'Can you show me how to find carpool rides from Islamabad to Lahore?'
  },
  {
    id: 'fare',
    title: 'Fare & Fuel Splitter',
    desc: 'Calculate exact cost per seat',
    icon: <Calculator className="w-4 h-4 text-warning" />,
    bgColor: 'bg-warning/10 border-warning/20 hover:bg-warning/20',
    prompt: 'How does Wayfare calculate fuel sharing and fare per passenger seat?'
  },
  {
    id: 'safety',
    title: 'Safety & Verification',
    desc: 'CNIC, License & Liveness',
    icon: <ShieldCheck className="w-4 h-4 text-verified" />,
    bgColor: 'bg-verified/10 border-verified/20 hover:bg-verified/20',
    prompt: 'What documents do drivers need to submit for ID verification?'
  },
  {
    id: 'driver',
    title: 'Offer Carpool Trip',
    desc: 'Driver trip posting guide',
    icon: <PlusCircle className="w-4 h-4 text-teal" />,
    bgColor: 'bg-teal/10 border-teal/20 hover:bg-teal/20',
    prompt: 'How do I post a new ride offer as a driver on Wayfare?'
  }
]

export default function HelpWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [inputQuery, setInputQuery] = useState('')
  const [isThinking, setIsThinking] = useState(false)
  const chatEndRef = useRef(null)

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    if (isOpen) {
      scrollToBottom()
    }
  }, [messages, isThinking, isOpen])

  const handleSendMessage = (textToSend = null) => {
    const query = textToSend || inputQuery
    if (!query.trim()) return

    const userMsg = { id: Date.now(), sender: 'user', text: query }
    setMessages(prev => [...prev, userMsg])
    if (!textToSend) setInputQuery('')
    setIsThinking(true)

    setTimeout(() => {
      let botAnswer = "Hello! I am Wayfare AI, your personal carpool assistant. I can help you search for available rides, estimate fare costs, guide you through profile verification, or post a new carpool offer."
      const lower = query.toLowerCase()

      if (lower.includes('lahore') || lower.includes('find') || lower.includes('search')) {
        botAnswer = "To find a ride: Tap 'Find a Ride' on your dashboard, select your origin (e.g. Islamabad) and destination (e.g. Lahore), then choose your preferred date and driver gender preference."
      } else if (lower.includes('fare') || lower.includes('fuel') || lower.includes('cost') || lower.includes('price')) {
        botAnswer = "Wayfare automatically calculates fair fare splitting based on trip distance and current fuel prices in Pakistan. Driver fare is capped per seat so riders save up to 60% compared to taxi services."
      } else if (lower.includes('safety') || lower.includes('cnic') || lower.includes('verify') || lower.includes('license')) {
        botAnswer = "Safety is built into every trip! Drivers and riders undergo 3-step verification: 1. Government CNIC photo, 2. Driving license check, 3. Real-time liveness selfie check."
      } else if (lower.includes('post') || lower.includes('driver') || lower.includes('offer')) {
        botAnswer = "To offer a ride: Select 'Offer a Ride' from your dashboard or tap the '+' button. Set your pickup location, destination, departure time, available seats, and fare."
      }

      setMessages(prev => [...prev, { id: Date.now() + 1, sender: 'bot', text: botAnswer }])
      setIsThinking(false)
    }, 600)
  }

  return (
    <>
      {/* CHATBOT MODAL POPUP */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm sm:bg-transparent sm:backdrop-blur-none pointer-events-auto">
            {/* Backdrop click to close on mobile */}
            <div className="absolute inset-0 sm:hidden" onClick={() => setIsOpen(false)} />

            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.95 }}
              className="relative w-full max-w-[400px] h-[80vh] max-h-[580px] bg-[#121722] border border-[#232B3B] rounded-3xl shadow-2xl flex flex-col overflow-hidden z-10 sm:fixed sm:bottom-24 sm:right-6"
            >
              {/* Top Header Bar */}
              <div className="flex items-center justify-between px-4 py-3.5 border-b border-[#232B3B] bg-[#0F1420] shrink-0">
                <div className="flex items-center gap-2.5 font-display text-sm font-bold text-white tracking-tight">
                  <img 
                    src="/Wayfare_favicon.jpeg" 
                    alt="Wayfare Logo" 
                    className="w-7 h-7 rounded-lg object-cover border border-amber-500/30"
                  />
                  <span>Wayfare<span className="text-amber-400">.ai</span></span>
                </div>
                
                <div className="flex items-center gap-2">
                  {messages.length > 0 && (
                    <button 
                      onClick={() => setMessages([])}
                      className="px-2.5 py-1 rounded-lg bg-[#1C2333] border border-[#2D374D] text-ink-300 hover:text-white text-[11px] font-medium transition-colors"
                    >
                      New Chat
                    </button>
                  )}
                  <button 
                    onClick={() => setIsOpen(false)} 
                    className="w-8 h-8 rounded-full bg-ink-800/80 text-ink-300 hover:text-white flex items-center justify-center text-sm transition-colors"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Chat Body Container */}
              <div className="flex-1 bg-[#121722] flex flex-col overflow-y-auto custom-scrollbar p-4">
                {messages.length === 0 ? (
                  /* Hero Screen with 4 Prompt Tiles */
                  <div className="flex flex-col items-center text-center my-auto py-2 gap-4">
                    <img 
                      src="/Wayfare_favicon.jpeg" 
                      alt="Wayfare Logo" 
                      className="w-14 h-14 rounded-2xl object-cover border border-white/10 shadow-lg"
                    />

                    <p className="text-xs text-ink-300 max-w-[260px] leading-relaxed">
                      Your intelligent carpool assistant for fares, ride matching, and safety checks.
                    </p>

                    {/* 4 Quick Prompt Cards Grid */}
                    <div className="grid grid-cols-2 gap-2.5 w-full max-w-[340px] mt-2">
                      {AI_TILES.map((tile) => (
                        <button
                          key={tile.id}
                          onClick={() => handleSendMessage(tile.prompt)}
                          className={`p-3 rounded-2xl border ${tile.bgColor} transition-all flex flex-col items-center justify-center text-center gap-1.5 h-[90px] hover:scale-[1.02] shadow-sm relative group`}
                        >
                          <div className="p-1.5 rounded-xl bg-ink-900/60 flex items-center justify-center">
                            {tile.icon}
                          </div>
                          <div className="w-full">
                            <div className="font-display font-bold text-[11px] text-white truncate px-1 tracking-tight">{tile.title}</div>
                            <div className="font-body text-[9.5px] text-ink-400 truncate px-1 mt-0.5">{tile.desc}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  /* Messages Stream */
                  <div className="flex flex-col gap-3">
                    {messages.map((m) => (
                      <div key={m.id} className={`max-w-[85%] p-3 rounded-2xl text-xs leading-relaxed shadow-sm ${
                        m.sender === 'user' 
                          ? 'self-end bg-gradient-to-br from-amber-400 to-amber-500 text-ink-950 font-semibold rounded-br-xs' 
                          : 'self-start bg-[#1C2333] text-ink-100 border border-[#2A354B] rounded-bl-xs'
                      }`}>
                        {m.text ? m.text.replaceAll('**', '') : ''}
                      </div>
                    ))}

                    {isThinking && (
                      <div className="self-start px-3.5 py-2.5 rounded-2xl bg-[#1C2333] text-ink-300 text-xs flex items-center gap-2 border border-[#2A354B]">
                        <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" /> Wayfare AI is thinking...
                      </div>
                    )}
                    <div ref={chatEndRef} />
                  </div>
                )}
              </div>

              {/* Bottom Input Bar */}
              <div className="p-3 border-t border-[#232B3B] bg-[#0F1420] shrink-0">
                <div className="flex items-center gap-2 rounded-2xl bg-[#161C28] border border-[#2A354B] px-3 py-1.5 focus-within:border-amber-400/50 transition-all">
                  <input
                    type="text"
                    placeholder="Ask Wayfare AI anything..."
                    value={inputQuery}
                    onChange={(e) => setInputQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    className="flex-1 bg-transparent border-none text-xs text-white placeholder-ink-400 focus:outline-none"
                  />

                  <button 
                    onClick={() => handleSendMessage()}
                    disabled={!inputQuery.trim()}
                    className="px-3.5 py-1.5 rounded-full text-xs font-bold text-white bg-gradient-to-r from-amber-500 to-amber-600 disabled:opacity-40 shadow-sm shrink-0 transition-opacity"
                  >
                    Send ↑
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* FLOATING TRIGGER BUTTON */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-[95] w-14 h-14 rounded-full bg-gradient-to-br from-amber-400 to-amber-500 text-ink-950 flex items-center justify-center shadow-glow hover:scale-105 active:scale-95 transition-all duration-200"
        title="Wayfare AI Assistant"
      >
        {isOpen ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
        ) : (
          <MessageSquare className="w-6 h-6 fill-ink-950/20" strokeWidth={2.2} />
        )}
      </button>
    </>
  )
}
