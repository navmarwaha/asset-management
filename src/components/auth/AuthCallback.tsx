import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export const AuthCallback = () => {
  const { user, loading, session } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if there's an error in the URL
    const errorParam = searchParams.get('error');
    if (errorParam) {
      setError(errorParam);
      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 3000);
      return;
    }

    // Wait for loading to complete
    if (!loading) {
      // Give it a moment to ensure user state is updated
      const timer = setTimeout(() => {
        if (user) {
          // User successfully authenticated, redirect to home
          navigate('/', { replace: true });
        } else if (session) {
          // We have a session but no user - wait a bit more
          // This might be a race condition
        } else {
          // No session and no user - authentication failed
          navigate('/login', { replace: true });
        }
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [user, loading, session, navigate, searchParams]);

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">Authentication failed: {error}</p>
          <p className="text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  // Show loading state while processing authentication
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
        <p className="mt-4 text-gray-600">Completing authentication...</p>
      </div>
    </div>
  );
};
