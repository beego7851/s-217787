import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { LoginTabs } from "../components/auth/LoginTabs";
import { useNavigate } from "react-router-dom";
import { useToast } from "../hooks/use-toast";
import { getMemberByMemberId, verifyMemberPassword } from "../utils/memberAuth";
import { supabase } from "../integrations/supabase/client";

export default function Login() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleEmailSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
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
    console.log("Member ID login attempt started");
    setIsLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const memberId = formData.get('memberId') as string;
    const password = formData.get('memberPassword') as string;
    
    try {
      console.log("Looking up member with ID:", memberId);
      const member = await getMemberByMemberId(memberId);

      if (!member || !member.email) {
        console.log("Member lookup result:", member);
        throw new Error("Member ID not found or no email associated");
      }

      const isPasswordValid = await verifyMemberPassword(memberId, password);
      if (!isPasswordValid) {
        throw new Error("Invalid member ID or password");
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: member.email,
        password: member.member_number,
      });

      if (error) throw error;
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
