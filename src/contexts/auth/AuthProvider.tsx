import { useState, useEffect, ReactNode } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { AuthContext } from './AuthContext';
import { verifyMember, clearAuthState, getAuthCredentials } from '@/components/auth/login/utils/authUtils';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { useUnifiedRoles } from '@/hooks/useUnifiedRoles';

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Initialize roles management
  const { refetch: refetchRoles } = useUnifiedRoles(session?.user?.id);

  useEffect(() => {
    console.log('AuthProvider: Initializing');
    
    const initializeAuth = async () => {
      try {
        const { data: { session: initialSession }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        
        console.log('AuthProvider: Initial session loaded:', !!initialSession);
        setSession(initialSession);
      } catch (err) {
        console.error('AuthProvider: Error getting initial session:', err);
        setError(err instanceof Error ? err : new Error('Failed to initialize session'));
      } finally {
        setLoading(false);
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      console.log('Auth state changed:', event, !!currentSession);
      setSession(currentSession);
      
      if (event === 'SIGNED_OUT') {
        setError(null);
        queryClient.clear();
      } else if (event === 'SIGNED_IN' && currentSession) {
        refetchRoles();
      }
    });

    initializeAuth();

    return () => {
      subscription.unsubscribe();
    };
  }, [queryClient, refetchRoles]);

  const handleSignIn = async (memberNumber: string) => {
    console.log('Starting sign in process for member:', memberNumber);
    setLoading(true);
    setError(null);

    try {
      await clearAuthState();
      const member = await verifyMember(memberNumber);
      console.log('Member verified:', member);

      const { email, password } = getAuthCredentials(memberNumber);
      console.log('Generated credentials for:', { email });

      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw signInError;
      if (!signInData?.session) throw new Error('Failed to establish session');

      console.log('Sign in successful');
      setSession(signInData.session);
      await queryClient.invalidateQueries();
      await refetchRoles();

      toast({
        title: "Login successful",
        description: "Welcome back!",
      });
    } catch (err: any) {
      console.error('Sign in error:', err);
      
      let errorMessage = 'An unexpected error occurred';
      if (err.message.includes('Member not found')) {
        errorMessage = 'Member number not found or inactive';
      } else if (err.message.includes('Invalid login credentials')) {
        errorMessage = 'Invalid member number. Please try again.';
      } else if (err.message.includes('Email not confirmed')) {
        errorMessage = 'Please verify your email before logging in';
      }
      
      setError(new Error(errorMessage));
      toast({
        title: "Login failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async (redirect: boolean = true) => {
    console.log('Starting sign out process');
    setLoading(true);
    try {
      await clearAuthState();
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
    } catch (err) {
      console.error('Sign out error:', err);
      const errorMessage = 'Failed to sign out properly';
      setError(new Error(errorMessage));
      toast({
        title: "Error signing out",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{
      session,
      loading,
      error,
      handleSignIn,
      handleSignOut
    }}>
      {children}
    </AuthContext.Provider>
  );
};