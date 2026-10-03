import { prisma } from "@/lib/prisma";
import { addDays, dateInZone, type ActivitySource, type SourceActivity, type StreakDeckPayload } from "./core";

/**
 * Server-side data for the Developer Streak Deck. Every source returns the same normalized SourceActivity.
 *
 * Data sources (verified in this codebase):
 * - HackTrack: ActivityEvent rows written after successful actions (lib/activity.ts). Counted in the
 *   viewer's time zone, since that's the day the user experienced.
 * - GitHub: no verified integration exists yet (no GitHub OAuth app or token; a self-entered profile URL
 *   doesn't prove account ownership), so it reports "unavailable" instead of guessing.
 * - LeetCode: no official or permitted API for activity, so it reports "unavailable".
 */

/** About a year, so every grid width has data to show */
const RANGE_DAYS = 371;
const TTL_MS: Record<ActivitySource, number> = {
  hacktrack: 30_000,
  github: 30 * 60_000,
  leetcode: 30 * 60_000,
};

type CacheEntry = { value: SourceActivity; fetchedAt: number };

// Per-process cache, keyed by user, so one user can never be served another's data.
// Note: it resets on server restart / per serverless instance; it's a speed and resilience layer, not storage.
const fresh = new Map<string, CacheEntry>();
const lastGood = new Map<string, SourceActivity>();

/** Test helper: forget cached results so a fresh load is forced */
export function expireStreakCache() {
  fresh.clear();
}

/** Exported for tests. */
export async function cached(
  source: ActivitySource,
  userId: string,
  timeZone: string,
  load: () => Promise<SourceActivity>
): Promise<SourceActivity> {
  const key = `${source}:${userId}:${timeZone}`;
  const hit = fresh.get(key);
  if (hit && Date.now() - hit.fetchedAt < TTL_MS[source]) return hit.value;

  try {
    const value = await load();
    fresh.set(key, { value, fetchedAt: Date.now() });
    if (value.status === "connected") lastGood.set(key, value);
    return value;
  } catch (err) {
    console.error(`[Streaks] ${source} refresh failed:`, err instanceof Error ? err.message : err);
    const previous = lastGood.get(key);
    if (previous) {
      // Keep showing the last valid result, clearly marked as stale
      return { ...previous, stale: true, message: "Couldn't refresh. Showing the last synced activity." };
    }
    return {
      source,
      status: "error",
      timeZone,
      rangeStart: null,
      rangeEnd: null,
      days: [],
      lastSyncedAt: null,
      stale: false,
      message: "Couldn't load activity right now.",
    };
  }
}

async function loadHackTrack(userId: string, timeZone: string): Promise<SourceActivity> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { createdAt: true } });
  if (!user) throw new Error("User not found");

  const now = new Date();
  const today = dateInZone(now, timeZone);
  // Coverage starts no earlier than the account itself: before that we know nothing, so those days stay unknown
  const accountStart = dateInZone(user.createdAt, timeZone);
  const windowStart = addDays(today, -(RANGE_DAYS - 1));
  const rangeStart = accountStart > windowStart ? accountStart : windowStart;

  const events = await prisma.activityEvent.findMany({
    // One extra day of margin either side of the window covers every time-zone offset
    where: { userId, occurredAt: { gte: new Date(Date.parse(`${addDays(rangeStart, -1)}T00:00:00Z`)) } },
    select: { occurredAt: true },
  });

  const counts = new Map<string, number>();
  for (const e of events) {
    const day = dateInZone(e.occurredAt, timeZone);
    if (day >= rangeStart && day <= today) counts.set(day, (counts.get(day) ?? 0) + 1);
  }

  return {
    source: "hacktrack",
    status: "connected",
    timeZone,
    rangeStart,
    rangeEnd: today,
    days: [...counts].map(([date, count]) => ({ date, count })).sort((a, b) => a.date.localeCompare(b.date)),
    lastSyncedAt: now.toISOString(),
    stale: false,
  };
}

function unavailable(source: ActivitySource, timeZone: string, message: string): SourceActivity {
  return { source, status: "unavailable", timeZone, rangeStart: null, rangeEnd: null, days: [], lastSyncedAt: null, stale: false, message };
}

async function loadGitHub(timeZone: string): Promise<SourceActivity> {
  return unavailable(
    "github",
    timeZone,
    "GitHub sync isn't set up yet. It needs a verified GitHub connection (OAuth) so HackTrack only shows contributions from an account you own."
  );
}

async function loadLeetCode(timeZone: string): Promise<SourceActivity> {
  return unavailable(
    "leetcode",
    timeZone,
    "LeetCode doesn't offer an official API for solve history, so HackTrack can't sync it reliably yet."
  );
}

export async function getStreakDeck(userId: string, timeZone: string): Promise<StreakDeckPayload> {
  const [github, leetcode, hacktrack] = await Promise.all([
    cached("github", userId, timeZone, () => loadGitHub(timeZone)),
    cached("leetcode", userId, timeZone, () => loadLeetCode(timeZone)),
    cached("hacktrack", userId, timeZone, () => loadHackTrack(userId, timeZone)),
  ]);
  return { sources: [github, leetcode, hacktrack], generatedAt: new Date().toISOString() };
}
