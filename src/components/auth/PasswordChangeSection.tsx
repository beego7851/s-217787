import { useState } from "react";
import ChangePasswordDialog from "./ChangePasswordDialog";
import { Button } from "@/components/ui/button";
import { Key } from "lucide-react";

interface PasswordChangeSectionProps {
  memberNumber: string;
}

const PasswordChangeSection = ({ memberNumber }: PasswordChangeSectionProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <div className="space-y-4">
      <Button
        onClick={() => setIsDialogOpen(true)}
        variant="outline"
        className="w-full flex items-center gap-2 bg-dashboard-card hover:bg-dashboard-cardHover"
      >
        <Key className="w-4 h-4" />
        Change Password
      </Button>

      <ChangePasswordDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        memberNumber={memberNumber}
      />
    </div>
  );
};

export default PasswordChangeSection;