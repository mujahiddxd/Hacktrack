/**
 * Developer Streak Deck: shared types and pure calculations (safe on server and client).
 *
 * Dates are calendar days as "YYYY-MM-DD" strings in the *source's* date convention (its time zone).
 * Day arithmetic runs on UTC midnights, so DST, month/year boundaries and leap days need no special cases.
 */

export type ActivitySource = "github" | "leetcode" | "hacktrack";

export const SOURCES: ActivitySource[] = ["github", "leetcode", "hacktrack"];

/** One normalized day of activity. */
export type DailyActivity = { date: string; count: number };

export type SourceStatus =
  /** Data present and synchronized */
  | "connected"
  /** The integration exists but this user hasn't connected an account */
  | "disconnected"
  /** No verified/permitted data source is available at all */
  | "unavailable"
  /** Refresh failed and there is no previous good result to show */
  | "error";

export type SourceActivity = {
  source: ActivitySource;
  status: SourceStatus;
  /** The time zone whose calendar days `days` are counted in (e.g. "Asia/Kolkata", "UTC") */
  timeZone: string;
  /** Inclusive coverage. Days inside it are known (count may be 0); days outside are unknown, never zero. */
  rangeStart: string | null;
  rangeEnd: string | null;
  /** Only days with count > 0 are listed; absence inside the range means a known zero. */
  days: DailyActivity[];
  /** ISO time of the last successful synchronization */
  lastSyncedAt: string | null;
  /** True when a refresh failed and the last good result is being shown */
  stale: boolean;
  /** Human-readable explanation for disconnected / unavailable / error / stale states */
  message?: string;
};

export type StreakDeckPayload = { sources: SourceActivity[]; generatedAt: string };

/* ── Calendar-day helpers ── */

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

export function isValidDateKey(key: string) {
  const m = DATE_RE.exec(key);
  if (!m) return false;
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  return d.getUTCFullYear() === +m[1] && d.getUTCMonth() === +m[2] - 1 && d.getUTCDate() === +m[3];
}

function toUtc(key: string) {
  const m = DATE_RE.exec(key);
  if (!m) throw new Error(`Invalid date key: ${key}`);
  return Date.UTC(+m[1], +m[2] - 1, +m[3]);
}

function fromUtc(ms: number) {
  return new Date(ms).toISOString().slice(0, 10);
}

export function addDays(key: string, n: number) {
  return fromUtc(toUtc(key) + n * 86_400_000);
}

export function diffDays(a: string, b: string) {
  return Math.round((toUtc(a) - toUtc(b)) / 86_400_000);
}

/** 0 = Sunday … 6 = Saturday */
export function weekday(key: string) {
  return new Date(toUtc(key)).getUTCDay();
}

/** The calendar day an instant falls on in a given IANA time zone. */
export function dateInZone(instant: Date, timeZone: string) {
  // en-CA formats as YYYY-MM-DD
  return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(instant);
}

export function isValidTimeZone(tz: string) {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

/* ── Streaks ── */

export type Streak = {
  /** Consecutive active days ending today or yesterday; 0 when broken or unknown */
  current: number;
  longest: number;
  lastActiveDate: string | null;
  activeToday: boolean;
};

/**
 * Counts consecutive active days. The streak stays alive if the latest active day is today or yesterday
 * (today may simply not have happened yet). `today` must be in the same convention as `days`.
 */
export function computeStreak(days: DailyActivity[], today: string): Streak {
  const active = new Set(days.filter((d) => d.count > 0 && d.date <= today).map((d) => d.date));
  if (active.size === 0) return { current: 0, longest: 0, lastActiveDate: null, activeToday: false };

  const sorted = [...active].sort();
  let longest = 1;
  let run = 1;
  for (let i = 1; i < sorted.length; i++) {
    run = diffDays(sorted[i], sorted[i - 1]) === 1 ? run + 1 : 1;
    longest = Math.max(longest, run);
  }

  const lastActiveDate = sorted[sorted.length - 1];
  const activeToday = active.has(today);
  const anchor = activeToday ? today : active.has(addDays(today, -1)) ? addDays(today, -1) : null;

  let current = 0;
  if (anchor) {
    for (let d = anchor; active.has(d); d = addDays(d, -1)) current++;
  }
  return { current, longest, lastActiveDate, activeToday };
}

/* ── Grid ── */

export type GridCell = {
  date: string;
  /** null = no data for that day (outside coverage or in the future); never shown as zero */
  count: number | null;
};

/**
 * Week columns (Sunday→Saturday) ending with the week containing `today`.
 * Days after `today` or outside the source's coverage come back as count: null.
 */
export function buildGrid(source: Pick<SourceActivity, "days" | "rangeStart" | "rangeEnd">, today: string, weeks: number) {
  const counts = new Map(source.days.map((d) => [d.date, d.count]));
  const lastSaturday = addDays(today, 6 - weekday(today));
  const firstSunday = addDays(lastSaturday, -(weeks * 7 - 1));
  const columns: GridCell[][] = [];
  for (let w = 0; w < weeks; w++) {
    const col: GridCell[] = [];
    for (let d = 0; d < 7; d++) {
      const date = addDays(firstSunday, w * 7 + d);
      const covered =
        date <= today &&
        source.rangeStart !== null &&
        source.rangeEnd !== null &&
        date >= source.rangeStart &&
        date <= source.rangeEnd;
      col.push({ date, count: covered ? counts.get(date) ?? 0 : null });
    }
    columns.push(col);
  }
  return columns;
}

/** 0 (none) … 4 (most). Fixed thresholds keep levels comparable across platforms and over time. */
export function intensityLevel(count: number) {
  if (count <= 0) return 0;
  if (count === 1) return 1;
  if (count <= 3) return 2;
  if (count <= 6) return 3;
  return 4;
}
