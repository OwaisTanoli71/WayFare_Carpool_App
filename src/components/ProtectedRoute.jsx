import { Navigate, useLocation } from 'react-router-dom'
import { useApp } from '../context/AppContext'

export default function ProtectedRoute({ children, requireOnboarding = true }) {
  const { user, loading } = useApp()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-[#0F131C] text-white flex flex-col md:flex-row overflow-hidden font-body">
        {/* DESKTOP SIDEBAR SKELETON (Hidden on mobile) */}
        <aside className="hidden md:flex flex-col w-64 border-r border-ink-700/80 bg-[#131722] p-6 shrink-0 h-screen justify-between">
          <div>
            {/* Official Logo & Brand */}
            <div className="flex items-center gap-3 mb-10">
              <img src="/Wayfare_favicon.jpeg" alt="Wayfare Logo" className="w-10 h-10 rounded-xl object-cover shadow-md" />
              <span className="font-display text-xl font-bold tracking-tight text-white">Wayfare</span>
            </div>

            {/* Sidebar Menu Items Skeletons */}
            <div className="space-y-4">
              <div className="text-[11px] font-bold uppercase tracking-wider text-ink-400 mb-2">Main Menu</div>
              <div className="h-11 w-full rounded-xl bg-ink-700/60 animate-pulse" />
              <div className="h-11 w-full rounded-xl bg-ink-800/60 animate-pulse" />
              <div className="h-11 w-full rounded-xl bg-ink-800/60 animate-pulse" />

              <div className="text-[11px] font-bold uppercase tracking-wider text-ink-400 mt-6 mb-2">Rides & Safety</div>
              <div className="h-11 w-full rounded-xl bg-ink-800/60 animate-pulse" />
              <div className="h-11 w-full rounded-xl bg-ink-800/60 animate-pulse" />
              <div className="h-11 w-full rounded-xl bg-ink-800/60 animate-pulse" />
            </div>
          </div>

          {/* User Profile Card Skeleton */}
          <div className="p-3 rounded-2xl border border-ink-700/80 bg-ink-800/40 flex items-center gap-3 animate-pulse">
            <div className="w-9 h-9 rounded-full bg-ink-700 shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3.5 w-24 bg-ink-700 rounded-md" />
              <div className="h-2.5 w-16 bg-ink-800 rounded-md" />
            </div>
          </div>
        </aside>

        {/* MOBILE TOP NAVBAR SKELETON (Visible on mobile only) */}
        <header className="md:hidden flex items-center justify-between px-5 py-4 border-b border-ink-700/80 bg-[#131722] shrink-0">
          <div className="flex items-center gap-3">
            <img src="/Wayfare_favicon.jpeg" alt="Wayfare Logo" className="w-8 h-8 rounded-lg object-cover shadow-sm" />
            <span className="font-display text-lg font-bold text-white">Wayfare</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-ink-700/60 animate-pulse" />
            <div className="w-8 h-8 rounded-full bg-ink-700/60 animate-pulse" />
          </div>
        </header>

        {/* MAIN PORTAL BODY SKELETON */}
        <main className="flex-1 p-5 sm:p-8 md:p-10 overflow-y-auto max-w-7xl mx-auto w-full space-y-8">
          {/* Header Bar Skeleton */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="h-8 w-48 sm:w-64 bg-ink-700/70 rounded-xl animate-pulse" />
              <div className="h-4 w-36 sm:w-48 bg-ink-800/80 rounded-md animate-pulse" />
            </div>
            <div className="hidden sm:flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-ink-800/80 animate-pulse" />
              <div className="h-10 w-32 rounded-xl bg-amber-500/20 border border-amber-500/30 animate-pulse" />
            </div>
          </div>

          {/* Quick Action Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="h-32 sm:h-36 rounded-2xl border border-ink-700/80 bg-ink-800/40 p-6 flex flex-col justify-between animate-pulse">
              <div className="h-4 w-28 bg-amber-500/30 rounded-md" />
              <div className="h-7 w-40 bg-ink-700 rounded-lg" />
            </div>
            <div className="h-32 sm:h-36 rounded-2xl border border-ink-700/80 bg-ink-800/40 p-6 flex flex-col justify-between animate-pulse">
              <div className="h-4 w-28 bg-teal/30 rounded-md" />
              <div className="h-7 w-40 bg-ink-700 rounded-lg" />
            </div>
          </div>

          {/* Main Content Area Card */}
          <div className="rounded-3xl border border-ink-700/80 bg-[#121622] p-6 sm:p-8 space-y-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-ink-700/60 pb-4">
              <div className="h-6 w-44 bg-ink-700/70 rounded-lg animate-pulse" />
              <div className="h-5 w-20 bg-ink-800/80 rounded-md animate-pulse" />
            </div>
            <div className="space-y-4">
              <div className="h-20 w-full rounded-2xl bg-ink-800/50 animate-pulse" />
              <div className="h-20 w-full rounded-2xl bg-ink-800/50 animate-pulse" />
              <div className="h-20 w-full rounded-2xl bg-ink-800/50 animate-pulse" />
            </div>
          </div>

          {/* 4 Bottom Stats Grid Skeleton */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="h-24 rounded-2xl border border-ink-700/80 bg-ink-800/30 p-4 space-y-2 animate-pulse">
              <div className="h-3 w-16 bg-ink-700 rounded" />
              <div className="h-6 w-12 bg-white/20 rounded" />
            </div>
            <div className="h-24 rounded-2xl border border-ink-700/80 bg-ink-800/30 p-4 space-y-2 animate-pulse">
              <div className="h-3 w-16 bg-ink-700 rounded" />
              <div className="h-6 w-12 bg-white/20 rounded" />
            </div>
            <div className="h-24 rounded-2xl border border-ink-700/80 bg-ink-800/30 p-4 space-y-2 animate-pulse">
              <div className="h-3 w-16 bg-ink-700 rounded" />
              <div className="h-6 w-12 bg-white/20 rounded" />
            </div>
            <div className="h-24 rounded-2xl border border-ink-700/80 bg-ink-800/30 p-4 space-y-2 animate-pulse">
              <div className="h-3 w-16 bg-ink-700 rounded" />
              <div className="h-6 w-12 bg-white/20 rounded" />
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (!user) {
    // Save the location they were trying to go to
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  const userRole = user.role || localStorage.getItem('wayfare_role')
  const completedOnboarding = localStorage.getItem('wayfare_onboarded') || user.onboarded

  if (requireOnboarding && !completedOnboarding && !userRole) {
    return <Navigate to="/onboarding" replace />
  }

  return children
}
