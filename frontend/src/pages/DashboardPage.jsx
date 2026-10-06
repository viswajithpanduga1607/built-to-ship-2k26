import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  PlusCircle, RefreshCw, TrendingUp, Clock, CheckCircle2,
  Brain, Zap, ArrowUpRight
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { DashboardGrid } from '../components/ui/DashboardGrid'
import { getInitials, cn } from '../lib/utils'

/**
 * DashboardPage — Home route (/)
 * Shows profile summary, stat cards, and a real-time grid of all user requests.
 * Subscribes to Supabase Realtime for live status updates when n8n writes back.
 */
export default function DashboardPage() {
  const { user, profile } = useAuth()
  const [requests, setRequests] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [lastSync, setLastSync] = useState(null)

  // ── Fetch all requests for the current user ──────────────────────────────
  const fetchRequests = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('employee_requests')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (!error) {
      setRequests(data ?? [])
      setLastSync(new Date())
    } else {
      console.error('[Dayflow] Fetch error:', error.message)
    }
    setLoading(false)
  }, [user.id])

  useEffect(() => {
    fetchRequests()
  }, [fetchRequests])

  // ── Supabase Realtime subscription ────────────────────────────────────────
  // When n8n PATCHes a record (status + ai_evaluation_json), the UI updates live.
  useEffect(() => {
    const channel = supabase
      .channel(`user-requests-${user.id}`)
      .on(
        'postgres_changes',
        {
          event:  '*',
          schema: 'public',
          table:  'employee_requests',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          setRequests(prev => {
            switch (payload.eventType) {
              case 'INSERT':
                return [payload.new, ...prev]
              case 'UPDATE':
                return prev.map(r => r.id === payload.new.id ? payload.new : r)
              case 'DELETE':
                return prev.filter(r => r.id !== payload.old.id)
              default:
                return prev
            }
          })
          setLastSync(new Date())
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [user.id])

  // ── Derived stats ─────────────────────────────────────────────────────────
  const stats = {
    total:    requests.length,
    pending:  requests.filter(r => r.status === 'Pending').length,
    approved: requests.filter(r => r.status === 'Approved').length,
    review:   requests.filter(r => r.status === 'Requires Manual Review').length,
  }

  const initials    = getInitials(profile?.full_name ?? user.email)
  const displayName = profile?.full_name ?? user.email?.split('@')[0] ?? 'Employee'

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">

      {/* ── Hero greeting ─────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-brand-600/20 via-surface-2 to-surface-1 p-6 sm:p-8">
        {/* Background glow */}
        <div className="pointer-events-none absolute -top-10 -right-10 h-48 w-48 rounded-full bg-brand-500/20 blur-[60px]" />
        <div className="pointer-events-none absolute bottom-0 left-0 h-32 w-64 rounded-full bg-accent-violet/10 blur-[60px]" />

        <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-5">
          {/* Avatar */}
          <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-accent-violet text-xl font-bold text-white shadow-glow-sm">
            {initials}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-display font-bold text-white truncate">
                Good {getGreeting()}, {displayName.split(' ')[0]} 👋
              </h1>
            </div>
            <p className="text-sm text-slate-400">
              {profile?.role === 'admin'
                ? 'Administrator — You have full access to all system requests.'
                : `Your workspace at a glance — ${stats.pending} request${stats.pending !== 1 ? 's' : ''} awaiting AI review.`
              }
            </p>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={fetchRequests}
              className="btn-ghost gap-2 text-xs"
              title={lastSync ? `Last synced ${lastSync.toLocaleTimeString()}` : 'Sync'}
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh
            </button>
            <Link to="/new-request" className="btn-brand text-xs px-4 py-2.5">
              <PlusCircle className="h-4 w-4" />
              New Request
            </Link>
          </div>
        </div>
      </section>

      {/* ── Stat cards ────────────────────────────────────────────────────── */}
      <section>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total Requests"
            value={stats.total}
            icon={TrendingUp}
            iconColor="text-brand-400"
            iconBg="bg-brand-500/15"
          />
          <StatCard
            label="Pending Review"
            value={stats.pending}
            icon={Clock}
            iconColor="text-amber-400"
            iconBg="bg-amber-500/15"
            pulse={stats.pending > 0}
          />
          <StatCard
            label="Approved"
            value={stats.approved}
            icon={CheckCircle2}
            iconColor="text-emerald-400"
            iconBg="bg-emerald-500/15"
          />
          <StatCard
            label="In Manual Review"
            value={stats.review}
            icon={Brain}
            iconColor="text-violet-400"
            iconBg="bg-violet-500/15"
          />
        </div>
      </section>

      {/* ── AI Pipeline status banner ──────────────────────────────────────── */}
      {stats.pending > 0 && (
        <section className="flex items-center gap-3 rounded-xl border border-brand-500/25 bg-brand-500/8 px-4 py-3">
          <div className="relative flex-shrink-0">
            <Brain className="h-5 w-5 text-brand-400" />
            <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-brand-400 animate-ping" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-brand-300">
              AI Pipeline Active
            </p>
            <p className="text-xs text-slate-500">
              {stats.pending} request{stats.pending !== 1 ? 's are' : ' is'} being evaluated by Gemini via the n8n workflow.
              Status updates in real-time.
            </p>
          </div>
          <Zap className="h-4 w-4 text-brand-400 flex-shrink-0 animate-pulse" fill="currentColor" />
        </section>
      )}

      {/* ── All requests grid ─────────────────────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="section-heading">My Requests</h2>
            <p className="section-subheading">Click any card to view AI evaluation details</p>
          </div>
          {lastSync && (
            <span className="text-[11px] text-slate-600 hidden sm:block">
              Live · synced {lastSync.toLocaleTimeString()}
            </span>
          )}
        </div>

        <DashboardGrid
          requests={requests}
          loading={loading}
          emptyMessage="You haven't submitted any requests yet."
        />
      </section>
    </div>
  )
}

// ── Sub-components ─────────────────────────────────────────────────────────

function StatCard({ label, value, icon: Icon, iconColor, iconBg, pulse = false }) {
  return (
    <div className="glass-card p-5">
      <div className="flex items-start justify-between mb-4">
        <div className={cn('flex h-9 w-9 items-center justify-center rounded-xl', iconBg)}>
          <Icon className={cn('h-4.5 w-4.5', iconColor)} size={18} />
          {pulse && (
            <span className={cn('absolute h-2 w-2 rounded-full animate-ping opacity-75', iconBg)} />
          )}
        </div>
        <ArrowUpRight className="h-3.5 w-3.5 text-slate-700" />
      </div>
      <p className="text-3xl font-display font-bold text-white mb-1">{value}</p>
      <p className="text-xs text-slate-500 font-medium">{label}</p>
    </div>
  )
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
}
