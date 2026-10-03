import * as React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

const WIDTHS = {
  narrow: "max-w-3xl",
  default: "max-w-5xl",
  wide: "max-w-7xl",
} as const;

/** Page-level wrapper: one width rule and one vertical rhythm for every screen. */
export function PageShell({
  width = "wide",
  className,
  children,
}: {
  width?: keyof typeof WIDTHS;
  className?: string;
  children: React.ReactNode;
}) {
  return <div className={cn("mx-auto w-full space-y-6 sm:space-y-8", WIDTHS[width], className)}>{children}</div>;
}

/**
 * Level-1 heading block shared by all pages:
 * back link → eyebrow → title → description, with actions aligned right on wider screens.
 */
export function PageHeader({
  title,
  description,
  eyebrow,
  icon: Icon,
  actions,
  backHref,
  backLabel = "Back",
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  eyebrow?: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  actions?: React.ReactNode;
  backHref?: string;
  backLabel?: string;
}) {
  return (
    <header className="space-y-4">
      {backHref && (
        <Link
          href={backHref}
          className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted hover:text-ink transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          {backLabel}
        </Link>
      )}

      <div className="flex flex-col gap-4 pb-6 border-b-3 border-ink md:flex-row md:items-end md:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          {Icon && (
            <div className="hidden sm:flex w-12 h-12 shrink-0 items-center justify-center rounded-xl border-3 border-ink bg-[#FFEB3B] text-on-accent shadow-brutal-sm">
              <Icon className="w-6 h-6 text-ink" />
            </div>
          )}
          <div className="min-w-0">
            {eyebrow && (
              <p className="mb-1 font-mono text-xs font-bold uppercase tracking-wider text-muted">{eyebrow}</p>
            )}
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight leading-tight text-ink break-words">
              {title}
            </h1>
            {description && (
              <p className="mt-1.5 max-w-2xl text-sm sm:text-base font-medium leading-relaxed text-body">
                {description}
              </p>
            )}
          </div>
        </div>

        {actions && <div className="flex flex-wrap items-center gap-2 sm:gap-3 md:shrink-0 md:justify-end">{actions}</div>}
      </div>
    </header>
  );
}

/** Level-2 heading for a card or panel: icon chip, title, subtitle, optional actions. */
export function SectionHeader({
  icon: Icon,
  title,
  subtitle,
  iconClassName = "bg-[#FFEB3B] text-on-accent",
  actions,
  className,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  iconClassName?: string;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 pb-4 mb-5 border-b-2 border-ink sm:flex-row sm:items-center sm:justify-between",
        className
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        {Icon && (
          <div className={cn("shrink-0 rounded-lg border-2 border-ink p-2", iconClassName)}>
            <Icon className="w-5 h-5" />
          </div>
        )}
        <div className="min-w-0">
          <h2 className="flex flex-wrap items-center gap-2 text-lg sm:text-xl font-black tracking-tight text-ink">
            {title}
          </h2>
          {subtitle && <p className="text-xs sm:text-sm font-medium text-muted">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2 sm:shrink-0">{actions}</div>}
    </div>
  );
}

/** Numbered sub-section inside a long form. */
export function FormSection({
  step,
  title,
  icon: Icon,
  children,
  className,
}: {
  step?: number;
  title: string;
  icon?: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("space-y-4", className)}>
      <h2 className="flex items-center gap-2 pb-2 border-b-2 border-ink font-mono text-xs sm:text-sm font-bold uppercase tracking-wider text-ink">
        {step !== undefined && (
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 border-ink bg-[#FFEB3B] text-on-accent text-[11px]">
            {step}
          </span>
        )}
        {Icon && <Icon className="w-4 h-4 shrink-0" />}
        <span>{title}</span>
      </h2>
      {children}
    </section>
  );
}

/** Sticky-free action row for forms: stacked full-width on phones, right-aligned from sm up. */
export function FormActions({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "flex flex-col-reverse gap-3 pt-6 border-t-3 border-ink sm:flex-row sm:items-center sm:justify-end [&>*]:w-full sm:[&>*]:w-auto",
        className
      )}
    >
      {children}
    </div>
  );
}
