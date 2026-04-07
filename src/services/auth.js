// Authentication service for desktop app
import { supabase, isSupabaseConfigured } from './supabase';

// Sign up with email
export const signUp = async (email, password) => {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase is not configured');
  }

  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  return data;
};

// Sign in with email
export const signIn = async (email, password) => {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase is not configured');
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
};

// Sign out
export const signOut = async () => {
  if (!isSupabaseConfigured()) return;
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

// Get current session
export const getSession = async () => {
  if (!isSupabaseConfigured()) return null;
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) throw error;
  return session;
};

// Get current user
export const getUser = async () => {
  if (!isSupabaseConfigured()) return null;
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  return user;
};

// Reset password
export const resetPassword = async (email) => {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase is not configured');
  }
  const { error } = await supabase.auth.resetPasswordForEmail(email);
  if (error) throw error;
};

// Listen for auth state changes — returns a no-op subscription when unconfigured
export const onAuthStateChange = (callback) => {
  if (!isSupabaseConfigured()) {
    return { unsubscribe: () => {} };
  }
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (_event, session) => { callback(session); }
  );
  return subscription;
};
