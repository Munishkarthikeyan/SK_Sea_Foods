import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseAnonKey) {
  // eslint-disable-next-line no-console
  console.warn(
    'Missing Supabase env vars. Copy .env.example to .env and fill in your project URL and anon key.'
  )
}

// createClient() throws immediately if the URL is empty/invalid, which would crash
// the whole app at import time (blank white page) before React even renders.
// Fall back to a placeholder so the app still loads and shows the normal
// "Couldn't load products" / error states instead of a hard crash.
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key'
)