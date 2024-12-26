import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { useState } from "react";

interface MemberIdLoginFormProps {
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => Promise<void>;
  isLoading?: boolean;
}

export const MemberIdLoginForm = ({ onSubmit, isLoading }: MemberIdLoginFormProps) => {
  const [memberId, setMemberId] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Create a new FormData instance
    const formData = new FormData(e.currentTarget);
    
    // Clean and set the member ID
    const cleanMemberId = memberId.toUpperCase().trim();
    formData.set('memberId', cleanMemberId);
    
    // Set the password
    formData.set('password', password);
    
    console.log("Login attempt with:", {
      memberId: cleanMemberId,
      hasPassword: !!password,
    });
    
    await onSubmit(e);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Input
          id="memberId"
          name="memberId"
          type="text"
          placeholder="Member ID (e.g. TM20001)"
          value={memberId}
          onChange={(e) => setMemberId(e.target.value.toUpperCase().trim())}
          required
          disabled={isLoading}
          className="uppercase"
        />
      </div>
      <div className="space-y-2">
        <Input
          id="password"
          name="password"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={isLoading}
          minLength={6}
        />
      </div>
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Logging in..." : "Login with Member ID"}
      </Button>
      <p className="text-sm text-muted-foreground text-center">
        Use your Member ID (e.g. TM20001) and password
      </p>
    </form>
  );
};