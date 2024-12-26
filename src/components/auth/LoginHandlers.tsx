import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { getMemberByMemberId } from "@/utils/memberAuth";

export async function handleMemberIdLogin(memberId: string, password: string, navigate: ReturnType<typeof useNavigate>) {
  // First, look up the member
  const member = await getMemberByMemberId(memberId);
  
  if (!member) {
    throw new Error("Member ID not found");
  }
  
  // Use a consistent email format for member ID login
  const email = `member.${memberId.toLowerCase()}@temporary.org`;
  
  // Create a secure password by combining member ID and provided password
  const securePassword = `${memberId}${password}`;
  
  console.log("Attempting member ID login with:", { email });
  
  try {
    // First try to sign in
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password: securePassword,
    });

    if (!signInError && signInData?.user) {
      navigate("/admin");
      return;
    }

    // If sign in fails, try to create the account
    console.log("Sign in failed, attempting to create account");
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password: securePassword,
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

export async function handleEmailLogin(
  email: string,
  password: string,
  setIsLoading: (loading: boolean) => void,
  navigate: ReturnType<typeof useNavigate>
) {
  const { toast } = useToast();
  
  try {
    setIsLoading(true);
    console.log('Attempting to sign in with:', { email });

    // Try to sign in first
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password: password.padEnd(6, '0'), // Ensure minimum length
    });

    if (!signInError && signInData?.user) {
      console.log('Sign in successful');
      navigate("/admin");
      return;
    }

    console.log('Sign in failed, checking if user exists...');

    // If sign in fails, try to find the user by email
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.error('Error checking user existence:', listError);
      throw listError;
    }

    // Properly type the users array
    const existingUser = (users as User[] | null)?.find(user => user.email === email);
    
    if (existingUser) {
      throw new Error("Invalid password. Please try again or contact support.");
    }

    // If user doesn't exist, try to sign up
    console.log('User not found, attempting to sign up...');
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password: password.padEnd(6, '0'), // Ensure minimum length
    });

    if (signUpError) {
      console.error('Sign up error:', signUpError);
      throw signUpError;
    }

    console.log('Sign up successful');
    toast({
      title: "Account created",
      description: "Please check your email to verify your account.",
    });

  } catch (error) {
    console.error('Authentication error:', error);
    throw error;
  } finally {
    setIsLoading(false);
  }
}