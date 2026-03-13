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
        bg-surface rounded-xl border border-border
        ${hoverable ? 'hover:border-brand-200 hover:shadow-md transition-all duration-200 cursor-pointer' : ''}
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
