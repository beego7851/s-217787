import { Routes, Route } from 'react-router-dom';
import { Toaster } from "@/components/ui/toaster";
import Login from '@/pages/Login';
import ProtectedRoutes from '@/components/routing/ProtectedRoutes';
import { useAuth } from '@/contexts/auth/AuthContext';
import { LoadingOverlay } from '@/components/ui/loading/LoadingOverlay';
import ErrorBoundary from '@/components/error/ErrorBoundary';
import { useUnifiedRoles } from '@/hooks/useUnifiedRoles';

const AppContent = () => {
  const { session, loading: sessionLoading } = useAuth();
  const { isLoading: rolesLoading } = useUnifiedRoles(session?.user?.id);

  console.log('App render state:', {
    hasSession: !!session,
    sessionLoading,
    rolesLoading,
    timestamp: new Date().toISOString()
  });

  // Only show loading during initial session check
  if (sessionLoading && !session) {
    return <LoadingOverlay message="Initializing application..." />;
  }

  // Don't show loading for role checks if we already have a session
  if (!sessionLoading && session && rolesLoading) {
    console.log('Session exists but roles still loading');
    return null;
  }

  return (
    <>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/*" element={<ProtectedRoutes session={session} />} />
      </Routes>
      <Toaster />
    </>
  );
};

const App = () => {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
};

export default App;