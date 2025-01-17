import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/auth/AuthContext';

export const useLoginForm = () => {
  const [memberNumber, setMemberNumber] = useState('');
  const navigate = useNavigate();
  const { handleSignIn, loading } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || !memberNumber.trim()) return;
    
    try {
      await handleSignIn(memberNumber);
      const isMobile = window.innerWidth <= 768;
      
      // Use replace to prevent back button issues
      if (isMobile) {
        window.location.href = '/';
      } else {
        navigate('/', { replace: true });
      }
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  return {
    memberNumber,
    setMemberNumber,
    loading,
    handleLogin,
  };
};