"use client";

import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import Link from "next/link";
import { ChevronDown, CloudOff, CodeXml, Flame, RefreshCw, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  SOURCES,
  buildGrid,
  computeStreak,
  intensityLevel,
  type ActivitySource,
  type GridCell,
  type SourceActivity,
} from "@/lib/streaks/core";
import { refreshStreaks, useStreaks } from "./streak-store";

/* ── Platform look ── */

const PLATFORM: Record<ActivitySource, { name: string; accent: string; onAccent: string; unit: string }> = {
  github: { name: "GitHub", accent: "#7C3AED", onAccent: "#FFFFFF", unit: "contribution" },
  leetcode: { name: "LeetCode", accent: "#FFB300", onAccent: "#121212", unit: "accepted solution" },
  hacktrack: { name: "HackTrack", accent: "#00E676", onAccent: "#121212", unit: "action" },
};

function PlatformIcon({ source, className }: { source: ActivitySource; className?: string }) {
  if (source === "github") {
    return (
      <svg viewBox="0 0 16 16" aria-hidden="true" className={className} fill="currentColor">
        <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
      </svg>
    );
  }
  if (source === "leetcode") return <CodeXml className={className} aria-hidden="true" />;
  return (
    <span aria-hidden="true" className={cn("font-black leading-none", className)} style={{ fontSize: "0.7em" }}>
      HT
    </span>
  );
}

/* ── Sizes ── */

type DeckSize = "large" | "compact";

const SIZE = {
  large: {
    cell: 13,
    gap: 3,
    // Rear card offsets: [x, y, rotate]
    rear: [
      // Wide cards: keep rotation small, or the far corners swing into the dropdown
      [14, -12, 0.8],
      [27, -23, 1.6],
    ],
    pad: "pt-8 pr-9",
    outMs: 190,
    inMs: 310,
    shift: 36,
  },
  compact: {
    cell: 10,
    gap: 2,
    rear: [
      [8, -7, 0.6],
      [15, -13, 1.2],
    ],
    pad: "pt-5 pr-6",
    outMs: 130,
    inMs: 210,
    shift: 22,
  },
} as const;

const WEEKS = 53;
const DAY_LABELS = ["", "Mon", "", "Wed", "", "Fri", ""];

const dayFormat = (date: string) =>
  new Intl.DateTimeFormat(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(
    new Date(`${date}T00:00:00Z`)
  );
const shortDate = (date: string) =>
  new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", timeZone: "UTC" }).format(new Date(`${date}T00:00:00Z`));
const timeFormat = (iso: string) =>
  new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit", month: "short", day: "numeric" }).format(new Date(iso));

const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ── Deck ── */

export function StreakDeck({ size = "large", className }: { size?: DeckSize; className?: string }) {
  const S = SIZE[size];
  const { phase, payload, error } = useStreaks();
  const selectId = useId();

  // `selected` follows the dropdown immediately; `shown` is what the front card renders and only swaps
  // at the midpoint of the transition, so content is never stale and never changes mid-flight twice.
  const [selected, setSelected] = useState<ActivitySource>("hacktrack");
  const [shown, setShown] = useState<ActivitySource>("hacktrack");

  const frontRef = useRef<HTMLDivElement>(null);
  const scanRef = useRef<HTMLDivElement>(null);
  const targetRef = useRef<ActivitySource>("hacktrack");
  const running = useRef<Animation[]>([]);
  const pendingIn = useRef(false);

  function stopAll() {
    for (const a of running.current) {
      try {
        a.commitStyles(); // continue from where the card visually is
      } catch {
        // element may be detached; ignore
      }
      a.cancel();
    }
    running.current = [];
  }

  function select(next: ActivitySource) {
    setSelected(next);
    targetRef.current = next;
    const front = frontRef.current;
    if (prefersReducedMotion() || !front || typeof front.animate !== "function") {
      stopAll();
      if (front) front.style.cssText = "";
      setShown(next);
      return;
    }
    stopAll();
    // 1. Current card shifts sideways and recedes
    const out = front.animate(
      [{}, { transform: `translateX(${-S.shift}px) translateY(6px) rotate(-3deg) scale(0.95)`, opacity: 0.35 }],
      { duration: S.outMs, easing: "cubic-bezier(0.4, 0, 1, 1)", fill: "forwards" }
    );
    running.current.push(out);
    out.onfinish = () => {
      if (targetRef.current !== next) return; // superseded by a newer choice
      pendingIn.current = true;
      setShown(next);
    };
  }

  // 2–4. Selected card moves forward and straightens, a faint scan crosses the grid, then it settles
  useLayoutEffect(() => {
    if (!pendingIn.current) return;
    pendingIn.current = false;
    const front = frontRef.current;
    if (!front) return;
    stopAll();
    front.style.cssText = "";
    const inAnim = front.animate(
      [
        { transform: `translateX(${S.shift}px) translateY(4px) rotate(2.5deg) scale(0.96)`, opacity: 0.4 },
        { transform: "translateX(-2px) rotate(-0.4deg) scale(1.005)", opacity: 1, offset: 0.75 },
        { transform: "none", opacity: 1 },
      ],
      { duration: S.inMs, easing: "cubic-bezier(0.22, 1, 0.36, 1)" }
    );
    running.current.push(inAnim);
    const scan = scanRef.current;
    if (scan) {
      const scanAnim = scan.animate(
        [
          { transform: "translateX(-100%)", opacity: 0 },
          { opacity: 0.55, offset: 0.3 },
          { transform: "translateX(300%)", opacity: 0 },
        ],
        { duration: S.inMs * 0.9, delay: S.inMs * 0.1, easing: "ease-in-out" }
      );
      running.current.push(scanAnim);
    }
    inAnim.onfinish = () => {
      running.current = running.current.filter((a) => a !== inAnim);
    };
  }, [shown, S.inMs, S.shift]);

  // Clean up animations if the deck unmounts mid-transition
  useEffect(() => () => running.current.forEach((a) => a.cancel()), []);

  const order = [shown, ...SOURCES.filter((s) => s !== shown)];
  const data = payload?.sources.find((s) => s.source === shown) ?? null;
  const requestFailed = phase === "failed";

  return (
    <div className={cn("w-full", className)}>
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <label htmlFor={selectId} className="block font-mono text-xs font-bold uppercase tracking-wider text-muted">
            Streak source
          </label>
          <div className="relative mt-1 w-48">
            <select
              id={selectId}
              value={selected}
              onChange={(e) => select(e.target.value as ActivitySource)}
              className="brutal-input appearance-none rounded-lg py-2 pr-10 text-sm font-bold"
            >
              {SOURCES.map((s) => (
                <option key={s} value={s}>
                  {PLATFORM[s].name}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink" aria-hidden="true" />
          </div>
        </div>
        {requestFailed && payload && (
          <button
            type="button"
            onClick={() => refreshStreaks()}
            className="inline-flex items-center gap-1.5 rounded-md border-2 border-ink bg-surface px-2.5 py-1 font-mono text-xs font-bold text-ink hover:bg-quiet"
          >
            <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
            Retry
          </button>
        )}
      </div>

      <div className={cn("relative", S.pad)}>
        {/* Two decorative rear cards: the other platforms peeking out behind */}
        {order.slice(1).map((source, i) => {
          const [x, y, r] = S.rear[i];
          return (
            <div
              key={`rear-${i}`}
              aria-hidden="true"
              inert
              className="pointer-events-none absolute inset-0 rounded-2xl border-3 border-ink bg-surface shadow-brutal transition-transform duration-300"
              style={{
                top: size === "large" ? 32 : 20,
                right: size === "large" ? 36 : 24,
                transform: `translate(${x}px, ${y}px) rotate(${r}deg)`,
                zIndex: 2 - i,
              }}
            >
              <div className="h-3 rounded-t-[13px]" style={{ backgroundColor: PLATFORM[source].accent }} />
            </div>
          );
        })}

        {/* Front card: the only interactive one */}
        <div
          ref={frontRef}
          className="relative z-10 rounded-2xl border-3 border-ink bg-surface shadow-brutal-lg"
          aria-busy={phase === "loading"}
        >
          <div className="h-3 rounded-t-[13px] border-b-2 border-ink" style={{ backgroundColor: PLATFORM[shown].accent }} />
          <FrontCard
            source={shown}
            data={data}
            loading={phase === "loading" && !payload}
            requestError={!payload && requestFailed ? error : null}
            size={size}
            scanRef={scanRef}
          />
        </div>
      </div>
    </div>
  );
}

/* ── Front card content ── */

function FrontCard({
  source,
  data,
  loading,
  requestError,
  size,
  scanRef,
}: {
  source: ActivitySource;
  data: SourceActivity | null;
  loading: boolean;
  requestError: string | null;
  size: DeckSize;
  scanRef: React.RefObject<HTMLDivElement | null>;
}) {
  const S = SIZE[size];
  const meta = PLATFORM[source];
  const hasData = !!data && (data.status === "connected" || data.stale) && data.rangeEnd !== null;
  const today = data?.rangeEnd ?? null;
  const streak = useMemo(() => (hasData && today ? computeStreak(data!.days, today) : null), [hasData, data, today]);
  const empty = hasData && data!.days.length === 0;

  return (
    <div className={cn(size === "large" ? "p-5 sm:p-6" : "p-4 sm:p-5")}>
      {/* Header: platform + streak */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-ink shadow-brutal-sm"
            style={{ backgroundColor: meta.accent, color: meta.onAccent }}
          >
            <PlatformIcon source={source} className="h-5 w-5" />
          </span>
          <div>
            <h3 className="text-lg font-black leading-tight text-ink">{meta.name}</h3>
            <StatusLine data={data} loading={loading} requestError={requestError} />
          </div>
        </div>

        <div className="text-right">
          {loading ? (
            <p className="text-2xl font-black text-faint">—</p>
          ) : streak ? (
            <>
              <p className={cn("flex items-center justify-end gap-1.5 font-black text-ink", size === "large" ? "text-2xl sm:text-3xl" : "text-xl sm:text-2xl")}>
                {streak.current > 0 && <Flame className="h-6 w-6" style={{ color: meta.accent === "#00E676" ? "#00C853" : meta.accent }} aria-hidden="true" />}
                {streak.current > 0 ? `${streak.current}-day streak` : "No active streak"}
              </p>
              <p className="text-xs font-medium text-muted">
                {streak.longest > 0 ? `Longest ${streak.longest} day${streak.longest === 1 ? "" : "s"}` : "No activity yet"}
                {streak.lastActiveDate && ` · Last active ${shortDate(streak.lastActiveDate)}`}
              </p>
            </>
          ) : (
            <p className="text-sm font-bold text-muted">Streak unavailable</p>
          )}
        </div>
      </div>

      {/* Body: grid or an honest state panel, same footprint so nothing jumps */}
      <div className="mt-4">
        {hasData || loading ? (
          <ActivityGrid data={hasData ? data! : null} source={source} size={size} scanRef={scanRef} />
        ) : (
          <StatePanel source={source} data={data} requestError={requestError} gridHeight={7 * S.cell + 6 * S.gap + 20} />
        )}
      </div>

      {empty && source === "hacktrack" && (
        <p className="mt-3 text-sm font-medium text-body">
          No HackTrack activity recorded yet.{" "}
          <Link href="/hackathons/new" className="font-bold text-ink underline underline-offset-2">
            Add a hackathon
          </Link>{" "}
          to start a streak.
        </p>
      )}

      {/* Footer: legend + date convention + sync time */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 text-[11px] font-medium text-muted">
        <Legend accent={meta.accent} cell={S.cell} />
        {data && hasData && (
          <span>
            Days counted in {data.timeZone === "UTC" ? "UTC" : data.timeZone.replace(/_/g, " ")}
            {data.lastSyncedAt && ` · Synced ${timeFormat(data.lastSyncedAt)}`}
          </span>
        )}
      </div>
    </div>
  );
}

function StatusLine({ data, loading, requestError }: { data: SourceActivity | null; loading: boolean; requestError: string | null }) {
  let tone = "bg-quiet text-muted";
  let text = "Loading…";
  if (requestError) {
    tone = "bg-tint-coral text-ink";
    text = "Couldn't load";
  } else if (!loading && data) {
    if (data.stale) {
      tone = "bg-tint-yellow text-ink";
      text = "Stale";
    } else if (data.status === "connected") {
      tone = "bg-tint-mint text-ink";
      text = "Synced";
    } else if (data.status === "disconnected") {
      text = "Not connected";
    } else if (data.status === "unavailable") {
      text = "Unavailable";
    } else if (data.status === "error") {
      tone = "bg-tint-coral text-ink";
      text = "Refresh failed";
    }
  }
  return (
    <span className={cn("mt-0.5 inline-block rounded border border-ink px-1.5 py-px font-mono text-[10px] font-bold uppercase tracking-wider", tone)}>
      {text}
    </span>
  );
}

function StatePanel({
  source,
  data,
  requestError,
  gridHeight,
}: {
  source: ActivitySource;
  data: SourceActivity | null;
  requestError: string | null;
  gridHeight: number;
}) {
  const failed = !!requestError || data?.status === "error";
  const Icon = failed ? TriangleAlert : CloudOff;
  return (
    <div
      className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-ink/40 bg-canvas px-4 py-4 text-center"
      style={{ minHeight: gridHeight }}
    >
      <Icon className="h-6 w-6 text-muted" aria-hidden="true" />
      <p className="max-w-md text-sm font-bold text-ink">
        {failed
          ? requestError ?? data?.message ?? "Couldn't load activity."
          : data?.message ?? `${PLATFORM[source].name} activity isn't available.`}
      </p>
      {failed ? (
        <button
          type="button"
          onClick={() => refreshStreaks()}
          className="inline-flex items-center gap-1.5 rounded-md border-2 border-ink bg-surface px-2.5 py-1 font-mono text-xs font-bold text-ink hover:bg-quiet"
        >
          <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
          Try again
        </button>
      ) : (
        <p className="text-xs font-medium text-muted">No activity is shown rather than guessing. Nothing here counts as zero.</p>
      )}
    </div>
  );
}

function Legend({ accent, cell }: { accent: string; cell: number }) {
  const box = { width: cell, height: cell } as CSSProperties;
  return (
    <span className="flex items-center gap-1.5" aria-label="Intensity legend: less to more, plus no-data">
      <span>Less</span>
      {[0, 1, 2, 3, 4].map((lvl) => (
        <span key={lvl} className="rounded-[3px] border border-ink/25" style={{ ...box, background: levelColor(lvl, accent) }} />
      ))}
      <span>More</span>
      <span className="ml-2 rounded-[3px] border border-dashed border-ink/40" style={box} />
      <span>No data</span>
    </span>
  );
}

function levelColor(level: number, accent: string) {
  if (level === 0) return "var(--ht-quiet)";
  const pct = [0, 30, 55, 78, 100][level];
  return `color-mix(in srgb, ${accent} ${pct}%, var(--ht-surface))`;
}

/* ── Activity grid ── */

function ActivityGrid({
  data,
  source,
  size,
  scanRef,
}: {
  data: SourceActivity | null;
  source: ActivitySource;
  size: DeckSize;
  scanRef: React.RefObject<HTMLDivElement | null>;
}) {
  const S = SIZE[size];
  const meta = PLATFORM[source];
  // Loading skeleton uses the same shape as real data
  const today = data?.rangeEnd ?? null;
  const columns = useMemo<GridCell[][]>(() => {
    if (data && today) return buildGrid(data, today, WEEKS);
    return Array.from({ length: WEEKS }, () => Array.from({ length: 7 }, (_, d) => ({ date: `skeleton-${d}`, count: null })));
  }, [data, today]);
  const flat = useMemo(() => columns.flat(), [columns]);

  const lastKnown = useMemo(() => {
    for (let i = flat.length - 1; i >= 0; i--) if (flat[i].count !== null) return i;
    return flat.length - 1;
  }, [flat]);
  const [focusIndex, setFocusIndex] = useState<number | null>(null);
  const [detailIndex, setDetailIndex] = useState<number | null>(null);
  const activeIndex = focusIndex ?? lastKnown;

  const scrollRef = useRef<HTMLDivElement>(null);
  const cellRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Newest weeks first in view; older weeks stay reachable by scrolling or arrow keys
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollLeft = el.scrollWidth;
  }, [source, data]);

  function move(e: KeyboardEvent, index: number) {
    const delta: Record<string, number> = { ArrowUp: -1, ArrowDown: 1, ArrowLeft: -7, ArrowRight: 7 };
    let next = index;
    if (e.key in delta) next = index + delta[e.key];
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = lastKnown;
    else return;
    e.preventDefault();
    next = Math.max(0, Math.min(flat.length - 1, next));
    setFocusIndex(next);
    setDetailIndex(next);
    cellRefs.current[next]?.focus();
  }

  const detail = detailIndex !== null && data ? flat[detailIndex] : null;
  // Label the column that contains each month's 1st
  const monthLabels = columns.map((col) => {
    const first = data ? col.find((c) => c.date.endsWith("-01")) : undefined;
    return first ? new Intl.DateTimeFormat(undefined, { month: "short", timeZone: "UTC" }).format(new Date(`${first.date}T00:00:00Z`)) : "";
  });

  const step = S.cell + S.gap;
  return (
    <div>
      <div className="flex gap-2">
        {/* Weekday labels */}
        <div aria-hidden="true" className="flex shrink-0 flex-col pt-[18px] text-[10px] font-medium text-muted" style={{ gap: S.gap }}>
          {DAY_LABELS.map((l, i) => (
            <span key={i} className="leading-none" style={{ height: S.cell, lineHeight: `${S.cell}px` }}>
              {l}
            </span>
          ))}
        </div>

        <div ref={scrollRef} className="relative min-w-0 overflow-x-auto pb-1">
          {/* Month labels */}
          <div aria-hidden="true" className="relative h-[18px] text-[10px] font-medium text-muted" style={{ width: WEEKS * step }}>
            {monthLabels.map((m, i) =>
              m ? (
                <span key={i} className="absolute top-0 whitespace-nowrap" style={{ left: i * step }}>
                  {m}
                </span>
              ) : null
            )}
          </div>

          <div
            role="group"
            aria-label={`${meta.name} daily activity, last ${WEEKS} weeks. Use arrow keys to move between days.`}
            className="relative grid grid-flow-col"
            style={{ gridTemplateRows: `repeat(7, ${S.cell}px)`, gridAutoColumns: `${S.cell}px`, gap: S.gap, width: WEEKS * step - S.gap }}
          >
            {flat.map((cell, i) => {
              const known = cell.count !== null && !!data;
              const label = !data
                ? "Loading"
                : cell.count === null
                  ? `${dayFormat(cell.date)}: no data`
                  : `${dayFormat(cell.date)}: ${cell.count} ${meta.unit}${cell.count === 1 ? "" : "s"}`;
              return (
                <button
                  key={`${cell.date}-${i}`}
                  ref={(el) => {
                    cellRefs.current[i] = el;
                  }}
                  type="button"
                  disabled={!data}
                  tabIndex={data && i === activeIndex ? 0 : -1}
                  aria-label={label}
                  onKeyDown={(e) => move(e, i)}
                  onFocus={() => {
                    setFocusIndex(i);
                    setDetailIndex(i);
                  }}
                  onMouseEnter={() => setDetailIndex(i)}
                  onClick={() => {
                    setFocusIndex(i);
                    setDetailIndex(i);
                  }}
                  className={cn(
                    "rounded-[3px] p-0 outline-offset-1",
                    known ? "border border-ink/25" : "border border-dashed border-ink/25",
                    detailIndex === i && "ring-2 ring-ink"
                  )}
                  style={{
                    width: S.cell,
                    height: S.cell,
                    background: known ? levelColor(intensityLevel(cell.count!), meta.accent) : "transparent",
                  }}
                />
              );
            })}
          </div>
          {/* Decorative scan over the grid: a faint accent band in its own clipped layer; it never changes any cell */}
          <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-1 top-[18px] overflow-hidden">
            <div
              ref={scanRef}
              className="h-full w-1/3 opacity-0"
              style={{
                background: `linear-gradient(90deg, transparent, color-mix(in srgb, ${meta.accent} 45%, transparent), transparent)`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Day details (hover, tap or keyboard focus) */}
      <p className="mt-2 min-h-[1.25rem] text-xs font-bold text-ink" aria-live="polite">
        {detail
          ? detail.count === null
            ? `${dayFormat(detail.date)} · No data for this day`
            : `${dayFormat(detail.date)} · ${detail.count === 0 ? "No" : detail.count} ${meta.unit}${detail.count === 1 ? "" : "s"}`
          : data
            ? <span className="font-medium text-muted">Hover, tap or use arrow keys on a day for details.</span>
            : <span className="font-medium text-muted">Loading activity…</span>}
      </p>
    </div>
  );
}
