import { useState, useEffect } from 'react';
import { supabase, recordLogin } from '@/supabaseClient';
import { eventBus } from '@/modules/core/events';
import { events } from '../events';
import * as Sentry from '@sentry/browser';

export function useAuth() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasRecordedLogin, setHasRecordedLogin] = useState(false);
  
  // Auth state initialization and listener
  useEffect(() => {
    console.log('Setting up auth listener');
    
    // Check active session on initial mount
    const checkSession = async () => {
      try {
        console.log('Checking for existing session');
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          Sentry.captureException(error);
          setLoading(false);
          return;
        }
        
        // Set initial session if it exists
        if (data.session) {
          console.log('Found existing session');
          setSession(data.session);
        } else {
          console.log('No existing session found');
        }
        setLoading(false);
      } catch (error) {
        console.error('Exception checking session:', error);
        Sentry.captureException(error);
        setLoading(false);
      }
    };
    
    checkSession();
    
    // Set up auth state change listener
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      console.log('Auth event:', event);
      
      if (event === 'SIGNED_IN') {
        console.log('User signed in, updating session');
        setSession(newSession);
        if (newSession?.user?.email) {
          eventBus.publish(events.USER_SIGNED_IN, { user: newSession.user });
          setHasRecordedLogin(false);
        }
      } 
      else if (event === 'TOKEN_REFRESHED') {
        console.log('Token refreshed, updating session');
        setSession(newSession);
      }
      else if (event === 'SIGNED_OUT') {
        console.log('User signed out, clearing session');
        setSession(null);
        eventBus.publish(events.USER_SIGNED_OUT, {});
        setHasRecordedLogin(false);
      }
    });
    
    return () => {
      console.log('Cleaning up auth listener');
      authListener?.subscription.unsubscribe();
    };
  }, []); // No dependencies to prevent re-creating the listener
  
  // Handle login recording
  useEffect(() => {
    if (session?.user?.email && !hasRecordedLogin) {
      console.log('Recording login for:', session.user.email);
      try {
        recordLogin(session.user.email, import.meta.env.VITE_PUBLIC_APP_ENV);
        setHasRecordedLogin(true);
      } catch (error) {
        console.error('Failed to record login:', error);
        Sentry.captureException(error);
      }
    }
  }, [session, hasRecordedLogin]);
  
  const signOut = async () => {
    try {
      console.log('Signing out user');
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error('Error signing out:', error);
      Sentry.captureException(error);
      throw error;
    }
  };
  
  return {
    session,
    user: session?.user || null,
    loading,
    signOut,
  };
}