import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  header?: ReactNode;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
}

const paddingClasses = {
  none: '',
  sm: 'p-3',
  md: 'p-5',
  lg: 'p-6',
};

export function Card({
  children,
  header,
  padding = 'md',
  className = '',
  onClick,
  hoverable = false,
}: CardProps) {
  return (
    <div
      onClick={onClick}
      className={`
        bg-surface rounded-2xl border border-slate-200/80 shadow-[0_8px_24px_rgba(15,23,42,0.05)]
        ${hoverable ? 'hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-[0_14px_30px_rgba(37,99,235,0.15)] transition-all duration-200 cursor-pointer' : ''}
        ${className}
      `}
    >
      {header && (
        <div className="px-5 py-3 border-b border-border">
          {header}
        </div>
      )}
      <div className={paddingClasses[padding]}>
        {children}
      </div>
    </div>
  );
}
