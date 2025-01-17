import { useLoginForm } from './login/useLoginForm';
import MemberNumberInput from './login/MemberNumberInput';
import LoginButton from './login/LoginButton';
import LegalLinks from './login/LegalLinks';
import { useAuth } from '@/contexts/auth/AuthContext';

const LoginForm = () => {
  const { loading, error } = useAuth();
  const { memberNumber, setMemberNumber, handleLogin } = useLoginForm();

  return (
    <div className="bg-dashboard-card rounded-lg shadow-lg p-8 mb-12">
      <form onSubmit={handleLogin} className="space-y-6 max-w-md mx-auto">
        {error && (
          <div className="text-red-500 text-sm mb-4">
            {error.message}
          </div>
        )}
        
        <MemberNumberInput
          memberNumber={memberNumber}
          setMemberNumber={setMemberNumber}
          loading={loading}
        />

        <LoginButton loading={loading} />
        <LegalLinks />
      </form>
    </div>
  );
};

export default LoginForm;