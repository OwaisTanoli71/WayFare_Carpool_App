import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import Button from '../components/Button'
import AdminSidebar from '../components/AdminSidebar'
import { supabase } from '../lib/supabase'

// Audit logs fallback
const MOCK_ACTIVITY_LOGS = [
  {
    id: 'log-1',
    created_at: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
    admin_email: 'admin@wayfare.com',
    action_type: 'VERIFICATION_APPROVED',
    target_entity: 'driver_mock1@example.com',
    details: 'Approved CNIC & Driving License document verification'
  },
  {
    id: 'log-2',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    admin_email: 'admin@wayfare.com',
    action_type: 'RIDE_MANAGED',
    target_entity: 'Islamabad → Rawalpindi Route',
    details: 'Reviewed and confirmed ongoing ride listing'
  },
  {
    id: 'log-3',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    admin_email: 'admin@wayfare.com',
    action_type: 'USER_ACTIVATED',
    target_entity: 'mudasir@gmail.com',
    details: 'Verified account status and activated profile access'
  },
  {
    id: 'log-4',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
    admin_email: 'admin@wayfare.com',
    action_type: 'ADMIN_PROMOTED',
    target_entity: 'admin@wayfare.com',
    details: 'Granted master console administrative privileges'
  }
]

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview') // overview | verifications | users | rides | reviews | activity_logs | admins
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  
  // Data States
  const [users, setUsers] = useState([])
  const [verifications, setVerifications] = useState([])
  const [rides, setRides] = useState([])
  const [reviews, setReviews] = useState([])
  const [activityLogs, setActivityLogs] = useState(MOCK_ACTIVITY_LOGS)
  const [loadingData, setLoadingData] = useState(true)

  // Modals & Actions State
  const [reviewingDoc, setReviewingDoc] = useState(null)
  const [inspectingUser, setInspectingUser] = useState(null) // selected user profile object for admin inspection modal
  const [inspectingRide, setInspectingRide] = useState(null) // selected ride for admin preview modal
  const [userRides, setUserRides] = useState([])
  const [loadingUserRides, setLoadingUserRides] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [showAddUserModal, setShowAddUserModal] = useState(false)
  const [fullscreenImage, setFullscreenImage] = useState(null) // { url, title }
  const [zoomScale, setZoomScale] = useState(1)
  const [rotationDeg, setRotationDeg] = useState(0)

  // Filters & Search
  const [userSearch, setUserSearch] = useState('')
  const [userRoleFilter, setUserRoleFilter] = useState('all')
  const [rideFilter, setRideFilter] = useState('all')

  // Date Filter State for Activity Logs
  const [dateFilterPreset, setDateFilterPreset] = useState('all') // all | today | 7days | 30days | custom
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  // New Admin Form State (Super Admin Only)
  const [adminRegisterForm, setAdminRegisterForm] = useState({ name: '', email: '', password: '' })
  const [selectedUserEmailToPromote, setSelectedUserEmailToPromote] = useState('')
  const [registeringAdmin, setRegisteringAdmin] = useState(false)
  const [promoteMsg, setPromoteMsg] = useState(null)

  // New User Form State
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    gender: 'male',
    city: 'Islamabad',
    role: 'rider'
  })
  const [addingUser, setAddingUser] = useState(false)
  const [userActionMsg, setUserActionMsg] = useState(null)

  const { user, logout } = useApp()
  const navigate = useNavigate()

  // Super Admin Check
  const isSuperAdmin = user?.email === 'admin@wayfare.com' || user?.role === 'super_admin'

  useEffect(() => {
    fetchAllData()

    // Real-Time Supabase Listener for instant dashboard updates
    const channel = supabase
      .channel('admin-dashboard-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'activity_logs' }, (payload) => {
        if (payload.new) {
          setActivityLogs(prev => [payload.new, ...prev.filter(l => l.id !== payload.new.id)])
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'verifications' }, () => {
        fetchAllData()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, () => {
        fetchAllData()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rides' }, () => {
        fetchAllData()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  // Fetch ride history for inspected user profile modal
  useEffect(() => {
    if (!inspectingUser) {
      setUserRides([])
      return
    }
    async function fetchUserDetailRides() {
      setLoadingUserRides(true)
      try {
        const { data } = await supabase
          .from('rides')
          .select('*')
          .eq('driver_id', inspectingUser.id)
          .order('created_at', { ascending: false })
        if (data) setUserRides(data)
      } catch (err) {
        console.error("Error fetching user rides:", err)
      } finally {
        setLoadingUserRides(false)
      }
    }
    fetchUserDetailRides()
  }, [inspectingUser])

  const logActivity = async (action_type, target_entity, details) => {
    const newLog = {
      id: `log-${Date.now()}`,
      created_at: new Date().toISOString(),
      admin_email: user?.email || 'admin@wayfare.com',
      action_type,
      target_entity,
      details
    }
    setActivityLogs(prev => [newLog, ...prev])

    // Persist log to Supabase activity_logs table
    try {
      await supabase.from('activity_logs').insert({
        admin_email: user?.email || 'admin@wayfare.com',
        action_type,
        target_entity,
        details
      })
    } catch (err) {
      console.error('Logged activity locally (table creation recommended)', err)
    }
  }

  const fetchAllData = async () => {
    setLoadingData(true)
    try {
      const { data: usersData } = await supabase.from('users').select('*').order('created_at', { ascending: false })
      const { data: verificationsData } = await supabase.from('verifications').select(`*, user:users(name, email, role)`).order('created_at', { ascending: false })
      const { data: ridesData } = await supabase.from('rides').select(`*, driver:users(name, email, avatar)`).order('created_at', { ascending: false })
      const { data: reviewsData } = await supabase.from('app_reviews').select(`*, user:users(name, email, avatar)`).order('created_at', { ascending: false })
      const { data: dbLogs } = await supabase.from('activity_logs').select('*').order('created_at', { ascending: false }).limit(50)

      if (usersData) setUsers(usersData)
      if (verificationsData) setVerifications(verificationsData)
      if (ridesData) setRides(ridesData)
      if (reviewsData) setReviews(reviewsData)
      if (dbLogs && dbLogs.length > 0) {
        setActivityLogs(dbLogs)
      }
    } catch (err) {
      console.error('Error loading admin data:', err)
    } finally {
      setLoadingData(false)
    }
  }

  // Analytics Metrics
  const totalUsers = users.length
  const driversCount = users.filter(u => u.role === 'driver').length
  const ridersCount = users.filter(u => u.role === 'rider').length
  const bothCount = users.filter(u => u.role === 'both').length
  const verifiedUsersCount = users.filter(u => u.verified === true).length
  const unverifiedUsersCount = users.filter(u => !u.verified).length
  const pendingVerificationsCount = verifications.filter(v => v.status === 'pending').length

  // User Actions
  const handleToggleUserActive = async (userId, currentStatus) => {
    const newStatus = currentStatus === 'deactivated' ? 'active' : 'deactivated'
    const targetUser = users.find(u => u.id === userId)
    try {
      await supabase.from('users').update({ status: newStatus }).eq('id', userId)
      setUsers(users.map(u => u.id === userId ? { ...u, status: newStatus } : u))
      logActivity(
        newStatus === 'deactivated' ? 'USER_DEACTIVATED' : 'USER_ACTIVATED',
        targetUser?.email || userId,
        `Account status updated to ${newStatus}`
      )
    } catch (err) {
      alert('Failed to update user status')
    }
  }

  const handleRegisterUser = async (e) => {
    e.preventDefault()
    setAddingUser(true)
    setUserActionMsg(null)
    try {
      const { data, error } = await supabase.auth.signUp({
        email: newUser.email,
        password: newUser.password,
        options: {
          data: {
            name: newUser.name,
            gender: newUser.gender,
            city: newUser.city
          }
        }
      })
      if (error) throw error

      if (data?.user) {
        await supabase.from('users').upsert({
          id: data.user.id,
          name: newUser.name,
          email: newUser.email,
          gender: newUser.gender,
          city: newUser.city,
          role: newUser.role,
          status: 'active',
          verified: false
        })
      }
      setUserActionMsg({ type: 'success', text: `User ${newUser.name} registered successfully!` })
      logActivity('USER_REGISTERED', newUser.email, `Created user account with role ${newUser.role}`)
      setShowAddUserModal(false)
      setNewUser({ name: '', email: '', password: '', gender: 'male', city: 'Islamabad', role: 'rider' })
      fetchAllData()
    } catch (err) {
      setUserActionMsg({ type: 'error', text: err.message || 'Failed to create user.' })
    } finally {
      setAddingUser(false)
    }
  }

  // Verification Doc Actions
  const handleVerificationAction = async (verificationId, targetUserId, action) => {
    setProcessing(true)
    const targetVerif = verifications.find(v => v.id === verificationId)
    try {
      const status = action === 'approve' ? 'approved' : 'rejected'
      await supabase.from('verifications').update({ status }).eq('id', verificationId)

      if (action === 'approve') {
        await supabase.from('users').update({ verified: true, role: 'driver' }).eq('id', targetUserId)
        await supabase.from('notifications').insert({
          user_id: targetUserId,
          type: 'verification_approved',
          title: 'Account Verified!',
          body: 'Your identity and driver documents have been approved by Admin.',
          link: '/profile'
        })
        logActivity('VERIFICATION_APPROVED', targetVerif?.user?.email || targetUserId, 'Approved driver documents & verified profile')
      } else {
        await supabase.from('users').update({ verified: false }).eq('id', targetUserId)
        logActivity('VERIFICATION_REJECTED', targetVerif?.user?.email || targetUserId, 'Rejected driver documents')
      }

      setVerifications(verifications.map(v => v.id === verificationId ? { ...v, status } : v))
      setReviewingDoc(null)
      fetchAllData()
    } catch (err) {
      alert('Failed to process verification action')
    } finally {
      setProcessing(false)
    }
  }

  // Ride Management
  const handleToggleRideStatus = async (rideId, currentStatus) => {
    const nextStatus = currentStatus === 'cancelled' ? 'open' : 'cancelled'
    const targetRide = rides.find(r => r.id === rideId)
    try {
      await supabase.from('rides').update({ status: nextStatus }).eq('id', rideId)
      setRides(rides.map(r => r.id === rideId ? { ...r, status: nextStatus } : r))
      logActivity(
        nextStatus === 'cancelled' ? 'RIDE_CANCELLED' : 'RIDE_REOPENED',
        `${targetRide?.from_location} → ${targetRide?.to_location}`,
        `Updated ride status to ${nextStatus}`
      )
    } catch (err) {
      alert('Failed to update ride status')
    }
  }

  // Review Approval
  const handleReviewAction = async (reviewId, action) => {
    try {
      if (action === 'approve') {
        await supabase.from('app_reviews').update({ status: 'approved' }).eq('id', reviewId)
        setReviews(reviews.map(r => r.id === reviewId ? { ...r, status: 'approved' } : r))
        logActivity('REVIEW_APPROVED', `Review #${reviewId.slice(0, 6)}`, 'Approved public review listing')
      } else if (action === 'delete') {
        await supabase.from('app_reviews').delete().eq('id', reviewId)
        setReviews(reviews.filter(r => r.id !== reviewId))
        logActivity('REVIEW_DELETED', `Review #${reviewId.slice(0, 6)}`, 'Deleted user review from system')
      }
    } catch (err) {
      alert('Failed to update review status')
    }
  }

  // 1. Register Brand New Admin Account
  const handleRegisterNewAdmin = async (e) => {
    e.preventDefault()
    if (!isSuperAdmin) {
      alert('Super Admin privileges required!')
      return
    }
    setRegisteringAdmin(true)
    setPromoteMsg(null)
    try {
      const { data, error } = await supabase.auth.signUp({
        email: adminRegisterForm.email,
        password: adminRegisterForm.password,
        options: {
          data: { name: adminRegisterForm.name }
        }
      })
      if (error) throw error

      if (data?.user) {
        await supabase.from('users').upsert({
          id: data.user.id,
          name: adminRegisterForm.name,
          email: adminRegisterForm.email,
          role: 'admin',
          status: 'active',
          verified: true
        })
      }
      setPromoteMsg({ type: 'success', text: `Admin account ${adminRegisterForm.name} (${adminRegisterForm.email}) created successfully!` })
      logActivity('ADMIN_REGISTERED', adminRegisterForm.email, 'Created brand new administrator account')
      setAdminRegisterForm({ name: '', email: '', password: '' })
      fetchAllData()
    } catch (err) {
      setPromoteMsg({ type: 'error', text: err.message || 'Failed to register admin account.' })
    } finally {
      setRegisteringAdmin(false)
    }
  }

  // 2. Promote Existing User by Email Dropdown
  const handlePromoteExistingUser = async (e) => {
    e.preventDefault()
    if (!isSuperAdmin) {
      alert('Super Admin privileges required!')
      return
    }
    if (!selectedUserEmailToPromote) return
    setRegisteringAdmin(true)
    setPromoteMsg(null)
    try {
      const { error } = await supabase.from('users').update({ role: 'admin' }).eq('email', selectedUserEmailToPromote)
      if (error) throw error
      setPromoteMsg({ type: 'success', text: `User ${selectedUserEmailToPromote} successfully promoted to Admin!` })
      logActivity('ADMIN_PROMOTED', selectedUserEmailToPromote, 'Promoted existing platform user to Admin')
      setSelectedUserEmailToPromote('')
      fetchAllData()
    } catch (err) {
      setPromoteMsg({ type: 'error', text: err.message || 'Failed to promote user to admin.' })
    } finally {
      setRegisteringAdmin(false)
    }
  }

  // Filtered Users
  const filteredUsers = users.filter(u => {
    const matchesSearch = (u.name || '').toLowerCase().includes(userSearch.toLowerCase()) ||
                          (u.email || '').toLowerCase().includes(userSearch.toLowerCase()) ||
                          (u.city || '').toLowerCase().includes(userSearch.toLowerCase())
    const matchesRole = userRoleFilter === 'all' || u.role === userRoleFilter
    return matchesSearch && matchesRole
  })

  // Filtered Rides
  const filteredRides = rides.filter(r => {
    if (rideFilter === 'all') return true
    if (rideFilter === 'open') return r.status === 'open' || !r.status
    return r.status === rideFilter
  })

  // Filtered Activity Logs by Date
  const filteredActivityLogs = activityLogs.filter(log => {
    const logDate = new Date(log.created_at)
    const now = new Date()

    if (dateFilterPreset === 'today') {
      return logDate.toDateString() === now.toDateString()
    }
    if (dateFilterPreset === '7days') {
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      return logDate >= sevenDaysAgo
    }
    if (dateFilterPreset === '30days') {
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      return logDate >= thirtyDaysAgo
    }
    if (dateFilterPreset === 'custom') {
      let passStart = true
      let passEnd = true
      if (startDate) {
        passStart = logDate >= new Date(startDate)
      }
      if (endDate) {
        const endOfDay = new Date(endDate)
        endOfDay.setHours(23, 59, 59, 999)
        passEnd = logDate <= endOfDay
      }
      return passStart && passEnd
    }
    return true
  })

  const getTabTitle = () => {
    switch (activeTab) {
      case 'overview': return 'Dashboard'
      case 'verifications': return 'Driver Document Verification Center'
      case 'users': return 'Platform User Management'
      case 'rides': return 'Active Carpool Rides Management'
      case 'reviews': return 'Moderate Platform Reviews'
      case 'activity_logs': return 'Audit Logs & Activity History'
      case 'admins': return 'Register & Manage Admin Privileges'
      default: return 'Admin Console'
    }
  }

  return (
    <>
      {/* Admin Sidebar */}
      <AdminSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        pendingCount={pendingVerificationsCount}
        totalUsersCount={totalUsers}
        ridesCount={rides.length}
        reviewsCount={reviews.length}
        isSuperAdmin={isSuperAdmin}
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />

      {/* Main Layout Area */}
      <main className="main bg-[#0B0E14] min-h-screen text-white pb-16">
        {/* Modern Sticky Glass Header */}
        <header className="sticky top-0 z-40 w-full transition-all duration-300 bg-[#0B0E14]/80 backdrop-blur-2xl border-b border-white/5 shadow-[0_4px_30px_rgba(0,0,0,0.1)] px-6 sm:px-8 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              className="md:hidden shrink-0 flex items-center justify-center w-10 h-10 rounded-xl bg-white/5 border border-white/10 text-ink-200 hover:text-white hover:bg-white/10 transition-colors shadow-sm backdrop-blur-md"
              onClick={() => setMobileMenuOpen(true)}
            >
              <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="4" y1="12" x2="20" y2="12"></line>
                <line x1="4" y1="6" x2="20" y2="6"></line>
                <line x1="4" y1="18" x2="14" y2="18"></line>
              </svg>
            </button>
            <div>
              {activeTab === 'overview' ? (
                <div className="flex flex-col ml-1">
                  <h1 className="font-display text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
                    <span className="bg-gradient-to-r from-blue-400 to-blue-500 text-transparent bg-clip-text">Wayfare</span> Command Center
                  </h1>
                  <span className="text-[10px] font-bold text-ink-400 uppercase tracking-widest mt-0.5">Global Admin Workspace</span>
                </div>
              ) : (
                <>
                  <h1 className="font-display text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
                    {getTabTitle()}
                  </h1>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.1)]">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> All Systems Operational
                    </span>
                    {isSuperAdmin && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full">
                        Super Admin Console
                      </span>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button 
              onClick={fetchAllData}
              disabled={loadingData}
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 text-xs font-bold text-ink-100 hover:text-white transition-all flex items-center gap-2 shadow-sm backdrop-blur-md"
            >
              <svg className={`w-3.5 h-3.5 ${loadingData ? 'animate-spin text-amber-400' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <div 
              className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shadow-lg text-[#14181C] border border-white/10"
              style={{ background: 'linear-gradient(135deg, #F59E0B, #EA580C)' }}
            >
              {user?.name ? user.name[0].toUpperCase() : 'A'}
            </div>
          </div>
        </header>

        {/* System Action Messages Banner */}
        {userActionMsg && (
          <div className={`mb-6 p-4 rounded-2xl text-xs sm:text-sm flex items-center justify-between border ${
            userActionMsg.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-red-500/10 text-red-400 border-red-500/30'
          }`}>
            <span className="font-medium">{userActionMsg.text}</span>
            <button onClick={() => setUserActionMsg(null)} className="text-xs opacity-70 hover:opacity-100">✕</button>
          </div>
        )}

        {/* TAB CONTENT CONTAINER */}
        <div className="page active space-y-6 px-6 sm:px-8 mt-6">
          {/* TAB 1: EXECUTIVE OVERVIEW */}
          {activeTab === 'overview' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
            
              {/* Floating Premium Hero Banner */}
              <div className="relative rounded-[1.5rem] border border-white/10 bg-gradient-to-r from-blue-900/30 to-blue-900/10 backdrop-blur-3xl py-5 px-6 sm:py-6 sm:px-10 shadow-[0_12px_40px_rgba(0,0,0,0.4)] overflow-hidden group">
                <div className="absolute -left-32 -top-32 w-[30rem] h-[30rem] bg-blue-500/10 rounded-full blur-[100px] pointer-events-none group-hover:bg-blue-400/20 transition-all duration-700 mix-blend-screen"></div>
                <div className="absolute right-0 bottom-0 w-[20rem] h-[20rem] bg-indigo-500/10 rounded-full blur-[80px] pointer-events-none mix-blend-screen"></div>
                
                <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
                  <div>
                    <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
                      Welcome back,<br className="sm:hidden" /> <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-300">{user?.name?.split(' ')[0] || 'Administrator'}!</span>
                    </h2>
                    <p className="text-sm sm:text-base text-blue-100/70 font-medium mt-1.5 max-w-lg leading-relaxed">
                      Monitor active carpools, review pending driver documents, and oversee platform operations from your command center.
                    </p>
                  </div>
                  
                  <div className="flex flex-col gap-3 shrink-0">
                    <span className="inline-flex justify-center items-center gap-2 px-4 py-2.5 text-xs font-extrabold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl shadow-[0_0_15px_rgba(16,185,129,0.15)] backdrop-blur-md">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" /> System Operational
                    </span>
                    {isSuperAdmin && (
                      <span className="inline-flex justify-center items-center gap-2 px-4 py-2.5 text-xs font-extrabold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-xl shadow-[0_0_15px_rgba(245,158,11,0.1)] backdrop-blur-md">
                        Super Admin Access
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Key Metric Cards Grid (Premium Glassmorphic Style) */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-5">
                {/* 1. Total Unique Users */}
                <div className="relative rounded-3xl bg-[#171920] border border-white/[0.03] p-4 sm:p-6 shadow-xl hover:-translate-y-1 group overflow-hidden transition-all duration-300">
                  <svg className="absolute -right-2 -bottom-2 w-24 h-24 sm:w-36 sm:h-36 text-blue-500/5 group-hover:text-blue-500/10 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                  
                  <div className="relative z-10 flex flex-col h-full">
                    <div className="flex items-center gap-1.5 sm:gap-2 mb-3 sm:mb-4">
                      <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-500/80 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
                      </svg>
                      <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-blue-500/80 truncate">TOTAL USERS</span>
                    </div>
                    
                    <h3 className="font-serif text-lg sm:text-2xl font-bold text-white flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3">
                      {totalUsers} <span className="hidden sm:inline">Accounts</span> <span className="font-sans text-base sm:text-xl font-light text-ink-400">→</span>
                    </h3>
                    
                    <p className="text-[9px] sm:text-[11px] text-ink-400 font-medium leading-relaxed max-w-[90%] sm:max-w-[85%] mt-auto line-clamp-2">
                      Unique registered accounts
                    </p>
                  </div>
                </div>

                {/* 2. Total Drivers */}
                <div className="relative rounded-3xl bg-[#171920] border border-white/[0.03] p-4 sm:p-6 shadow-xl hover:-translate-y-1 group overflow-hidden transition-all duration-300">
                  <svg className="absolute -right-2 -bottom-2 w-24 h-24 sm:w-36 sm:h-36 text-amber-500/5 group-hover:text-amber-500/10 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 12 10s-6.7.6-8.5 1.1C2.7 11.3 2 12.1 2 13v3c0 .6.4 1 1 1h2" /><path d="M14 17h-4v-1h4v1z" /><path d="M5 17l-.5 2.5c-.2.8.5 1.5 1.3 1.5h.4c.7 0 1.3-.5 1.4-1.2l.4-2.8" /><path d="M19 17l.5 2.5c.2.8-.5 1.5-1.3 1.5h-.4c-.7 0-1.3-.5-1.4-1.2l-.4-2.8" /><path d="M5.5 10l1.2-4.5c.3-1.1 1.2-1.9 2.4-2h5.8c1.2.1 2.1.9 2.4 2l1.2 4.5" /><circle cx="6.5" cy="13.5" r="1.5" /><circle cx="17.5" cy="13.5" r="1.5" />
                  </svg>
                  
                  <div className="relative z-10 flex flex-col h-full">
                    <div className="flex items-center gap-1.5 sm:gap-2 mb-3 sm:mb-4">
                      <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500/80 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                        <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 12 10s-6.7.6-8.5 1.1C2.7 11.3 2 12.1 2 13v3c0 .6.4 1 1 1h2" /><path d="M14 17h-4v-1h4v1z" /><path d="M5 17l-.5 2.5c-.2.8.5 1.5 1.3 1.5h.4c.7 0 1.3-.5 1.4-1.2l.4-2.8" /><path d="M19 17l.5 2.5c.2.8-.5 1.5-1.3 1.5h-.4c-.7 0-1.3-.5-1.4-1.2l-.4-2.8" /><path d="M5.5 10l1.2-4.5c.3-1.1 1.2-1.9 2.4-2h5.8c1.2.1 2.1.9 2.4 2l1.2 4.5" /><circle cx="6.5" cy="13.5" r="1.5" /><circle cx="17.5" cy="13.5" r="1.5" />
                      </svg>
                      <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-amber-500/80 truncate">TOTAL DRIVERS</span>
                    </div>
                    
                    <h3 className="font-serif text-lg sm:text-2xl font-bold text-white flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3">
                      {driversCount} <span className="hidden sm:inline">Drivers</span> <span className="font-sans text-base sm:text-xl font-light text-ink-400">→</span>
                    </h3>
                    
                    <p className="text-[9px] sm:text-[11px] text-ink-400 font-medium leading-relaxed max-w-[90%] sm:max-w-[85%] mt-auto line-clamp-2">
                      Offering active carpool rides
                    </p>
                  </div>
                </div>

                {/* 3. Total Passengers */}
                <div className="relative rounded-3xl bg-[#171920] border border-white/[0.03] p-4 sm:p-6 shadow-xl hover:-translate-y-1 group overflow-hidden transition-all duration-300">
                  <svg className="absolute -right-2 -bottom-2 w-24 h-24 sm:w-36 sm:h-36 text-blue-500/5 group-hover:text-blue-500/10 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" />
                  </svg>
                  
                  <div className="relative z-10 flex flex-col h-full">
                    <div className="flex items-center gap-1.5 sm:gap-2 mb-3 sm:mb-4">
                      <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-500/80 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" />
                      </svg>
                      <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-blue-500/80 truncate">TOTAL PASSENGERS</span>
                    </div>
                    
                    <h3 className="font-serif text-lg sm:text-2xl font-bold text-white flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3">
                      {ridersCount} <span className="hidden sm:inline">Riders</span> <span className="font-sans text-base sm:text-xl font-light text-ink-400">→</span>
                    </h3>
                    
                    <p className="text-[9px] sm:text-[11px] text-ink-400 font-medium leading-relaxed max-w-[90%] sm:max-w-[85%] mt-auto line-clamp-2">
                      Booking carpool seats
                    </p>
                  </div>
                </div>

                {/* 4. Dual Role (Both) */}
                <div className="relative rounded-3xl bg-[#171920] border border-white/[0.03] p-4 sm:p-6 shadow-xl hover:-translate-y-1 group overflow-hidden transition-all duration-300">
                  <svg className="absolute -right-2 -bottom-2 w-24 h-24 sm:w-36 sm:h-36 text-amber-500/5 group-hover:text-amber-500/10 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M8 3 4 7l4 4" /><path d="M4 7h16" /><path d="m16 21 4-4-4-4" /><path d="M20 17H4" />
                  </svg>
                  
                  <div className="relative z-10 flex flex-col h-full">
                    <div className="flex items-center gap-1.5 sm:gap-2 mb-3 sm:mb-4">
                      <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500/80 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                        <path d="M8 3 4 7l4 4" /><path d="M4 7h16" /><path d="m16 21 4-4-4-4" /><path d="M20 17H4" />
                      </svg>
                      <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-amber-500/80 truncate">DUAL ROLE</span>
                    </div>
                    
                    <h3 className="font-serif text-lg sm:text-2xl font-bold text-white flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3">
                      {bothCount} <span className="hidden sm:inline">Users</span> <span className="font-sans text-base sm:text-xl font-light text-ink-400">→</span>
                    </h3>
                    
                    <p className="text-[9px] sm:text-[11px] text-ink-400 font-medium leading-relaxed max-w-[90%] sm:max-w-[85%] mt-auto line-clamp-2">
                      Offers & books rides
                    </p>
                  </div>
                </div>
              </div>

              {/* Verification & Platform Safety Breakdown */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-5">
                {/* 1. Verified Profiles */}
                <div className="relative rounded-3xl bg-[#171920] border border-white/[0.03] p-4 sm:p-6 shadow-xl hover:-translate-y-1 group overflow-hidden transition-all duration-300">
                  <svg className="absolute -right-2 -bottom-2 w-24 h-24 sm:w-36 sm:h-36 text-blue-500/5 group-hover:text-blue-500/10 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="m9 12 2 2 4-4" />
                  </svg>
                  
                  <div className="relative z-10 flex flex-col h-full">
                    <div className="flex items-center gap-1.5 sm:gap-2 mb-3 sm:mb-4">
                      <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-500/80 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="m9 12 2 2 4-4" />
                      </svg>
                      <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-blue-500/80 truncate">VERIFIED PROFILES</span>
                    </div>
                    
                    <h3 className="font-serif text-lg sm:text-2xl font-bold text-white flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3">
                      {verifiedUsersCount} <span className="hidden sm:inline">Profiles</span> <span className="font-sans text-base sm:text-xl font-light text-ink-400">→</span>
                    </h3>
                    
                    <p className="text-[9px] sm:text-[11px] text-ink-400 font-medium leading-relaxed max-w-[90%] sm:max-w-[85%] mt-auto line-clamp-2">
                      {((verifiedUsersCount / (totalUsers || 1)) * 100).toFixed(0)}% securely verified
                    </p>
                  </div>
                </div>

                {/* 2. Unverified Users */}
                <div className="relative rounded-3xl bg-[#171920] border border-white/[0.03] p-4 sm:p-6 shadow-xl hover:-translate-y-1 group overflow-hidden transition-all duration-300">
                  <svg className="absolute -right-2 -bottom-2 w-24 h-24 sm:w-36 sm:h-36 text-amber-500/5 group-hover:text-amber-500/10 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
                  </svg>
                  
                  <div className="relative z-10 flex flex-col h-full">
                    <div className="flex items-center gap-1.5 sm:gap-2 mb-3 sm:mb-4">
                      <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500/80 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
                      </svg>
                      <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-amber-500/80 truncate">UNVERIFIED USERS</span>
                    </div>
                    
                    <h3 className="font-serif text-lg sm:text-2xl font-bold text-white flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3">
                      {unverifiedUsersCount} <span className="hidden sm:inline">Pending</span> <span className="font-sans text-base sm:text-xl font-light text-ink-400">→</span>
                    </h3>
                    
                    <p className="text-[9px] sm:text-[11px] text-ink-400 font-medium leading-relaxed max-w-[90%] sm:max-w-[85%] mt-auto line-clamp-2">
                      Awaiting document submission
                    </p>
                  </div>
                </div>

                {/* 3. Pending Driver Review */}
                <div className="col-span-2 sm:col-span-1 relative rounded-3xl bg-[#171920] border border-white/[0.03] p-4 sm:p-6 shadow-xl hover:-translate-y-1 group overflow-hidden transition-all duration-300">
                  <svg className="absolute -right-2 -bottom-2 w-24 h-24 sm:w-36 sm:h-36 text-amber-500/5 group-hover:text-amber-500/10 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  
                  <div className="relative z-10 flex flex-col h-full">
                    <div className="flex items-center gap-1.5 sm:gap-2 mb-3 sm:mb-4">
                      <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500/80 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                      </svg>
                      <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-amber-500/80 truncate">DRIVER REVIEWS</span>
                    </div>
                    
                    <h3 className="font-serif text-lg sm:text-2xl font-bold text-white flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3">
                      {pendingVerificationsCount} <span className="hidden sm:inline">Reviews</span> <span className="font-sans text-base sm:text-xl font-light text-ink-400">→</span>
                    </h3>
                    
                    <button onClick={() => setActiveTab('verifications')} className="text-[9px] sm:text-[11px] font-bold text-amber-400 hover:text-amber-300 mt-auto text-left w-max transition-colors relative z-20">
                      Review applications →
                    </button>
                  </div>
                </div>
              </div>

              {/* Two-Column Enterprise Operational Dashboard Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Left Column (2/3 Width): Pending Driver Verifications Table Preview */}
                <div className="lg:col-span-2 rounded-[1.5rem] border border-white/5 bg-[#11141A]/60 backdrop-blur-3xl p-7 shadow-[0_8px_30px_rgba(0,0,0,0.15)] flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="font-display text-xl font-bold text-white tracking-tight">Pending Driver Verifications</h3>
                        <p className="text-xs text-ink-400 font-medium mt-1">Applications awaiting identity document approval</p>
                      </div>
                      <button onClick={() => setActiveTab('verifications')} className="text-xs font-bold text-amber-400 hover:text-amber-300 transition-colors">
                        View All ({pendingVerificationsCount}) →
                      </button>
                    </div>

                    <div className="rounded-2xl border border-white/10 overflow-hidden bg-white/[0.02]">
                      <table className="w-full text-left text-xs text-ink-200">
                        <thead className="bg-white/5 text-[10px] uppercase font-black tracking-widest text-ink-400 border-b border-white/10">
                          <tr>
                            <th className="px-5 py-3.5">User</th>
                            <th className="px-5 py-3.5">Vehicle</th>
                            <th className="px-5 py-3.5 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {verifications.filter(v => v.status === 'pending').length === 0 ? (
                            <tr>
                              <td colSpan="3" className="px-5 py-12 text-center text-ink-400 font-medium">
                                ✓ All driver applications are currently reviewed and up to date!
                              </td>
                            </tr>
                          ) : (
                            verifications.filter(v => v.status === 'pending').slice(0, 4).map((v) => (
                              <tr key={v.id} className="hover:bg-white/5 transition-colors">
                                <td className="px-5 py-4">
                                  <div className="font-bold text-white text-sm">{v.user?.name || 'Applicant'}</div>
                                  <div className="text-[11px] text-ink-400 mt-0.5">{v.user?.email}</div>
                                </td>
                                <td className="px-5 py-4 text-ink-300">
                                  {v.car_details ? <span className="font-medium text-ink-200">{v.car_details.make} {v.car_details.model}</span> : 'Standard Car'}
                                </td>
                                <td className="px-5 py-4 text-right">
                                  <button
                                    onClick={() => setReviewingDoc(v)}
                                    className="px-4 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-bold transition-all shadow-sm"
                                  >
                                    Review Docs
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Right Column (1/3 Width): Live System Activity Feed (Enhanced Crystal Style) */}
                <div className="rounded-[1.5rem] border border-white/5 bg-[#11141A]/80 backdrop-blur-3xl p-7 shadow-[0_8px_30px_rgba(0,0,0,0.15)] flex flex-col relative overflow-hidden group hover:border-white/10 transition-all">
                  <div className="absolute -right-10 -top-10 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-purple-500/20 transition-all duration-500"></div>
                  
                  <div className="relative z-10 flex items-center justify-between mb-6">
                    <div>
                      <h3 className="font-display text-xl font-bold text-white tracking-tight flex items-center gap-2">
                        <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Live Activity
                      </h3>
                      <p className="text-xs text-ink-400 font-medium mt-1">Real-time system audit logs</p>
                    </div>
                    <button onClick={() => setActiveTab('activity_logs')} className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[10px] font-bold text-white uppercase tracking-wider transition-colors border border-white/5 shadow-sm">
                      View All
                    </button>
                  </div>

                  <div className="relative z-10 space-y-3">
                    {activityLogs.slice(0, 4).map((log) => (
                      <div key={log.id} className="relative p-4 rounded-2xl border border-white/5 bg-[#0B0E14]/50 hover:bg-white/[0.04] transition-all shadow-inner group/item flex gap-4">
                        <div className="shrink-0 w-8 h-8 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 font-bold text-xs shadow-[0_0_10px_rgba(168,85,247,0.1)] group-hover/item:scale-110 transition-transform">
                          {log.admin_email.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="font-bold text-white text-xs truncate pr-2">{log.admin_email.split('@')[0]}</span>
                            <span className="text-[9px] text-ink-400 font-bold uppercase tracking-wider bg-white/5 px-2 py-0.5 rounded-full shrink-0">
                              {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <div className="text-ink-300 text-[11px] leading-relaxed font-medium">{log.details}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

            </motion.div>
          )}

          {/* TAB 2: VERIFICATIONS */}
          {activeTab === 'verifications' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-display text-xl font-bold text-white">Driver Verification Requests</h2>
                  <p className="text-xs text-ink-300 mt-0.5">Review Liveness Selfie, CNIC, and License documents before approving drivers.</p>
                </div>
                <span className="px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-full text-xs font-bold">
                  {pendingVerificationsCount} Pending
                </span>
              </div>

              <div className="rounded-2xl border border-ink-700/80 bg-[#121721] shadow-card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full table-fixed text-center text-xs sm:text-sm text-ink-100 whitespace-nowrap">
                    <thead className="border-b border-ink-700 bg-ink-800/80 text-[11px] uppercase tracking-wider text-ink-400">
                      <tr>
                        <th className="px-6 pl-12 py-4 font-bold text-left w-[28%]">User</th>
                        <th className="px-6 py-4 font-bold text-center">Vehicle</th>
                        <th className="px-6 py-4 font-bold text-center">Submitted</th>
                        <th className="px-6 py-4 font-bold text-center">Status</th>
                        <th className="px-6 pr-12 py-4 font-bold text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-ink-700/50">
                      {verifications.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="px-6 py-12 text-center text-ink-400">
                            <div className="mx-auto w-10 h-10 rounded-full bg-ink-700/50 flex items-center justify-center mb-2">
                              <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                            No pending driver verification requests.
                          </td>
                        </tr>
                      ) : (
                        verifications.map((v) => (
                          <tr key={v.id} className="hover:bg-ink-800/30 transition-colors text-center">
                            <td className="px-6 pl-12 py-4 text-left">
                              <div className="font-bold text-white">{v.user?.name || 'Unknown User'}</div>
                              <div className="text-xs text-ink-400 mt-1">{v.user?.email}</div>
                            </td>
                            <td className="px-6 py-4 text-ink-200">
                              {v.car_details ? `${v.car_details.make} ${v.car_details.model}` : 'Standard Car'}
                            </td>
                            <td className="px-6 py-4 text-xs font-medium text-ink-300">
                              {new Date(v.created_at || Date.now()).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 align-middle text-center">
                              <span className={`inline-flex items-center justify-center px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest border ${
                                v.status === 'approved' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                v.status === 'rejected' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                'bg-amber-500/10 text-amber-400 border-amber-500/20'
                              }`}>
                                {v.status || 'pending'}
                              </span>
                            </td>
                            <td className="px-6 pr-12 py-4">
                              <Button 
                                variant="primary" 
                                className="px-4 py-1.5 text-xs font-bold" 
                                onClick={() => setReviewingDoc(v)}
                              >
                                Preview Docs
                              </Button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 3: USERS */}
          {activeTab === 'users' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="font-display text-xl font-bold text-white">Platform Users ({totalUsers})</h2>
                  <p className="text-xs text-ink-300 mt-0.5">Search, register new users, or deactivate existing user accounts.</p>
                </div>
                <Button 
                  variant="primary" 
                  onClick={() => setShowAddUserModal(true)} 
                  className="py-2.5 px-4 text-xs font-bold flex items-center gap-2"
                >
                  <span>+ Register New User</span>
                </Button>
              </div>

              {/* Toolbar */}
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  placeholder="Search user by name, email, or city..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="flex-1 rounded-xl border border-ink-700 bg-ink-800/80 px-4 py-2.5 text-xs text-white placeholder-ink-400 focus:border-beacon focus:outline-none"
                />
                <select
                  value={userRoleFilter}
                  onChange={(e) => setUserRoleFilter(e.target.value)}
                  className="rounded-xl border border-ink-700 bg-ink-800 px-4 py-2.5 text-xs text-white focus:border-beacon focus:outline-none"
                >
                  <option value="all">All Roles</option>
                  <option value="driver">Drivers</option>
                  <option value="rider">Riders / Passengers</option>
                  <option value="both">Both (Dual Role)</option>
                </select>
              </div>

              {/* Users Table */}
              <div className="rounded-2xl border border-ink-700/80 bg-[#121721] shadow-card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full table-fixed text-center text-xs sm:text-sm text-ink-100 whitespace-nowrap">
                    <thead className="border-b border-ink-700 bg-ink-800/80 text-[11px] uppercase tracking-wider text-ink-400">
                      <tr>
                        <th className="px-6 pl-12 py-4 font-bold text-left w-[28%]"><span className="ml-[44px]">User Profile</span></th>
                        <th className="px-6 py-4 font-bold text-center">City & Gender</th>
                        <th className="px-6 py-4 font-bold text-center">Role</th>
                        <th className="px-6 py-4 font-bold text-center">Verification</th>
                        <th className="px-6 py-4 font-bold text-center">Status</th>
                        <th className="px-6 pr-12 py-4 font-bold text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-ink-700/50">
                      {filteredUsers.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="px-6 py-8 text-center text-ink-400">No users found matching query.</td>
                        </tr>
                      ) : (
                        filteredUsers.map((u) => (
                          <tr key={u.id} className="hover:bg-ink-800/40 transition-colors text-center">
                            <td className="px-6 pl-12 py-4 text-left">
                              <div 
                                onClick={() => setInspectingUser(u)}
                                className="flex items-center justify-start gap-3 cursor-pointer group hover:opacity-80 transition-opacity"
                                title="Click to view full user profile"
                              >
                                <div className="h-8 w-8 rounded-full bg-beacon/20 text-beacon flex items-center justify-center font-bold text-xs group-hover:scale-105 transition-transform">
                                  {u.name ? u.name[0].toUpperCase() : 'U'}
                                </div>
                                <div className="text-left">
                                  <div className="font-bold text-white group-hover:text-amber-400 transition-colors flex items-center gap-1.5">
                                    {u.name || 'Unnamed User'}
                                    <span className="text-[10px] font-normal text-amber-400/80 underline opacity-0 group-hover:opacity-100 transition-opacity">View Profile →</span>
                                  </div>
                                  <div className="text-xs text-ink-400 mt-0.5">{u.email}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-xs font-medium text-ink-300">
                              {u.city || 'N/A'} • <span className="capitalize">{u.gender || 'unspecified'}</span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="capitalize text-[10px] uppercase font-bold tracking-widest px-3 py-1 rounded-md bg-ink-800 text-ink-200 border border-ink-700">
                                {u.role || 'rider'}
                              </span>
                            </td>
                            <td className="px-6 py-4 align-middle text-center">
                              {u.verified ? (
                                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest inline-flex items-center gap-1">
                                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                  </svg> Verified
                                </span>
                              ) : (
                                <span className="text-[10px] font-bold text-ink-500 uppercase tracking-widest">Unverified</span>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              <span className={`text-[10px] uppercase tracking-widest font-bold px-3 py-1 rounded-md border ${
                                u.status === 'deactivated' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              }`}>
                                {u.status === 'deactivated' ? 'Deactivated' : 'Active'}
                              </span>
                            </td>
                            <td className="px-6 pr-12 py-4">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={() => handleToggleUserActive(u.id, u.status)}
                                  disabled={u.email === 'admin@wayfare.com' || u.role === 'super_admin'}
                                  className={`px-4 py-1.5 rounded-lg text-[11px] font-bold transition-all border ${
                                    (u.email === 'admin@wayfare.com' || u.role === 'super_admin')
                                      ? 'opacity-40 cursor-not-allowed bg-ink-800 text-ink-500 border-ink-700'
                                      : u.status === 'deactivated' 
                                        ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                                        : 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/30'
                                  }`}
                                >
                                  {(u.email === 'admin@wayfare.com' || u.role === 'super_admin') ? 'Protected' : u.status === 'deactivated' ? 'Activate' : 'Deactivate'}
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 4: RIDES */}
          {activeTab === 'rides' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-display text-xl font-bold text-white">Manage Posted Rides</h2>
                  <p className="text-xs text-ink-300 mt-0.5">Monitor active routes, driver allocations, and cancel inappropriate rides.</p>
                </div>
                <div className="flex gap-2">
                  {['all', 'open', 'completed', 'cancelled'].map(st => (
                    <button
                      key={st}
                      onClick={() => setRideFilter(st)}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize ${
                        rideFilter === st ? 'bg-beacon text-ink-900 font-bold' : 'bg-ink-800 text-ink-300 hover:text-white'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-ink-700/80 bg-[#121721] shadow-card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full table-fixed text-center text-xs sm:text-sm text-ink-100 whitespace-nowrap">
                    <thead className="border-b border-ink-700 bg-ink-800/80 text-[11px] uppercase tracking-wider text-ink-400">
                      <tr>
                        <th className="px-6 pl-12 py-4 font-bold text-left w-[28%]">Route</th>
                        <th className="px-6 py-4 font-bold text-center">Driver</th>
                        <th className="px-6 py-4 font-bold text-center">Price</th>
                        <th className="px-6 py-4 font-bold text-center">Seats</th>
                        <th className="px-6 py-4 font-bold text-center">Status</th>
                        <th className="px-6 pr-12 py-4 font-bold text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-ink-700/50">
                      {filteredRides.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="px-6 py-8 text-center text-ink-400">No rides found.</td>
                        </tr>
                      ) : (
                        filteredRides.map((r) => (
                          <tr key={r.id} onClick={() => setInspectingRide(r)} className="hover:bg-ink-800/30 transition-colors cursor-pointer group text-center">
                            <td className="px-6 pl-12 py-4 text-left">
                              <div className="font-bold text-white group-hover:text-amber-400 transition-colors">{r.from_location} → {r.to_location}</div>
                              <div className="text-xs text-ink-400 mt-1">{r.type || 'In-City'} • {new Date(r.date || Date.now()).toLocaleDateString()}</div>
                            </td>
                            <td className="px-6 py-4 text-xs font-medium text-ink-200">
                              {r.driver?.name || 'Driver'}
                            </td>
                            <td className="px-6 py-4 text-sm font-bold text-amber-400">
                              Rs {r.price}
                            </td>
                            <td className="px-6 py-4 text-sm font-bold text-ink-300">
                              {r.seats} left
                            </td>
                            <td className="px-6 py-4">
                              <span className={`text-[10px] font-bold px-3 py-1 rounded-md uppercase tracking-widest border ${
                                r.status === 'cancelled' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              }`}>
                                {r.status || 'open'}
                              </span>
                            </td>
                            <td className="px-6 pr-12 py-4">
                              <button
                                onClick={(e) => { e.stopPropagation(); handleToggleRideStatus(r.id, r.status) }}
                                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                                  r.status === 'cancelled'
                                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                                    : 'bg-red-500/10 text-red-400 border-red-500/30 hover:bg-red-500/20'
                                }`}
                              >
                                {r.status === 'cancelled' ? 'Re-Open Ride' : 'Cancel Ride'}
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 5: REVIEWS */}
          {activeTab === 'reviews' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div>
                <h2 className="font-display text-xl font-bold text-white">App Reviews & Ratings</h2>
                <p className="text-xs text-ink-300 mt-0.5">Moderate public user reviews submitted from the platform landing modal.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {reviews.length === 0 ? (
                  <div className="col-span-2 p-8 text-center border border-ink-700 rounded-2xl text-ink-400">
                    No reviews submitted yet.
                  </div>
                ) : (
                  reviews.map((rev) => (
                    <div key={rev.id} className="p-5 rounded-2xl border border-ink-700 bg-ink-800/40 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-beacon/20 text-beacon flex items-center justify-center font-bold text-xs">
                            {rev.user?.name ? rev.user.name[0].toUpperCase() : 'U'}
                          </div>
                          <div>
                            <div className="font-bold text-xs text-white">{rev.user?.name || 'Anonymous User'}</div>
                            <div className="text-[10px] text-ink-400">{new Date(rev.created_at || Date.now()).toLocaleDateString()}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-0.5 text-amber-400">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <svg key={star} className={`w-4 h-4 ${star <= (rev.rating || 5) ? 'text-amber-400 fill-amber-400' : 'text-ink-600 fill-transparent'}`} viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                            </svg>
                          ))}
                        </div>
                      </div>
                      <p className="text-xs text-ink-100 leading-relaxed italic">"{rev.content}"</p>
                      
                      <div className="flex items-center justify-between pt-2 border-t border-ink-700/50">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          rev.status === 'approved' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                        }`}>
                          {rev.status || 'Pending Review'}
                        </span>

                        <div className="flex gap-2">
                          {rev.status !== 'approved' && (
                            <button 
                              onClick={() => handleReviewAction(rev.id, 'approve')}
                              className="px-2.5 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 text-xs font-bold rounded-lg"
                            >
                              Approve
                            </button>
                          )}
                          <button 
                            onClick={() => handleReviewAction(rev.id, 'delete')}
                            className="px-2.5 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold rounded-lg"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}

          {/* TAB 6: ACTIVITY LOGS (SUPER ADMIN ONLY WITH DATE FILTER) */}
          {activeTab === 'activity_logs' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              {!isSuperAdmin ? (
                <div className="p-8 rounded-3xl border border-amber-500/30 bg-amber-500/10 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto text-xl">🔒</div>
                  <h2 className="text-lg font-bold text-white">Super Admin Access Required</h2>
                  <p className="text-xs text-ink-300 max-w-md mx-auto">Only master Super Administrators (`admin@wayfare.com`) can review audit logs and activity histories.</p>
                </div>
              ) : (
                <>
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h2 className="font-display text-xl font-bold text-white">System Activity & Audit Logs</h2>
                      <p className="text-xs text-ink-300 mt-0.5">Track administrative actions, verifications, and platform changes.</p>
                    </div>

                    {/* Date Filters Toolbar */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold text-ink-400 mr-1">Date Filter:</span>
                      {[
                        { id: 'all', label: 'All Time' },
                        { id: 'today', label: 'Today' },
                        { id: '7days', label: 'Past 7 Days' },
                        { id: '30days', label: 'Past 30 Days' },
                        { id: 'custom', label: 'Custom Range' },
                      ].map(f => (
                        <button
                          key={f.id}
                          onClick={() => setDateFilterPreset(f.id)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                            dateFilterPreset === f.id ? 'bg-beacon text-ink-900 font-bold' : 'bg-ink-800 text-ink-300 hover:text-white border border-ink-700'
                          }`}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Custom Date Pickers */}
                  {dateFilterPreset === 'custom' && (
                    <div className="flex items-center gap-3 p-4 rounded-2xl border border-ink-700 bg-[#121721]">
                      <div>
                        <label className="text-[11px] font-bold text-ink-400 block mb-1">Start Date</label>
                        <input
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          className="rounded-xl border border-ink-700 bg-ink-900 px-3 py-1.5 text-xs text-white focus:border-beacon focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-ink-400 block mb-1">End Date</label>
                        <input
                          type="date"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          className="rounded-xl border border-ink-700 bg-ink-900 px-3 py-1.5 text-xs text-white focus:border-beacon focus:outline-none"
                        />
                      </div>
                      {(startDate || endDate) && (
                        <button 
                          onClick={() => { setStartDate(''); setEndDate(''); }}
                          className="mt-5 text-xs font-bold text-red-400 hover:underline"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  )}

                  {/* Activity Logs Table */}
                  <div className="rounded-2xl border border-ink-700/80 bg-[#121721] shadow-card overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full table-fixed text-center text-xs sm:text-sm text-ink-100 whitespace-nowrap">
                        <thead className="border-b border-ink-700 bg-ink-800/80 text-[11px] uppercase tracking-wider text-ink-400">
                          <tr>
                            <th className="px-6 pl-12 py-4 font-bold text-left w-[25%]">Timestamp</th>
                            <th className="px-6 py-4 font-bold text-center">Admin</th>
                            <th className="px-6 py-4 font-bold text-center">Action</th>
                            <th className="px-6 pr-12 py-4 font-bold text-center">Target / Details</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-ink-700/50">
                          {filteredActivityLogs.length === 0 ? (
                            <tr>
                              <td colSpan="4" className="px-6 py-8 text-center text-ink-400">No activity logs found for the selected date range.</td>
                            </tr>
                          ) : (
                            filteredActivityLogs.map((log) => (
                              <tr key={log.id} className="hover:bg-ink-800/30 transition-colors text-center">
                                <td className="px-6 pl-12 py-4 text-xs text-ink-300 font-mono text-left">
                                  {new Date(log.created_at).toLocaleString()}
                                </td>
                                <td className="px-6 py-4 font-bold text-white">
                                  {log.admin_email}
                                </td>
                                <td className="px-6 py-4 align-middle text-center">
                                  <span className={`text-[10px] font-extrabold px-3 py-1 rounded-md border uppercase tracking-widest inline-block ${
                                    log.action_type.includes('APPROVED') || log.action_type.includes('ACTIVATED') ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                                    log.action_type.includes('CANCELLED') || log.action_type.includes('DEACTIVATED') || log.action_type.includes('DELETED') ? 'bg-red-500/10 text-red-400 border-red-500/30' :
                                    'bg-amber-500/10 text-amber-400 border-amber-500/30'
                                  }`}>
                                    {log.action_type}
                                  </span>
                                </td>
                                <td className="px-6 pr-12 py-4">
                                  <div className="font-bold text-white">{log.target_entity}</div>
                                  <div className="text-xs text-ink-400 mt-1">{log.details}</div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          )}

          {/* TAB 7: ADMIN ACCESS (SUPER ADMIN ONLY) */}
          {activeTab === 'admins' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
              {!isSuperAdmin ? (
                <div className="p-8 rounded-3xl border border-red-500/30 bg-red-500/10 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center mx-auto text-xl">🔒</div>
                  <h2 className="text-lg font-bold text-white">Access Restricted</h2>
                  <p className="text-xs text-ink-300 max-w-md mx-auto">Only Super Administrators (`admin@wayfare.com`) can register or promote admin users.</p>
                </div>
              ) : (
                <>
                  {/* Status Banner */}
                  {promoteMsg && (
                    <div className={`p-4 rounded-xl text-xs font-semibold border ${
                      promoteMsg.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-red-500/10 text-red-400 border-red-500/30'
                    }`}>
                      {promoteMsg.text}
                    </div>
                  )}

                  {/* 2 Grid Forms: 1) Register Brand New Admin, 2) Promote Existing User */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* FORM 1: Register New Admin Account */}
                    <div className="rounded-3xl border border-ink-700/80 bg-[#121721] p-6 shadow-card flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-display text-lg font-bold text-white">Register Brand New Admin</h3>
                          <span className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded">New Credentials</span>
                        </div>
                        <p className="text-xs text-ink-300 mb-5">Create a brand new administrator account with a name, email address, and password.</p>
                        
                        <form onSubmit={handleRegisterNewAdmin} className="space-y-3">
                          <div>
                            <label className="text-[11px] font-bold text-ink-400 block mb-1">Admin Full Name</label>
                            <input
                              type="text"
                              placeholder="e.g. Admin Supervisor"
                              value={adminRegisterForm.name}
                              onChange={(e) => setAdminRegisterForm({ ...adminRegisterForm, name: e.target.value })}
                              className="w-full rounded-xl border border-ink-700 bg-ink-900 px-3.5 py-2.5 text-xs text-white placeholder-ink-500 focus:border-beacon focus:outline-none"
                              required
                            />
                          </div>

                          <div>
                            <label className="text-[11px] font-bold text-ink-400 block mb-1">Admin Email Address</label>
                            <input
                              type="email"
                              placeholder="admin.new@wayfare.com"
                              value={adminRegisterForm.email}
                              onChange={(e) => setAdminRegisterForm({ ...adminRegisterForm, email: e.target.value })}
                              className="w-full rounded-xl border border-ink-700 bg-ink-900 px-3.5 py-2.5 text-xs text-white placeholder-ink-500 focus:border-beacon focus:outline-none"
                              required
                            />
                          </div>

                          <div>
                            <label className="text-[11px] font-bold text-ink-400 block mb-1">Password</label>
                            <input
                              type="password"
                              placeholder="Min. 6 characters"
                              value={adminRegisterForm.password}
                              onChange={(e) => setAdminRegisterForm({ ...adminRegisterForm, password: e.target.value })}
                              className="w-full rounded-xl border border-ink-700 bg-ink-900 px-3.5 py-2.5 text-xs text-white placeholder-ink-500 focus:border-beacon focus:outline-none"
                              required
                            />
                          </div>

                          <div className="pt-2">
                            <Button variant="primary" type="submit" disabled={registeringAdmin} className="w-full py-2.5 text-xs font-bold">
                              {registeringAdmin ? 'Creating Account...' : '+ Register & Grant Admin Access'}
                            </Button>
                          </div>
                        </form>
                      </div>
                    </div>

                    {/* FORM 2: Promote Existing Platform User */}
                    <div className="rounded-3xl border border-ink-700/80 bg-[#121721] p-6 shadow-card flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-display text-lg font-bold text-white">Promote Existing User</h3>
                          <span className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-teal/20 text-teal border border-teal/30 rounded">By Email</span>
                        </div>
                        <p className="text-xs text-ink-300 mb-5">Select an existing registered platform user from the list to upgrade them to Admin role.</p>

                        <form onSubmit={handlePromoteExistingUser} className="space-y-4">
                          <div>
                            <label className="text-[11px] font-bold text-ink-400 block mb-1">Select User to Promote</label>
                            <select
                              value={selectedUserEmailToPromote}
                              onChange={(e) => setSelectedUserEmailToPromote(e.target.value)}
                              className="w-full rounded-xl border border-ink-700 bg-ink-900 px-3.5 py-2.5 text-xs text-white focus:border-beacon focus:outline-none"
                              required
                            >
                              <option value="">-- Choose User by Email --</option>
                              {users.filter(u => u.role !== 'admin' && u.role !== 'super_admin').map(u => (
                                <option key={u.id} value={u.email}>
                                  {u.name || 'User'} ({u.email})
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="p-3.5 rounded-xl border border-ink-700/60 bg-ink-900/40 text-xs text-ink-300 leading-relaxed">
                            💡 Promoted users will immediately gain access to the Admin Portal (`/admin-login`) using their existing password.
                          </div>

                          <div className="pt-2">
                            <button
                              type="submit"
                              disabled={registeringAdmin || !selectedUserEmailToPromote}
                              className="w-full py-2.5 rounded-xl text-xs font-bold text-ink-900 bg-teal hover:bg-teal/90 disabled:opacity-50 transition-all shadow-glow"
                            >
                              {registeringAdmin ? 'Promoting...' : 'Promote Selected User to Admin'}
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  </div>

                  {/* Active Platform Admins Table */}
                  <div className="rounded-3xl border border-ink-700/80 bg-[#121721] p-6 shadow-card">
                    <h3 className="font-display text-lg font-bold text-white mb-3">Active System Administrators</h3>
                    <div className="rounded-2xl border border-ink-700/80 overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full table-fixed text-center text-xs sm:text-sm text-ink-100 whitespace-nowrap">
                          <thead className="border-b border-ink-700 bg-ink-800/80 text-[11px] uppercase tracking-wider text-ink-400">
                            <tr>
                              <th className="px-6 pl-12 py-4 font-bold text-left w-[28%]"><span className="ml-[36px]">Admin Profile</span></th>
                              <th className="px-6 py-4 font-bold text-center">Email</th>
                              <th className="px-6 py-4 font-bold text-center">Privilege Level</th>
                              <th className="px-6 py-4 font-bold text-center">Status</th>
                              <th className="px-6 pr-12 py-4 font-bold text-center">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-ink-700/50">
                            {users.filter(u => u.role === 'admin' || u.role === 'super_admin' || u.email === 'admin@wayfare.com').map((adm) => (
                              <tr key={adm.id} className="hover:bg-ink-800/30 transition-colors text-center">
                                <td className="px-6 pl-12 py-4 align-middle text-left">
                                  <div 
                                    onClick={() => setInspectingUser(adm)}
                                    className="font-bold text-white flex items-center gap-2 cursor-pointer group"
                                  >
                                    <span className="h-7 w-7 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center font-bold text-xs group-hover:scale-105 transition-transform">
                                      {adm.name ? adm.name[0].toUpperCase() : 'A'}
                                    </span>
                                    <span className="group-hover:text-amber-400 transition-colors">{adm.name || 'System Admin'}</span>
                                  </div>
                                </td>
                                <td className="px-6 py-4 text-ink-300">{adm.email}</td>
                                <td className="px-6 py-4 align-middle text-center">
                                  <span className={`text-[10px] font-bold px-3 py-1 rounded-md border inline-block uppercase tracking-widest ${
                                    adm.email === 'admin@wayfare.com' || adm.role === 'super_admin'
                                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                      : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                  }`}>
                                    {adm.email === 'admin@wayfare.com' || adm.role === 'super_admin' ? 'Master Super Admin' : 'Admin'}
                                  </span>
                                </td>
                                <td className="px-6 py-4">
                                  <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 flex items-center justify-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Active
                                  </span>
                                </td>
                                <td className="px-6 pr-12 py-4">
                                  <button
                                    onClick={() => setInspectingUser(adm)}
                                    className="px-3 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 border border-amber-500/30 text-[11px] font-bold transition-all shadow-sm"
                                  >
                                    👁️ View Profile
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          )}
        </div>
      </main>

      {/* DOCUMENT PREVIEW MODAL */}
      <AnimatePresence>
        {reviewingDoc && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-[#0f121a]/80 backdrop-blur-2xl" onClick={() => setReviewingDoc(null)} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-5xl rounded-[2rem] border border-white/10 bg-[#121622]/50 backdrop-blur-3xl shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] z-10 flex flex-col max-h-[90vh] overflow-hidden">
              <div className="flex items-center justify-between p-6 sm:p-8 pb-4 border-b border-white/10">
                <div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
                      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-xl font-bold font-display text-white tracking-wide flex items-center gap-2">
                        Verification Dossier
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-extrabold uppercase shadow-[0_0_10px_rgba(245,158,11,0.2)]">
                          {reviewingDoc.status || 'Pending Review'}
                        </span>
                      </h2>
                      <p className="text-xs text-ink-300 mt-1">
                        Applicant: <strong className="text-white">{reviewingDoc.user?.name || 'Driver Applicant'}</strong> ({reviewingDoc.user?.email}) • Vehicle: <span className="text-amber-400 font-medium">{reviewingDoc.car_details ? `${reviewingDoc.car_details.make} ${reviewingDoc.car_details.model} (${reviewingDoc.car_details.plate})` : 'Vehicle Info Listed'}</span>
                      </p>
                    </div>
                  </div>
                </div>
                <button onClick={() => setReviewingDoc(null)} className="text-ink-400 hover:text-white p-2.5 rounded-full hover:bg-white/10 transition-colors backdrop-blur-md">✕</button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-6 sm:p-8 overflow-y-auto flex-1 custom-scrollbar">
                {/* 1. Selfie / Liveness Photo */}
                <div className="space-y-2.5 relative group">
                  <div className="flex items-center justify-between text-xs font-bold text-amber-400 uppercase tracking-widest pl-2 border-l-2 border-amber-400">
                    <span>Liveness Photo</span>
                  </div>
                  <div 
                    onClick={() => {
                      const src = (typeof reviewingDoc.images?.selfie === 'string' && reviewingDoc.images.selfie.startsWith('data:'))
                        ? reviewingDoc.images.selfie
                        : (reviewingDoc.images?.selfie || 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=1200&q=80')
                      setFullscreenImage({ url: src, title: 'Selfie / Liveness Photo' })
                      setZoomScale(1)
                      setRotationDeg(0)
                    }}
                    className="relative aspect-[16/9] sm:aspect-[4/3] rounded-2xl border border-white/10 bg-white/5 overflow-hidden cursor-pointer hover:border-amber-400/50 transition-all shadow-lg hover:shadow-amber-500/20 group-hover:-translate-y-1"
                  >
                    <img 
                      src={(typeof reviewingDoc.images?.selfie === 'string' && reviewingDoc.images.selfie.startsWith('data:')) ? reviewingDoc.images.selfie : (reviewingDoc.images?.selfie || 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800&q=80')} 
                      alt="Selfie" 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800&q=80' }}
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 backdrop-blur-[2px] transition-all duration-300 flex items-center justify-center">
                      <div className="px-4 py-2 rounded-full bg-white/10 border border-white/20 text-white text-xs font-bold flex items-center gap-2 backdrop-blur-md shadow-2xl transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                        </svg>
                        Click to Preview & Zoom
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. CNIC Front */}
                <div className="space-y-2.5 relative group">
                  <div className="flex items-center justify-between text-xs font-bold text-teal-400 uppercase tracking-widest pl-2 border-l-2 border-teal-400">
                    <span>Front of CNIC</span>
                  </div>
                  <div 
                    onClick={() => {
                      const src = (typeof reviewingDoc.images?.idFront === 'string' && reviewingDoc.images.idFront.startsWith('data:'))
                        ? reviewingDoc.images.idFront
                        : (reviewingDoc.images?.idFront || 'https://images.unsplash.com/photo-1621252179027-94459d278660?w=1200&q=80')
                      setFullscreenImage({ url: src, title: 'Front of CNIC Document' })
                      setZoomScale(1)
                      setRotationDeg(0)
                    }}
                    className="relative aspect-[16/9] sm:aspect-[4/3] rounded-2xl border border-white/10 bg-white/5 overflow-hidden cursor-pointer hover:border-teal-400/50 transition-all shadow-lg hover:shadow-teal-500/20 group-hover:-translate-y-1"
                  >
                    <img 
                      src={(typeof reviewingDoc.images?.idFront === 'string' && reviewingDoc.images.idFront.startsWith('data:')) ? reviewingDoc.images.idFront : (reviewingDoc.images?.idFront || 'https://images.unsplash.com/photo-1621252179027-94459d278660?w=800&q=80')} 
                      alt="CNIC Front" 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1621252179027-94459d278660?w=800&q=80' }}
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 backdrop-blur-[2px] transition-all duration-300 flex items-center justify-center">
                      <div className="px-4 py-2 rounded-full bg-white/10 border border-white/20 text-white text-xs font-bold flex items-center gap-2 backdrop-blur-md shadow-2xl transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                        </svg>
                        Click to Preview & Zoom
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Driving License */}
                <div className="space-y-2.5 relative group">
                  <div className="flex items-center justify-between text-xs font-bold text-blue-400 uppercase tracking-widest pl-2 border-l-2 border-blue-400">
                    <span>Driving License</span>
                  </div>
                  <div 
                    onClick={() => {
                      const src = (typeof reviewingDoc.images?.license === 'string' && reviewingDoc.images.license.startsWith('data:'))
                        ? reviewingDoc.images.license
                        : (reviewingDoc.images?.license || 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=1200&q=80')
                      setFullscreenImage({ url: src, title: 'Driving License Document' })
                      setZoomScale(1)
                      setRotationDeg(0)
                    }}
                    className="relative aspect-[16/9] sm:aspect-[4/3] rounded-2xl border border-white/10 bg-white/5 overflow-hidden cursor-pointer hover:border-blue-400/50 transition-all shadow-lg hover:shadow-blue-500/20 group-hover:-translate-y-1"
                  >
                    <img 
                      src={(typeof reviewingDoc.images?.license === 'string' && reviewingDoc.images.license.startsWith('data:')) ? reviewingDoc.images.license : (reviewingDoc.images?.license || 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&q=80')} 
                      alt="Driving License" 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&q=80' }}
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 backdrop-blur-[2px] transition-all duration-300 flex items-center justify-center">
                      <div className="px-4 py-2 rounded-full bg-white/10 border border-white/20 text-white text-xs font-bold flex items-center gap-2 backdrop-blur-md shadow-2xl transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                        </svg>
                        Click to Preview & Zoom
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4. Car / Vehicle Photo */}
                <div className="space-y-2.5 relative group">
                  <div className="flex items-center justify-between text-xs font-bold text-purple-400 uppercase tracking-widest pl-2 border-l-2 border-purple-400">
                    <span>Registered Vehicle Photo</span>
                  </div>
                  <div 
                    onClick={() => {
                      const src = (typeof reviewingDoc.images?.car === 'string' && reviewingDoc.images.car.startsWith('data:'))
                        ? reviewingDoc.images.car
                        : (reviewingDoc.images?.car || 'https://images.unsplash.com/photo-1590362891991-f776e747a588?w=1200&q=80')
                      setFullscreenImage({ url: src, title: 'Registered Vehicle Photo' })
                      setZoomScale(1)
                      setRotationDeg(0)
                    }}
                    className="relative aspect-[16/9] sm:aspect-[4/3] rounded-2xl border border-white/10 bg-white/5 overflow-hidden cursor-pointer hover:border-purple-400/50 transition-all shadow-lg hover:shadow-purple-500/20 group-hover:-translate-y-1"
                  >
                    <img 
                      src={(typeof reviewingDoc.images?.car === 'string' && reviewingDoc.images.car.startsWith('data:')) ? reviewingDoc.images.car : (reviewingDoc.images?.car || 'https://images.unsplash.com/photo-1590362891991-f776e747a588?w=800&q=80')} 
                      alt="Car Photo" 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1590362891991-f776e747a588?w=800&q=80' }}
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 backdrop-blur-[2px] transition-all duration-300 flex items-center justify-center">
                      <div className="px-4 py-2 rounded-full bg-white/10 border border-white/20 text-white text-xs font-bold flex items-center gap-2 backdrop-blur-md shadow-2xl transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                        </svg>
                        Click to Preview & Zoom
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 sm:p-8 pb-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
                <span className="text-xs text-ink-300 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-500">!</span>
                  Verify CNIC name and picture match user profile before approving.
                </span>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <button 
                    onClick={() => handleVerificationAction(reviewingDoc.id, reviewingDoc.user_id, 'reject')}
                    disabled={processing}
                    className="flex-1 sm:flex-none px-6 py-3 rounded-xl text-xs font-bold text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 transition-all backdrop-blur-md"
                  >
                    Reject Application
                  </button>
                  <button 
                    onClick={() => handleVerificationAction(reviewingDoc.id, reviewingDoc.user_id, 'approve')}
                    disabled={processing}
                    className="flex-1 sm:flex-none px-8 py-3 rounded-xl text-xs font-bold text-ink-950 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.4)] transition-all transform hover:scale-105"
                  >
                    {processing ? 'Updating...' : 'Approve & Verify Driver'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* FULLSCREEN INTERACTIVE ZOOM LIGHTBOX MODAL */}
      <AnimatePresence>
        {fullscreenImage && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl">
            {/* Top Toolbar */}
            <div className="absolute top-6 left-6 right-6 z-20 flex items-center justify-between bg-[#11141A]/60 border border-white/10 p-3 px-5 rounded-[1.5rem] backdrop-blur-3xl shadow-[0_8px_32px_0_rgba(0,0,0,0.5)]">
              <div className="text-sm font-bold font-display text-white tracking-wide">
                {fullscreenImage.title}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setZoomScale(prev => Math.min(prev + 0.5, 3))}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-bold border border-white/5 hover:border-white/10 flex items-center gap-1.5 transition-all shadow-sm"
                  title="Zoom In"
                >
                  <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                  Zoom In ({Math.round(zoomScale * 100)}%)
                </button>
                <button
                  onClick={() => setZoomScale(prev => Math.max(prev - 0.5, 0.5))}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-bold border border-white/5 hover:border-white/10 flex items-center gap-1.5 transition-all shadow-sm"
                  title="Zoom Out"
                >
                  <svg className="w-4 h-4 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20 12H4" /></svg>
                  Zoom Out
                </button>
                <button
                  onClick={() => setRotationDeg(prev => (prev + 90) % 360)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-bold border border-white/5 hover:border-white/10 flex items-center gap-1.5 transition-all shadow-sm"
                  title="Rotate 90 degrees"
                >
                  <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                  Rotate
                </button>
                <button
                  onClick={() => { setZoomScale(1); setRotationDeg(0); }}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-ink-300 hover:text-white text-xs font-bold border border-white/5 hover:border-white/10 transition-all ml-1 shadow-sm"
                >
                  Reset
                </button>
                <div className="w-px h-6 bg-white/10 mx-1"></div>
                <button
                  onClick={() => setFullscreenImage(null)}
                  className="px-5 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold border border-red-500/20 hover:border-red-500/30 transition-all shadow-sm flex items-center gap-1.5"
                >
                  Close <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            </div>

            {/* Interactive Image Container */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative max-w-full max-h-[85vh] overflow-auto flex items-center justify-center p-8 mt-12 cursor-grab active:cursor-grabbing"
            >
              <img
                src={fullscreenImage.url}
                alt={fullscreenImage.title}
                style={{
                  transform: `scale(${zoomScale}) rotate(${rotationDeg}deg)`,
                  transition: 'transform 0.2s ease-out'
                }}
                className="max-h-[75vh] w-auto rounded-2xl border border-white/10 shadow-2xl object-contain"
                onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1621252179027-94459d278660?w=1200&q=80' }}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* REGISTER NEW USER MODAL */}
      <AnimatePresence>
        {showAddUserModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowAddUserModal(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-md rounded-3xl border border-ink-700 bg-[#14181C] p-6 shadow-2xl z-10">
              <div className="flex items-center justify-between pb-4 border-b border-ink-700">
                <h2 className="text-lg font-bold text-white">Register New User</h2>
                <button onClick={() => setShowAddUserModal(false)} className="text-ink-400 hover:text-white">✕</button>
              </div>

              <form onSubmit={handleRegisterUser} className="space-y-3 pt-4">
                <div>
                  <label className="text-xs font-semibold text-ink-300 block mb-1">Full Name</label>
                  <input type="text" required value={newUser.name} onChange={e => setNewUser({ ...newUser, name: e.target.value })} className="w-full rounded-xl border border-ink-700 bg-ink-900 px-3 py-2 text-xs text-white" placeholder="John Doe" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-ink-300 block mb-1">Email Address</label>
                  <input type="email" required value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} className="w-full rounded-xl border border-ink-700 bg-ink-900 px-3 py-2 text-xs text-white" placeholder="john@example.com" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-ink-300 block mb-1">Password</label>
                  <input type="password" required value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })} className="w-full rounded-xl border border-ink-700 bg-ink-900 px-3 py-2 text-xs text-white" placeholder="Min 6 characters" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-semibold text-ink-300 block mb-1">Gender</label>
                    <select value={newUser.gender} onChange={e => setNewUser({ ...newUser, gender: e.target.value })} className="w-full rounded-xl border border-ink-700 bg-ink-900 px-3 py-2 text-xs text-white">
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-ink-300 block mb-1">City</label>
                    <input type="text" required value={newUser.city} onChange={e => setNewUser({ ...newUser, city: e.target.value })} className="w-full rounded-xl border border-ink-700 bg-ink-900 px-3 py-2 text-xs text-white" placeholder="Islamabad" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-ink-300 block mb-1">Initial Role</label>
                  <select value={newUser.role} onChange={e => setNewUser({ ...newUser, role: e.target.value })} className="w-full rounded-xl border border-ink-700 bg-ink-900 px-3 py-2 text-xs text-white">
                    <option value="rider">Rider / Passenger</option>
                    <option value="driver">Driver</option>
                    <option value="both">Both (Dual Role)</option>
                  </select>
                </div>

                <div className="pt-3 flex justify-end gap-2">
                  <button type="button" onClick={() => setShowAddUserModal(false)} className="px-4 py-2 rounded-xl text-xs font-semibold bg-ink-800 text-ink-300 hover:text-white">Cancel</button>
                  <Button variant="primary" type="submit" disabled={addingUser} className="px-5 py-2 text-xs font-bold">
                    {addingUser ? 'Creating...' : 'Register User'}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* USER PROFILE & ACTIVITY DOSSIER MODAL */}
      <AnimatePresence>
        {inspectingUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/85 backdrop-blur-md" onClick={() => setInspectingUser(null)} />
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="relative w-full max-w-2xl rounded-3xl border border-white/[0.08] bg-[#11141A]/95 backdrop-blur-3xl shadow-[0_30px_60px_rgba(0,0,0,0.8)] z-10 max-h-[90vh] flex flex-col overflow-hidden">
              
              {/* Header Section */}
              <div className="relative p-8 pb-6 border-b border-white/[0.05] bg-gradient-to-b from-white/[0.03] to-transparent">
                <div className="absolute top-0 right-0 p-4">
                  <button onClick={() => setInspectingUser(null)} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/[0.03] hover:bg-white/[0.1] text-ink-300 hover:text-white transition-all duration-200">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
                
                <div className="flex items-center gap-6">
                  {/* Avatar */}
                  <div className="relative">
                    <div className="absolute inset-0 bg-amber-500 blur-[20px] opacity-20 rounded-full" />
                    <div className="relative w-20 h-20 rounded-full bg-gradient-to-tr from-amber-600 via-amber-400 to-amber-200 p-[2px] shadow-lg">
                      <div className="w-full h-full rounded-full bg-[#11141A] flex items-center justify-center text-amber-400 font-display text-3xl font-bold">
                        {inspectingUser.name ? inspectingUser.name[0].toUpperCase() : 'U'}
                      </div>
                    </div>
                  </div>
                  {/* Info */}
                  <div>
                    <div className="flex items-center gap-3 mb-1.5">
                      <h2 className="text-3xl font-display font-bold text-white tracking-tight">{inspectingUser.name || 'Unnamed User'}</h2>
                      <span className="px-2.5 py-0.5 rounded-md bg-white/[0.06] text-ink-200 uppercase tracking-wider text-[10px] font-bold border border-white/[0.05]">
                        {inspectingUser.role || 'rider'}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-sm font-medium text-ink-400">
                      <span className="flex items-center gap-1.5">
                        <svg className="w-4 h-4 text-ink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                        {inspectingUser.email}
                      </span>
                      <span className="w-1 h-1 rounded-full bg-ink-600" />
                      <span className="font-mono text-ink-500 text-xs">ID: {inspectingUser.id?.slice(0, 8)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Body Section */}
              <div className="p-8 overflow-y-auto flex-1 custom-scrollbar space-y-10">
                
                {/* Stats Row */}
                <div className="flex items-center justify-between bg-white/[0.02] rounded-2xl p-6 border border-white/[0.04]">
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] font-bold text-ink-500 uppercase tracking-widest flex items-center gap-1.5">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                      City
                    </span>
                    <span className="text-sm font-semibold text-white">{inspectingUser.city || 'Islamabad'}</span>
                  </div>
                  <div className="w-px h-8 bg-white/10" />
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] font-bold text-ink-500 uppercase tracking-widest flex items-center gap-1.5">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                      Gender
                    </span>
                    <span className="text-sm font-semibold text-white capitalize">{inspectingUser.gender || 'Unspecified'}</span>
                  </div>
                  <div className="w-px h-8 bg-white/10" />
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] font-bold text-ink-500 uppercase tracking-widest flex items-center gap-1.5">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      Verification
                    </span>
                    <span className={`text-sm font-semibold ${inspectingUser.verified ? 'text-emerald-400' : 'text-ink-400'}`}>
                      {inspectingUser.verified ? 'ID Verified' : 'Pending'}
                    </span>
                  </div>
                  <div className="w-px h-8 bg-white/10" />
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] font-bold text-ink-500 uppercase tracking-widest flex items-center gap-1.5">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                      Status
                    </span>
                    <div className="flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full ${inspectingUser.status === 'deactivated' ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'}`} />
                      <span className={`text-sm font-semibold ${inspectingUser.status === 'deactivated' ? 'text-rose-400' : 'text-white'}`}>
                        {inspectingUser.status === 'deactivated' ? 'Suspended' : 'Active'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Rides List */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-[11px] font-bold text-ink-400 uppercase tracking-widest flex items-center gap-2">
                      <svg className="w-4 h-4 text-ink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                      Recent Activity
                    </h3>
                    <span className="bg-white/5 text-ink-300 border border-white/[0.05] text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                      {userRides.length} Rides
                    </span>
                  </div>
                  
                  <div className="space-y-3">
                    {loadingUserRides ? (
                      <div className="p-8 flex justify-center"><div className="w-5 h-5 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" /></div>
                    ) : userRides.length === 0 ? (
                      <div className="p-8 text-center text-sm font-medium text-ink-500 border border-dashed border-white/[0.05] rounded-2xl">
                        No recent ride activity found.
                      </div>
                    ) : (
                      userRides.map(r => (
                        <div key={r.id} className="group flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.03] transition-all duration-300">
                          <div className="flex flex-col gap-1.5">
                            <div className="flex items-center gap-2.5 text-sm font-bold text-white">
                              <span>{r.from_location}</span>
                              <svg className="w-3.5 h-3.5 text-ink-600 group-hover:text-amber-500/70 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                              <span>{r.to_location}</span>
                            </div>
                            <div className="text-xs text-ink-400 font-medium">{r.seats} seats offered</div>
                          </div>
                          <div className="flex flex-col items-end gap-1.5">
                            <span className="text-sm font-bold text-amber-400">Rs {r.price}</span>
                            <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded flex items-center gap-1 ${
                              r.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' :
                              r.status === 'cancelled' ? 'bg-rose-500/10 text-rose-400' : 'bg-amber-500/10 text-amber-400'
                            }`}>
                              <span className="w-1 h-1 rounded-full bg-current opacity-70" />
                              {r.status || 'open'}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>

              {/* Modal Footer */}
              <div className="p-6 bg-white/[0.01] border-t border-white/[0.05] flex items-center justify-between">
                <button
                  onClick={() => {
                    const verificationDoc = verifications.find(v => v.user_id === inspectingUser.id)
                    if (verificationDoc) {
                      setInspectingUser(null)
                      setActiveTab('verifications')
                      setTimeout(() => setReviewingDoc(verificationDoc), 50)
                    } else {
                      alert("No verification document uploaded for this user.")
                    }
                  }}
                  className="flex items-center gap-2 text-sm font-semibold text-ink-300 hover:text-white transition-colors"
                >
                  <svg className="w-4 h-4 text-ink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  Inspect Documents
                </button>

                <button
                  onClick={() => {
                    handleToggleUserActive(inspectingUser.id, inspectingUser.status)
                    setInspectingUser(null)
                  }}
                  disabled={inspectingUser.email === 'admin@wayfare.com' || inspectingUser.role === 'super_admin'}
                  className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
                    (inspectingUser.email === 'admin@wayfare.com' || inspectingUser.role === 'super_admin')
                      ? 'opacity-30 cursor-not-allowed bg-white/5 text-ink-500'
                      : inspectingUser.status === 'deactivated'
                        ? 'bg-emerald-500 text-white hover:bg-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_25px_rgba(16,185,129,0.5)]'
                        : 'bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white border border-rose-500/20 hover:border-rose-500 transition-colors'
                  }`}
                >
                  {inspectingUser.status === 'deactivated' ? 'Restore Account' : 'Suspend Account'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* RIDE PREVIEW MODAL */}
      <AnimatePresence>
        {inspectingRide && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/85 backdrop-blur-md" onClick={() => setInspectingRide(null)} />
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="relative w-full max-w-2xl rounded-3xl border border-white/[0.08] bg-[#11141A]/95 backdrop-blur-3xl shadow-[0_30px_60px_rgba(0,0,0,0.8)] z-10 max-h-[90vh] flex flex-col overflow-hidden">
              
              {/* Header Section */}
              <div className="relative p-8 pb-6 border-b border-white/[0.05] bg-gradient-to-b from-white/[0.03] to-transparent">
                <div className="absolute top-0 right-0 p-4">
                  <button onClick={() => setInspectingRide(null)} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/[0.03] hover:bg-white/[0.1] text-ink-300 hover:text-white transition-all duration-200">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
                
                <div className="flex items-center gap-6">
                  {/* Icon */}
                  <div className="relative">
                    <div className="absolute inset-0 bg-emerald-500 blur-[20px] opacity-20 rounded-full" />
                    <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 via-emerald-400 to-emerald-200 p-[2px] shadow-lg">
                      <div className="w-full h-full rounded-2xl bg-[#11141A] flex items-center justify-center text-emerald-400">
                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                      </div>
                    </div>
                  </div>
                  {/* Info */}
                  <div>
                    <div className="flex items-center gap-3 mb-1.5">
                      <h2 className="text-2xl font-display font-bold text-white tracking-tight">{inspectingRide.from_location} &rarr; {inspectingRide.to_location}</h2>
                      <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${
                        inspectingRide.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                        inspectingRide.status === 'cancelled' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      }`}>
                        {inspectingRide.status || 'open'}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-sm font-medium text-ink-400">
                      <span className="flex items-center gap-1.5">
                        <svg className="w-4 h-4 text-ink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        Posted: {new Date(inspectingRide.date || Date.now()).toLocaleString()}
                      </span>
                      <span className="w-1 h-1 rounded-full bg-ink-600" />
                      <span className="font-mono text-ink-500 text-xs">Ride ID: {inspectingRide.id?.slice(0, 8)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Body Section */}
              <div className="p-8 overflow-y-auto flex-1 custom-scrollbar space-y-8">
                
                {/* Stats Row */}
                <div className="flex items-center justify-between bg-white/[0.02] rounded-2xl p-6 border border-white/[0.04]">
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] font-bold text-ink-500 uppercase tracking-widest flex items-center gap-1.5">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                      Seats Available
                    </span>
                    <span className="text-lg font-semibold text-white">{inspectingRide.seats}</span>
                  </div>
                  <div className="w-px h-8 bg-white/10" />
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] font-bold text-ink-500 uppercase tracking-widest flex items-center gap-1.5">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      Fare per Seat
                    </span>
                    <span className="text-lg font-semibold text-amber-400">Rs {inspectingRide.price}</span>
                  </div>
                  <div className="w-px h-8 bg-white/10" />
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] font-bold text-ink-500 uppercase tracking-widest flex items-center gap-1.5">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                      Driver
                    </span>
                    <span className="text-sm font-semibold text-white">{inspectingRide.driver?.name || 'Driver'}</span>
                  </div>
                </div>
                
                {/* Driver Message Action Area */}
                <div className="bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border border-blue-500/20 rounded-2xl p-6 flex items-center justify-between">
                  <div className="flex flex-col">
                    <h3 className="text-sm font-bold text-white mb-1">Contact Participants</h3>
                    <p className="text-xs text-ink-300">Need to broadcast a message to the driver or riders regarding this route?</p>
                  </div>
                  <button 
                    onClick={() => alert('Chat interface opened. You can now send a direct message to the driver and passengers of this ride.')}
                    className="px-5 py-2.5 bg-blue-500 hover:bg-blue-400 text-white text-sm font-bold rounded-xl shadow-[0_0_15px_rgba(59,130,246,0.3)] hover:shadow-[0_0_25px_rgba(59,130,246,0.5)] transition-all flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                    Send Message
                  </button>
                </div>

              </div>

              {/* Modal Footer */}
              <div className="p-6 bg-white/[0.01] border-t border-white/[0.05] flex items-center justify-between">
                <button
                  onClick={() => setInspectingRide(null)}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-white/5 border border-white/5 text-ink-200 hover:text-white hover:bg-white/10 transition-all shadow-sm"
                >
                  Close Preview
                </button>

                <button
                  onClick={() => {
                    handleToggleRideStatus(inspectingRide.id, inspectingRide.status)
                    setInspectingRide(null)
                  }}
                  className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
                    inspectingRide.status === 'cancelled'
                      ? 'bg-emerald-500 text-white hover:bg-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_25px_rgba(16,185,129,0.5)]'
                      : 'bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white border border-rose-500/20 hover:border-rose-500 transition-colors'
                  }`}
                >
                  {inspectingRide.status === 'cancelled' ? 'Re-Open Ride' : 'Cancel Ride'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ADMIN MOBILE BOTTOM NAVIGATION BAR FOR FAST ACCESS */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0F131C]/95 backdrop-blur-xl border-t border-ink-700/80 px-2 py-2 flex items-center justify-around shadow-2xl">
        {/* 1. Overview */}
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex flex-col items-center gap-1 py-1.5 px-3 rounded-xl transition-all ${
            activeTab === 'overview' 
              ? 'bg-amber-500/15 border border-amber-500/30 text-amber-400 font-bold scale-105' 
              : 'text-ink-300 hover:text-white'
          }`}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          </svg>
          <span className="text-[10px]">Overview</span>
        </button>

        {/* 2. Verifications */}
        <button
          onClick={() => setActiveTab('verifications')}
          className={`relative flex flex-col items-center gap-1 py-1.5 px-3 rounded-xl transition-all ${
            activeTab === 'verifications' 
              ? 'bg-amber-500/15 border border-amber-500/30 text-amber-400 font-bold scale-105' 
              : 'text-ink-300 hover:text-white'
          }`}
        >
          {pendingVerificationsCount > 0 && (
            <span className="absolute -top-1 right-1 w-4 h-4 rounded-full bg-amber-400 text-ink-950 text-[9px] font-extrabold flex items-center justify-center animate-bounce">
              {pendingVerificationsCount}
            </span>
          )}
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <span className="text-[10px]">Docs</span>
        </button>

        {/* 3. Rides */}
        <button
          onClick={() => setActiveTab('rides')}
          className={`flex flex-col items-center gap-1 py-1.5 px-3 rounded-xl transition-all ${
            activeTab === 'rides' 
              ? 'bg-amber-500/15 border border-amber-500/30 text-amber-400 font-bold scale-105' 
              : 'text-ink-300 hover:text-white'
          }`}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
          <span className="text-[10px]">Rides</span>
        </button>

        {/* 4. Users */}
        <button
          onClick={() => setActiveTab('users')}
          className={`flex flex-col items-center gap-1 py-1.5 px-3 rounded-xl transition-all ${
            activeTab === 'users' 
              ? 'bg-amber-500/15 border border-amber-500/30 text-amber-400 font-bold scale-105' 
              : 'text-ink-300 hover:text-white'
          }`}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          <span className="text-[10px]">Users</span>
        </button>

        {/* 5. Reviews */}
        <button
          onClick={() => setActiveTab('reviews')}
          className={`flex flex-col items-center gap-1 py-1.5 px-3 rounded-xl transition-all ${
            activeTab === 'reviews' 
              ? 'bg-amber-500/15 border border-amber-500/30 text-amber-400 font-bold scale-105' 
              : 'text-ink-300 hover:text-white'
          }`}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
          <span className="text-[10px]">Reviews</span>
        </button>
      </nav>
    </>
  )
}
