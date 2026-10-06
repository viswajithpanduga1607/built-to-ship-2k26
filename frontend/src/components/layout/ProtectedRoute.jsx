import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { Zap } from 'lucide-react'

/**
 * ProtectedRoute
 * Guards routes that require authentication. Redirects to /login if no session.
 * Shows a branded loading screen while the initial auth check is in flight.
 *
 * @param {{ children: React.ReactNode, requireAdmin?: boolean }} props
 */
export function ProtectedRoute({ children, requireAdmin = false }) {
  const { user, loading, isAdmin } = useAuth()
  const location = useLocation()

  // While Supabase is checking the persisted session, show a loader
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <div className="flex flex-col items-center gap-4">
          <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-accent-violet shadow-glow animate-glow-pulse">
            <Zap className="h-8 w-8 text-white" fill="currentColor" />
          </div>
          <div className="flex flex-col items-center gap-1.5">
            <p className="text-sm font-semibold text-slate-300">Loading Dayflow…</p>
            <div className="flex gap-1">
              {[0, 1, 2].map(i => (
                <div
                  key={i}
                  className="h-1.5 w-1.5 rounded-full bg-brand-500 animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Not authenticated → redirect to login, preserving the intended destination
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Admin-only route guard
  if (requireAdmin && !isAdmin) {
    return <Navigate to="/" replace />
  }

  return children
}
