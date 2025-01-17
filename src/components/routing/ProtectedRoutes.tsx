import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import { useToast } from "@/hooks/use-toast";
import { useRoleAccess } from "@/hooks/useRoleAccess";
import { useRoleSync } from "@/hooks/useRoleSync";
import { LoadingSpinner } from "@/components/ui/loading/LoadingSpinner";
import MainLayout from "@/components/layout/MainLayout";
import DashboardView from "@/components/DashboardView";
import MembersList from "@/components/MembersList";
import FinancialsView from "@/components/FinancialsView";
import SystemToolsView from "@/components/SystemToolsView";

interface ProtectedRoutesProps {
  session: Session | null;
}

const ProtectedRoutes = ({ session }: ProtectedRoutesProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { roleLoading, hasRole, userRole } = useRoleAccess();
  const { syncRoles } = useRoleSync();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isInitialRoleLoad, setIsInitialRoleLoad] = useState(true);

  useEffect(() => {
    console.log('ProtectedRoutes mounted, session:', !!session);
    
    const handleAuthChange = async (event: string, currentSession: Session | null) => {
      console.log('Auth state change in protected routes:', event);
      
      if (event === 'SIGNED_OUT' || (event === 'TOKEN_REFRESHED' && !currentSession)) {
        console.log('User signed out or token refresh failed, redirecting to login');
        navigate('/login', { replace: true });
        return;
      }

      if (event === 'SIGNED_IN' && currentSession) {
        console.log('User signed in, checking role access');
        if (!hasRole('member')) {
          toast({
            title: "Access Denied",
            description: "You don't have permission to access this area.",
            variant: "destructive",
          });
          navigate('/login', { replace: true });
        }
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthChange);

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate, hasRole, toast]);

  // Update isInitialRoleLoad when role loading completes
  useEffect(() => {
    if (!roleLoading) {
      console.log('Role loading completed, setting isInitialRoleLoad to false');
      setIsInitialRoleLoad(false);
    }
  }, [roleLoading]);

  // First, check if there's no session
  if (!session) {
    console.log('No session in ProtectedRoutes, redirecting to login');
    navigate('/login', { replace: true });
    return null;
  }

  // Then, check if we need to show loading state
  // Only show loading during initial role fetch when there IS a session
  const showLoading = isInitialRoleLoad && roleLoading;

  if (showLoading) {
    console.log('Showing loading state:', {
      isInitialRoleLoad,
      roleLoading,
      hasSession: !!session,
      timestamp: new Date().toISOString()
    });
    return (
      <div className="flex items-center justify-center min-h-screen bg-dashboard-dark">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  console.log('Rendering protected content with role:', userRole);

  const renderContent = () => {
    console.log('Rendering content for tab:', activeTab);
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView />;
      case 'users':
        if (hasRole('admin') || hasRole('collector')) {
          return <MembersList searchTerm="" userRole={userRole} />;
        }
        return null;
      case 'financials':
        if (hasRole('admin')) {
          return <FinancialsView />;
        }
        return null;
      case 'system':
        if (hasRole('admin')) {
          return <SystemToolsView />;
        }
        return null;
      default:
        return <DashboardView />;
    }
  };

  return (
    <MainLayout
      activeTab={activeTab}
      userRole={userRole}
      isSidebarOpen={isSidebarOpen}
      onSidebarToggle={() => setIsSidebarOpen(!isSidebarOpen)}
      onTabChange={setActiveTab}
    >
      {renderContent()}
    </MainLayout>
  );
};

export default ProtectedRoutes;