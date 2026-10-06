import { useState } from 'react'
import { NavLink, useNavigate, Link } from 'react-router-dom'
import {
  LayoutDashboard, PlusCircle, ShieldCheck, LogOut,
  Menu, X, Zap, ChevronDown, Bell, Settings
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { getInitials, cn } from '../../lib/utils'

const NAV_ITEMS = [
  { to: '/',            icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/new-request', icon: PlusCircle,      label: 'New Request' },
]

const ADMIN_ITEMS = [
  { to: '/admin', icon: ShieldCheck, label: 'Admin' },
]

/**
 * AppLayout — persistent navigation shell wrapping all authenticated pages.
 * Responsive: collapsible sidebar on mobile, fixed sidebar on desktop.
 */
export function AppLayout({ children }) {
  const { user, profile, signOut, isAdmin } = useAuth()
  const navigate  = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  const initials    = getInitials(profile?.full_name ?? user?.email)
  const displayName = profile?.full_name ?? user?.email?.split('@')[0] ?? 'User'
  const roleLabel   = profile?.role === 'admin' ? 'Administrator' : 'Employee'

  const navLinks = [...NAV_ITEMS, ...(isAdmin ? ADMIN_ITEMS : [])]

  return (
    <div className="flex min-h-screen">

      {/* ── Sidebar ─────────────────────────────────────────────────────────── */}
      <>
        {/* Mobile overlay */}
        {mobileOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}

        <aside className={cn(
          'fixed top-0 left-0 z-40 flex h-full w-64 flex-col',
          'border-r border-white/8 bg-surface-1/90 backdrop-blur-xl',
          'transition-transform duration-300 ease-in-out',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
          'lg:relative lg:translate-x-0 lg:flex'
        )}>

          {/* Logo */}
          <div className="flex items-center gap-3 px-5 py-5 border-b border-white/8">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-accent-violet shadow-glow-sm">
              <Zap className="h-5 w-5 text-white" fill="currentColor" />
            </div>
            <div>
              <span className="text-base font-display font-bold text-white tracking-tight">Dayflow</span>
              <p className="text-[10px] text-slate-500 -mt-0.5">AI-Powered HRMS</p>
            </div>
            <button
              className="ml-auto lg:hidden btn-ghost p-1"
              onClick={() => setMobileOpen(false)}
              aria-label="Close menu"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Nav links */}
          <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
            <p className="px-3 py-2 text-[10px] font-semibold uppercase tracking-widest text-slate-600">
              Main Menu
            </p>
            {navLinks.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  isActive ? 'nav-link-active' : 'nav-link'
                }
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                {label}
              </NavLink>
            ))}
          </nav>

          {/* User profile footer */}
          <div className="border-t border-white/8 p-3">
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(v => !v)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-xl px-3 py-2.5',
                  'transition-all duration-200 hover:bg-white/6',
                  userMenuOpen && 'bg-white/6'
                )}
                aria-haspopup="true"
                aria-expanded={userMenuOpen}
              >
                {/* Avatar */}
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-accent-violet text-xs font-bold text-white">
                  {initials}
                </div>
                <div className="min-w-0 flex-1 text-left">
                  <p className="truncate text-sm font-medium text-slate-200">{displayName}</p>
                  <p className="text-[10px] text-slate-500">{roleLabel}</p>
                </div>
                <ChevronDown className={cn(
                  'h-3.5 w-3.5 text-slate-500 transition-transform flex-shrink-0',
                  userMenuOpen && 'rotate-180'
                )} />
              </button>

              {/* Dropdown */}
              {userMenuOpen && (
                <div className="absolute bottom-full left-0 right-0 mb-2 rounded-xl border border-white/12 bg-surface-2 shadow-card overflow-hidden animate-slide-up">
                  <div className="px-3 py-2.5 border-b border-white/8">
                    <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                  </div>
                  <button className="flex w-full items-center gap-2 px-3 py-2.5 text-sm text-slate-400 hover:bg-white/6 hover:text-slate-200 transition-colors">
                    <Settings className="h-4 w-4" />
                    Settings
                  </button>
                  <button
                    onClick={handleSignOut}
                    className="flex w-full items-center gap-2 px-3 py-2.5 text-sm text-rose-400 hover:bg-rose-500/10 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </aside>
      </>

      {/* ── Main content area ──────────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col min-w-0">

        {/* Top bar (mobile + notifications) */}
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-white/8 bg-surface/80 backdrop-blur-xl px-4 py-3 lg:px-6">
          <button
            className="btn-ghost p-2 lg:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Mobile logo */}
          <Link to="/" className="flex items-center gap-2 lg:hidden">
            <Zap className="h-5 w-5 text-brand-400" fill="currentColor" />
            <span className="text-sm font-display font-bold text-white">Dayflow</span>
          </Link>

          <div className="ml-auto flex items-center gap-2">
            <button className="btn-ghost relative p-2" aria-label="Notifications">
              <Bell className="h-4 w-4" />
              <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-brand-500" />
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
