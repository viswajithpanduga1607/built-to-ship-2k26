import { useEffect, useState, useCallback } from 'react'
import {
  ShieldCheck, Search, RefreshCw, Download,
  Users, Clock, CheckCircle2, Brain, ChevronDown,
  ArrowUpDown, AlertCircle
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { StatusBadge } from '../components/ui/StatusBadge'
import { RequestDetailModal } from '../components/ui/RequestDetailModal'
import { formatDate, formatTimestamp, daysBetween, cn } from '../lib/utils'

const STATUS_FILTERS = ['All', 'Pending', 'Approved', 'Requires Manual Review', 'Rejected']
const TYPE_FILTERS   = ['All', 'PTO', 'Sick Leave', 'Remote Work', 'Equipment']

/**
 * AdminPage — /admin (requires role = 'admin')
 * Full view of ALL requests across all users with search, filter, sort,
 * and per-request AI evaluation detail modal.
 */
export default function AdminPage() {
  const [requests,        setRequests]        = useState([])
  const [loading,         setLoading]         = useState(true)
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [searchQuery,     setSearchQuery]     = useState('')
  const [statusFilter,    setStatusFilter]    = useState('All')
  const [typeFilter,      setTypeFilter]      = useState('All')
  const [sortField,       setSortField]       = useState('created_at')
  const [sortDir,         setSortDir]         = useState('desc')
  const [lastSync,        setLastSync]        = useState(null)
  const [error,           setError]           = useState('')

  // ── Fetch ALL requests (admin bypass via service-role is on n8n side;
  //    admin RLS policy allows SELECT for admin role users) ──────────────────
  const fetchAll = useCallback(async () => {
    setLoading(true)
    setError('')

    const { data, error: err } = await supabase
      .from('employee_requests')
      .select(`
        *,
        profiles (
          full_name,
          role
        )
      `)
      .order(sortField, { ascending: sortDir === 'asc' })

    if (err) {
      setError('Failed to load requests. Ensure your account has the admin role.')
      console.error('[Dayflow Admin]', err.message)
    } else {
      setRequests(data ?? [])
      setLastSync(new Date())
    }
    setLoading(false)
  }, [sortField, sortDir])

  useEffect(() => { fetchAll() }, [fetchAll])

  // ── Realtime subscription (all changes) ───────────────────────────────────
  useEffect(() => {
    const channel = supabase
      .channel('admin-all-requests')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'employee_requests' },
        () => { fetchAll() }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [fetchAll])

  // ── Derived: filter + search on client ───────────────────────────────────
  const filtered = requests.filter(r => {
    const matchStatus = statusFilter === 'All' || r.status === statusFilter
    const matchType   = typeFilter   === 'All' || r.request_type === typeFilter
    const q = searchQuery.toLowerCase()
    const matchSearch = !q ||
      r.profiles?.full_name?.toLowerCase().includes(q) ||
      r.request_type?.toLowerCase().includes(q) ||
      r.justification?.toLowerCase().includes(q)
    return matchStatus && matchType && matchSearch
  })

  // ── Stats ──────────────────────────────────────────────────────────────────
  const stats = {
    total:    requests.length,
    pending:  requests.filter(r => r.status === 'Pending').length,
    approved: requests.filter(r => r.status === 'Approved').length,
    review:   requests.filter(r => r.status === 'Requires Manual Review').length,
  }

  const handleSort = (field) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortField(field); setSortDir('desc') }
  }

  const exportCsv = () => {
    const rows = [
      ['ID', 'Employee', 'Type', 'Start', 'End', 'Urgency', 'Status', 'AI Decision', 'Created'].join(','),
      ...filtered.map(r => [
        r.id,
        `"${r.profiles?.full_name ?? 'Unknown'}"`,
        r.request_type,
        r.start_date,
        r.end_date,
        r.urgency,
        r.status,
        r.ai_evaluation_json?.decision ?? 'Pending',
        r.created_at,
      ].join(','))
    ].join('\n')

    const blob = new Blob([rows], { type: 'text/csv' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `dayflow-requests-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">

      {/* ── Page header ──────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/20 border border-violet-500/30">
            <ShieldCheck className="h-5 w-5 text-violet-400" />
          </div>
          <div>
            <h1 className="section-heading">Admin Console</h1>
            <p className="section-subheading">All employee requests & AI evaluations</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {lastSync && (
            <span className="text-[11px] text-slate-600 hidden lg:block">
              Synced {lastSync.toLocaleTimeString()}
            </span>
          )}
          <button onClick={fetchAll} className="btn-ghost text-xs gap-1.5">
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </button>
          <button onClick={exportCsv} className="btn-brand-outline text-xs gap-1.5">
            <Download className="h-3.5 w-3.5" />
            Export CSV
          </button>
        </div>
      </div>

      {/* ── Error ─────────────────────────────────────────────────────────── */}
      {error && (
        <div className="flex items-start gap-3 rounded-xl bg-rose-500/12 border border-rose-500/25 p-4">
          <AlertCircle className="h-5 w-5 text-rose-400 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-rose-300">{error}</p>
        </div>
      )}

      {/* ── Stat cards ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total',    value: stats.total,    icon: Users,        c: 'text-brand-400',   bg: 'bg-brand-500/12'   },
          { label: 'Pending',  value: stats.pending,  icon: Clock,        c: 'text-amber-400',   bg: 'bg-amber-500/12'   },
          { label: 'Approved', value: stats.approved, icon: CheckCircle2, c: 'text-emerald-400', bg: 'bg-emerald-500/12' },
          { label: 'In Review',value: stats.review,   icon: Brain,        c: 'text-violet-400',  bg: 'bg-violet-500/12'  },
        ].map(s => (
          <div key={s.label} className="glass-card p-4 flex items-center gap-3">
            <div className={cn('flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl', s.bg)}>
              <s.icon className={cn('h-4 w-4', s.c)} />
            </div>
            <div>
              <p className="text-2xl font-display font-bold text-white">{s.value}</p>
              <p className="text-xs text-slate-500">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Filters & Search ──────────────────────────────────────────────── */}
      <div className="glass-card p-4 flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by employee, type, or justification…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="input-field pl-9 py-2.5"
            id="admin-search"
          />
        </div>

        {/* Status filter */}
        <div className="relative">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="input-field pr-8 py-2.5 appearance-none cursor-pointer min-w-[140px]"
            id="admin-status-filter"
          >
            {STATUS_FILTERS.map(s => <option key={s} value={s}>{s === 'All' ? 'All Statuses' : s}</option>)}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500 pointer-events-none" />
        </div>

        {/* Type filter */}
        <div className="relative">
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="input-field pr-8 py-2.5 appearance-none cursor-pointer min-w-[140px]"
            id="admin-type-filter"
          >
            {TYPE_FILTERS.map(t => <option key={t} value={t}>{t === 'All' ? 'All Types' : t}</option>)}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500 pointer-events-none" />
        </div>
      </div>

      {/* ── Table ─────────────────────────────────────────────────────────── */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <TableSkeleton />
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-slate-500">No requests match your filters.</p>
            </div>
          ) : (
            <table className="w-full text-sm" role="table">
              <thead>
                <tr className="border-b border-white/8 text-left">
                  {[
                    { label: 'Employee',   field: 'profiles.full_name' },
                    { label: 'Type',       field: 'request_type'       },
                    { label: 'Dates',      field: 'start_date'         },
                    { label: 'Duration',   field: null                 },
                    { label: 'Urgency',    field: 'urgency'            },
                    { label: 'Status',     field: 'status'             },
                    { label: 'AI Decision',field: null                 },
                    { label: 'Submitted',  field: 'created_at'         },
                    { label: '',           field: null                 },
                  ].map(col => (
                    <th
                      key={col.label}
                      className={cn(
                        'px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500',
                        col.field && 'cursor-pointer hover:text-slate-300 select-none'
                      )}
                      onClick={() => col.field && handleSort(col.field)}
                    >
                      <span className="flex items-center gap-1">
                        {col.label}
                        {col.field && (
                          <ArrowUpDown className={cn(
                            'h-3 w-3 transition-colors',
                            sortField === col.field ? 'text-brand-400' : 'text-slate-700'
                          )} />
                        )}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map(req => (
                  <AdminRow
                    key={req.id}
                    request={req}
                    onView={() => setSelectedRequest(req)}
                  />
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Table footer */}
        {!loading && filtered.length > 0 && (
          <div className="border-t border-white/8 px-4 py-3 flex items-center justify-between">
            <p className="text-xs text-slate-600">
              Showing <span className="text-slate-400 font-medium">{filtered.length}</span> of{' '}
              <span className="text-slate-400 font-medium">{requests.length}</span> requests
            </p>
          </div>
        )}
      </div>

      {/* Detail modal */}
      <RequestDetailModal
        request={selectedRequest}
        onClose={() => setSelectedRequest(null)}
      />
    </div>
  )
}

// ── Table Row ──────────────────────────────────────────────────────────────

function AdminRow({ request, onView }) {
  const name     = request.profiles?.full_name ?? 'Unknown'
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  const duration = daysBetween(request.start_date, request.end_date)
  const aiDecision = request.ai_evaluation_json?.decision

  const URGENCY_COLORS = {
    Low:    'text-emerald-400 bg-emerald-500/12 border-emerald-500/25',
    Medium: 'text-amber-400 bg-amber-500/12 border-amber-500/25',
    High:   'text-rose-400 bg-rose-500/12 border-rose-500/25',
  }

  return (
    <tr className="group hover:bg-white/3 transition-colors">
      {/* Employee */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 flex-shrink-0 rounded-lg bg-gradient-to-br from-brand-500 to-accent-violet flex items-center justify-center text-[10px] font-bold text-white">
            {initials}
          </div>
          <div>
            <p className="font-medium text-slate-200 text-xs whitespace-nowrap">{name}</p>
            <p className="text-[10px] text-slate-600">{request.profiles?.role ?? 'employee'}</p>
          </div>
        </div>
      </td>

      {/* Type */}
      <td className="px-4 py-3 whitespace-nowrap text-xs text-slate-300 font-medium">{request.request_type}</td>

      {/* Dates */}
      <td className="px-4 py-3 whitespace-nowrap text-xs text-slate-400">
        {formatDate(request.start_date)} → {formatDate(request.end_date)}
      </td>

      {/* Duration */}
      <td className="px-4 py-3 whitespace-nowrap text-xs text-slate-500">{duration}d</td>

      {/* Urgency */}
      <td className="px-4 py-3">
        <span className={cn(
          'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold border',
          URGENCY_COLORS[request.urgency] ?? ''
        )}>
          {request.urgency}
        </span>
      </td>

      {/* Status */}
      <td className="px-4 py-3"><StatusBadge status={request.status} size="sm" /></td>

      {/* AI Decision */}
      <td className="px-4 py-3">
        {aiDecision
          ? <span className={cn(
              'text-[10px] font-semibold',
              aiDecision === 'Approved' ? 'text-emerald-400' : 'text-amber-400'
            )}>{aiDecision}</span>
          : <span className="text-[10px] text-slate-600 italic">Pending…</span>
        }
      </td>

      {/* Created */}
      <td className="px-4 py-3 whitespace-nowrap text-xs text-slate-600">
        {formatTimestamp(request.created_at)}
      </td>

      {/* Actions */}
      <td className="px-4 py-3">
        <button
          onClick={onView}
          className="btn-ghost text-[11px] px-3 py-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          View
        </button>
      </td>
    </tr>
  )
}

// ── Skeleton ───────────────────────────────────────────────────────────────
function TableSkeleton() {
  return (
    <div className="divide-y divide-white/5">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-3">
          <div className="h-7 w-7 rounded-lg shimmer flex-shrink-0" />
          <div className="h-3 w-24 rounded shimmer" />
          <div className="h-3 w-20 rounded shimmer ml-8" />
          <div className="h-5 w-16 rounded-full shimmer ml-auto" />
        </div>
      ))}
    </div>
  )
}
