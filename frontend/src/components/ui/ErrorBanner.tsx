import { AlertCircle, X, RefreshCw } from 'lucide-react';
import { useState } from 'react';

interface ErrorBannerProps {
  message: string;
  onRetry?: () => void;
  dismissible?: boolean;
}

export function ErrorBanner({ message, onRetry, dismissible = true }: ErrorBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-red-800">
      <AlertCircle size={18} className="shrink-0" />
      <p className="text-sm flex-1">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="inline-flex items-center gap-1 text-sm font-medium hover:underline cursor-pointer">
          <RefreshCw size={14} /> Retry
        </button>
      )}
      {dismissible && (
        <button onClick={() => setDismissed(true)} className="cursor-pointer">
          <X size={14} />
        </button>
      )}
    </div>
  );
}
