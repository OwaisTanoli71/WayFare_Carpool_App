import { useState, useRef, useEffect } from 'react'
import { useTripTracker } from '../hooks/useTripTracker'
import { useApp } from '../context/AppContext'
import { supabase } from '../lib/supabase'

export default function Chat() {
  const { user } = useApp()
  const [threads, setThreads] = useState([])
  const [activeThread, setActiveThread] = useState(null)
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const tripStatus = useTripTracker(true)
  const chatEndRef = useRef(null)

  const [showMobileList, setShowMobileList] = useState(true)

  // 1. Fetch Threads (Rides the user is part of)
  useEffect(() => {
    async function fetchThreads() {
      if (!user) return
      
      // Fetch rides where user is driver
      const { data: driverRides } = await supabase
        .from('rides')
        .select(`*, driver:users(name, avatar, verified)`)
        .eq('driver_id', user.id)

      // Fetch bookings where user is rider
      const { data: userBookings } = await supabase
        .from('bookings')
        .select(`
          ride_id,
          rides:rides(*, driver:users(name, avatar, verified))
        `)
        .eq('rider_id', user.id)

      const riderRides = userBookings ? userBookings.map(b => b.rides) : []
      const allRides = [...(driverRides || []), ...riderRides].filter(r => r != null)
      
      // Deduplicate rides
      const uniqueRides = Array.from(new Map(allRides.map(item => [item.id, item])).values())
      uniqueRides.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      
      setThreads(uniqueRides)
      if (uniqueRides.length > 0) setActiveThread(uniqueRides[0])
    }
    fetchThreads()
  }, [user])

  // 2. Fetch Messages for Active Thread & Subscribe to Realtime
  useEffect(() => {
    if (!activeThread) return

    async function fetchMessages() {
      const { data, error } = await supabase
        .from('messages')
        .select(`*, sender:users(name, avatar)`)
        .eq('ride_id', activeThread.id)
        .order('created_at', { ascending: true })
      
      if (data) setMessages(data)
    }
    fetchMessages()

    const channel = supabase.channel(`messages_${activeThread.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `ride_id=eq.${activeThread.id}` }, (payload) => {
        fetchMessages()
      })
      .subscribe()
      
    return () => {
      supabase.removeChannel(channel)
    }
  }, [activeThread])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function send(e) {
    e.preventDefault()
    if (!text.trim() || !activeThread) return
    
    // Security Fix [No Input Validation]: Enforce a max length of 1000 characters per message to prevent payload overload
    const messageText = text.trim().slice(0, 1000)
    setText('')
    
    // Optimistic UI insertion
    const tempMsg = { id: Date.now(), sender_id: user.id, text: messageText, created_at: new Date().toISOString() }
    setMessages(prev => [...prev, tempMsg])

    await supabase.from('messages').insert({
      ride_id: activeThread.id,
      sender_id: user.id,
      text: messageText
    })
  }

  const filteredThreads = threads.filter(thread => {
    const route = `${thread.from_location} ${thread.to_location}`.toLowerCase()
    const driverName = thread.driver?.name?.toLowerCase() || ''
    return route.includes(searchQuery.toLowerCase()) || driverName.includes(searchQuery.toLowerCase())
  })

  return (
    <div className="h-[calc(100dvh-180px)] sm:h-[calc(100vh-140px)] lg:h-[calc(100vh-100px)] flex bg-[#0F131C] rounded-2xl sm:rounded-[24px] border border-white/5 overflow-hidden shadow-2xl relative">
      
      {/* Sidebar (Chat List) */}
      <div className={`${showMobileList ? 'flex' : 'hidden'} md:flex flex-col w-full md:w-[320px] lg:w-[380px] bg-[#14181C] border-r border-white/5`}>
        {/* Header */}
        <div className="p-3 sm:p-4 border-b border-white/5 shrink-0">
          <h2 className="text-lg sm:text-xl font-display font-semibold text-white mb-3 sm:mb-4 px-1 sm:px-2">Messages</h2>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-ink-500">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            </div>
            <input
              type="text"
              placeholder="Search chats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#1A2026] text-white text-xs sm:text-sm pl-10 pr-4 py-2.5 rounded-xl border border-transparent focus:border-[#FFB238]/30 focus:outline-none transition-colors placeholder-ink-500"
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-2">
          {filteredThreads.length > 0 ? filteredThreads.map(thread => {
             const isMe = thread.driver_id === user?.id
             const otherName = isMe ? thread.from_location : thread.driver?.name
             const avatarBg = isMe ? 'bg-gradient-to-br from-[#4FBDBA] to-[#2c8a87]' : 'bg-gradient-to-br from-[#FFB238] to-[#c9821f]'
             const isActive = activeThread?.id === thread.id

             return (
               <div 
                 key={thread.id} 
                 onClick={() => { setActiveThread(thread); setShowMobileList(false); }}
                 className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors ${isActive ? 'bg-[#1A2026] md:bg-[#1A2026]' : 'hover:bg-white/[0.02]'}`}
               >
                 <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-white text-base sm:text-lg font-bold shrink-0 ${avatarBg}`}>
                   {thread.from_location.charAt(0)}
                 </div>
                 <div className="flex-1 min-w-0">
                   <div className="flex justify-between items-baseline mb-0.5">
                     <div className="text-xs sm:text-[15px] font-semibold text-white truncate pr-2">
                       {isMe ? 'Your Passengers' : thread.driver?.name || 'Driver'}
                     </div>
                     <div className="text-[10px] sm:text-[11px] text-ink-400 shrink-0">{new Date(thread.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}</div>
                   </div>
                   <div className="text-xs sm:text-[13px] text-ink-400 truncate">
                     {thread.from_location} &rarr; {thread.to_location}
                   </div>
                 </div>
               </div>
             )
          }) : (
            <div className="text-center p-6 text-ink-500 text-sm">
              No chats found. Post or join a ride to start chatting.
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className={`${!showMobileList ? 'flex' : 'hidden'} md:flex flex-col flex-1 bg-[#0F131C] relative min-w-0`}>
        {activeThread ? (
          <>
            {/* Chat Header */}
            <div className="h-[64px] sm:h-[72px] bg-[#14181C]/90 backdrop-blur-md border-b border-white/5 flex items-center px-3 sm:px-4 md:px-6 justify-between shrink-0 z-10 gap-2">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                <button 
                  onClick={() => setShowMobileList(true)}
                  className="md:hidden p-1.5 -ml-1 text-ink-400 hover:text-white rounded-full transition-colors shrink-0"
                  title="Back to chat list"
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"></polyline></svg>
                </button>
                <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-gradient-to-br from-[#FFB238] to-[#c9821f] flex items-center justify-center text-[#14181C] font-bold text-base sm:text-lg shrink-0">
                  {activeThread.driver_id === user?.id ? 'P' : activeThread.driver?.name?.charAt(0) || 'D'}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-white font-semibold text-xs sm:text-sm md:text-base truncate leading-tight">
                    {activeThread.driver_id === user?.id ? 'Your Passengers' : activeThread.driver?.name || 'Driver'}
                  </h3>
                  <div className="text-[11px] sm:text-[12px] text-ink-400 flex items-center gap-1 font-medium truncate">
                    {activeThread.from_location} &rarr; {activeThread.to_location}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                {activeThread.driver_id === user?.id && (
                  <button onClick={() => window.location.href = `/ride/${activeThread.id}`} className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500/20 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-bold tracking-wide transition-all">
                    Manage Ride
                  </button>
                )}
                <span className="text-[11px] sm:text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 sm:px-3 sm:py-1 rounded-full hidden sm:inline-block">
                  Rs {activeThread.price || 0}
                </span>
                <button onClick={() => alert('SOS Triggered!')} className="bg-[#E8654F]/10 text-[#E8654F] border border-[#E8654F]/20 hover:bg-[#E8654F]/20 px-2.5 py-1 sm:px-3.5 sm:py-1.5 rounded-full text-xs font-bold tracking-wide flex items-center gap-1 transition-all">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                  SOS
                </button>
              </div>
            </div>

            {/* Chat Body */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 flex flex-col gap-3 relative" style={{ backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 0)', backgroundSize: '24px 24px' }}>
              {messages.length > 0 ? messages.map((m, i) => {
                const isMe = m.sender_id === user?.id
                const showTail = i === messages.length - 1 || messages[i+1].sender_id !== m.sender_id
                
                return (
                  <div key={m.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                    {!isMe && showTail && (
                      <div className="text-[10px] text-ink-400 font-medium mb-1 ml-1">{m.sender?.name || 'Passenger'}</div>
                    )}
                    <div 
                      className={`max-w-[85%] md:max-w-[70%] px-3.5 py-2 sm:px-4 sm:py-2.5 text-xs sm:text-[14.5px] leading-relaxed shadow-sm relative ${
                        isMe 
                          ? 'bg-gradient-to-br from-[#FFB238] to-[#d0891f] text-[#14181C] font-medium' 
                          : 'bg-[#20262C] border border-white/5 text-[#F1EDE5]'
                      }`}
                      style={{ 
                        borderRadius: isMe 
                          ? (showTail ? '18px 18px 4px 18px' : '18px') 
                          : (showTail ? '18px 18px 18px 4px' : '18px')
                      }}
                    >
                      {m.text}
                      <div className={`text-[9px] sm:text-[10px] mt-1 text-right font-bold tracking-wide ${isMe ? 'text-black/50' : 'text-white/40'}`}>
                        {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                )
              }) : (
                <div className="flex-1 flex items-center justify-center p-4">
                  <div className="bg-[#14181C]/80 backdrop-blur-sm border border-white/5 rounded-2xl p-5 text-center max-w-xs shadow-xl">
                    <div className="text-3xl mb-2">👋</div>
                    <h4 className="text-white font-medium mb-1 text-sm sm:text-base">Start the conversation</h4>
                    <p className="text-ink-400 text-xs sm:text-sm leading-relaxed">Coordinate pickup times, share live locations, or ask any questions.</p>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} className="h-2 shrink-0" />
            </div>

            {/* Chat Input */}
            <div className="p-2.5 sm:p-4 bg-[#14181C] border-t border-white/5 shrink-0 z-10">
              <form onSubmit={send} className="flex items-center gap-2 bg-[#0F131C] border border-white/5 rounded-3xl p-1.5 focus-within:border-[#FFB238]/50 transition-colors">
                <button type="button" className="p-2 text-ink-500 hover:text-white transition-colors shrink-0 bg-transparent rounded-full hover:bg-white/5" title="Attach file">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/></svg>
                </button>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(e); } }}
                  placeholder="Type a message..."
                  className="flex-1 max-h-[100px] min-h-[38px] bg-transparent border-none text-[#F1EDE5] text-xs sm:text-[15px] py-2 focus:outline-none resize-none leading-normal"
                  rows="1"
                />
                <button type="submit" disabled={!text.trim()} className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-[#FFB238] text-[#14181C] flex items-center justify-center shrink-0 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#e69a25] transition-all shadow-[0_2px_10px_rgba(255,178,56,0.3)]">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="-ml-0.5"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-ink-400 bg-[#0F131C]">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#1A2026] to-[#14181C] border border-white/5 flex items-center justify-center mb-6 shadow-2xl">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              </svg>
            </div>
            <h3 className="text-white text-xl mb-2 font-display">Your Messages</h3>
            <p className="text-[14px] max-w-[280px] text-center leading-relaxed">Select a conversation from the sidebar to view your messages or start chatting.</p>
          </div>
        )}
      </div>
    </div>
  )
}
