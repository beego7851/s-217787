import { useToast } from "@/hooks/use-toast";
import { AuthError } from "@supabase/supabase-js";

export const useErrorHandler = () => {
  const { toast } = useToast();

  const handleError = (error: unknown) => {
    console.error('Error caught by handler:', error);
    
    let message = 'An unexpected error occurred';
    
    if (error instanceof AuthError) {
      switch (error.status) {
        case 400:
          message = 'Invalid request. Please check your input.';
          break;
        case 401:
          message = 'Authentication failed. Please log in again.';
          break;
        case 403:
          message = 'You do not have permission to perform this action.';
          break;
        case 404:
          message = 'The requested resource was not found.';
          break;
        case 409:
          message = 'This operation conflicts with an existing record.';
          break;
        case 422:
          message = 'Invalid input. Please check your data.';
          break;
        case 429:
          message = 'Too many requests. Please try again later.';
          break;
        case 500:
          message = 'Server error. Please try again later.';
          break;
        default:
          if (error.message) {
            message = error.message;
          }
      }
    } else if (error instanceof Error) {
      if (error.message.includes('Failed to fetch')) {
        message = 'Network error. Please check your connection.';
      } else {
        message = error.message;
      }
    }

    toast({
      title: "Error",
      description: message,
      variant: "destructive",
    });

    return message;
  };

  return { handleError };
};