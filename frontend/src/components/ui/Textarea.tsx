import { forwardRef, type TextareaHTMLAttributes } from 'react';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  charCount?: { current: number; max: number };
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, charCount, className = '', id, ...props }, ref) => {
    const textareaId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={textareaId} className="text-sm font-medium text-text-primary">
            {label}
            {props.required && <span className="text-red-500 ml-0.5">*</span>}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          rows={3}
          className={`
            w-full rounded-lg border px-3 py-2 text-sm resize-none
            transition-colors duration-150
            placeholder:text-text-muted
            focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500
            ${error ? 'border-red-400' : 'border-border'}
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

Textarea.displayName = 'Textarea';
