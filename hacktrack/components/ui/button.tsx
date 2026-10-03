import * as React from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "blue" | "mint" | "outline" | "ghost" | "dark";
type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: "bg-[#FFEB3B] text-on-accent hover:bg-[#FDD835]",
  secondary: "bg-[#FF5252] text-white hover:bg-[#FF1744]",
  blue: "bg-[#2196F3] text-white hover:bg-[#1E88E5]",
  mint: "bg-[#00E676] text-on-accent hover:bg-[#00C853]",
  outline: "bg-surface text-ink hover:bg-quiet",
  dark: "bg-[#121212] text-white hover:bg-[#27272A]",
  ghost: "border-none shadow-none hover:bg-ink/5 hover:translate-none",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-xs rounded-md gap-1.5",
  md: "px-4 py-2 text-sm rounded-lg gap-2",
  lg: "px-6 py-3 text-base rounded-lg gap-2",
};

/**
 * Button classes for non-button elements, e.g. `<Link className={buttonVariants()}>`.
 * Avoids nesting a <button> inside an <a>, which is invalid and creates two tab stops.
 */
export function buttonVariants({
  variant = "primary",
  size = "md",
  className,
}: { variant?: ButtonVariant; size?: ButtonSize; className?: string } = {}) {
  return cn("brutal-btn text-center",variantStyles[variant], sizeStyles[size], className);
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={buttonVariants({ variant, size, className })}
        {...props}
      >
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
