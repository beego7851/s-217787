import { useState } from "react";
import { LoginTabs } from "../components/auth/LoginTabs";
import { useNavigate } from "react-router-dom";
import { useToast } from "../hooks/use-toast";
import { getMemberByMemberId } from "../utils/memberAuth";
import { supabase } from "../integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { InfoIcon } from "lucide-react";

export default function Login() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showEmailConfirmation, setShowEmailConfirmation] = useState(false);

  const handleEmailSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      console.log("Attempting email login with:", { email });
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("Email login error:", error);
        throw error;
      }

      if (data?.user) {
        toast({
          title: "Login successful",
          description: "Welcome back!",
        });
        navigate("/admin");
      }
    } catch (error) {
      console.error("Email login error:", error);
      toast({
        title: "Login failed",
        description: "Invalid email or password",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleMemberIdSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setShowEmailConfirmation(false);
    
    const formData = new FormData(e.currentTarget);
    const memberId = formData.get('memberId') as string;
    
    try {
      console.log("Looking up member with ID:", memberId);
      const member = await getMemberByMemberId(memberId);
      console.log("Member lookup result:", member);

      if (!member) {
        throw new Error("Member ID not found");
      }

      // Generate temporary email if needed
      const tempEmail = `member.${member.member_number.toLowerCase()}@temporary.org`;
      const email = member.email?.endsWith('@temp.pwaburton.org') 
        ? tempEmail 
        : member.email;

      if (!email) {
        throw new Error("No email associated with this member ID");
      }

      // Create a password that meets minimum requirements (at least 6 characters)
      const securePassword = member.member_number.padEnd(6, member.member_number);

      // First try to sign in
      console.log("Attempting to sign in with member number");
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password: securePassword,
      });

      if (!signInError && signInData?.user) {
        toast({
          title: "Login successful",
          description: "Welcome back!",
        });
        navigate("/admin");
        return;
      }

      // If sign in fails, create a new account
      console.log("Sign in failed, creating new account:", { email, memberId: member.member_number });
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
        console.error("Sign up error:", signUpError);
        throw signUpError;
      }

      if (signUpData?.user) {
        setShowEmailConfirmation(true);
        throw new Error("Please check your email for confirmation link");
      }

    } catch (error) {
      console.error("Member ID login error:", error);
      toast({
        title: "Login failed",
        description: error instanceof Error ? error.message : "Invalid member ID or password",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container max-w-lg mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl text-center">Login</CardTitle>
        </CardHeader>
        <CardContent>
          {showEmailConfirmation && (
            <Alert className="mb-6">
              <InfoIcon className="h-4 w-4" />
              <AlertDescription>
                Please check your email for a confirmation link before logging in.
                You may need to check your spam folder.
              </AlertDescription>
            </Alert>
          )}
          <LoginTabs 
            onEmailSubmit={handleEmailSubmit}
            onMemberIdSubmit={handleMemberIdSubmit}
            isLoading={isLoading}
          />
        </CardContent>
      </Card>
    </div>
  );
}