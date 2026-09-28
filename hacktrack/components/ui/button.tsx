import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "blue" | "mint" | "outline" | "ghost" | "dark";
  size?: "sm" | "md" | "lg";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", children, ...props }, ref) => {
    const variantStyles = {
      primary: "bg-[#FFEB3B] text-[#121212] hover:bg-[#FDD835]",
      secondary: "bg-[#FF5252] text-white hover:bg-[#FF1744]",
      blue: "bg-[#2196F3] text-white hover:bg-[#1E88E5]",
      mint: "bg-[#00E676] text-[#121212] hover:bg-[#00C853]",
      outline: "bg-white text-[#121212] hover:bg-[#F4F4F5]",
      dark: "bg-[#121212] text-white hover:bg-[#27272A]",
      ghost: "border-none shadow-none hover:bg-black/5 hover:translate-none",
    };

    const sizeStyles = {
      sm: "px-3 py-1.5 text-xs rounded-md",
      md: "px-4 py-2 text-sm rounded-lg",
      lg: "px-6 py-3 text-base rounded-lg",
    };

    return (
      <button
        ref={ref}
        className={cn(
          "brutal-btn",
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
