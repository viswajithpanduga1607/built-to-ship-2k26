import { useState } from 'react'
import {
  Eye, Palmtree, Stethoscope, Laptop, Monitor,
  CalendarDays, ArrowRight, Clock, Inbox
} from 'lucide-react'
import { StatusBadge } from './StatusBadge'
import { RequestDetailModal } from './RequestDetailModal'
import { formatDate, daysBetween, formatTimestamp, URGENCY_CONFIG } from '../../lib/utils'
import { cn } from '../../lib/utils'

const TYPE_ICONS = {
  'PTO':         { icon: Palmtree,     color: 'text-cyan-400',   bg: 'bg-cyan-400/12 border-cyan-400/20' },
  'Sick Leave':  { icon: Stethoscope,  color: 'text-rose-400',   bg: 'bg-rose-400/12 border-rose-400/20' },
  'Remote Work': { icon: Laptop,       color: 'text-violet-400', bg: 'bg-violet-400/12 border-violet-400/20' },
  'Equipment':   { icon: Monitor,      color: 'text-amber-400',  bg: 'bg-amber-400/12 border-amber-400/20' },
}

/**
 * DashboardGrid
 * Responsive grid of request cards with detail modal trigger.
 *
 * @param {{ requests: object[], loading: boolean, emptyMessage?: string }} props
 */
export function DashboardGrid({ requests, loading, emptyMessage = 'No requests found.' }) {
  const [selectedRequest, setSelectedRequest] = useState(null)

  if (loading) return <GridSkeleton />

  if (!requests?.length) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/4 border border-white/8">
          <Inbox className="h-7 w-7 text-slate-600" />
        </div>
        <div>
          <p className="text-slate-400 font-medium">{emptyMessage}</p>
          <p className="text-slate-600 text-sm mt-1">Requests you submit will appear here.</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {requests.map(req => (
          <RequestCard
            key={req.id}
            request={req}
            onClick={() => setSelectedRequest(req)}
          />
        ))}
      </div>

      <RequestDetailModal
        request={selectedRequest}
        onClose={() => setSelectedRequest(null)}
      />
    </>
  )
}

// ── Request Card ───────────────────────────────────────────────────────────

function RequestCard({ request, onClick }) {
  const typeCfg    = TYPE_ICONS[request.request_type] ?? TYPE_ICONS['PTO']
  const urgencyCfg = URGENCY_CONFIG[request.urgency]  ?? URGENCY_CONFIG['Medium']
  const TypeIcon   = typeCfg.icon
  const duration   = daysBetween(request.start_date, request.end_date)
  const hasAi      = !!request.ai_evaluation_json

  return (
    <button
      onClick={onClick}
      className={cn(
        'glass-card-hover group w-full text-left p-5 transition-all duration-300',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50'
      )}
      aria-label={`View ${request.request_type} request details`}
    >
      {/* Card Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className={cn('flex h-9 w-9 items-center justify-center rounded-xl border flex-shrink-0', typeCfg.bg)}>
          <TypeIcon className={cn('h-4.5 w-4.5', typeCfg.color)} size={18} />
        </div>
        <StatusBadge status={request.status} size="sm" />
      </div>

      {/* Title */}
      <h3 className="text-sm font-semibold text-white group-hover:text-brand-300 transition-colors mb-1">
        {request.request_type}
      </h3>

      {/* Date range */}
      <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-3">
        <CalendarDays className="h-3.5 w-3.5 flex-shrink-0" />
        <span>{formatDate(request.start_date)}</span>
        <ArrowRight className="h-3 w-3 flex-shrink-0" />
        <span>{formatDate(request.end_date)}</span>
        <span className="ml-auto text-slate-600">{duration}d</span>
      </div>

      {/* Justification preview */}
      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-4">
        {request.justification}
      </p>

      {/* Footer */}
      <div className="flex items-center justify-between">
        {/* Urgency */}
        <span className={cn(
          'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold border',
          urgencyCfg.bg, urgencyCfg.color
        )}>
          <span className={cn('h-1 w-1 rounded-full', urgencyCfg.dot)} />
          {request.urgency}
        </span>

        {/* AI indicator or timestamp */}
        <span className="flex items-center gap-1 text-[10px] text-slate-600">
          {hasAi
            ? <span className="text-brand-400/70 font-medium">AI evaluated</span>
            : <><Clock className="h-3 w-3" />{formatTimestamp(request.created_at)}</>
          }
          <Eye className="h-3 w-3 text-slate-600 group-hover:text-slate-400 transition-colors ml-0.5" />
        </span>
      </div>
    </button>
  )
}

// ── Loading Skeleton ───────────────────────────────────────────────────────

function GridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="glass-card p-5 space-y-3">
          <div className="flex items-start justify-between">
            <div className="h-9 w-9 rounded-xl shimmer" />
            <div className="h-5 w-16 rounded-full shimmer" />
          </div>
          <div className="h-4 w-1/2 rounded shimmer" />
          <div className="h-3 w-3/4 rounded shimmer" />
          <div className="h-8 w-full rounded-lg shimmer" />
          <div className="flex justify-between">
            <div className="h-4 w-16 rounded-full shimmer" />
            <div className="h-4 w-20 rounded shimmer" />
          </div>
        </div>
      ))}
    </div>
  )
}
