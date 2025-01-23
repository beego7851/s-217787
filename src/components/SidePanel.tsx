import { useCallback, useMemo, memo, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useRoleAccess } from "@/hooks/useRoleAccess";
import { useAuthSession } from "@/hooks/useAuthSession";
import NavItem from "./navigation/NavItem";

interface SidePanelProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
}

const SidePanel = memo(({ currentTab, onTabChange }: SidePanelProps) => {
  const { session, handleSignOut } = useAuthSession();
  const { userRole, userRoles, roleLoading, hasRole } = useRoleAccess();
  const { toast } = useToast();

  const prevUserRoleRef = useRef(userRole);
  const prevUserRolesRef = useRef(userRoles);

  const hasSession = !!session;

  useEffect(() => {
    if (!hasSession) {
      console.log('No active session, access will be restricted');
      return;
    }

    if (prevUserRoleRef.current !== userRole) {
      console.log('SidePanel rerender: userRole changed', { old: prevUserRoleRef.current, new: userRole });
      prevUserRoleRef.current = userRole;
    }
    if (prevUserRolesRef.current !== userRoles) {
      console.log('SidePanel rerender: userRoles changed', { old: prevUserRolesRef.current, new: userRoles });
      prevUserRolesRef.current = userRoles;
    }
  }, [userRole, userRoles, hasSession]);

  const navigationItems = useMemo(() => [
    {
      name: 'Overview',
      tab: 'dashboard',
      alwaysShow: true
    },
    {
      name: 'Users',
      tab: 'users',
      requiresRole: ['admin', 'collector'] as const
    },
    {
      name: 'Financials',
      tab: 'financials',
      requiresRole: ['admin', 'collector'] as const
    },
    {
      name: 'System',
      tab: 'system',
      requiresRole: ['admin'] as const
    }
  ], []);

  const shouldShowTab = useCallback((tab: string): boolean => {
    if (!hasSession) return tab === 'dashboard';
    if (roleLoading) return tab === 'dashboard';
    if (!userRoles || !userRole) return tab === 'dashboard';

    switch (tab) {
      case 'dashboard':
        return true;
      case 'users':
        return hasRole('admin') || hasRole('collector');
      case 'financials':
        return hasRole('admin') || hasRole('collector');
      case 'system':
        return hasRole('admin');
      default:
        return false;
    }
  }, [roleLoading, userRoles, userRole, hasRole, hasSession]);

  const handleLogoutClick = useCallback(async () => {
    console.log('Logout initiated');
    try {
      await handleSignOut(false);
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive"
      });
    }
  }, [handleSignOut, toast]);

  const roleStatusText = useMemo(() => {
    console.log('Calculating role status text');
    if (!hasSession) return 'Not authenticated';
    if (roleLoading) return 'Loading access...';
    return userRole ? `Role: ${userRole}` : 'Access restricted';
  }, [roleLoading, userRole, hasSession]);

  const visibleNavigationItems = useMemo(() => {
    console.log('Calculating visible navigation items');
    if (!hasSession) return navigationItems.filter(item => item.alwaysShow);
    return navigationItems.filter(item => 
      item.alwaysShow || (!roleLoading && item.requiresRole?.some(role => userRoles?.includes(role)))
    );
  }, [navigationItems, roleLoading, userRoles, hasSession]);

  console.log('SidePanel render', { userRole, roleLoading, hasSession });

  return (
    <div className="flex flex-col h-full bg-dashboard-card border-r border-dashboard-cardBorder">
      <ScrollArea className="flex-1">
        <div className="space-y-4 py-4">
          <div className="px-3 py-2">
            <h2 className="mb-2 px-4 text-lg font-semibold text-dashboard-highlight">
              Navigation
            </h2>
            <div className="space-y-1">
              {visibleNavigationItems.map((item) => (
                <NavItem
                  key={item.tab}
                  name={item.name}
                  tab={item.tab}
                  isActive={currentTab === item.tab}
                  onClick={() => onTabChange(item.tab)}
                />
              ))}
            </div>
          </div>
        </div>
      </ScrollArea>
      <div className="p-4 border-t border-dashboard-cardBorder space-y-4">
        <Button
          variant="outline"
          className="w-full justify-start bg-[#9b87f5] hover:bg-[#7E69AB] text-white"
          onClick={handleLogoutClick}
        >
          Sign Out
        </Button>
      </div>
    </div>
  );
});

SidePanel.displayName = "SidePanel";

export default SidePanel;
