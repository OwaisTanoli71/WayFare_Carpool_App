import { Navigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'

export default function AdminRoute({ children }) {
  const { user, loading } = useApp()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink-900">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-beacon border-t-transparent" />
      </div>
    )
  }

  // Not logged in or not an admin -> send back to dashboard or login
  if (!user || user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />
  }

  return children
}
