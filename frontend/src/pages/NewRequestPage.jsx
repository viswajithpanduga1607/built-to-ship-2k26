import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Palmtree, Stethoscope, Laptop, Monitor, CalendarDays,
  AlertTriangle, FileText, Zap, Loader2, CheckCircle2,
  AlertCircle, ArrowLeft, Send, Info
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { requestInputSchema } from '../schemas'
import { cn, URGENCY_CONFIG } from '../lib/utils'

// ── Config maps ────────────────────────────────────────────────────────────
const REQUEST_TYPE_OPTIONS = [
  { value: 'PTO',         label: 'PTO',         description: 'Paid time off / vacation',       icon: Palmtree,    color: 'cyan'   },
  { value: 'Sick Leave',  label: 'Sick Leave',  description: 'Medical or health-related leave', icon: Stethoscope, color: 'rose'   },
  { value: 'Remote Work', label: 'Remote Work', description: 'Work-from-home arrangement',      icon: Laptop,      color: 'violet' },
  { value: 'Equipment',   label: 'Equipment',   description: 'Hardware or software request',    icon: Monitor,     color: 'amber'  },
]

const COLOR_MAP = {
  cyan:   { bg: 'bg-cyan-400/10',   border: 'border-cyan-400/30',   text: 'text-cyan-400',   ring: 'ring-cyan-400/30'   },
  rose:   { bg: 'bg-rose-400/10',   border: 'border-rose-400/30',   text: 'text-rose-400',   ring: 'ring-rose-400/30'   },
  violet: { bg: 'bg-violet-400/10', border: 'border-violet-400/30', text: 'text-violet-400', ring: 'ring-violet-400/30' },
  amber:  { bg: 'bg-amber-400/10',  border: 'border-amber-400/30',  text: 'text-amber-400',  ring: 'ring-amber-400/30'  },
}

const URGENCY_OPTIONS = [
  { value: 'Low',    description: 'No immediate urgency',    dot: 'bg-emerald-400' },
  { value: 'Medium', description: 'Needed within a week',   dot: 'bg-amber-400'   },
  { value: 'High',   description: 'Immediately time-sensitive', dot: 'bg-rose-400' },
]

/**
 * NewRequestPage — /new-request
 * Multi-step form with Zod validation + Supabase insert.
 * On submit, the DB webhook fires the n8n pipeline automatically.
 */
export default function NewRequestPage() {
  const { user } = useAuth()
  const navigate  = useNavigate()
  const [submitState, setSubmitState] = useState('idle') // 'idle'|'loading'|'success'|'error'
  const [errorMsg,    setErrorMsg]    = useState('')

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver:      zodResolver(requestInputSchema),
    defaultValues: {
      requestType:   '',
      startDate:     '',
      endDate:       '',
      justification: '',
      urgency:       '',
    },
  })

  const watchedType = watch('requestType')
  const watchedJust = watch('justification')

  // ── Submit handler ─────────────────────────────────────────────────────────
  const onSubmit = async (data) => {
    setSubmitState('loading')
    setErrorMsg('')

    const payload = {
      user_id:       user.id,
      request_type:  data.requestType,
      start_date:    data.startDate,
      end_date:      data.endDate,
      justification: data.justification,
      urgency:       data.urgency,
      status:        'Pending',
    }

    const { error } = await supabase
      .from('employee_requests')
      .insert(payload)

    if (error) {
      console.error('[Dayflow] Insert error:', error)
      setErrorMsg(error.message ?? 'Something went wrong. Please try again.')
      setSubmitState('error')
      return
    }

    setSubmitState('success')
    // Redirect to dashboard after a brief success flash
    setTimeout(() => navigate('/'), 2200)
  }

  // ── Success screen ─────────────────────────────────────────────────────────
  if (submitState === 'success') {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="text-center max-w-sm mx-auto animate-slide-up">
          <div className="relative inline-flex mb-6">
            <div className="h-20 w-20 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
              <CheckCircle2 className="h-10 w-10 text-emerald-400" />
            </div>
            <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-brand-500 border-2 border-surface flex items-center justify-center">
              <Zap className="h-3 w-3 text-white" fill="currentColor" />
            </div>
          </div>
          <h2 className="text-2xl font-display font-bold text-white mb-2">Request Submitted!</h2>
          <p className="text-slate-400 text-sm leading-relaxed mb-6">
            Your request is now in the AI pipeline. Gemini is analyzing it based on company policy.
            You'll see the evaluation on your dashboard in moments.
          </p>
          <div className="flex items-center justify-center gap-2 text-xs text-brand-400">
            <Zap className="h-3.5 w-3.5 animate-pulse" fill="currentColor" />
            <span>Redirecting to dashboard…</span>
          </div>
        </div>
      </div>
    )
  }

  // ── Today's date string for min attribute ──────────────────────────────────
  const todayStr = new Date().toISOString().split('T')[0]

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">

      {/* Page header */}
      <div className="mb-8">
        <button
          onClick={() => navigate(-1)}
          className="btn-ghost mb-4 text-xs gap-1.5"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back
        </button>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/20 border border-brand-500/30">
            <Send className="h-5 w-5 text-brand-400" />
          </div>
          <div>
            <h1 className="section-heading">New Request</h1>
            <p className="section-subheading">Submit a time-off or resource request for AI evaluation</p>
          </div>
        </div>
      </div>

      {/* AI pipeline info banner */}
      <div className="mb-6 flex items-start gap-3 rounded-xl border border-brand-500/20 bg-brand-500/8 p-4">
        <Info className="h-4 w-4 text-brand-400 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-slate-400 leading-relaxed">
          <span className="font-semibold text-brand-300">Powered by Gemini AI.</span>{' '}
          Once submitted, your request is automatically routed through the n8n workflow, evaluated by Gemini,
          and the result is emailed to you. Approved PTO is added to Google Calendar.
        </p>
      </div>

      {/* Error banner */}
      {submitState === 'error' && (
        <div className="mb-6 flex items-start gap-3 rounded-xl bg-rose-500/12 border border-rose-500/25 p-4">
          <AlertCircle className="h-5 w-5 text-rose-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-rose-300 mb-0.5">Submission failed</p>
            <p className="text-xs text-rose-400/80">{errorMsg}</p>
          </div>
        </div>
      )}

      {/* Form card */}
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">

        {/* ── 1. Request Type ─────────────────────────────────────────── */}
        <div className="glass-card p-6">
          <label className="label mb-4">Request Type</label>
          <Controller
            name="requestType"
            control={control}
            render={({ field }) => (
              <div className="grid grid-cols-2 gap-3">
                {REQUEST_TYPE_OPTIONS.map(opt => {
                  const Icon    = opt.icon
                  const colors  = COLOR_MAP[opt.color]
                  const active  = field.value === opt.value
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => field.onChange(opt.value)}
                      className={cn(
                        'flex items-start gap-3 rounded-xl border p-4 text-left transition-all duration-200',
                        active
                          ? cn('border-opacity-60 ring-1', colors.bg, colors.border, colors.ring)
                          : 'border-white/10 bg-white/3 hover:bg-white/6 hover:border-white/20'
                      )}
                    >
                      <div className={cn(
                        'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg',
                        active ? colors.bg : 'bg-white/8'
                      )}>
                        <Icon className={cn('h-4 w-4', active ? colors.text : 'text-slate-500')} />
                      </div>
                      <div>
                        <p className={cn('text-sm font-semibold', active ? 'text-white' : 'text-slate-400')}>
                          {opt.label}
                        </p>
                        <p className="text-[11px] text-slate-600 mt-0.5">{opt.description}</p>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          />
          {errors.requestType && <FieldError msg={errors.requestType.message} />}
        </div>

        {/* ── 2. Dates ────────────────────────────────────────────────── */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <CalendarDays className="h-4 w-4 text-slate-500" />
            <label className="label mb-0">Date Range</label>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label" htmlFor="startDate">Start Date</label>
              <input
                {...register('startDate')}
                type="date"
                id="startDate"
                min={todayStr}
                className={errors.startDate ? 'input-field-error' : 'input-field'}
              />
              {errors.startDate && <FieldError msg={errors.startDate.message} />}
            </div>
            <div>
              <label className="label" htmlFor="endDate">End Date</label>
              <input
                {...register('endDate')}
                type="date"
                id="endDate"
                min={todayStr}
                className={errors.endDate ? 'input-field-error' : 'input-field'}
              />
              {errors.endDate && <FieldError msg={errors.endDate.message} />}
            </div>
          </div>
        </div>

        {/* ── 3. Urgency ──────────────────────────────────────────────── */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="h-4 w-4 text-slate-500" />
            <label className="label mb-0">Urgency Level</label>
          </div>
          <Controller
            name="urgency"
            control={control}
            render={({ field }) => (
              <div className="flex flex-col sm:flex-row gap-3">
                {URGENCY_OPTIONS.map(opt => {
                  const cfg    = URGENCY_CONFIG[opt.value]
                  const active = field.value === opt.value
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => field.onChange(opt.value)}
                      className={cn(
                        'flex flex-1 items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all duration-200',
                        active
                          ? cn('border-opacity-50', cfg.bg, cfg.color)
                          : 'border-white/10 bg-white/3 hover:bg-white/6'
                      )}
                    >
                      <span className={cn('h-2.5 w-2.5 rounded-full flex-shrink-0', opt.dot)} />
                      <div>
                        <p className={cn('text-sm font-semibold', active ? cfg.color : 'text-slate-400')}>
                          {opt.value}
                        </p>
                        <p className="text-[11px] text-slate-600">{opt.description}</p>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          />
          {errors.urgency && <FieldError msg={errors.urgency.message} />}
        </div>

        {/* ── 4. Justification ─────────────────────────────────────────── */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="h-4 w-4 text-slate-500" />
            <label className="label mb-0" htmlFor="justification">
              Justification
            </label>
            <span className="ml-auto text-[11px] text-slate-600">
              {watchedJust?.length ?? 0}/1000
            </span>
          </div>
          <textarea
            {...register('justification')}
            id="justification"
            rows={5}
            placeholder="Describe the reason for your request in detail. The AI uses this to make its evaluation — more context leads to better decisions."
            className={cn(
              errors.justification ? 'input-field-error' : 'input-field',
              'resize-none leading-relaxed'
            )}
          />
          {errors.justification && <FieldError msg={errors.justification.message} />}

          {/* Tip when a type is selected */}
          {watchedType === 'Sick Leave' && (
            <p className="mt-2 text-[11px] text-slate-600 flex items-center gap-1.5">
              <Info className="h-3 w-3" />
              Tip: For sick leave, a brief description of symptoms or recovery plan helps the AI evaluate appropriately.
            </p>
          )}
        </div>

        {/* ── Submit ──────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row gap-3 pb-4">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="btn-brand-outline flex-1"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || submitState === 'loading'}
            id="btn-submit-request"
            className="btn-brand flex-[2]"
          >
            {(isSubmitting || submitState === 'loading')
              ? <><Loader2 className="h-4 w-4 animate-spin" /> Submitting to AI Pipeline…</>
              : <><Zap className="h-4 w-4" fill="currentColor" /> Submit Request</>
            }
          </button>
        </div>
      </form>
    </div>
  )
}

// ── Helpers ────────────────────────────────────────────────────────────────
function FieldError({ msg }) {
  return (
    <p className="mt-1.5 flex items-center gap-1.5 text-xs text-rose-400">
      <AlertCircle className="h-3 w-3 flex-shrink-0" />
      {msg}
    </p>
  )
}
