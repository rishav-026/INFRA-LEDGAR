import type { ReactNode } from 'react';

interface StatCardProps {
  icon: ReactNode;
  label: string;
  value: string | number;
  className?: string;
}

export function StatCard({ icon, label, value, className = '' }: StatCardProps) {
  return (
    <div className={`bg-surface rounded-xl border border-border p-4 flex items-center gap-4 ${className}`}>
      <div className="p-2.5 rounded-lg bg-brand-50 text-brand-600 shrink-0">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs text-text-muted uppercase tracking-wide">{label}</p>
        <p className="text-lg font-bold text-text-primary truncate">{value}</p>
      </div>
    </div>
  );
}
