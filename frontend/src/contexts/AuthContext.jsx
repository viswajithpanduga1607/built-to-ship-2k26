import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

/**
 * AuthContext provides the authenticated user, their profile (from `profiles` table),
 * loading state, and auth helpers (signOut) to the entire component tree.
 */
const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession]   = useState(null)
  const [profile, setProfile]   = useState(null)
  const [loading, setLoading]   = useState(true)

  // ── Fetch extended profile from the `profiles` table ──────────────────────
  const fetchProfile = useCallback(async (userId) => {
    if (!userId) { setProfile(null); return }
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    if (!error) setProfile(data)
    else        console.warn('[Dayflow] Could not load profile:', error.message)
  }, [])

  // ── Subscribe to auth state changes ───────────────────────────────────────
  useEffect(() => {
    // 1. Get current session immediately (avoids flash of unauthenticated content)
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      fetchProfile(session?.user?.id).finally(() => setLoading(false))
    })

    // 2. Listen for future auth events
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session)
        await fetchProfile(session?.user?.id)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [fetchProfile])

  // ── Sign-out ───────────────────────────────────────────────────────────────
  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    setSession(null)
    setProfile(null)
  }, [])

  const value = {
    session,
    user:    session?.user ?? null,
    profile,
    loading,
    signOut,
    isAdmin: profile?.role === 'admin',
    /** Refresh profile data (e.g., after a role update) */
    refreshProfile: () => fetchProfile(session?.user?.id),
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

/**
 * Hook to access auth context anywhere in the tree.
 * Throws if used outside <AuthProvider>.
 */
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an <AuthProvider>')
  return ctx
}
