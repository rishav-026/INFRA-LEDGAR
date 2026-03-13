import type { ReactNode } from 'react';
import type { RiskLevel, ProjectStatus } from '../../types';

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info';

interface BadgeProps {
  variant?: BadgeVariant;
  children: ReactNode;
  dot?: boolean;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-gray-100 text-gray-700',
  success: 'bg-green-50 text-green-700',
  warning: 'bg-yellow-50 text-yellow-700',
  danger: 'bg-red-50 text-red-700',
  info: 'bg-blue-50 text-blue-700',
};

const dotColors: Record<BadgeVariant, string> = {
  default: 'bg-gray-400',
  success: 'bg-green-500',
  warning: 'bg-yellow-500',
  danger: 'bg-red-500',
  info: 'bg-blue-500',
};

export function Badge({ variant = 'default', children, dot = false, className = '' }: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5
        text-xs font-medium whitespace-nowrap
        ${variantClasses[variant]}
        ${className}
      `}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotColors[variant]}`} />}
      {children}
    </span>
  );
}

/* ─── Convenience helpers ─── */

const riskVariantMap: Record<RiskLevel, BadgeVariant> = {
  normal: 'success',
  medium: 'warning',
  high: 'danger',
};

export function RiskBadge({ level }: { level: RiskLevel | null }) {
  if (!level) return <Badge variant="default">Not Analyzed</Badge>;
  const labels: Record<RiskLevel, string> = { normal: 'Normal', medium: 'Medium Risk', high: 'High Risk' };
  return <Badge variant={riskVariantMap[level]} dot>{labels[level]}</Badge>;
}

const statusVariantMap: Record<ProjectStatus, BadgeVariant> = {
  active: 'info',
  completed: 'success',
  flagged: 'danger',
  archived: 'default',
};

export function StatusBadge({ status }: { status: ProjectStatus }) {
  return <Badge variant={statusVariantMap[status]} dot>{status.charAt(0).toUpperCase() + status.slice(1)}</Badge>;
}

export function RoleBadge({ role }: { role: string }) {
  const map: Record<string, BadgeVariant> = { government: 'info', contractor: 'warning', citizen: 'default' };
  const label: Record<string, string> = { government: 'Government', contractor: 'Contractor', citizen: 'Citizen' };
  return <Badge variant={map[role] || 'default'}>{label[role] || role}</Badge>;
}
