import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "yellow" | "coral" | "blue" | "mint" | "neutral" | "outline";
}

export function Badge({
  className,
  variant = "yellow",
  children,
  ...props
}: BadgeProps) {
  const variantStyles = {
    yellow: "bg-[#FFEB3B] text-[#121212]",
    coral: "bg-[#FF5252] text-white",
    blue: "bg-[#2196F3] text-white",
    mint: "bg-[#00E676] text-[#121212]",
    neutral: "bg-[#121212] text-white",
    outline: "bg-white text-[#121212]",
  };

  return (
    <span
      className={cn(
        "brutal-badge rounded-md font-mono text-[11px]",
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "SCHEDULED":
      return <Badge variant="blue">● Scheduled</Badge>;
    case "SENDING":
      return <Badge variant="yellow" className="animate-pulse">● Sending...</Badge>;
    case "SENT":
      return <Badge variant="mint">✓ Sent</Badge>;
    case "FAILED":
      return <Badge variant="coral">✕ Failed</Badge>;
    case "CANCELLED":
      return <Badge variant="outline">⊘ Cancelled</Badge>;
    case "PENDING":
      return <Badge variant="yellow">○ Pending</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

export function HackathonStatusBadge({
  status,
  hackathonDate,
}: {
  status: string;
  hackathonDate: Date | string;
}) {
  if (status === "REMOVED") return <Badge variant="coral">Removed</Badge>;
  if (status === "FLAGGED") return <Badge variant="coral">⚑ Flagged</Badge>;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (new Date(hackathonDate) >= today) return <Badge variant="blue">Upcoming</Badge>;
  return <Badge variant="outline">Completed</Badge>;
}
