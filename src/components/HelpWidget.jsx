import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, MessageSquare, Compass, ShieldCheck, PlusCircle, Calculator, X, Trash2 } from 'lucide-react'

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
  const [isDragging, setIsDragging] = useState(false)
  const [overDismissZone, setOverDismissZone] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)

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

  const handleDrag = (event, info) => {
    const pointY = info.point.y
    const pointX = info.point.x
    const screenHeight = window.innerHeight
    const screenWidth = window.innerWidth

    // Check if dragging near bottom center dismiss zone
    const isNearBottom = pointY > screenHeight - 140
    const isNearCenterX = Math.abs(pointX - screenWidth / 2) < 130

    if (isNearBottom && isNearCenterX) {
      setOverDismissZone(true)
    } else {
      setOverDismissZone(false)
    }
  }

  const handleDragEnd = (event, info) => {
    setIsDragging(false)
    if (overDismissZone) {
      setIsDismissed(true)
      setIsOpen(false)
    }
    setOverDismissZone(false)
  }

  return (
    <>
      {/* CHATBOT MODAL POPUP */}
      <AnimatePresence>
        {isOpen && !isDismissed && (
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
              <div className="p-4 border-b border-[#232B3B] bg-[#161C28] flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center font-bold shadow-md">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-sm text-white flex items-center gap-1.5">
                      Wayfare AI Assistant
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">v2.4</span>
                    </h3>
                    <p className="text-[11px] text-ink-400">Ask about rides, fares & safety verification</p>
                  </div>
                </div>

                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-xl text-ink-400 hover:text-white hover:bg-ink-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Chat Body */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-[#0F1420]">
                {messages.length === 0 ? (
                  <div className="space-y-4">
                    <div className="p-3.5 rounded-2xl bg-[#161C28] border border-[#2A354B] text-xs text-ink-200 leading-relaxed space-y-1">
                      <div className="font-bold text-amber-400 flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4" /> Welcome to Wayfare Support!
                      </div>
                      <p className="text-ink-300">Select a prompt below or type your custom query to get instant AI assistance.</p>
                    </div>

                    <div className="grid grid-cols-1 gap-2.5">
                      {AI_TILES.map(tile => (
                        <button
                          key={tile.id}
                          onClick={() => handleSendMessage(tile.prompt)}
                          className={`p-3 rounded-2xl border text-left transition-all flex items-center gap-3 ${tile.bgColor} group`}
                        >
                          <div className="p-2.5 rounded-xl bg-ink-900/80 shrink-0 shadow-sm">
                            {tile.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-bold text-white group-hover:text-amber-400 transition-colors truncate">
                              {tile.title}
                            </div>
                            <div className="text-[11px] text-ink-400 truncate">{tile.desc}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {messages.map(m => (
                      <div
                        key={m.id}
                        className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
                      >
                        <div
                          className={`max-w-[85%] p-3 rounded-2xl text-xs leading-relaxed ${
                            m.sender === 'user'
                              ? 'bg-amber-400 text-ink-950 font-semibold rounded-br-xs shadow-md'
                              : 'bg-[#1A2130] text-ink-100 border border-[#2A354B] rounded-bl-xs'
                          }`}
                        >
                          {m.text}
                        </div>
                      </div>
                    ))}

                    {isThinking && (
                      <div className="flex items-center gap-2 p-3 rounded-2xl bg-[#1A2130] border border-[#2A354B] w-fit text-xs text-ink-400">
                        <Sparkles className="w-4 h-4 text-amber-400 animate-spin" />
                        <span>Wayfare AI is thinking...</span>
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

      {/* DISMISS DROPZONE (REVEALS WHILE DRAGGING) */}
      <AnimatePresence>
        {isDragging && !isDismissed && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: overDismissZone ? 1.1 : 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.8 }}
            className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[99] px-5 py-3 rounded-full border flex items-center gap-2 shadow-2xl transition-all ${
              overDismissZone
                ? 'bg-red-600 text-white border-red-400 scale-110 shadow-[0_0_25px_rgba(239,68,68,0.7)]'
                : 'bg-[#181D29]/95 text-red-400 border-red-500/40 backdrop-blur-xl'
            }`}
          >
            <Trash2 className="w-5 h-5 animate-bounce" />
            <span className="text-xs font-extrabold tracking-wide">
              {overDismissZone ? 'Release to Hide AI Widget' : 'Drop here to hide AI button'}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* DRAGGABLE FLOATING TRIGGER BUTTON (Hidden on mobile when chat drawer is open, visible on desktop) */}
      {!isDismissed && (
        <motion.div
          drag
          dragMomentum={false}
          onDragStart={() => setIsDragging(true)}
          onDrag={handleDrag}
          onDragEnd={handleDragEnd}
          className={`fixed bottom-24 right-5 sm:bottom-6 sm:right-6 z-[95] touch-none cursor-grab active:cursor-grabbing ${
            isOpen ? 'hidden sm:block' : 'block'
          }`}
        >
          <button
            onClick={() => {
              if (!isDragging) setIsOpen(!isOpen)
            }}
            className={`w-14 h-14 rounded-full bg-gradient-to-br from-amber-400 to-amber-500 text-ink-950 flex items-center justify-center shadow-[0_8px_30px_rgba(245,158,11,0.4)] hover:scale-105 active:scale-95 transition-all duration-200 ${
              overDismissZone ? 'ring-4 ring-red-500 scale-110' : ''
            }`}
            title="Wayfare AI Assistant (Drag to move or drop at bottom to hide)"
          >
            {isOpen ? (
              <X className="w-6 h-6 stroke-[2.5]" />
            ) : (
              <MessageSquare className="w-6 h-6 fill-ink-950/20 stroke-[2.2]" />
            )}
          </button>
        </motion.div>
      )}
    </>
  )
}
