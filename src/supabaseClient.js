import { initializeZapt } from '@zapt/zapt-js';
import * as Sentry from '@sentry/browser';

console.log('Initializing supabase client with app ID:', import.meta.env.VITE_PUBLIC_APP_ID);

try {
  const { supabase, recordLogin } = initializeZapt(import.meta.env.VITE_PUBLIC_APP_ID);
  export { supabase, recordLogin };
} catch (error) {
  console.error('Failed to initialize ZAPT/Supabase:', error);
  Sentry.captureException(error);
  // Provide fallback to prevent app from crashing
  const mockRecordLogin = async (email, env) => {
    console.error('Using mock recordLogin because initialization failed');
  };
  // Export a dummy client that will show a clear error
  export const supabase = {
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
  export const recordLogin = mockRecordLogin;
}