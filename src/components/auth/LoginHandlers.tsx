import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";

export async function handleMemberIdLogin(memberId: string, password: string, navigate: ReturnType<typeof useNavigate>) {
  // Create a secure password by combining member ID and provided password
  const securePassword = `${memberId}${password}`;
  
  // Use a consistent email format for member ID login
  const email = `member.${memberId.toLowerCase()}@temporary.org`;
  
  console.log("Attempting member ID login with:", { email });
  
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password: securePassword,
  });

  if (error) {
    console.error('Member ID login error:', error);
    throw error;
  }

  navigate("/admin/dashboard");
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
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password: password.padEnd(6, '0'), // Ensure minimum length
    });

    if (!signInError) {
      console.log('Sign in successful');
      navigate("/admin/dashboard");
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
      toast({
        title: "Login failed",
        description: "Invalid password. Please try again or contact support.",
        variant: "destructive",
      });
      return;
    }

    // If user doesn't exist, try to sign up
    console.log('User not found, attempting to sign up...');
    const { error: signUpError } = await supabase.auth.signUp({
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
    toast({
      title: "Authentication error",
      description: error instanceof Error ? error.message : "An unexpected error occurred",
      variant: "destructive",
    });
  } finally {
    setIsLoading(false);
  }
}