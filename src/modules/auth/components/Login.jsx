import React, { useEffect, useState } from 'react';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/supabaseClient';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthContext } from './AuthProvider';
import * as Sentry from '@sentry/browser';

const Login = () => {
  const { user, loading } = useAuthContext();
  const navigate = useNavigate();
  const location = useLocation();
  const [authError, setAuthError] = useState(null);
  const from = location.state?.from?.pathname || '/dashboard';
  
  useEffect(() => {
    console.log('Login component: user state changed', { 
      user: user ? 'exists' : 'null', 
      loading, 
      from 
    });
    
    if (user && !loading) {
      console.log('User is authenticated, navigating to:', from);
      navigate(from, { replace: true });
    }
  }, [user, loading, navigate, from]);

  // If still loading, show a loading spinner
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Mechanic Job Sheets</h2>
          <p className="text-gray-600">Sign in with ZAPT</p>
          <div className="mt-2">
            <a 
              href="https://www.zapt.ai" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary-600 hover:underline text-sm"
            >
              Powered by ZAPT
            </a>
          </div>
        </div>
        
        {authError && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
            Authentication error: {authError}
          </div>
        )}
        
        <Auth
          supabaseClient={supabase}
          appearance={{ 
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: '#0284c7',
                  brandAccent: '#0369a1'
                }
              }
            }
          }}
          theme="light"
          providers={['google', 'facebook', 'apple']}
          magicLink={true}
          view="magic_link"
          onError={(error) => {
            console.error('Auth error:', error);
            setAuthError(error.message);
            Sentry.captureException(error);
          }}
        />
      </div>
    </div>
  );
};

export default Login;