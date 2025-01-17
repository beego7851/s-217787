import { supabase } from "@/integrations/supabase/client";
import { QueryClient } from '@tanstack/react-query';

export const clearAuthState = async () => {
  console.log('Clearing existing session...');
  try {
    await supabase.auth.signOut();
    await new QueryClient().clear();
    localStorage.clear();
  } catch (error) {
    console.error('Error clearing auth state:', error);
  }
};

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const verifyMember = async (memberNumber: string, retryCount = 3) => {
  console.log('Verifying member:', memberNumber);
  
  for (let attempt = 1; attempt <= retryCount; attempt++) {
    try {
      console.log(`Verification attempt ${attempt} of ${retryCount}`);
      
      const { data: members, error: memberError } = await supabase
        .from('members')
        .select('id, member_number, status')
        .eq('member_number', memberNumber)
        .eq('status', 'active')
        .limit(1)
        .maybeSingle();

      if (memberError) {
        console.error(`Member verification error on attempt ${attempt}:`, memberError);
        if (memberError.code === 'PGRST116') {
          throw new Error('Member not found or inactive');
        }
        // If it's the last attempt, throw the error
        if (attempt === retryCount) {
          throw memberError;
        }
        // Otherwise wait and retry
        await delay(1000 * attempt); // Exponential backoff
        continue;
      }

      if (!members) {
        throw new Error('Member not found or inactive');
      }

      return members;
    } catch (error: any) {
      console.error(`Verification error on attempt ${attempt}:`, error);
      if (error.message === 'Member not found or inactive') {
        throw error; // Don't retry for known business logic errors
      }
      if (attempt === retryCount) {
        if (error.message === 'Failed to fetch') {
          throw new Error('Network error - please check your connection and try again');
        }
        throw error;
      }
      await delay(1000 * attempt); // Exponential backoff
    }
  }
  
  throw new Error('Failed to verify member after multiple attempts');
};

export const getAuthCredentials = (memberNumber: string) => ({
  email: `${memberNumber.toLowerCase()}@temp.com`,
  password: memberNumber,
});