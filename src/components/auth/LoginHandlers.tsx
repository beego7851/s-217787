import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { getMemberByMemberId } from "@/utils/memberAuth";

export const useLoginHandlers = (setIsLoggedIn: (value: boolean) => void) => {
  const { toast } = useToast();

  const handleEmailSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      toast({
        title: "Login successful",
        description: "Welcome back!",
      });
      setIsLoggedIn(true);
    } catch (error) {
      console.error("Email login error:", error);
      toast({
        title: "Login failed",
        description: error instanceof Error ? error.message : "An error occurred during login",
        variant: "destructive",
      });
    }
  };

  const handleMemberIdSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const memberId = (formData.get("memberId") as string).toUpperCase().trim();
    const password = formData.get("password") as string;

    try {
      console.log("Looking up member with member_number:", memberId);
      const member = await getMemberByMemberId(memberId);
      
      if (!member) {
        throw new Error("Member ID not found");
      }

      // Generate email consistently
      const email = member.email || `member.${member.member_number.toLowerCase()}@temporary.org`;
      
      // Ensure password meets minimum length requirement
      const securePassword = password.padEnd(6, member.member_number);

      console.log("Attempting to sign in with member credentials");
      
      // First try to sign in
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password: securePassword,
      });

      if (!signInError && signInData?.user) {
        toast({
          title: "Login successful",
          description: "Welcome back!",
        });
        setIsLoggedIn(true);
        return;
      }

      // If sign in fails, try to find the user by email
      const { data: users, error: listError } = await supabase.auth.admin.listUsers();
      const existingUser = users?.users.find(u => u.email === email);
      
      if (existingUser) {
        toast({
          title: "Login failed",
          description: "Invalid password. Please try again or contact support.",
          variant: "destructive",
        });
        return;
      }

      // If user doesn't exist, create new account
      console.log("Creating new account for:", { email, memberId });
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
        throw signUpError;
      }

      if (signUpData?.user) {
        toast({
          title: "Account created",
          description: "Please check your email for confirmation link",
        });
      }

    } catch (error) {
      console.error("Member ID login error:", error);
      toast({
        title: "Login failed",
        description: error instanceof Error ? error.message : "Invalid member ID or password",
        variant: "destructive",
      });
    }
  };

  const handleGoogleLogin = async () => {
    console.log("Google login attempt started");
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + "/admin",
        },
      });

      console.log("Google login response:", { data, error });
      if (error) throw error;
      
      toast({
        title: "Redirecting to Google",
        description: "Please wait while we redirect you to Google sign-in...",
      });
    } catch (error) {
      console.error("Google login error:", error);
      toast({
        title: "Login failed",
        description: error instanceof Error ? error.message : "An error occurred during Google login",
        variant: "destructive",
      });
    }
  };

  return {
    handleEmailSubmit,
    handleMemberIdSubmit,
    handleGoogleLogin,
  };
};