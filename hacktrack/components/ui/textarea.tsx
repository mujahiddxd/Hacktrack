import * as React from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, helperText, id, rows = 4, ...props }, ref) => {
    const generatedId = React.useId();
    const textareaId = id || generatedId;

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={textareaId}
            className="block text-xs font-bold uppercase tracking-wider text-ink"
          >
            {label}
          </label>
        )}
        <textarea
          id={textareaId}
          ref={ref}
          rows={rows}
          className={cn(
            "brutal-input rounded-lg text-sm resize-y font-normal",
            error && "border-[#FF5252] bg-tint-coral focus:shadow-[3px_3px_0px_#FF5252]",
            className
          )}
          {...props}
        />
        {helperText && !error && (
          <p className="text-xs text-muted font-medium">{helperText}</p>
        )}
        {error && (
          <p className="text-xs font-bold text-[#FF5252]">{error}</p>
        )}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";
