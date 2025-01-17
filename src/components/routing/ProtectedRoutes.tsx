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
  rolesLoaded: boolean;
}

const ProtectedRoutes = ({ session, rolesLoaded }: ProtectedRoutesProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { hasRole, userRole } = useRoleAccess();
  const { syncRoles } = useRoleSync();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    console.log('ProtectedRoutes state:', {
      hasSession: !!session,
      rolesLoaded,
      userRole,
      timestamp: new Date().toISOString()
    });
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, currentSession) => {
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
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate, hasRole, toast, session, rolesLoaded, userRole]);

  // First, check if there's no session
  if (!session) {
    console.log('No session in ProtectedRoutes, redirecting to login');
    navigate('/login', { replace: true });
    return null;
  }

  // Then, check if roles are still loading
  if (!rolesLoaded) {
    console.log('Roles not yet loaded in ProtectedRoutes');
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