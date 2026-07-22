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
      case 'overview': return 'Executive Overview & Analytics'
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
        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 w-full gap-3 pt-2 border-b border-ink-700/60 pb-4">
          <div className="flex items-center justify-between w-full sm:w-auto gap-3">
            <div className="flex items-center gap-3">
              <button 
                className="md:hidden shrink-0 flex items-center justify-center w-10 h-10 rounded-xl bg-ink-800/80 border border-ink-700 text-ink-200 hover:text-white hover:bg-ink-700 transition-colors shadow-sm"
                onClick={() => setMobileMenuOpen(true)}
              >
                <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="4" y1="12" x2="20" y2="12"></line>
                  <line x1="4" y1="6" x2="20" y2="6"></line>
                  <line x1="4" y1="18" x2="14" y2="18"></line>
                </svg>
              </button>

              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="font-display text-lg sm:text-2xl md:text-3xl font-bold text-white leading-tight">
                    {getTabTitle()}
                  </h1>
                </div>
                {isSuperAdmin && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 mt-1 text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider bg-amber-500/20 text-amber-400 border border-amber-500/40 rounded-full shadow-[0_0_12px_rgba(245,158,11,0.2)]">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" /> Super Admin Console
                  </span>
                )}
              </div>
            </div>

            {/* Mobile Header Right Controls */}
            <div className="sm:hidden flex items-center gap-2">
              <button 
                onClick={fetchAllData}
                disabled={loadingData}
                className="p-2 rounded-xl border border-ink-700/80 bg-[#121721] text-xs font-semibold text-ink-100 hover:text-white shadow-sm flex items-center gap-1.5"
                title="Refresh System Data"
              >
                <svg className={`w-4 h-4 ${loadingData ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span className="text-[11px]">Refresh</span>
              </button>
              <div 
                className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shadow-md text-[#14181C] shrink-0"
                style={{ background: 'linear-gradient(155deg, #EF4444, #DC2626)' }}
              >
                {user?.name ? user.name[0].toUpperCase() : 'A'}
              </div>
            </div>
          </div>

          {/* Desktop Header Right Controls */}
          <div className="hidden sm:flex items-center gap-2 md:gap-3 shrink-0">
            <button 
              onClick={fetchAllData}
              disabled={loadingData}
              className="px-3.5 py-2 rounded-xl border border-ink-700/80 bg-[#121721] hover:bg-ink-700 text-xs font-semibold text-ink-100 hover:text-white transition-all flex items-center gap-2 shadow-sm"
            >
              <svg className={`w-3.5 h-3.5 ${loadingData ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Refresh</span>
            </button>
            <div 
              className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shadow-md text-[#14181C]"
              style={{ background: 'linear-gradient(155deg, #EF4444, #DC2626)' }}
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
        <div className="page active space-y-6">
          {/* TAB 1: EXECUTIVE OVERVIEW */}
          {activeTab === 'overview' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
              
              {/* Premium Welcome Hero Card */}
              <div className="relative rounded-3xl border border-ink-700/80 bg-gradient-to-r from-[#121722] via-[#161B28] to-[#121722] p-6 sm:p-8 overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-extrabold uppercase tracking-wider mb-3">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      All Platform Systems Operational
                    </div>
                    <h2 className="font-display text-2xl sm:text-3xl font-black text-white tracking-tight">
                      Welcome back, <span className="text-amber-400">{user?.name || 'Administrator'}</span>
                    </h2>
                    <p className="text-xs sm:text-sm text-ink-300 mt-1 max-w-xl">
                      Here is the real-time health overview of Wayfare's users, rides, driver document verifications, and safety operations today.
                    </p>
                  </div>

                  <div className="flex items-center gap-3 flex-wrap">
                    <button
                      onClick={() => setActiveTab('verifications')}
                      className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-ink-900 text-xs font-bold transition-all shadow-[0_0_20px_rgba(245,158,11,0.25)] flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      <span>Review Drivers ({pendingVerificationsCount})</span>
                    </button>

                    <button
                      onClick={() => setActiveTab('users')}
                      className="px-4 py-2.5 rounded-xl bg-ink-800 hover:bg-ink-700 text-white text-xs font-bold transition-all border border-ink-700 flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                      <span>Users ({totalUsers})</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Key Metric Cards Grid (Stripe / Linear Enterprise Style) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {/* 1. Total Unique Users */}
                <div className="rounded-2xl border border-ink-700/80 bg-[#111622] p-5 hover:border-ink-500 transition-all shadow-sm group">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-blue-400">Total Users</span>
                    <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="text-3xl font-bold font-display text-white tracking-tight">{totalUsers}</div>
                  <div className="text-[11px] text-ink-400 mt-2 flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                    <span>Unique registered accounts</span>
                  </div>
                </div>

                {/* 2. Total Drivers */}
                <div className="rounded-2xl border border-ink-700/80 bg-[#111622] p-5 hover:border-ink-500 transition-all shadow-sm group">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">Total Drivers</span>
                    <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M8 17a2 2 0 100 4 2 2 0 000-4zm10 0a2 2 0 100 4 2 2 0 000-4zM4 9h16l-1 4H5L4 9zm1 4v5h2v-2h10v2h2v-5M5 9L7 4h10l2 5" />
                      </svg>
                    </div>
                  </div>
                  <div className="text-3xl font-bold font-display text-white tracking-tight">{driversCount}</div>
                  <div className="text-[11px] text-ink-400 mt-2 flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                    <span>Offering active carpool rides</span>
                  </div>
                </div>

                {/* 3. Total Passengers */}
                <div className="rounded-2xl border border-ink-700/80 bg-[#111622] p-5 hover:border-ink-500 transition-all shadow-sm group">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-teal">Total Passengers</span>
                    <div className="w-9 h-9 rounded-xl bg-teal/10 border border-teal/20 text-teal flex items-center justify-center shrink-0">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                  </div>
                  <div className="text-3xl font-bold font-display text-white tracking-tight">{ridersCount}</div>
                  <div className="text-[11px] text-ink-400 mt-2 flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-teal" />
                    <span>Booking carpool seats</span>
                  </div>
                </div>

                {/* 4. Dual Role (Both) */}
                <div className="rounded-2xl border border-ink-700/80 bg-[#111622] p-5 hover:border-ink-500 transition-all shadow-sm group">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-purple-400">Dual Role (Both)</span>
                    <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                      </svg>
                    </div>
                  </div>
                  <div className="text-3xl font-bold font-display text-white tracking-tight">{bothCount}</div>
                  <div className="text-[11px] text-ink-400 mt-2 flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-purple-400" />
                    <span>Offers & Books rides</span>
                  </div>
                </div>
              </div>

              {/* Verification & Platform Safety Breakdown */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="rounded-2xl border border-ink-700/80 bg-[#111622] p-5 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-1">Verified Profiles</div>
                    <div className="text-2xl font-bold text-white">{verifiedUsersCount}</div>
                    <div className="text-[11px] text-ink-400 mt-0.5">{((verifiedUsersCount / (totalUsers || 1)) * 100).toFixed(0)}% verified</div>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>

                <div className="rounded-2xl border border-ink-700/80 bg-[#111622] p-5 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-1">Unverified Users</div>
                    <div className="text-2xl font-bold text-white">{unverifiedUsersCount}</div>
                    <div className="text-[11px] text-ink-400 mt-0.5">Pending document submission</div>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>

                <div className="rounded-2xl border border-ink-700/80 bg-[#111622] p-5 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-1">Pending Driver Review</div>
                    <div className="text-2xl font-bold text-white">{pendingVerificationsCount}</div>
                    <button onClick={() => setActiveTab('verifications')} className="text-[11px] font-bold text-red-400 hover:underline mt-0.5 block">
                      Review applications →
                    </button>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.618 5.984A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Two-Column Enterprise Operational Dashboard Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Left Column (2/3 Width): Pending Driver Verifications Table Preview */}
                <div className="lg:col-span-2 rounded-2xl border border-ink-700/80 bg-[#111622] p-6 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-display text-base font-bold text-white">Pending Driver Verifications</h3>
                        <p className="text-xs text-ink-400">Applications awaiting identity document approval</p>
                      </div>
                      <button onClick={() => setActiveTab('verifications')} className="text-xs font-bold text-amber-400 hover:underline">
                        View All ({pendingVerificationsCount}) →
                      </button>
                    </div>

                    <div className="rounded-xl border border-ink-700/60 overflow-hidden">
                      <table className="w-full text-left text-xs text-ink-200">
                        <thead className="bg-ink-800/80 text-[10px] uppercase font-bold text-ink-400 border-b border-ink-700/60">
                          <tr>
                            <th className="px-3.5 py-2.5">User</th>
                            <th className="px-3.5 py-2.5">Vehicle</th>
                            <th className="px-3.5 py-2.5 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-ink-700/40">
                          {verifications.filter(v => v.status === 'pending').length === 0 ? (
                            <tr>
                              <td colSpan="3" className="px-4 py-8 text-center text-ink-400 text-xs">
                                ✓ All driver applications are currently reviewed and up to date!
                              </td>
                            </tr>
                          ) : (
                            verifications.filter(v => v.status === 'pending').slice(0, 4).map((v) => (
                              <tr key={v.id} className="hover:bg-ink-800/40 transition-colors">
                                <td className="px-3.5 py-3">
                                  <div className="font-bold text-white">{v.user?.name || 'Applicant'}</div>
                                  <div className="text-[11px] text-ink-400">{v.user?.email}</div>
                                </td>
                                <td className="px-3.5 py-3 text-ink-300 text-xs">
                                  {v.car_details ? `${v.car_details.make} ${v.car_details.model}` : 'Standard Car'}
                                </td>
                                <td className="px-3.5 py-3 text-right">
                                  <button
                                    onClick={() => setReviewingDoc(v)}
                                    className="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[11px] font-bold"
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

                {/* Right Column (1/3 Width): Live System Activity Feed */}
                <div className="rounded-2xl border border-ink-700/80 bg-[#111622] p-6 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-display text-base font-bold text-white">Recent Audit Logs</h3>
                      <button onClick={() => setActiveTab('activity_logs')} className="text-xs font-bold text-ink-300 hover:text-white">
                        Full Log →
                      </button>
                    </div>

                    <div className="space-y-3">
                      {activityLogs.slice(0, 4).map((log) => (
                        <div key={log.id} className="p-3 rounded-xl border border-ink-700/50 bg-ink-900/40 text-xs">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-semibold text-white text-[11px] truncate max-w-[140px]">{log.admin_email}</span>
                            <span className="text-[10px] text-ink-400 font-mono">
                              {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <div className="text-ink-300 text-[11px] leading-tight">{log.details}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions Panel */}
              <div className="rounded-2xl border border-ink-700/80 bg-[#111622] p-5 shadow-sm">
                <h3 className="font-display text-sm font-bold text-white mb-3">Quick Actions</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button 
                    onClick={() => setActiveTab('verifications')} 
                    className="p-3.5 rounded-xl border border-ink-700/60 bg-ink-900/40 hover:border-ink-500 transition-all text-left flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3">
                      <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      <span className="font-semibold text-xs text-white">Approve Driver Licenses</span>
                    </div>
                    <span className="text-xs text-ink-400 group-hover:text-white transition-colors">→</span>
                  </button>

                  <button 
                    onClick={() => setActiveTab('users')} 
                    className="p-3.5 rounded-xl border border-ink-700/60 bg-ink-900/40 hover:border-ink-500 transition-all text-left flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3">
                      <svg className="w-4 h-4 text-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <span className="font-semibold text-xs text-white">Manage & Block Users</span>
                    </div>
                    <span className="text-xs text-ink-400 group-hover:text-white transition-colors">→</span>
                  </button>

                  <button 
                    onClick={() => setActiveTab('rides')} 
                    className="p-3.5 rounded-xl border border-ink-700/60 bg-ink-900/40 hover:border-ink-500 transition-all text-left flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3">
                      <svg className="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 17a2 2 0 100 4 2 2 0 000-4zm10 0a2 2 0 100 4 2 2 0 000-4zM4 9h16l-1 4H5L4 9zm1 4v5h2v-2h10v2h2v-5M5 9L7 4h10l2 5" />
                      </svg>
                      <span className="font-semibold text-xs text-white">Monitor Live Rides</span>
                    </div>
                    <span className="text-xs text-ink-400 group-hover:text-white transition-colors">→</span>
                  </button>
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
                <table className="w-full text-left text-xs sm:text-sm text-ink-100">
                  <thead className="border-b border-ink-700 bg-ink-800/80 text-[11px] uppercase tracking-wider text-ink-400">
                    <tr>
                      <th className="px-4 py-3 font-semibold">User</th>
                      <th className="px-4 py-3 font-semibold">Vehicle</th>
                      <th className="px-4 py-3 font-semibold">Submitted</th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                      <th className="px-4 py-3 font-semibold text-right">Actions</th>
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
                        <tr key={v.id} className="hover:bg-ink-800/30 transition-colors">
                          <td className="px-4 py-3.5">
                            <div className="font-bold text-white">{v.user?.name || 'Unknown User'}</div>
                            <div className="text-xs text-ink-400">{v.user?.email}</div>
                          </td>
                          <td className="px-4 py-3.5 text-ink-200">
                            {v.car_details ? `${v.car_details.make} ${v.car_details.model}` : 'Standard Car'}
                          </td>
                          <td className="px-4 py-3.5 text-xs text-ink-300">
                            {new Date(v.created_at || Date.now()).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3.5">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                              v.status === 'approved' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                              v.status === 'rejected' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                              'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            }`}>
                              {v.status || 'pending'}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-right">
                            <Button 
                              variant="primary" 
                              className="px-3 py-1.5 text-xs font-bold" 
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
                <table className="w-full text-left text-xs sm:text-sm text-ink-100">
                  <thead className="border-b border-ink-700 bg-ink-800/80 text-[11px] uppercase tracking-wider text-ink-400">
                    <tr>
                      <th className="px-4 py-3 font-semibold">User Profile</th>
                      <th className="px-4 py-3 font-semibold">City & Gender</th>
                      <th className="px-4 py-3 font-semibold">Role</th>
                      <th className="px-4 py-3 font-semibold">Verification</th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                      <th className="px-4 py-3 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink-700/50">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="px-6 py-8 text-center text-ink-400">No users found matching query.</td>
                      </tr>
                    ) : (
                      filteredUsers.map((u) => (
                        <tr key={u.id} className="hover:bg-ink-800/40 transition-colors">
                          <td className="px-4 py-3.5">
                            <div 
                              onClick={() => setInspectingUser(u)}
                              className="flex items-center gap-3 cursor-pointer group hover:opacity-80 transition-opacity"
                              title="Click to view full user profile"
                            >
                              <div className="h-8 w-8 rounded-full bg-beacon/20 text-beacon flex items-center justify-center font-bold text-xs group-hover:scale-105 transition-transform">
                                {u.name ? u.name[0].toUpperCase() : 'U'}
                              </div>
                              <div>
                                <div className="font-bold text-white group-hover:text-amber-400 transition-colors flex items-center gap-1.5">
                                  {u.name || 'Unnamed User'}
                                  <span className="text-[10px] font-normal text-amber-400/80 underline opacity-0 group-hover:opacity-100 transition-opacity">View Profile →</span>
                                </div>
                                <div className="text-xs text-ink-400">{u.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3.5 text-xs text-ink-300">
                            {u.city || 'N/A'} • <span className="capitalize">{u.gender || 'unspecified'}</span>
                          </td>
                          <td className="px-4 py-3.5">
                            <span className="capitalize text-xs font-semibold px-2 py-0.5 rounded-md bg-ink-700 text-ink-200">
                              {u.role || 'rider'}
                            </span>
                          </td>
                          <td className="px-4 py-3.5">
                            {u.verified ? (
                              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                </svg> Verified
                              </span>
                            ) : (
                              <span className="text-xs text-ink-400">Unverified</span>
                            )}
                          </td>
                          <td className="px-4 py-3.5">
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                              u.status === 'deactivated' ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'
                            }`}>
                              {u.status === 'deactivated' ? 'Deactivated' : 'Active'}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => setInspectingUser(u)}
                                className="px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 border border-amber-500/30 text-xs font-bold transition-all flex items-center gap-1 shadow-sm"
                                title="View User Profile & Rides"
                              >
                                <span>👁️</span> View Profile
                              </button>
                              <button
                                onClick={() => handleToggleUserActive(u.id, u.status)}
                                disabled={u.email === 'admin@wayfare.com' || u.role === 'super_admin'}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                                  (u.email === 'admin@wayfare.com' || u.role === 'super_admin')
                                    ? 'opacity-40 cursor-not-allowed bg-ink-800 text-ink-500 border border-ink-700'
                                    : u.status === 'deactivated' 
                                      ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30'
                                      : 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20'
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
                <table className="w-full text-left text-xs sm:text-sm text-ink-100">
                  <thead className="border-b border-ink-700 bg-ink-800/80 text-[11px] uppercase tracking-wider text-ink-400">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Route</th>
                      <th className="px-4 py-3 font-semibold">Driver</th>
                      <th className="px-4 py-3 font-semibold">Seats & Price</th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                      <th className="px-4 py-3 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink-700/50">
                    {filteredRides.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="px-6 py-8 text-center text-ink-400">No rides found.</td>
                      </tr>
                    ) : (
                      filteredRides.map((r) => (
                        <tr key={r.id} className="hover:bg-ink-800/30 transition-colors">
                          <td className="px-4 py-3.5">
                            <div className="font-bold text-white">{r.from_location} → {r.to_location}</div>
                            <div className="text-xs text-ink-400">{r.type || 'In-City'} • {new Date(r.date || Date.now()).toLocaleDateString()}</div>
                          </td>
                          <td className="px-4 py-3.5 text-xs text-ink-200">
                            {r.driver?.name || 'Driver'}
                          </td>
                          <td className="px-4 py-3.5 text-xs font-semibold text-beacon">
                            {r.price} PKR • {r.seats} Seats left
                          </td>
                          <td className="px-4 py-3.5">
                            <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                              r.status === 'cancelled' ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'
                            }`}>
                              {r.status || 'open'}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-right">
                            <button
                              onClick={() => handleToggleRideStatus(r.id, r.status)}
                              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                                r.status === 'cancelled'
                                  ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                                  : 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
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
                    <table className="w-full text-left text-xs sm:text-sm text-ink-100">
                      <thead className="border-b border-ink-700 bg-ink-800/80 text-[11px] uppercase tracking-wider text-ink-400">
                        <tr>
                          <th className="px-4 py-3 font-semibold">Timestamp</th>
                          <th className="px-4 py-3 font-semibold">Admin</th>
                          <th className="px-4 py-3 font-semibold">Action</th>
                          <th className="px-4 py-3 font-semibold">Target / Details</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-ink-700/50">
                        {filteredActivityLogs.length === 0 ? (
                          <tr>
                            <td colSpan="4" className="px-6 py-8 text-center text-ink-400">No activity logs found for the selected date range.</td>
                          </tr>
                        ) : (
                          filteredActivityLogs.map((log) => (
                            <tr key={log.id} className="hover:bg-ink-800/30 transition-colors">
                              <td className="px-4 py-3.5 text-xs text-ink-300 font-mono">
                                {new Date(log.created_at).toLocaleString()}
                              </td>
                              <td className="px-4 py-3.5 font-bold text-white">
                                {log.admin_email}
                              </td>
                              <td className="px-4 py-3.5">
                                <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${
                                  log.action_type.includes('APPROVED') || log.action_type.includes('ACTIVATED') ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                                  log.action_type.includes('CANCELLED') || log.action_type.includes('DEACTIVATED') || log.action_type.includes('DELETED') ? 'bg-red-500/10 text-red-400 border-red-500/30' :
                                  'bg-amber-500/10 text-amber-400 border-amber-500/30'
                                }`}>
                                  {log.action_type}
                                </span>
                              </td>
                              <td className="px-4 py-3.5">
                                <div className="font-bold text-white">{log.target_entity}</div>
                                <div className="text-xs text-ink-400 mt-0.5">{log.details}</div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
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
                      <table className="w-full text-left text-xs sm:text-sm text-ink-100">
                        <thead className="border-b border-ink-700 bg-ink-800/80 text-[11px] uppercase tracking-wider text-ink-400">
                          <tr>
                            <th className="px-4 py-3 font-semibold">Admin Profile</th>
                            <th className="px-4 py-3 font-semibold">Email</th>
                            <th className="px-4 py-3 font-semibold">Privilege Level</th>
                            <th className="px-4 py-3 font-semibold">Status</th>
                            <th className="px-4 py-3 font-semibold text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-ink-700/50">
                          {users.filter(u => u.role === 'admin' || u.role === 'super_admin' || u.email === 'admin@wayfare.com').map((adm) => (
                            <tr key={adm.id} className="hover:bg-ink-800/30 transition-colors">
                              <td 
                                onClick={() => setInspectingUser(adm)}
                                className="px-4 py-3.5 font-bold text-white flex items-center gap-2 cursor-pointer group"
                              >
                                <span className="h-7 w-7 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center font-bold text-xs group-hover:scale-105 transition-transform">
                                  {adm.name ? adm.name[0].toUpperCase() : 'A'}
                                </span>
                                <span className="group-hover:text-amber-400 transition-colors">{adm.name || 'System Admin'}</span>
                              </td>
                              <td className="px-4 py-3.5 text-ink-300">{adm.email}</td>
                              <td className="px-4 py-3.5">
                                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                                  adm.email === 'admin@wayfare.com' || adm.role === 'super_admin'
                                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                    : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                }`}>
                                  {adm.email === 'admin@wayfare.com' || adm.role === 'super_admin' ? 'Master Super Admin' : 'Admin'}
                                </span>
                              </td>
                              <td className="px-4 py-3.5">
                                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Active
                                </span>
                              </td>
                              <td className="px-4 py-3.5 text-right">
                                <button
                                  onClick={() => setInspectingUser(adm)}
                                  className="px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 border border-amber-500/30 text-xs font-bold transition-all shadow-sm"
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
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/85 backdrop-blur-md" onClick={() => setReviewingDoc(null)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-5xl rounded-3xl border border-ink-700 bg-[#121622] p-6 sm:p-8 shadow-2xl z-10 max-h-[92vh] flex flex-col">
              <div className="flex items-center justify-between pb-4 border-b border-ink-700/80">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold font-display text-white">Driver Verification Dossier</h2>
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-extrabold uppercase">
                      {reviewingDoc.status || 'Pending Review'}
                    </span>
                  </div>
                  <p className="text-xs text-ink-300 mt-1">
                    Applicant: <strong className="text-white">{reviewingDoc.user?.name || 'Driver Applicant'}</strong> ({reviewingDoc.user?.email}) • Vehicle: <span className="text-amber-400">{reviewingDoc.car_details ? `${reviewingDoc.car_details.make} ${reviewingDoc.car_details.model} (${reviewingDoc.car_details.plate})` : 'Vehicle Info Listed'}</span>
                  </p>
                </div>
                <button onClick={() => setReviewingDoc(null)} className="text-ink-400 hover:text-white p-2 rounded-xl hover:bg-ink-800 transition-colors">✕</button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 py-5 overflow-y-auto flex-1 custom-scrollbar">
                {/* 1. Selfie / Liveness Photo */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-amber-400 uppercase">
                    <span>Selfie / Liveness Photo</span>
                    <span className="text-[10px] text-ink-400 font-normal">Click to Zoom 🔍</span>
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
                    className="group relative aspect-[4/3] rounded-2xl border border-ink-700 bg-ink-950 overflow-hidden cursor-pointer hover:border-amber-400/60 transition-all shadow-md"
                  >
                    <img 
                      src={(typeof reviewingDoc.images?.selfie === 'string' && reviewingDoc.images.selfie.startsWith('data:')) ? reviewingDoc.images.selfie : (reviewingDoc.images?.selfie || 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800&q=80')} 
                      alt="Selfie" 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800&q=80' }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                      <span className="text-xs font-bold text-white flex items-center gap-1.5">
                        <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                        </svg>
                        Click to Fullscreen & Zoom
                      </span>
                    </div>
                  </div>
                </div>

                {/* 2. CNIC Front */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-teal uppercase">
                    <span>Front of CNIC / ID</span>
                    <span className="text-[10px] text-ink-400 font-normal">Click to Zoom 🔍</span>
                  </div>
                  <div 
                    onClick={() => {
                      const src = (typeof reviewingDoc.images?.idFront === 'string' && reviewingDoc.images.idFront.startsWith('data:'))
                        ? reviewingDoc.images.idFront
                        : (reviewingDoc.images?.idFront || 'https://images.unsplash.com/photo-1621252179027-94459d278660?w=1200&q=80')
                      setFullscreenImage({ url: src, title: 'Front of CNIC / ID Document' })
                      setZoomScale(1)
                      setRotationDeg(0)
                    }}
                    className="group relative aspect-[4/3] rounded-2xl border border-ink-700 bg-ink-950 overflow-hidden cursor-pointer hover:border-teal/60 transition-all shadow-md"
                  >
                    <img 
                      src={(typeof reviewingDoc.images?.idFront === 'string' && reviewingDoc.images.idFront.startsWith('data:')) ? reviewingDoc.images.idFront : (reviewingDoc.images?.idFront || 'https://images.unsplash.com/photo-1621252179027-94459d278660?w=800&q=80')} 
                      alt="CNIC Front" 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1621252179027-94459d278660?w=800&q=80' }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                      <span className="text-xs font-bold text-white flex items-center gap-1.5">
                        <svg className="w-4 h-4 text-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                        </svg>
                        Click to Fullscreen & Zoom
                      </span>
                    </div>
                  </div>
                </div>

                {/* 3. Driving License */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-blue-400 uppercase">
                    <span>Driving License</span>
                    <span className="text-[10px] text-ink-400 font-normal">Click to Zoom 🔍</span>
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
                    className="group relative aspect-[4/3] rounded-2xl border border-ink-700 bg-ink-950 overflow-hidden cursor-pointer hover:border-blue-400/60 transition-all shadow-md"
                  >
                    <img 
                      src={(typeof reviewingDoc.images?.license === 'string' && reviewingDoc.images.license.startsWith('data:')) ? reviewingDoc.images.license : (reviewingDoc.images?.license || 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&q=80')} 
                      alt="Driving License" 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&q=80' }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                      <span className="text-xs font-bold text-white flex items-center gap-1.5">
                        <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                        </svg>
                        Click to Fullscreen & Zoom
                      </span>
                    </div>
                  </div>
                </div>

                {/* 4. Car / Vehicle Photo */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-purple-400 uppercase">
                    <span>Registered Vehicle Photo</span>
                    <span className="text-[10px] text-ink-400 font-normal">Click to Zoom 🔍</span>
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
                    className="group relative aspect-[4/3] rounded-2xl border border-ink-700 bg-ink-950 overflow-hidden cursor-pointer hover:border-purple-400/60 transition-all shadow-md"
                  >
                    <img 
                      src={(typeof reviewingDoc.images?.car === 'string' && reviewingDoc.images.car.startsWith('data:')) ? reviewingDoc.images.car : (reviewingDoc.images?.car || 'https://images.unsplash.com/photo-1590362891991-f776e747a588?w=800&q=80')} 
                      alt="Car Photo" 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1590362891991-f776e747a588?w=800&q=80' }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                      <span className="text-xs font-bold text-white flex items-center gap-1.5">
                        <svg className="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                        </svg>
                        Click to Fullscreen & Zoom
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-ink-700/80 flex flex-col sm:flex-row items-center justify-between gap-3">
                <span className="text-xs text-ink-300">
                  ⚠️ Verify CNIC name and picture match user profile before approving.
                </span>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <button 
                    onClick={() => handleVerificationAction(reviewingDoc.id, reviewingDoc.user_id, 'reject')}
                    disabled={processing}
                    className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl text-xs font-bold text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 transition-all"
                  >
                    Reject Application
                  </button>
                  <button 
                    onClick={() => handleVerificationAction(reviewingDoc.id, reviewingDoc.user_id, 'approve')}
                    disabled={processing}
                    className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-xs font-bold text-ink-950 bg-amber-400 hover:bg-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.3)] transition-all"
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
            <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between bg-ink-900/80 border border-white/10 p-3 rounded-2xl backdrop-blur-md">
              <div className="text-sm font-bold font-display text-white">
                {fullscreenImage.title}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setZoomScale(prev => Math.min(prev + 0.5, 3))}
                  className="px-3 py-1.5 rounded-xl bg-ink-800 hover:bg-ink-700 text-white text-xs font-bold border border-ink-600 flex items-center gap-1 transition-all"
                  title="Zoom In"
                >
                  ➕ Zoom In ({Math.round(zoomScale * 100)}%)
                </button>
                <button
                  onClick={() => setZoomScale(prev => Math.max(prev - 0.5, 0.5))}
                  className="px-3 py-1.5 rounded-xl bg-ink-800 hover:bg-ink-700 text-white text-xs font-bold border border-ink-600 flex items-center gap-1 transition-all"
                  title="Zoom Out"
                >
                  ➖ Zoom Out
                </button>
                <button
                  onClick={() => setRotationDeg(prev => (prev + 90) % 360)}
                  className="px-3 py-1.5 rounded-xl bg-ink-800 hover:bg-ink-700 text-white text-xs font-bold border border-ink-600 flex items-center gap-1 transition-all"
                  title="Rotate 90 degrees"
                >
                  ↺ Rotate
                </button>
                <button
                  onClick={() => { setZoomScale(1); setRotationDeg(0); }}
                  className="px-3 py-1.5 rounded-xl bg-ink-800 hover:bg-ink-700 text-ink-300 hover:text-white text-xs font-bold border border-ink-600 transition-all"
                >
                  Reset
                </button>
                <button
                  onClick={() => setFullscreenImage(null)}
                  className="px-3.5 py-1.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-400 text-xs font-bold border border-red-500/30 transition-all ml-2"
                >
                  Close ✕
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
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-3xl rounded-3xl border border-ink-700 bg-[#121622] p-6 sm:p-8 shadow-2xl z-10 max-h-[90vh] flex flex-col">
              
              {/* Modal Header */}
              <div className="flex items-start justify-between pb-4 border-b border-ink-700/80">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold text-xl shadow-md">
                    {inspectingUser.name ? inspectingUser.name[0].toUpperCase() : 'U'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-bold font-display text-white">{inspectingUser.name || 'Unnamed User'}</h2>
                      <span className="capitalize text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-ink-800 border border-ink-700 text-ink-200">
                        {inspectingUser.role || 'rider'}
                      </span>
                    </div>
                    <p className="text-xs text-ink-400 mt-0.5">{inspectingUser.email} • ID: {inspectingUser.id?.slice(0, 8)}...</p>
                  </div>
                </div>

                <button onClick={() => setInspectingUser(null)} className="text-ink-400 hover:text-white p-2 rounded-xl hover:bg-ink-800 transition-colors">✕</button>
              </div>

              {/* Modal Content Scrollable Area */}
              <div className="py-5 overflow-y-auto flex-1 space-y-6 custom-scrollbar">
                
                {/* 1. Account Attributes Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3.5 rounded-2xl border border-ink-700/60 bg-ink-900/60 space-y-1">
                    <div className="text-[10px] font-bold text-ink-400 uppercase">City</div>
                    <div className="text-xs font-bold text-white truncate">{inspectingUser.city || 'Islamabad'}</div>
                  </div>
                  <div className="p-3.5 rounded-2xl border border-ink-700/60 bg-ink-900/60 space-y-1">
                    <div className="text-[10px] font-bold text-ink-400 uppercase">Gender</div>
                    <div className="text-xs font-bold text-white capitalize">{inspectingUser.gender || 'Unspecified'}</div>
                  </div>
                  <div className="p-3.5 rounded-2xl border border-ink-700/60 bg-ink-900/60 space-y-1">
                    <div className="text-[10px] font-bold text-ink-400 uppercase">Verification</div>
                    <div className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                      {inspectingUser.verified ? '✅ ID Verified' : '❌ Unverified'}
                    </div>
                  </div>
                  <div className="p-3.5 rounded-2xl border border-ink-700/60 bg-ink-900/60 space-y-1">
                    <div className="text-[10px] font-bold text-ink-400 uppercase">Status</div>
                    <div className={`text-xs font-bold ${inspectingUser.status === 'deactivated' ? 'text-red-400' : 'text-emerald-400'}`}>
                      {inspectingUser.status === 'deactivated' ? '🚫 Deactivated' : '⚡ Active Account'}
                    </div>
                  </div>
                </div>

                {/* 2. User Rides History */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display text-sm font-bold text-white uppercase tracking-wider text-amber-400">
                      🚗 User Posted Rides History ({userRides.length})
                    </h3>
                  </div>

                  <div className="rounded-2xl border border-ink-700/80 overflow-hidden bg-ink-900/40">
                    {loadingUserRides ? (
                      <div className="p-6 text-center text-xs text-ink-400">Loading user rides...</div>
                    ) : userRides.length === 0 ? (
                      <div className="p-6 text-center text-xs text-ink-400">No posted rides found for this user.</div>
                    ) : (
                      <table className="w-full text-left text-xs text-ink-100">
                        <thead className="border-b border-ink-700 bg-ink-800/80 text-[10px] uppercase text-ink-400 font-semibold">
                          <tr>
                            <th className="px-3.5 py-2.5">Route</th>
                            <th className="px-3.5 py-2.5">Fare</th>
                            <th className="px-3.5 py-2.5">Seats</th>
                            <th className="px-3.5 py-2.5">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-ink-700/40">
                          {userRides.map(r => (
                            <tr key={r.id} className="hover:bg-ink-800/30">
                              <td className="px-3.5 py-2.5 font-bold text-white">
                                {r.from_location} &rarr; {r.to_location}
                              </td>
                              <td className="px-3.5 py-2.5 text-amber-400 font-bold">Rs {r.price}</td>
                              <td className="px-3.5 py-2.5 text-ink-300">{r.seats} seats</td>
                              <td className="px-3.5 py-2.5">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                  r.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' :
                                  r.status === 'cancelled' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'
                                }`}>
                                  {r.status || 'open'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>

              </div>

              {/* Modal Footer Admin Actions */}
              <div className="pt-4 border-t border-ink-700/80 flex flex-wrap items-center justify-between gap-3">
                <button
                  onClick={() => {
                    const verificationDoc = verifications.find(v => v.user_id === inspectingUser.id)
                    if (verificationDoc) {
                      setReviewingDoc(verificationDoc)
                    } else {
                      alert("No verification document uploaded for this user.")
                    }
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-teal bg-teal/10 hover:bg-teal/20 border border-teal/20"
                >
                  📄 View ID Verification Docs
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      handleToggleUserActive(inspectingUser.id, inspectingUser.status)
                      setInspectingUser(null)
                    }}
                    disabled={inspectingUser.email === 'admin@wayfare.com' || inspectingUser.role === 'super_admin'}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                      (inspectingUser.email === 'admin@wayfare.com' || inspectingUser.role === 'super_admin')
                        ? 'opacity-40 cursor-not-allowed bg-ink-800 text-ink-500'
                        : inspectingUser.status === 'deactivated'
                          ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30'
                          : 'bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30'
                    }`}
                  >
                    {inspectingUser.status === 'deactivated' ? '⚡ Activate Account' : '🚫 Deactivate Account'}
                  </button>
                  <button
                    onClick={() => setInspectingUser(null)}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-ink-800 text-ink-300 hover:text-white"
                  >
                    Close Dossier
                  </button>
                </div>
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
