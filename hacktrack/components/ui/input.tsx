import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", label, error, helperText, id, ...props }, ref) => {
    const inputId = id || React.useId();

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-bold uppercase tracking-wider text-[#121212]"
          >
            {label}
          </label>
        )}
        <input
          id={inputId}
          type={type}
          ref={ref}
          className={cn(
            "brutal-input rounded-lg text-sm",
            error && "border-[#FF5252] bg-red-50 focus:shadow-[3px_3px_0px_#FF5252]",
            className
          )}
          {...props}
        />
        {helperText && !error && (
          <p className="text-xs text-[#71717A] font-medium">{helperText}</p>
        )}
        {error && (
          <p className="text-xs font-bold text-[#FF5252]">{error}</p>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";
