import { useQuery } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import { useRoleStore, mapRolesToPermissions } from '@/store/roleStore';
import { Database } from "@/integrations/supabase/types";

type UserRole = Database['public']['Enums']['app_role'];

const fetchUserRoles = async (userId: string | undefined) => {
  console.log('Fetching roles for user:', userId);
  if (!userId) return null;

  const { data, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching user roles:', error);
    throw error;
  }

  console.log('Fetched roles:', data);
  return data?.map(item => item.role as UserRole) || null;
};

export const useUnifiedRoles = (userId: string | undefined) => {
  const setUserRoles = useRoleStore((state) => state.setUserRoles);
  const setUserRole = useRoleStore((state) => state.setUserRole);
  const setIsLoading = useRoleStore((state) => state.setIsLoading);
  const setError = useRoleStore((state) => state.setError);
  const setPermissions = useRoleStore((state) => state.setPermissions);

  return useQuery({
    queryKey: ['userRoles', userId],
    queryFn: () => fetchUserRoles(userId),
    enabled: !!userId,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * (attemptIndex + 1), 3000),
    staleTime: 1000 * 60 * 15, // 15 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes (previously cacheTime)
    meta: {
      onSuccess: (data: UserRole[] | null) => {
        console.log('Role query succeeded, updating store:', data);
        setUserRoles(data);
        const primaryRole = data?.includes('admin') 
          ? 'admin' as UserRole
          : data?.includes('collector')
            ? 'collector' as UserRole
            : 'member' as UserRole;
        
        setUserRole(primaryRole);
        const permissions = mapRolesToPermissions(data);
        setPermissions(permissions);
        setIsLoading(false);
        setError(null);
      },
      onError: (error: Error) => {
        console.error('Role query failed:', error);
        const defaultRole: UserRole[] = ['member'];
        setUserRoles(defaultRole);
        setUserRole('member');
        setPermissions(mapRolesToPermissions(defaultRole));
        setIsLoading(false);
        setError(error);
      },
      onSettled: () => {
        setIsLoading(false);
      }
    }
  });
};