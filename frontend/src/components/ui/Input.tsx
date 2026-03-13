import { forwardRef, type InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  charCount?: { current: number; max: number };
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, charCount, className = '', id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-text-primary">
            {label}
            {props.required && <span className="text-red-500 ml-0.5">*</span>}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`
            w-full rounded-lg border px-3 py-2 text-sm
            transition-colors duration-150
            placeholder:text-text-muted
            focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500
            ${error ? 'border-red-400 focus:ring-red-500/30 focus:border-red-500' : 'border-border'}
            ${className}
          `}
          {...props}
        />
        <div className="flex justify-between">
          {error && <p className="text-xs text-red-500">{error}</p>}
          {charCount && (
            <p className={`text-xs ml-auto ${charCount.current > charCount.max ? 'text-red-500' : 'text-text-muted'}`}>
              {charCount.current}/{charCount.max}
            </p>
          )}
        </div>
      </div>
    );
  }
);

Input.displayName = 'Input';
