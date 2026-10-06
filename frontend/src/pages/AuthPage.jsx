import { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, Zap, ArrowRight, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { loginSchema, registerSchema } from '../schemas'
import { cn } from '../lib/utils'

/**
 * AuthForm page — handles both login and registration in a single
 * glassmorphism card with tab switching. Uses Supabase Auth.
 */
export default function AuthPage() {
  const [mode, setMode]         = useState('login')   // 'login' | 'register'
  const [showPass, setShowPass] = useState(false)
  const [serverError, setServerError] = useState('')
  const [successMsg, setSuccessMsg]   = useState('')

  const navigate  = useNavigate()
  const location  = useLocation()
  const from      = location.state?.from?.pathname ?? '/'

  // ── Login form ──────────────────────────────────────────────────────────────
  const loginForm = useForm({
    resolver:      zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  // ── Register form ───────────────────────────────────────────────────────────
  const registerForm = useForm({
    resolver:      zodResolver(registerSchema),
    defaultValues: { fullName: '', email: '', password: '', confirmPassword: '' },
  })

  const activeForm = mode === 'login' ? loginForm : registerForm
  const { formState: { isSubmitting } } = activeForm

  // ── Handlers ────────────────────────────────────────────────────────────────
  const onLogin = async ({ email, password }) => {
    setServerError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setServerError(error.message); return }
    navigate(from, { replace: true })
  }

  const onRegister = async ({ fullName, email, password }) => {
    setServerError('')
    setSuccessMsg('')

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        // Email confirmation redirect
        emailRedirectTo: `${window.location.origin}/`,
      },
    })

    if (error) { setServerError(error.message); return }

    // Create profile record (triggered also via DB function, but defensive here)
    if (data.user) {
      await supabase.from('profiles').upsert({
        id:        data.user.id,
        full_name: fullName,
        role:      'employee',
      })
    }

    setSuccessMsg('Account created! Please check your email to confirm your address, then log in.')
    setMode('login')
    registerForm.reset()
  }

  const handleTabSwitch = (newMode) => {
    setMode(newMode)
    setServerError('')
    setSuccessMsg('')
    loginForm.reset()
    registerForm.reset()
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4 relative overflow-hidden">

      {/* Background decoration */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-brand-600/20 blur-[120px]" />
        <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-accent-violet/20 blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-64 w-64 rounded-full bg-accent-cyan/8 blur-[80px]" />
      </div>

      <div className="relative w-full max-w-md animate-slide-up">

        {/* Logo header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-gradient-to-br from-brand-500 to-accent-violet shadow-glow mb-4">
            <Zap className="h-7 w-7 text-white" fill="currentColor" />
          </div>
          <h1 className="text-3xl font-display font-bold text-white tracking-tight">
            {mode === 'login' ? 'Welcome back' : 'Create account'}
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            {mode === 'login'
              ? 'Sign in to your Dayflow workspace'
              : 'Join Dayflow and streamline your HR workflow'
            }
          </p>
        </div>

        {/* Card */}
        <div className="glass-card border-white/12 p-8">

          {/* Tabs */}
          <div className="mb-6 flex rounded-xl bg-white/5 p-1 gap-1">
            {(['login', 'register'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => handleTabSwitch(tab)}
                className={cn(
                  'flex-1 rounded-lg py-2 text-sm font-medium transition-all duration-200',
                  mode === tab
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-300'
                )}
              >
                {tab === 'login' ? 'Sign In' : 'Register'}
              </button>
            ))}
          </div>

          {/* Success message */}
          {successMsg && (
            <div className="mb-5 flex items-start gap-3 rounded-xl bg-emerald-500/12 border border-emerald-500/25 p-4">
              <CheckCircle2 className="h-5 w-5 text-emerald-400 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-emerald-300">{successMsg}</p>
            </div>
          )}

          {/* Server error */}
          {serverError && (
            <div className="mb-5 flex items-start gap-3 rounded-xl bg-rose-500/12 border border-rose-500/25 p-4">
              <AlertCircle className="h-5 w-5 text-rose-400 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-rose-300">{serverError}</p>
            </div>
          )}

          {/* ── LOGIN FORM ── */}
          {mode === 'login' && (
            <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-5" noValidate>
              <FormField
                label="Email Address"
                error={loginForm.formState.errors.email?.message}
              >
                <input
                  {...loginForm.register('email')}
                  type="email"
                  id="login-email"
                  placeholder="you@company.com"
                  autoComplete="email"
                  className={loginForm.formState.errors.email ? 'input-field-error' : 'input-field'}
                />
              </FormField>

              <FormField
                label="Password"
                error={loginForm.formState.errors.password?.message}
              >
                <div className="relative">
                  <input
                    {...loginForm.register('password')}
                    type={showPass ? 'text' : 'password'}
                    id="login-password"
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className={cn(
                      loginForm.formState.errors.password ? 'input-field-error' : 'input-field',
                      'pr-10'
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                    aria-label={showPass ? 'Hide password' : 'Show password'}
                  >
                    {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </FormField>

              <button
                type="submit"
                disabled={isSubmitting}
                id="btn-login"
                className="btn-brand w-full"
              >
                {isSubmitting
                  ? <><Loader2 className="h-4 w-4 animate-spin" /> Signing in…</>
                  : <><ArrowRight className="h-4 w-4" /> Sign In</>
                }
              </button>
            </form>
          )}

          {/* ── REGISTER FORM ── */}
          {mode === 'register' && (
            <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-5" noValidate>
              <FormField
                label="Full Name"
                error={registerForm.formState.errors.fullName?.message}
              >
                <input
                  {...registerForm.register('fullName')}
                  type="text"
                  id="reg-fullname"
                  placeholder="Jane Smith"
                  autoComplete="name"
                  className={registerForm.formState.errors.fullName ? 'input-field-error' : 'input-field'}
                />
              </FormField>

              <FormField
                label="Email Address"
                error={registerForm.formState.errors.email?.message}
              >
                <input
                  {...registerForm.register('email')}
                  type="email"
                  id="reg-email"
                  placeholder="you@company.com"
                  autoComplete="email"
                  className={registerForm.formState.errors.email ? 'input-field-error' : 'input-field'}
                />
              </FormField>

              <FormField
                label="Password"
                error={registerForm.formState.errors.password?.message}
              >
                <div className="relative">
                  <input
                    {...registerForm.register('password')}
                    type={showPass ? 'text' : 'password'}
                    id="reg-password"
                    placeholder="Min 8 chars, 1 uppercase, 1 number"
                    autoComplete="new-password"
                    className={cn(
                      registerForm.formState.errors.password ? 'input-field-error' : 'input-field',
                      'pr-10'
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                    aria-label={showPass ? 'Hide password' : 'Show password'}
                  >
                    {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </FormField>

              <FormField
                label="Confirm Password"
                error={registerForm.formState.errors.confirmPassword?.message}
              >
                <input
                  {...registerForm.register('confirmPassword')}
                  type="password"
                  id="reg-confirm"
                  placeholder="Re-enter your password"
                  autoComplete="new-password"
                  className={registerForm.formState.errors.confirmPassword ? 'input-field-error' : 'input-field'}
                />
              </FormField>

              <button
                type="submit"
                disabled={isSubmitting}
                id="btn-register"
                className="btn-brand w-full"
              >
                {isSubmitting
                  ? <><Loader2 className="h-4 w-4 animate-spin" /> Creating account…</>
                  : <><ArrowRight className="h-4 w-4" /> Create Account</>
                }
              </button>
            </form>
          )}

          {/* Footer note */}
          <p className="mt-6 text-center text-xs text-slate-600">
            By using Dayflow you agree to our{' '}
            <span className="text-brand-400 cursor-pointer hover:underline">Terms of Service</span>{' '}
            and{' '}
            <span className="text-brand-400 cursor-pointer hover:underline">Privacy Policy</span>.
          </p>
        </div>
      </div>
    </div>
  )
}

// ── Helper sub-component ───────────────────────────────────────────────────

function FormField({ label, error, children }) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
      {error && (
        <p className="mt-1.5 flex items-center gap-1.5 text-xs text-rose-400">
          <AlertCircle className="h-3 w-3 flex-shrink-0" />
          {error}
        </p>
      )}
    </div>
  )
}
