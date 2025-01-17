import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { useToast } from "@/hooks/use-toast";

export function useOptimizedQuery<TData = unknown, TError = unknown>(
  queryKey: string[],
  queryFn: () => Promise<TData>,
  options?: Omit<UseQueryOptions<TData, TError, TData>, 'queryKey' | 'queryFn'>
) {
  const { toast } = useToast();

  return useQuery({
    queryKey,
    queryFn,
    retry: (failureCount, error) => {
      // Only retry network errors
      if (error instanceof Error && error.message.includes('network')) {
        return failureCount < 3;
      }
      return false;
    },
    meta: {
      errorHandler: (error: unknown) => {
        console.error('Query error:', error);
        toast({
          title: "Error fetching data",
          description: error instanceof Error ? error.message : "An unknown error occurred",
          variant: "destructive",
        });
      }
    },
    ...options,
  });
}