import { useRoleStore } from '@/store/roleStore';
import { Database } from "@/integrations/supabase/types";

export type UserRole = Database['public']['Enums']['app_role'];

export const useRoleAccess = () => {
  const {
    userRole,
    userRoles,
    isLoading: roleLoading,
    hasRole,
    isAdmin,
    isCollector,
    isMember,
    permissions,
    error,
    setUserRole,
    setUserRoles,
    setIsLoading,
    setError,
    setPermissions
  } = useRoleStore();

  const hasAnyRole = (roles: UserRole[]) => {
    return roles.some(role => hasRole(role));
  };

  const canAccessTab = (tab: string): boolean => {
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
  };

  return {
    userRole,
    userRoles,
    roleLoading,
    hasRole,
    hasAnyRole,
    canAccessTab,
    isAdmin,
    isCollector,
    isMember,
    permissions,
    error,
    setUserRole,
    setUserRoles,
    setIsLoading,
    setError,
    setPermissions
  };
};