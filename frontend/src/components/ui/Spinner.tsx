import { Loader2 } from 'lucide-react';

interface SpinnerProps {
  size?: number;
  className?: string;
  fullScreen?: boolean;
}

export function Spinner({ size = 24, className = '', fullScreen = false }: SpinnerProps) {
  if (fullScreen) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 size={40} className="animate-spin text-brand-500" />
      </div>
    );
  }

  return <Loader2 size={size} className={`animate-spin text-brand-500 ${className}`} />;
}
