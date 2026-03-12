// Supabase client disabled - Migration to PostgreSQL complete
// This file prevents any Supabase client initialization to stop WebSocket connections

// DO NOT import createClient here - this prevents WebSocket connections
// Even if environment variables are set, we prevent initialization

// Override environment variables to prevent Supabase from initializing
if (typeof window !== 'undefined') {
  // Clear any Supabase-related environment variables from being accessed
  const originalEnv = (window as any).__ENV__;
  if (originalEnv) {
    delete originalEnv.VITE_SUPABASE_URL;
    delete originalEnv.VITE_SUPABASE_PUBLISHABLE_KEY;
  }
  
  // Set a flag to prevent Supabase initialization
  (window as any).__SUPABASE_CLIENT_DISABLED__ = true;
}

// Export null - this prevents any Supabase client from being created
// If code tries to use supabase, it will get null and fail gracefully
export const supabase = null as any;

// Prevent module from being re-evaluated with createClient
Object.freeze(exports);
