// Supabase client configuration for desktop app
import { createClient } from '@supabase/supabase-js';

// TODO: Replace with your Supabase project credentials
// Get these from: https://app.supabase.com/project/_/settings/api
const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';

// Check if Supabase is configured with real credentials
export const isSupabaseConfigured = () => {
  return SUPABASE_URL !== 'YOUR_SUPABASE_URL' &&
         SUPABASE_ANON_KEY !== 'YOUR_SUPABASE_ANON_KEY' &&
         SUPABASE_URL.startsWith('http');
};

// Storage adapter for Electron (uses localStorage in renderer)
const storage = {
  getItem: (key) => {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem(key);
    }
    return null;
  },
  setItem: (key, value) => {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, value);
    }
  },
  removeItem: (key) => {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(key);
    }
  },
};

// Only create the Supabase client if credentials are configured.
// When not configured, supabase is null and all callers must guard with
// isSupabaseConfigured() before using it — the app runs in local-only mode.
export const supabase = isSupabaseConfigured()
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        storage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    })
  : null;
