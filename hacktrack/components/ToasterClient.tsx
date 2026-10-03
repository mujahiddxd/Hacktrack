"use client";

import { useSyncExternalStore } from "react";
import { Toaster } from "sonner";
import { readPreference, resolveTheme, subscribeTheme, type ResolvedTheme } from "@/lib/theme";

export function ToasterClient() {
  // Follow the app's resolved theme (not just the OS), so a manual Light/Dark choice also applies to toasts
  const theme = useSyncExternalStore<ResolvedTheme>(
    subscribeTheme,
    () => resolveTheme(readPreference()),
    () => "light"
  );

  return (
    <Toaster
      position="top-right"
      theme={theme}
      toastOptions={{
        className: "rounded-lg font-bold text-sm",
        // Inline so Sonner's own theme styles can't override the brutal look
        style: {
          background: "var(--ht-surface)",
          color: "var(--ht-ink)",
          border: "3px solid var(--ht-ink)",
          boxShadow: "4px 4px 0px var(--ht-shadow)",
        },
      }}
    />
  );
}
