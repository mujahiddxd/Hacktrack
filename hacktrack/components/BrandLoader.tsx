"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const DEFAULT_STEPS = ["Checking your session", "Loading your hackathons", "Preparing your dashboard"];
const STEP_MS = 650;

/**
 * Branded loading screen: a softly pressing HT tile, a large title, one readable status line
 * that advances through `steps`, and a progress bar that eases towards full.
 * `overlay` covers the viewport (sign-in transitions); otherwise it fills the content area.
 */
export function BrandLoader({
  title = "Getting things ready",
  steps = DEFAULT_STEPS,
  overlay = false,
  className,
}: {
  title?: string;
  steps?: string[];
  overlay?: boolean;
  className?: string;
}) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setStep((s) => Math.min(s + 1, steps.length - 1)), STEP_MS);
    return () => clearInterval(id);
  }, [steps.length]);

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex flex-col items-center justify-center px-6 text-center",
        overlay ? "fixed inset-0 z-[100] bg-canvas" : "min-h-[60dvh]",
        className
      )}
    >
      <div className="ht-press flex h-20 w-20 items-center justify-center rounded-2xl border-3 border-ink bg-[#FFEB3B] text-3xl font-black text-on-accent">
        HT
      </div>

      <h2 className="mt-8 max-w-md text-2xl sm:text-3xl font-black leading-tight tracking-tight text-ink">
        {title}
      </h2>

      {/* Keyed so each new step fades in; min-height stops the layout from jumping */}
      <p key={step} className="ht-step-in mt-3 min-h-[1.75rem] text-base sm:text-lg font-semibold text-body">
        {steps[step]}…
      </p>

      <div className="mt-8 w-full max-w-xs">
        <div className="h-2.5 w-full overflow-hidden rounded-full border-2 border-ink bg-surface">
          <div className="ht-fill h-full rounded-full bg-ink" />
        </div>
        <div className="mt-4 flex items-center justify-center gap-2" aria-hidden="true">
          {steps.map((s, i) => (
            <span
              key={s}
              className={cn(
                "h-2 rounded-full border border-ink transition-all duration-300",
                i <= step ? "w-6 bg-[#FFEB3B] text-on-accent" : "w-2 bg-surface"
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
