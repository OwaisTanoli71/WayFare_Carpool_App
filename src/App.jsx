import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AppProvider } from './context/AppContext'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Onboarding from './pages/Onboarding'
import Dashboard from './pages/Dashboard'
import RideDetail from './pages/RideDetail'
import Chat from './pages/Chat'
import PostRide from './pages/PostRide'
import FindRide from './pages/FindRide'
import Profile from './pages/Profile'
import TrustedContacts from './pages/TrustedContacts'
import Circles from './pages/Circles'
import Verification from './pages/Verification'
import AdminDashboard from './pages/AdminDashboard'
import AdminLogin from './pages/AdminLogin'
import ResetPassword from './pages/ResetPassword'
import SessionTimeout from './pages/SessionTimeout'
import NotFound from './pages/NotFound'
import EarningsDashboard from './pages/EarningsDashboard'
import ProtectedRoute from './components/ProtectedRoute'
import AdminRoute from './components/AdminRoute'
import InstallPrompt from './components/InstallPrompt'
import OfflineIndicator from './components/OfflineIndicator'
import HelpWidget from './components/HelpWidget'
import DashboardLayout from './components/DashboardLayout'
import InactivityTracker from './components/InactivityTracker'
import PwaUpdatePrompt from './components/PwaUpdatePrompt'
import SplashScreen from './components/SplashScreen'

export default function App() {
  return (
    <AppProvider>
      <SplashScreen />
      <InactivityTracker />
      <OfflineIndicator />
      <InstallPrompt />
      <PwaUpdatePrompt />
      <HelpWidget />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/session-timeout" element={<SessionTimeout />} />
        <Route path="/onboarding" element={<ProtectedRoute requireOnboarding={false}><Onboarding /></ProtectedRoute>} />
        
        {/* Authenticated Layout */}
        <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/ride/:id" element={<RideDetail />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/post-ride" element={<PostRide />} />
          <Route path="/find-ride" element={<FindRide />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/verify" element={<Verification />} />
          <Route path="/trusted-contacts" element={<TrustedContacts />} />
          <Route path="/circles" element={<Circles />} />
          <Route path="/earnings" element={<EarningsDashboard />} />
        </Route>

        <Route path="/admin-login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AppProvider>
  )
}
