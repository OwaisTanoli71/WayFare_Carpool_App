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

        {/* MAIN PORTAL BODY SKELETON MATCHED TO DESTINATION PAGE */}
        <main className="flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full space-y-6">
          {/* Header Bar Skeleton */}
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="h-7 w-48 sm:w-64 bg-ink-700/70 rounded-xl animate-pulse" />
              <div className="h-3.5 w-36 sm:w-48 bg-ink-800/80 rounded-md animate-pulse" />
            </div>
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-ink-800/80 animate-pulse" />
              <div className="h-9 w-9 rounded-full bg-amber-500/20 border border-amber-500/30 animate-pulse" />
            </div>
          </div>

          {/* PAGE STRUCTURE MATCHING */}
          {location.pathname === '/chat' ? (
            /* CHAT PAGE SKELETON STRUCTURE */
            <div className="h-[70vh] rounded-3xl border border-ink-700/80 bg-[#121622] flex overflow-hidden">
              <div className="w-full md:w-80 border-r border-ink-700/60 p-4 space-y-3 shrink-0">
                <div className="h-8 w-full bg-ink-800 rounded-xl animate-pulse" />
                <div className="h-16 w-full bg-ink-800/60 rounded-xl animate-pulse" />
                <div className="h-16 w-full bg-ink-800/60 rounded-xl animate-pulse" />
                <div className="h-16 w-full bg-ink-800/60 rounded-xl animate-pulse" />
              </div>
              <div className="hidden md:flex flex-1 flex-col justify-between p-4 bg-ink-950/40">
                <div className="h-12 w-full bg-ink-800/50 rounded-xl animate-pulse" />
                <div className="space-y-3 my-auto">
                  <div className="h-10 w-48 bg-amber-500/20 rounded-2xl animate-pulse ml-auto" />
                  <div className="h-10 w-56 bg-ink-800/60 rounded-2xl animate-pulse" />
                </div>
                <div className="h-12 w-full bg-ink-800/80 rounded-2xl animate-pulse" />
              </div>
            </div>
          ) : location.pathname === '/find-ride' ? (
            /* FIND RIDE PAGE SKELETON STRUCTURE */
            <div className="space-y-6">
              <div className="h-16 w-full rounded-2xl border border-ink-700/80 bg-[#121622] p-3 flex items-center gap-3 animate-pulse">
                <div className="h-9 flex-1 bg-ink-800/60 rounded-xl" />
                <div className="h-9 flex-1 bg-ink-800/60 rounded-xl" />
              </div>
              <div className="flex gap-2">
                <div className="h-8 w-24 rounded-full bg-amber-500/20 border border-amber-500/30 animate-pulse" />
                <div className="h-8 w-24 rounded-full bg-ink-800/60 animate-pulse" />
                <div className="h-8 w-24 rounded-full bg-ink-800/60 animate-pulse" />
              </div>
              <div className="space-y-3">
                <div className="h-28 w-full rounded-2xl border border-ink-700/80 bg-[#121622] p-5 flex justify-between animate-pulse">
                  <div className="space-y-2">
                    <div className="h-5 w-48 bg-ink-700 rounded" />
                    <div className="h-4 w-32 bg-ink-800 rounded" />
                  </div>
                  <div className="h-8 w-20 bg-amber-500/20 rounded-xl" />
                </div>
                <div className="h-28 w-full rounded-2xl border border-ink-700/80 bg-[#121622] p-5 flex justify-between animate-pulse">
                  <div className="space-y-2">
                    <div className="h-5 w-48 bg-ink-700 rounded" />
                    <div className="h-4 w-32 bg-ink-800 rounded" />
                  </div>
                  <div className="h-8 w-20 bg-amber-500/20 rounded-xl" />
                </div>
              </div>
            </div>
          ) : location.pathname === '/profile' ? (
            /* PROFILE PAGE SKELETON STRUCTURE */
            <div className="max-w-2xl mx-auto rounded-3xl border border-ink-700/80 bg-[#121622] p-6 sm:p-8 space-y-6">
              <div className="flex items-center gap-4 border-b border-ink-700/60 pb-6">
                <div className="w-20 h-20 rounded-full bg-ink-700 animate-pulse shrink-0" />
                <div className="space-y-2">
                  <div className="h-6 w-40 bg-ink-700 rounded-lg animate-pulse" />
                  <div className="h-4 w-28 bg-ink-800 rounded-md animate-pulse" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="h-12 w-full bg-ink-800/60 rounded-xl animate-pulse" />
                <div className="h-12 w-full bg-ink-800/60 rounded-xl animate-pulse" />
                <div className="h-12 w-full bg-ink-800/60 rounded-xl animate-pulse" />
                <div className="h-12 w-full bg-ink-800/60 rounded-xl animate-pulse" />
              </div>
            </div>
          ) : location.pathname === '/admin' ? (
            /* ADMIN DASHBOARD SKELETON STRUCTURE */
            <div className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="h-24 rounded-2xl border border-ink-700/80 bg-ink-800/40 p-4 space-y-2 animate-pulse" />
                <div className="h-24 rounded-2xl border border-ink-700/80 bg-ink-800/40 p-4 space-y-2 animate-pulse" />
                <div className="h-24 rounded-2xl border border-ink-700/80 bg-ink-800/40 p-4 space-y-2 animate-pulse" />
                <div className="h-24 rounded-2xl border border-ink-700/80 bg-ink-800/40 p-4 space-y-2 animate-pulse" />
              </div>
              <div className="rounded-3xl border border-ink-700/80 bg-[#121622] p-6 space-y-4">
                <div className="h-6 w-48 bg-ink-700 rounded-md animate-pulse" />
                <div className="h-12 w-full bg-ink-800/60 rounded-xl animate-pulse" />
                <div className="h-12 w-full bg-ink-800/60 rounded-xl animate-pulse" />
                <div className="h-12 w-full bg-ink-800/60 rounded-xl animate-pulse" />
              </div>
            </div>
          ) : (
            /* DEFAULT DASHBOARD PAGE SKELETON STRUCTURE */
            <div className="space-y-6">
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

              <div className="rounded-3xl border border-ink-700/80 bg-[#121622] p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-ink-700/60 pb-3">
                  <div className="h-5 w-44 bg-ink-700/70 rounded-lg animate-pulse" />
                  <div className="h-4 w-20 bg-ink-800/80 rounded-md animate-pulse" />
                </div>
                <div className="space-y-3">
                  <div className="h-20 w-full rounded-2xl bg-ink-800/50 animate-pulse" />
                  <div className="h-20 w-full rounded-2xl bg-ink-800/50 animate-pulse" />
                </div>
              </div>
            </div>
          )}
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
