import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import {
  X, Brain, CheckCircle2, XCircle, Calendar, MessageSquareQuote,
  Sparkles, Clock, Palmtree, Stethoscope, Laptop, Monitor
} from 'lucide-react'
import { StatusBadge } from './StatusBadge'
import { formatDate, daysBetween, formatTimestamp, URGENCY_CONFIG } from '../../lib/utils'
import { cn } from '../../lib/utils'

const TYPE_ICONS = {
  'PTO':         Palmtree,
  'Sick Leave':  Stethoscope,
  'Remote Work': Laptop,
  'Equipment':   Monitor,
}

/**
 * RequestDetailModal
 * Full breakdown of a request including AI evaluation JSON.
 * Rendered into a portal for proper z-index stacking.
 *
 * @param {{ request: object|null, onClose: () => void }} props
 */
export function RequestDetailModal({ request, onClose }) {
  const overlayRef = useRef(null)

  // Close on Escape key
  useEffect(() => {
    if (!request) return
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [request, onClose])

  // Lock body scroll while open
  useEffect(() => {
    if (request) document.body.style.overflow = 'hidden'
    else         document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [request])

  if (!request) return null

  const aiEval     = request.ai_evaluation_json
  const TypeIcon   = TYPE_ICONS[request.request_type] ?? Clock
  const urgencyCfg = URGENCY_CONFIG[request.urgency] ?? URGENCY_CONFIG['Medium']
  const duration   = daysBetween(request.start_date, request.end_date)

  const handleBackdropClick = (e) => {
    if (e.target === overlayRef.current) onClose()
  }

  return createPortal(
    <div
      ref={overlayRef}
      className="modal-backdrop animate-fade-in"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="glass-card relative w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-slide-up border-white/15">

        {/* Header */}
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 p-6 pb-4 bg-surface-2/80 backdrop-blur-sm border-b border-white/8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/20 border border-brand-500/30">
              <TypeIcon className="h-5 w-5 text-brand-400" />
            </div>
            <div>
              <h2 id="modal-title" className="text-lg font-display font-bold text-white">
                {request.request_type} Request
              </h2>
              <p className="text-xs text-slate-500">
                Submitted {formatTimestamp(request.created_at)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={request.status} />
            <button
              onClick={onClose}
              className="btn-ghost rounded-lg p-1.5"
              aria-label="Close modal"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">

          {/* Request Details Grid */}
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
              Request Details
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <DetailCell label="Start Date"  value={formatDate(request.start_date)} />
              <DetailCell label="End Date"    value={formatDate(request.end_date)} />
              <DetailCell label="Duration"    value={`${duration} day${duration !== 1 ? 's' : ''}`} />
              <DetailCell
                label="Urgency"
                value={
                  <span className={cn(
                    'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-semibold border',
                    urgencyCfg.bg, urgencyCfg.color
                  )}>
                    <span className={cn('h-1.5 w-1.5 rounded-full', urgencyCfg.dot)} />
                    {request.urgency}
                  </span>
                }
              />
            </div>
          </section>

          {/* Justification */}
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
              Justification
            </h3>
            <div className="rounded-xl bg-white/4 border border-white/8 p-4">
              <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                {request.justification}
              </p>
            </div>
          </section>

          {/* AI Evaluation Panel */}
          {aiEval ? (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <Brain className="h-4 w-4 text-brand-400" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  AI Evaluation
                </h3>
                <span className="ml-auto text-[10px] font-medium text-brand-400/70 bg-brand-500/10 border border-brand-500/20 rounded-full px-2 py-0.5">
                  Powered by Gemini
                </span>
              </div>

              <div className="rounded-xl border border-white/10 bg-gradient-to-br from-brand-950/50 to-surface-2 divide-y divide-white/8 overflow-hidden">

                {/* Decision */}
                <div className="flex items-start gap-3 p-4">
                  {aiEval.decision === 'Approved'
                    ? <CheckCircle2 className="h-5 w-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                    : <XCircle      className="h-5 w-5 text-amber-400   mt-0.5 flex-shrink-0" />
                  }
                  <div>
                    <p className="text-xs text-slate-500 font-medium mb-1">Decision</p>
                    <p className={cn(
                      'text-sm font-semibold',
                      aiEval.decision === 'Approved' ? 'text-emerald-400' : 'text-amber-400'
                    )}>
                      {aiEval.decision}
                    </p>
                  </div>
                </div>

                {/* Reasoning */}
                <div className="flex items-start gap-3 p-4">
                  <Sparkles className="h-5 w-5 text-brand-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-slate-500 font-medium mb-1">Reasoning</p>
                    <p className="text-sm text-slate-300 leading-relaxed">{aiEval.reasoning}</p>
                  </div>
                </div>

                {/* Sentiment */}
                <div className="flex items-start gap-3 p-4">
                  <MessageSquareQuote className="h-5 w-5 text-violet-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-slate-500 font-medium mb-1">Sentiment Analysis</p>
                    <p className="text-sm text-slate-300 leading-relaxed">{aiEval.sentimentAnalysis}</p>
                  </div>
                </div>

                {/* Calendar Event */}
                <div className="flex items-start gap-3 p-4">
                  <Calendar className="h-5 w-5 text-cyan-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-slate-500 font-medium mb-1">Calendar Event</p>
                    <p className="text-sm text-slate-300">
                      {aiEval.calendarEventRequired
                        ? '✓ Calendar event scheduled in Google Calendar'
                        : '✗ No calendar event required'
                      }
                    </p>
                  </div>
                </div>
              </div>
            </section>
          ) : (
            /* Pending AI evaluation state */
            <section>
              <div className="flex items-center gap-3 rounded-xl border border-amber-500/20 bg-amber-500/8 p-4">
                <div className="relative">
                  <Brain className="h-5 w-5 text-amber-400" />
                  <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-amber-400 animate-ping" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-amber-300">AI Evaluation Pending</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Gemini is analyzing your request. This usually takes under 30 seconds.
                  </p>
                </div>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}

// ── Sub-component ──────────────────────────────────────────────────────────

function DetailCell({ label, value }) {
  return (
    <div className="rounded-xl bg-white/4 border border-white/8 p-3">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">{label}</p>
      {typeof value === 'string'
        ? <p className="text-sm font-medium text-slate-200">{value}</p>
        : value
      }
    </div>
  )
}
