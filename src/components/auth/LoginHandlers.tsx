import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getMemberByMemberId } from "@/utils/memberAuth";

export async function handleMemberIdLogin(memberId: string, password: string, navigate: ReturnType<typeof useNavigate>) {
  // First, look up the member
  const member = await getMemberByMemberId(memberId);
  
  if (!member) {
    throw new Error("Member ID not found");
  }
  
  // Use member number for email and password for authentication
  const email = `${memberId.toLowerCase()}@pwaburton.org`;
  
  console.log("Attempting member ID login with:", { memberId });
  
  try {
    // Try to sign in
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (!signInError && signInData?.user) {
      navigate("/admin");
      return;
    }

    // If sign in fails, create account with provided password
    console.log("Sign in failed, attempting to create account");
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          member_id: member.id,
          member_number: member.member_number,
          full_name: member.full_name
        }
      }
    });

    if (signUpError) {
      console.error('Sign up error:', signUpError);
      throw signUpError;
    }

    if (signUpData?.user) {
      navigate("/admin");
    }
  } catch (error) {
    console.error('Authentication error:', error);
    throw error;
  }
}