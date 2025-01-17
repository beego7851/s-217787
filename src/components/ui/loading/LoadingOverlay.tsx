import { LoadingSpinner } from "./LoadingSpinner";

interface LoadingOverlayProps {
  message?: string;
}

export function LoadingOverlay({ message = "Loading..." }: LoadingOverlayProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg flex flex-col items-center space-y-4">
        <LoadingSpinner size="lg" />
        <p className="text-dashboard-text font-medium">{message}</p>
      </div>
    </div>
  );
}