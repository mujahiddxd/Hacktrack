"use client";

import { useEffect, useSyncExternalStore } from "react";
import type { StreakDeckPayload } from "@/lib/streaks/core";

/**
 * One client-side store for the deck, shared by every StreakDeck on the page. Fetches go through the server
 * cache (/api/streaks), so the homepage and dashboard always compute from the same data.
 */
export type DeckState =
  | { phase: "loading"; payload: null; error: null }
  | { phase: "ready"; payload: StreakDeckPayload; error: null }
  /** Request failed; `payload` keeps the last good response if there was one */
  | { phase: "failed"; payload: StreakDeckPayload | null; error: string };

let state: DeckState = { phase: "loading", payload: null, error: null };
let inflight: Promise<void> | null = null;
const listeners = new Set<() => void>();

function set(next: DeckState) {
  state = next;
  listeners.forEach((l) => l());
}

export function refreshStreaks() {
  if (inflight) return inflight;
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  if (!state.payload) set({ phase: "loading", payload: null, error: null });
  inflight = fetch(`/api/streaks?tz=${encodeURIComponent(timeZone)}`, { cache: "no-store" })
    .then(async (res) => {
      if (!res.ok) throw new Error(res.status === 401 ? "Please sign in again." : `Request failed (${res.status})`);
      set({ phase: "ready", payload: (await res.json()) as StreakDeckPayload, error: null });
    })
    .catch((err: unknown) => {
      set({ phase: "failed", payload: state.payload, error: err instanceof Error ? err.message : "Couldn't load streaks" });
    })
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};
const SERVER_STATE: DeckState = { phase: "loading", payload: null, error: null };

export function useStreaks() {
  const snapshot = useSyncExternalStore(subscribe, () => state, () => SERVER_STATE);
  useEffect(() => {
    // Refresh on every mount (navigating between Home and Dashboard); the server cache keeps this cheap
    refreshStreaks();
  }, []);
  return snapshot;
}
