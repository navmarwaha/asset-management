import React from 'react';
import api, { setAuthToken, removeAuthToken } from '@/lib/api-client';

interface User {
  id: string;
  email: string;
  role?: string;
  department?: string;
  account_type?: string;
}

interface AuthContextType {
  user: User | null;
  session: { token: string } | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = React.createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signInWithGoogle: async () => {},
  signOut: async () => {},
  refreshUser: async () => {},
});

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = React.useState<User | null>(null);
  const [session, setSession] = React.useState<{ token: string } | null>(null);
  const [loading, setLoading] = React.useState(true);

  // Check for token in URL (from OAuth callback)
  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    
    if (token) {
      setAuthToken(token);
      setSession({ token });
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
      // Fetch user info
      fetchUser();
    } else {
      // Check for existing token in localStorage
      const existingToken = localStorage.getItem('auth_token');
      if (existingToken) {
        setSession({ token: existingToken });
        fetchUser();
      } else {
        setLoading(false);
      }
    }
  }, []);

  const fetchUser = async () => {
    try {
      const response = await api.auth.getMe();
      setUser(response.user);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching user:', error);
      // Token might be invalid, clear it
      removeAuthToken();
      setSession(null);
      setUser(null);
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    // Redirect to backend OAuth endpoint
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    window.location.href = `${API_URL}/api/auth/google`;
  };

  const signOut = async () => {
    try {
      await api.auth.logout();
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      removeAuthToken();
      setSession(null);
      setUser(null);
    }
  };

  const refreshUser = async () => {
    await fetchUser();
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      loading,
      signInWithGoogle,
      signOut,
      refreshUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
};