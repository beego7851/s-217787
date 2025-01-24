import PasswordChangeSection from '@/components/auth/PasswordChangeSection';

interface MemberPasswordSectionProps {
  memberNumber: string;
}

const MemberPasswordSection = ({ memberNumber }: MemberPasswordSectionProps) => {
  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium text-dashboard-accent1">Password Management</h4>
      <div className="bg-dashboard-card p-3 rounded-lg border border-dashboard-cardBorder">
        <PasswordChangeSection memberNumber={memberNumber} />
      </div>
    </div>
  );
};

export default MemberPasswordSection;