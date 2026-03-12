// Supabase client disabled - Migration to PostgreSQL complete
// This file is kept for reference but the client is not initialized
// to prevent WebSocket connection attempts

// DO NOT import createClient here
// Export null to prevent any Supabase client initialization
export const supabase = null;

// Prevent any accidental initialization
if (typeof window !== 'undefined') {
  window.__SUPABASE_CLIENT_DISABLED__ = true;
}
