import { createClient } from '@supabase/supabase-js'

/**
 * Supabase browser client.
 * Keys are injected at build-time from Vite environment variables.
 * NEVER expose SUPABASE_SERVICE_ROLE_KEY here — that lives only in n8n/Edge Functions.
 */
const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL
const supabaseAnon = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnon) {
  throw new Error(
    '[Dayflow] Missing Supabase environment variables.\n' +
    'Please copy .env.example → .env and fill in your project credentials.'
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnon, {
  auth: {
    // Persist session across page refreshes using localStorage
    persistSession:    true,
    autoRefreshToken:  true,
    detectSessionInUrl: true,
  },
  realtime: {
    // Enable real-time subscriptions for request status updates
    params: { eventsPerSecond: 10 },
  },
})
