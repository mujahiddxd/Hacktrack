"use client";

import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Toggleable chips that submit as one comma-joined hidden input, so they work
 * inside plain <form action={...}> without extra client state wiring.
 */
export function ChipSelect({
  name,
  label,
  helperText,
  options,
  defaultValue,
  max,
}: {
  name: string;
  label: string;
  helperText?: string;
  options: readonly string[];
  defaultValue?: string | null;
  max?: number;
}) {
  const [selected, setSelected] = React.useState<string[]>(() =>
    (defaultValue ?? "").split(",").map((s) => s.trim()).filter(Boolean)
  );
  const labelId = React.useId();

  function toggle(option: string) {
    setSelected((prev) => {
      if (prev.includes(option)) return prev.filter((o) => o !== option);
      if (max && prev.length >= max) return prev;
      return [...prev, option];
    });
  }

  return (
    <div className="w-full space-y-2">
      <div className="flex items-baseline justify-between gap-3">
        <span id={labelId} className="block text-xs font-bold uppercase tracking-wider text-ink">
          {label}
        </span>
        {max && (
          <span className="font-mono text-[11px] font-bold text-muted">
            {selected.length}/{max}
          </span>
        )}
      </div>
      <div role="group" aria-labelledby={labelId} className="flex flex-wrap gap-2">
        {options.map((option) => {
          const isOn = selected.includes(option);
          const isDisabled = !isOn && !!max && selected.length >= max;
          return (
            <button
              key={option}
              type="button"
              aria-pressed={isOn}
              disabled={isDisabled}
              onClick={() => toggle(option)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border-2 border-ink px-3 py-1.5 text-xs font-bold transition-all",
                isOn
                  ? "bg-[#FFEB3B] text-on-accent shadow-brutal-sm"
                  : "bg-surface text-ink hover:bg-quiet",
                isDisabled && "cursor-not-allowed opacity-40"
              )}
            >
              {isOn && <Check className="h-3.5 w-3.5" />}
              {option}
            </button>
          );
        })}
      </div>
      {helperText && <p className="text-xs font-medium text-muted">{helperText}</p>}
      <input type="hidden" name={name} value={selected.join(",")} />
    </div>
  );
}

/** Large single-choice cards (radio semantics) for short option lists. */
export function ChoiceCards({
  name,
  label,
  options,
  defaultValue,
  columns = 2,
}: {
  name: string;
  label: string;
  options: readonly { value: string; label: string; hint?: string }[];
  defaultValue?: string | null;
  columns?: 2 | 3 | 4;
}) {
  const [value, setValue] = React.useState(defaultValue ?? "");
  const cols = { 2: "sm:grid-cols-2", 3: "sm:grid-cols-3", 4: "sm:grid-cols-2 lg:grid-cols-4" }[columns];

  return (
    <fieldset className="w-full space-y-2">
      <legend className="mb-2 block text-xs font-bold uppercase tracking-wider text-ink">{label}</legend>
      <div className={cn("grid grid-cols-1 gap-3", cols)}>
        {options.map((opt) => {
          const isOn = value === opt.value;
          return (
            <label
              key={opt.value}
              className={cn(
                "relative flex cursor-pointer flex-col gap-0.5 rounded-xl border-2 border-ink p-3.5 transition-all has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[#2196F3]",
                isOn ? "bg-[#FFEB3B] text-on-accent shadow-brutal-sm -translate-y-0.5" : "bg-surface hover:bg-quiet"
              )}
            >
              <input
                type="radio"
                name={name}
                value={opt.value}
                checked={isOn}
                onChange={() => setValue(opt.value)}
                className="sr-only"
              />
              <span className="text-sm font-black text-ink">{opt.label}</span>
              {opt.hint && <span className="text-xs font-medium text-body">{opt.hint}</span>}
              {isOn && <Check className="absolute right-3 top-3 h-4 w-4 text-ink" />}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
