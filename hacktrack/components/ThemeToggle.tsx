"use client";

import { useLayoutEffect, useRef, useSyncExternalStore, type KeyboardEvent } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  applyTheme,
  readPreference,
  resolveTheme,
  setPreference,
  subscribeTheme,
  type ThemePreference,
} from "@/lib/theme";

const usePreference = () =>
  useSyncExternalStore<ThemePreference>(subscribeTheme, readPreference, () => "system");

/**
 * Mounted once in the root layout. Keeps System mode following the OS while any page is open, and
 * re-applies the theme after React's development-only remount resets <html> attributes.
 */
export function ThemeController() {
  const pref = usePreference();
  useLayoutEffect(() => {
    applyTheme(resolveTheme(pref));
  }, [pref]);
  return null;
}

const OPTIONS: { value: ThemePreference; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
];

/** Light / Dark / System as a radio group (arrow keys move and select, like native radios). */
export function ThemeToggle({ showLabels = false, className }: { showLabels?: boolean; className?: string }) {
  const pref = usePreference();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  function onKeyDown(e: KeyboardEvent<HTMLButtonElement>, index: number) {
    const step = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
    if (!step) return;
    e.preventDefault();
    const next = (index + step + OPTIONS.length) % OPTIONS.length;
    setPreference(OPTIONS[next].value);
    refs.current[next]?.focus();
  }

  return (
    <div
      role="radiogroup"
      aria-label="Colour theme"
      className={cn("inline-flex items-center gap-0.5 rounded-lg border-2 border-ink bg-surface p-0.5", className)}
    >
      {OPTIONS.map(({ value, label, icon: Icon }, i) => {
        const checked = pref === value;
        return (
          <button
            key={value}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="radio"
            aria-checked={checked}
            aria-label={showLabels ? undefined : `${label} theme`}
            title={showLabels ? undefined : `${label} theme`}
            tabIndex={checked ? 0 : -1}
            onClick={() => setPreference(value)}
            onKeyDown={(e) => onKeyDown(e, i)}
            className={cn(
              "inline-flex items-center justify-center gap-1.5 rounded-md text-xs font-bold transition-colors",
              showLabels ? "flex-1 px-2.5 py-1.5" : "h-7 w-7",
              checked ? "bg-primary-yellow text-on-accent" : "text-muted hover:bg-quiet hover:text-ink"
            )}
          >
            <Icon className="h-3.5 w-3.5" aria-hidden="true" />
            {showLabels && label}
          </button>
        );
      })}
    </div>
  );
}
