import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider }    from './contexts/AuthContext'
import { ProtectedRoute }  from './components/layout/ProtectedRoute'
import { AppLayout }       from './components/layout/AppLayout'
import AuthPage            from './pages/AuthPage'
import DashboardPage       from './pages/DashboardPage'
import NewRequestPage      from './pages/NewRequestPage'
import AdminPage           from './pages/AdminPage'

/**
 * App — Root component.
 *
 * Route structure:
 *   /login        → AuthPage         (public)
 *   /             → DashboardPage    (protected)
 *   /new-request  → NewRequestPage   (protected)
 *   /admin        → AdminPage        (protected + admin role)
 *   *             → redirect to /
 */
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>

          {/* ── Public Routes ───────────────────────────────────────────── */}
          <Route path="/login" element={<AuthPage />} />

          {/* ── Protected Routes (authenticated shell) ──────────────────── */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <DashboardPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/new-request"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <NewRequestPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          {/* ── Admin-only Route ────────────────────────────────────────── */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute requireAdmin>
                <AppLayout>
                  <AdminPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          {/* ── Catch-all redirect ──────────────────────────────────────── */}
          <Route path="*" element={<Navigate to="/" replace />} />

        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
