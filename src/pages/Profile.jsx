import { useApp } from '../context/AppContext'
import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function Profile() {
  const { user } = useApp()
  const navigate = useNavigate()
  const [verificationStatus, setVerificationStatus] = useState(null)
  const [isVerificationLoading, setIsVerificationLoading] = useState(true)

  useEffect(() => {
    async function checkVerification() {
      if (!user) return
      try {
        const { data } = await supabase.from('verifications')
          .select('status')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()
          
        if (data) {
          setVerificationStatus(data.status)
        }
      } catch (err) {
        console.error(err)
      } finally {
        setIsVerificationLoading(false)
      }
    }
    checkVerification()
  }, [user])

  if (!user) {
    navigate('/login')
    return null
  }

  const [reputation, setReputation] = useState({ rating: 0, tags: [] })
  const [isReputationLoading, setIsReputationLoading] = useState(true)
  const [showVerificationModal, setShowVerificationModal] = useState(true)

  useEffect(() => {
    if (!user) return
    async function fetchReputation() {
      try {
        const { data, error } = await supabase.rpc('get_user_reputation', { target_user_id: user.id })
        if (!error && data) {
          setReputation(data)
        }
      } catch (err) {
        console.error(err)
      } finally {
        setIsReputationLoading(false)
      }
    }
    fetchReputation()
  }, [user?.id])

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    // Resize image before uploading to prevent payload size errors
    const reader = new FileReader()
    reader.onload = (event) => {
      const img = new Image()
      img.onload = async () => {
        const canvas = document.createElement('canvas')
        const MAX_WIDTH = 400
        const MAX_HEIGHT = 400
        let width = img.width
        let height = img.height

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width
            width = MAX_WIDTH
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height
            height = MAX_HEIGHT
          }
        }
        
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, width, height)
        
        const base64String = canvas.toDataURL('image/jpeg', 0.8) // 80% quality JPEG

        // Update DB
        const { error } = await supabase.from('users').update({ avatar: base64String }).eq('id', user.id)
        
        if (!error) {
          // setUser is not destructured from useApp, usually it's handled via auth state change or a refresh
          // Force a local reload or state update if setUser is not available
          window.location.reload()
        } else {
          console.error("Upload error:", error)
          alert("Failed to update profile picture. Ensure the file is a valid image.")
        }
      }
      img.src = event.target.result
    }
    reader.readAsDataURL(file)
  }

  const avatarContent = user.avatar && user.avatar.startsWith('data:image') 
    ? <img src={user.avatar} alt="Profile" className="w-full h-full object-cover rounded-full" />
    : (user.name?.charAt(0) || user.email?.charAt(0) || 'U')

  return (
    <div className="max-w-[1000px] mx-auto pb-10 px-4 sm:px-6">
      <div className="grid lg:grid-cols-[1.5fr_1fr] gap-6 items-start">
        
        {/* Left Column */}
        <div className="flex flex-col gap-6">
          
          {/* Header Card */}
          <section className="bg-gradient-to-br from-[#1A2026] to-[#14181C] rounded-[24px] p-6 sm:p-8 shadow-[0_8px_32px_rgba(0,0,0,0.2)] border border-white/5 relative overflow-hidden group">
            {/* Background Glow */}
            <div className="absolute -top-20 -right-20 w-48 h-48 bg-[#FFB238]/10 rounded-full blur-[50px] pointer-events-none"></div>

            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 sm:gap-6 relative z-10">
              {/* Avatar Container */}
              <div className="relative group/avatar cursor-pointer shrink-0">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-[#252B31] border-2 border-[#2A3138] overflow-hidden flex items-center justify-center text-4xl text-[#FFB238] shadow-[0_4px_20px_rgba(0,0,0,0.4)] transition-transform duration-300 group-hover/avatar:scale-105">
                  {avatarContent}
                </div>
                <label className="absolute bottom-0 right-0 bg-[#FFB238] text-[#14181C] w-8 h-8 rounded-full flex items-center justify-center cursor-pointer shadow-lg hover:scale-110 transition-transform duration-200">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>
                  <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                </label>
              </div>

              {/* User Info */}
              <div className="flex-1 text-center sm:text-left mt-1 sm:mt-0">
                <div className="flex flex-col sm:flex-row items-center sm:items-center gap-2 sm:gap-3 mb-1.5">
                  <h1 className="text-[26px] sm:text-[28px] font-display font-semibold text-white tracking-tight">
                    {user.name || 'User'}
                  </h1>
                  {(user.user_metadata?.verified || user.verified) && (
                    <span className="bg-[#4FBDBA]/10 text-[#4FBDBA] text-[12px] font-semibold px-3 py-1 rounded-full flex items-center gap-1.5 border border-[#4FBDBA]/20">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                      Verified
                    </span>
                  )}
                </div>
                <div className="text-[14px] sm:text-[15px] text-[#8B9298] mb-4 sm:mb-5">{user.email}</div>
                
                <div className="inline-flex items-center gap-2 text-[11px] sm:text-[12px] font-medium text-[#FFB238] bg-[#FFB238]/10 px-4 py-2 rounded-xl border border-[#FFB238]/20 leading-snug">
                  <span className="text-sm shrink-0 flex items-center justify-center">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>
                  </span>
                  <span>Upload a clear, front-view picture for safety.</span>
                </div>
              </div>
            </div>
          </section>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <div className="bg-gradient-to-br from-[#1E252C] to-[#14181C] p-5 sm:p-6 rounded-[20px] sm:rounded-[24px] border border-white/5 flex flex-col justify-center shadow-lg hover:border-white/10 transition-colors">
              <div className="text-[11px] sm:text-[12px] text-[#8B9298] font-semibold uppercase tracking-wider mb-1.5">Role</div>
              <div className="text-[18px] sm:text-[22px] font-display text-white font-medium capitalize truncate">
                {(user.role || localStorage.getItem('wayfare_role')) === 'rider' ? 'Passenger' : (user.role || localStorage.getItem('wayfare_role')) === 'both' ? 'Driver & Pass' : user.role || localStorage.getItem('wayfare_role') || 'Not set'}
              </div>
            </div>
            <div className="bg-gradient-to-br from-[#1E252C] to-[#14181C] p-5 sm:p-6 rounded-[20px] sm:rounded-[24px] border border-white/5 flex flex-col justify-center shadow-lg hover:border-white/10 transition-colors">
              <div className="text-[11px] sm:text-[12px] text-[#8B9298] font-semibold uppercase tracking-wider mb-1.5">Rating</div>
              {isReputationLoading ? (
                <div className="h-[22px] w-16 skeleton rounded-md mt-1"></div>
              ) : (
                <div className="text-[18px] sm:text-[22px] font-display text-[#FFB238] font-medium flex items-center gap-1.5">
                  <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>
                  {reputation.rating || 'New'}
                </div>
              )}
            </div>
          </div>

          {/* Personal Info */}
          <section className="bg-[#1A2026] rounded-[24px] p-6 sm:p-8 border border-white/5 shadow-lg">
            <h3 className="text-[17px] sm:text-[18px] text-white font-medium mb-6">Personal Information</h3>
            <div className="flex flex-col gap-4">
              <div className="flex flex-row justify-between items-center pb-4 border-b border-white/5">
                <span className="text-[#8B9298] text-[13px] sm:text-[14px]">Phone</span>
                <span className="text-[#F1EDE5] text-[13px] sm:text-[15px] font-medium">{user.user_metadata?.phone || localStorage.getItem('wayfare_phone') || '--'}</span>
              </div>
              <div className="flex flex-row justify-between items-center pb-4 border-b border-white/5">
                <span className="text-[#8B9298] text-[13px] sm:text-[14px]">Age & City</span>
                <span className="text-[#F1EDE5] text-[13px] sm:text-[15px] font-medium">{user.user_metadata?.age || localStorage.getItem('wayfare_age') || '--'} yrs, {user.user_metadata?.city || localStorage.getItem('wayfare_city') || '--'}</span>
              </div>
              <div className="flex flex-row justify-between items-center pb-2">
                <span className="text-[#8B9298] text-[13px] sm:text-[14px]">Gender Pref</span>
                <span className="text-[#F1EDE5] text-[13px] sm:text-[15px] font-medium">{user.user_metadata?.gender_pref === 'same' || localStorage.getItem('wayfare_gender_pref') === 'same' ? 'Same gender only' : 'Open to all'}</span>
              </div>
            </div>

            {/* Logout Button */}
            <div className="mt-8 pt-6 border-t border-white/5 flex">
              <button 
                onClick={async () => {
                  await supabase.auth.signOut()
                  navigate('/')
                }}
                className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-[#E8654F]/10 hover:bg-[#E8654F]/20 text-[#E8654F] border border-[#E8654F]/20 transition-all font-semibold text-[14px]"
              >
                <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                  <polyline points="16 17 21 12 16 7"></polyline>
                  <line x1="21" y1="12" x2="9" y2="12"></line>
                </svg>
                Log out
              </button>
            </div>
          </section>

        </div>

        {/* Right Column (Verification Banner) - Popup on Mobile */}
        <div className={`${showVerificationModal ? 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm lg:static lg:block lg:p-0 lg:bg-transparent lg:z-auto' : 'hidden lg:block'}`}>
          <div className="relative w-full max-w-md lg:max-w-none h-auto shadow-2xl lg:shadow-none">
            
            {/* Mobile Close Button */}
            <button 
              onClick={() => setShowVerificationModal(false)}
              className="lg:hidden absolute top-4 right-4 z-30 bg-black/20 hover:bg-black/40 text-white/70 hover:text-white p-2 rounded-full backdrop-blur-md transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>

          {isVerificationLoading ? (
            <section className="bg-gradient-to-br from-[#1A2026] to-[#14181C] rounded-[24px] p-6 sm:p-8 border border-white/5 flex flex-col shadow-lg relative overflow-hidden">
              <div className="w-14 h-14 shrink-0 rounded-[16px] skeleton mb-6 border border-white/10"></div>
              <div className="h-6 w-3/4 skeleton rounded-lg mb-4"></div>
              <div className="h-4 w-full skeleton rounded-md mb-2"></div>
              <div className="h-4 w-5/6 skeleton rounded-md mb-8"></div>
              <div className="h-[52px] sm:h-[56px] w-full skeleton rounded-[14px] sm:rounded-[16px]"></div>
            </section>
          ) : (user.user_metadata?.verified || user.verified || verificationStatus === 'approved') ? (
            <section className="bg-gradient-to-br from-[#1A2E2A] to-[#14181C] rounded-[24px] p-6 sm:p-8 border border-[#4FBDBA]/20 flex flex-col shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#4FBDBA]/10 rounded-full blur-[40px] pointer-events-none"></div>
              
              <div className="w-14 h-14 shrink-0 rounded-[16px] bg-[#4FBDBA]/10 flex items-center justify-center text-[#4FBDBA] text-2xl mb-6 border border-[#4FBDBA]/20 backdrop-blur-sm shadow-[0_4px_16px_rgba(79,189,186,0.15)]">&#10003;</div>
              <div className="text-xl sm:text-[22px] text-[#4FBDBA] font-semibold mb-3 pr-8">
                {(user.role || localStorage.getItem('wayfare_role')) === 'rider' ? 'Identity Verified' : 'Identity & License Verified'}
              </div>
              <div className="text-[14px] sm:text-[15px] text-[#8B9298] leading-relaxed mb-8 relative z-10">
                {(user.role || localStorage.getItem('wayfare_role')) === 'rider' 
                  ? 'You are fully verified to request rides on Wayfare. Your trusted status gives drivers confidence to travel with you.'
                  : 'You are fully verified to offer and request rides on Wayfare. Your trusted status gives other members confidence to travel with you.'}
              </div>
              
              <div className="flex flex-col gap-4 mb-2 relative z-10">
                {['Can safely ' + ((user.role || localStorage.getItem('wayfare_role')) === 'rider' ? 'request rides' : 'offer rides to others'), 'Higher priority matching', 'Verified Badge unlocked'].map((text, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="text-[#4FBDBA] bg-[#4FBDBA]/10 rounded-full w-6 h-6 shrink-0 flex items-center justify-center text-xs font-bold border border-[#4FBDBA]/20 shadow-sm">&#10003;</div>
                    <span className="text-[14px] sm:text-[15px] text-[#F1EDE5]">{text}</span>
                  </div>
                ))}
              </div>
            </section>
          ) : verificationStatus === 'pending' ? (
            <section className="bg-gradient-to-br from-[#1E2E40] to-[#14181C] rounded-[24px] p-6 sm:p-8 border border-blue-500/30 flex flex-col shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-[40px] pointer-events-none"></div>

              <div className="w-14 h-14 shrink-0 rounded-[16px] bg-blue-500/10 flex items-center justify-center text-blue-400 text-2xl mb-6 border border-blue-500/20 backdrop-blur-sm shadow-[0_4px_16px_rgba(59,130,246,0.15)]">
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <div className="text-xl sm:text-[22px] text-blue-400 font-semibold mb-3 pr-8">
                Verification Pending
              </div>
              <div className="text-[14px] sm:text-[15px] text-[#8B9298] mb-8 leading-relaxed relative z-10">
                We have received your documents. Our admin team is currently reviewing your profile to ensure safety. This usually takes less than 24 hours.
              </div>

              <div className="mt-2 relative z-10">
                <button disabled className="w-full h-[52px] sm:h-[56px] rounded-[14px] sm:rounded-[16px] bg-ink-800 text-ink-500 font-semibold text-[15px] sm:text-[16px] cursor-not-allowed">
                  Under Review...
                </button>
              </div>
            </section>
          ) : (
            <section className="bg-gradient-to-br from-[#2A2218] to-[#14181C] rounded-[24px] p-6 sm:p-8 border border-dashed border-[#FFB238]/30 flex flex-col shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#FFB238]/10 rounded-full blur-[40px] pointer-events-none"></div>

              <div className="w-14 h-14 shrink-0 rounded-[16px] bg-[#FFB238]/10 flex items-center justify-center text-[#FFB238] text-2xl mb-6 border border-[#FFB238]/20 backdrop-blur-sm shadow-[0_4px_16px_rgba(255,178,56,0.15)]">&#9888;</div>
              <div className="text-xl sm:text-[22px] text-[#FFB238] font-semibold mb-3 pr-8">
                {(user.role || localStorage.getItem('wayfare_role')) === 'rider' ? 'Verify your Identity' : 'Verify your ID to drive'}
              </div>
              <div className="text-[14px] sm:text-[15px] text-[#8B9298] mb-8 leading-relaxed relative z-10">
                {(user.role || localStorage.getItem('wayfare_role')) === 'rider' 
                  ? 'To travel safely and ensure community trust, you must upload your CNIC.'
                  : 'To offer rides and ensure community safety, you must upload your CNIC, license, and vehicle details.'}
              </div>
              
              <div className="flex flex-col gap-4 mb-8 relative z-10">
                {[
                  (user.role || localStorage.getItem('wayfare_role')) === 'rider' ? 'Get accepted by drivers instantly' : 'Get 3x more ride requests',
                  'Build trust with the community',
                  (user.role || localStorage.getItem('wayfare_role')) === 'rider' ? 'Unlock premium features' : 'Unlock the ability to post rides'
                ].map((text, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="text-[#FFB238] bg-[#FFB238]/10 rounded-full w-6 h-6 shrink-0 flex items-center justify-center text-xs font-bold border border-[#FFB238]/20 shadow-sm">&#10003;</div>
                    <span className="text-[14px] sm:text-[15px] text-[#F1EDE5]">{text}</span>
                  </div>
                ))}
              </div>

              <div className="mt-auto relative z-10">
                <button 
                  className="w-full bg-[#FFB238] hover:bg-[#e69a25] text-[#14181C] py-3.5 rounded-xl font-bold text-[15px] transition-colors shadow-[0_4px_12px_rgba(255,178,56,0.2)]" 
                  onClick={() => navigate('/verify')}
                >
                  Start Verification
                </button>
              </div>
            </section>
          )}
          </div>
        </div>

      </div>
    </div>
  )
}
