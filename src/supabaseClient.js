import { initializeZapt } from '@zapt/zapt-js';
import * as Sentry from '@sentry/browser';

console.log('Initializing supabase client with app ID:', import.meta.env.VITE_PUBLIC_APP_ID);

// Declare variables at the top level
let supabase;
let recordLogin;

try {
  const zapt = initializeZapt(import.meta.env.VITE_PUBLIC_APP_ID);
  if (!zapt) {
    throw new Error('Failed to initialize ZAPT - initializeZapt returned empty value');
  }
  
  supabase = zapt.supabase;
  recordLogin = zapt.recordLogin;
  
  if (!supabase) {
    throw new Error('Supabase client not available from ZAPT initialization');
  }
  
  // Test the supabase connection to catch any early issues
  supabase.auth.getSession()
    .then(({ data, error }) => {
      if (error) {
        console.error('Supabase session test failed:', error);
        Sentry.captureException(error);
      } else {
        console.log('Supabase connection verified:', data.session ? 'User has session' : 'No session');
      }
    })
    .catch((error) => {
      console.error('Unexpected error testing Supabase connection:', error);
      Sentry.captureException(error);
    });
} catch (error) {
  console.error('Failed to initialize ZAPT/Supabase:', error);
  Sentry.captureException(error);
  // Provide fallback to prevent app from crashing
  const mockRecordLogin = async (email, env) => {
    console.error('Using mock recordLogin because initialization failed');
  };
  // Export a dummy client that will show a clear error
  supabase = {
    auth: {
      getSession: async () => {
        const error = new Error('Supabase client failed to initialize');
        console.error(error);
        return { data: { session: null }, error };
      },
      getUser: async () => {
        const error = new Error('Supabase client failed to initialize');
        console.error(error);
        return { data: { user: null }, error };
      },
      onAuthStateChange: () => {
        console.error('Supabase client failed to initialize');
        return { data: { subscription: { unsubscribe: () => {} } } };
      },
      signOut: async () => {
        const error = new Error('Supabase client failed to initialize');
        console.error(error);
        return { error };
      }
    }
  };
  recordLogin = mockRecordLogin;
}

// Export at the top level
export { supabase, recordLogin };