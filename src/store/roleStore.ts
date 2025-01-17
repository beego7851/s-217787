import { create } from 'zustand';
import { Database } from '@/integrations/supabase/types';

type UserRole = Database['public']['Enums']['app_role'];

interface RoleState {
  userRole: UserRole | null;
  userRoles: UserRole[] | null;
  isLoading: boolean;
  error: Error | null;
  permissions: {
    canManageUsers: boolean;
    canCollectPayments: boolean;
    canAccessSystem: boolean;
    canViewAudit: boolean;
    canManageCollectors: boolean;
  };
  hasRole: (role: UserRole) => boolean;
  isAdmin: () => boolean;
  isCollector: () => boolean;
  isMember: () => boolean;
  setUserRole: (role: UserRole | null) => void;
  setUserRoles: (roles: UserRole[] | null) => void;
  setIsLoading: (loading: boolean) => void;
  setError: (error: Error | null) => void;
  setPermissions: (permissions: RoleState['permissions']) => void;
}

export const useRoleStore = create<RoleState>((set, get) => ({
  userRole: null,
  userRoles: null,
  isLoading: true,
  error: null,
  permissions: {
    canManageUsers: false,
    canCollectPayments: false,
    canAccessSystem: false,
    canViewAudit: false,
    canManageCollectors: false,
  },
  hasRole: (role: UserRole) => {
    const state = get();
    return state.userRoles?.includes(role) || false;
  },
  isAdmin: () => {
    const state = get();
    return state.userRoles?.includes('admin') || false;
  },
  isCollector: () => {
    const state = get();
    return state.userRoles?.includes('collector') || false;
  },
  isMember: () => {
    const state = get();
    return state.userRoles?.includes('member') || false;
  },
  setUserRole: (role) => set({ userRole: role }),
  setUserRoles: (roles) => set({ userRoles: roles }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error: error }),
  setPermissions: (permissions) => set({ permissions }),
}));

export const mapRolesToPermissions = (roles: UserRole[] | null): RoleState['permissions'] => {
  if (!roles) return {
    canManageUsers: false,
    canCollectPayments: false,
    canAccessSystem: false,
    canViewAudit: false,
    canManageCollectors: false,
  };

  return {
    canManageUsers: roles.includes('admin'),
    canCollectPayments: roles.includes('admin') || roles.includes('collector'),
    canAccessSystem: roles.length > 0,
    canViewAudit: roles.includes('admin'),
    canManageCollectors: roles.includes('admin'),
  };
};