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
  const { isLoading: rolesLoading, data: roles } = useUnifiedRoles(session?.user?.id);

  console.log('App render state:', {
    hasSession: !!session,
    sessionLoading,
    rolesLoading,
    hasRoles: !!roles,
    timestamp: new Date().toISOString()
  });

  // Show loading only during initial session check
  if (sessionLoading && !session) {
    return <LoadingOverlay message="Initializing application..." />;
  }

  // Don't show loading for role checks if we already have a session and roles
  if (!sessionLoading && session && rolesLoading && !roles) {
    console.log('Session exists but roles still loading');
    return <LoadingOverlay message="Loading user permissions..." />;
  }

  return (
    <>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/*" element={<ProtectedRoutes session={session} rolesLoaded={!rolesLoading && !!roles} />} />
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