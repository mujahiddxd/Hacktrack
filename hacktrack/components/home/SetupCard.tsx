"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type CSSProperties } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Circle, Rocket } from "lucide-react";
import { isSplashActive, subscribeSplash } from "@/lib/splash-signal";

/**
 * Home "Your setup" card with the Setup Circuit: four nodes (event → participants → Gmail → scheduled email)
 * drawn from the same `done` flags as the checklist.
 *
 * How it's driven (same approach as HowItWorksMotion):
 * - Every animated element has a CSS keyframe animation with an absolute delay from one timeline below.
 *   Base styles are the finished state; keyframes animate FROM the start state, so with reduced motion
 *   (animations off in globals.css) everything simply shows the correct static state.
 * - The root's data-play stays "paused" until the card is actually seen (and the sign-in splash is gone).
 * - Completion celebrations come from comparing the server's flags with the last set this browser saw
 *   (localStorage, per user). The snapshot is overwritten as soon as it's read, so reloads, remounts and
 *   rerenders never replay a celebration, and a failed action (no server change) never triggers one.
 */

export type SetupStepId = "hackathon" | "participants" | "gmail" | "email";

export type SetupStep = {
  id: SetupStepId;
  done: boolean;
  title: string;
  detail: string;
  href: string;
};

/** What has to exist before a step can actually be done (mirrors the server actions' checks). */
const REQUIRES: Record<SetupStepId, SetupStepId[]> = {
  hackathon: [],
  participants: ["hackathon"], // participants are added inside a hackathon
  gmail: [],
  email: ["participants"], // scheduleMessageAction refuses a hackathon without recipients
};

/** First incomplete step whose prerequisites are met, in checklist order. */
function nextActionable(done: Record<string, boolean>, ids: SetupStepId[]) {
  return ids.find((id) => !done[id] && REQUIRES[id].every((r) => done[r])) ?? null;
}

const ease = "cubic-bezier(0.25, 1, 0.5, 1)"; // ease-out, no overshoot
type Anim = [name: string, duration: number, delay: number, timing?: string];
function anim(...list: Anim[]): CSSProperties {
  return { animation: list.map(([n, d, dl, t = ease]) => `${n} ${d}s ${t} ${dl}s both`).join(", ") };
}

/** Timeline in seconds from the moment the card is seen. */
const T = {
  base: 0.3, // lets the card's own rise land first
  line: 0.25,
  nodeAt: (i: number) => 0.38 + i * 0.07,
  celebrateAt: (k: number) => 0.85 + k * 0.5, // one node at a time so the counter ticks readably
};

// Theme-aware colours; accents are fixed in both themes and always carry ink on top.
const INK = "var(--ht-ink)";
const SHADOW = "var(--ht-shadow)";
const SURFACE = "var(--ht-surface)";
const MUTED = "var(--ht-muted)";
const ON_ACCENT = "#121212";
const MINT = "#00E676";
const YELLOW = "#FFEB3B";

// Geometry (viewBox units). Nodes are 44×44 tiles; the strip scales with the card width.
const VB_W = 276;
const VB_H = 70;
const TILE = 44;
const TILE_Y = 14;
const NODE_X = [14, 82, 150, 218]; // 68 apart; sc-travel in globals.css runs 3 × 68
const LINE_Y = TILE_Y + TILE / 2;

function subscribeVisibility(cb: () => void) {
  document.addEventListener("visibilitychange", cb);
  return () => document.removeEventListener("visibilitychange", cb);
}
const getTabHidden = () => document.hidden;

type Celebration = { newly: SetupStepId[]; prevNext: SetupStepId | null; startCount: number };

export function SetupCard({ steps, userId, style }: { steps: SetupStep[]; userId: string; style?: CSSProperties }) {
  const rootRef = useRef<HTMLElement>(null);
  const readRef = useRef(false);
  const [started, setStarted] = useState(false);
  const [celebration, setCelebration] = useState<Celebration | null>(null);
  const splashActive = useSyncExternalStore(subscribeSplash, isSplashActive, () => false);
  const tabHidden = useSyncExternalStore(subscribeVisibility, getTabHidden, () => false);

  const ids = steps.map((s) => s.id);
  const done = Object.fromEntries(steps.map((s) => [s.id, s.done])) as Record<SetupStepId, boolean>;
  const doneKey = ids.filter((id) => done[id]).join(",");
  const total = steps.length;
  const doneCount = steps.filter((s) => s.done).length;
  const next = nextActionable(done, ids);

  const [shownCount, setShownCount] = useState(doneCount);
  const count = celebration ? shownCount : doneCount;

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        // Read (and immediately overwrite) the last-seen snapshot exactly once per mount.
        if (!readRef.current) {
          readRef.current = true;
          const key = `ht:setup-seen:${userId}`;
          let prev: string | null = null;
          try {
            prev = localStorage.getItem(key);
            localStorage.setItem(key, doneKey);
          } catch {
            prev = null;
          }
          const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
          if (prev !== null && !reduced) {
            const was = new Set(prev.split(",").filter(Boolean));
            const newly = ids.filter((id) => done[id] && !was.has(id));
            if (newly.length > 0) {
              const prevDone = Object.fromEntries(ids.map((id) => [id, was.has(id)]));
              const startCount = doneCount - newly.length;
              setShownCount(startCount);
              setCelebration({ newly, prevNext: nextActionable(prevDone, ids), startCount });
            }
          }
        }
        if (entry.isIntersecting && (entry.intersectionRatio >= 0.4 || entry.intersectionRect.height >= 160)) {
          setStarted(true);
        }
      },
      { threshold: [0, 0.2, 0.4, 0.6, 1] }
    );
    io.observe(el);
    return () => io.disconnect();
    // The flags come from the server render; re-observing on every render isn't needed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, doneKey]);

  const running = started && !splashActive && !tabHidden;
  const newly = celebration?.newly ?? [];
  const lastCelebrateEnd = newly.length ? T.celebrateAt(newly.length - 1) + 0.75 : 0;
  const ringAt = newly.length ? lastCelebrateEnd : T.base + 0.6;
  const finale = doneCount === total && newly.length > 0;

  return (
    <aside
      ref={rootRef}
      style={style}
      data-play={running ? "running" : "paused"}
      className="ht-sc ht-rise brutal-card min-w-0 rounded-2xl p-5 sm:p-6"
    >
      <div className="flex items-center justify-between gap-3 border-b-2 border-ink pb-4">
        <div>
          <p className="font-mono text-xs font-bold uppercase tracking-wider text-muted">Your setup</p>
          <h2 className="text-xl font-black tracking-tight">{count === total ? "All set 🎉" : "Get going in 4 steps"}</h2>
        </div>
        <span
          key={count}
          style={celebration && count > celebration.startCount ? anim(["sc-count", 0.22, 0]) : undefined}
          className="inline-block rounded-md border-2 border-ink bg-[#FFEB3B] px-2 py-1 font-mono text-sm font-black tabular-nums text-on-accent shadow-brutal-sm"
        >
          {count}/{total}
        </span>
      </div>

      <div
        className="mt-4 flex h-2.5 gap-1"
        role="progressbar"
        aria-label="Setup progress"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={doneCount}
      >
        {/* Fills left to right by count, whichever steps are done; the circuit below shows which ones */}
        {steps.map((s, i) => {
          const k = celebration ? i - celebration.startCount : -1; // index into this visit's new completions
          const animating = celebration && k >= 0 && k < newly.length;
          return (
            <span key={s.id} className="relative flex-1 overflow-hidden rounded-full border-2 border-ink bg-surface">
              {i < doneCount && (
                <span
                  className="absolute inset-0 bg-[#00E676]"
                  style={
                    animating
                      ? { ...anim(["sc-seg", 0.25, T.celebrateAt(k) + 0.45]), transformOrigin: "left center" }
                      : undefined
                  }
                  onAnimationStart={animating ? () => setShownCount((c) => Math.max(c, i + 1)) : undefined}
                />
              )}
            </span>
          );
        })}
      </div>

      {/* Decorative: the checklist below carries the same information as text */}
      <div className="mt-4">
        <svg
          viewBox={`0 0 ${VB_W} ${VB_H}`}
          className="mx-auto block h-auto w-full max-w-[310px] overflow-visible"
          aria-hidden="true"
          focusable="false"
        >
          <line
            x1={NODE_X[0] + TILE / 2}
            y1={LINE_Y}
            x2={NODE_X[3] + TILE / 2}
            y2={LINE_Y}
            stroke={INK}
            strokeWidth={2.5}
            strokeLinecap="round"
            style={{ ...anim(["sc-line", T.line, T.base, "cubic-bezier(0.65, 0, 0.35, 1)"]), transformOrigin: "left center" }}
          />
          {finale && (
            <rect
              x={NODE_X[0] + TILE / 2 - 9}
              y={LINE_Y - 3.5}
              width={18}
              height={7}
              rx={3.5}
              fill={MINT}
              stroke={INK}
              strokeWidth={1.5}
              className="sc-hidden"
              style={anim(["sc-travel", 0.45, lastCelebrateEnd, "cubic-bezier(0.65, 0, 0.35, 1)"])}
            />
          )}
          {steps.map((s, i) => {
            const k = newly.indexOf(s.id);
            return (
              <CircuitNode
                key={s.id}
                id={s.id}
                x={NODE_X[i]}
                entranceAt={T.nodeAt(i)}
                state={s.done ? "done" : s.id === next ? "next" : "todo"}
                prevState={k >= 0 ? (celebration?.prevNext === s.id ? "next" : "todo") : null}
                celebrateAt={k >= 0 ? T.celebrateAt(k) : null}
                ringAt={ringAt}
              />
            );
          })}
        </svg>
        {doneCount === total && (
          <p
            className="mt-2 flex items-center justify-center gap-1.5 font-mono text-xs font-bold text-ink"
            style={finale ? anim(["sc-ready", 0.25, lastCelebrateEnd + 0.35]) : undefined}
          >
            <Rocket className="h-3.5 w-3.5" aria-hidden="true" />
            You&rsquo;re ready to launch.
          </p>
        )}
      </div>

      <ul className="mt-3 space-y-2">
        {steps.map((s) => (
          <li key={s.id}>
            <Link
              href={s.href}
              className="group flex items-start gap-3 rounded-lg border-2 border-transparent p-2.5 transition-colors hover:border-ink hover:bg-canvas"
            >
              {s.done ? (
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#00C853]" aria-label="Done" />
              ) : (
                <Circle className="mt-0.5 h-5 w-5 shrink-0 text-faint" aria-label="To do" />
              )}
              <span className="min-w-0 flex-1">
                <span className={`block text-sm font-black ${s.done ? "text-muted line-through decoration-2" : ""}`}>
                  {s.title}
                </span>
                <span className="block truncate text-xs font-medium text-muted">{s.detail}</span>
              </span>
              <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-faint transition-transform group-hover:translate-x-0.5 group-hover:text-ink" />
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  );
}

type NodeState = "done" | "next" | "todo";

const FACE: Record<NodeState, string> = { done: MINT, next: YELLOW, todo: SURFACE };
const STROKE: Record<NodeState, string> = { done: ON_ACCENT, next: ON_ACCENT, todo: MUTED };

function CircuitNode({
  id,
  x,
  entranceAt,
  state,
  prevState,
  celebrateAt,
  ringAt,
}: {
  id: SetupStepId;
  x: number;
  entranceAt: number;
  state: NodeState;
  /** Set only while celebrating: how this node looked before this visit's completion. */
  prevState: NodeState | null;
  celebrateAt: number | null;
  ringAt: number;
}) {
  const c = celebrateAt;
  const face = (s: NodeState, motion?: CSSProperties) => (
    <>
      <rect width={TILE} height={TILE} rx={9} fill={FACE[s]} stroke={INK} strokeWidth={2.5} />
      <NodeIcon id={id} stroke={STROKE[s]} fill={FACE[s]} motion={motion} />
    </>
  );

  return (
    <g transform={`translate(${x} ${TILE_Y})`}>
      <g style={anim(["sc-node-in", 0.22, entranceAt])}>
        <rect x={3} y={3} width={TILE} height={TILE} rx={9} fill={SHADOW} />
        <g style={c !== null ? anim(["sc-press", 0.24, c, "cubic-bezier(0.45, 0, 0.55, 1)"]) : undefined}>
          {prevState && face(prevState)}
          {c !== null ? (
            <g style={anim(["sc-show", 0.18, c + 0.1])}>{face(state, anim([MOTION[id], 0.28, c + 0.12]))}</g>
          ) : (
            face(state)
          )}
        </g>

        {state === "next" && (
          <rect
            x={-3}
            y={-3}
            width={TILE + 6}
            height={TILE + 6}
            rx={11}
            fill="none"
            stroke={YELLOW}
            strokeWidth={3}
            className="sc-hidden"
            style={anim(["sc-ring", 0.45, ringAt, "ease-out"])}
          />
        )}

        {state === "done" && (
          <g transform={`translate(${TILE - 2} 2)`}>
            <g style={c !== null ? anim(["sc-badge", 0.22, c + 0.2]) : undefined}>
              <circle r={7.5} fill={MINT} stroke={INK} strokeWidth={2} />
              <path
                d="M-3.3 0.2l2.2 2.2 4.2-4.4"
                fill="none"
                stroke={ON_ACCENT}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray={12}
                style={c !== null ? anim(["sc-check", 0.2, c + 0.28]) : undefined}
              />
            </g>
          </g>
        )}

        {c !== null && (
          <circle
            cx={TILE / 2}
            cy={-2}
            r={3.5}
            fill={MINT}
            stroke={INK}
            strokeWidth={1.5}
            className="sc-hidden"
            style={anim(["sc-pulse", 0.3, c + 0.2, "cubic-bezier(0.5, 0, 0.75, 0)"])}
          />
        )}
      </g>
    </g>
  );
}

/** Each icon's small completion movement, applied to its moving part. */
const MOTION: Record<SetupStepId, string> = {
  hackathon: "sc-unfold",
  participants: "sc-align",
  gmail: "sc-plug",
  email: "sc-hand",
};

const line = { fill: "none", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" } as const;

function NodeIcon({
  id,
  stroke,
  fill,
  motion,
}: {
  id: SetupStepId;
  stroke: string;
  fill: string;
  motion?: CSSProperties;
}) {
  switch (id) {
    case "hackathon": // ticket; the stub unfolds from the perforation
      return (
        <g stroke={stroke} strokeWidth={2} strokeLinejoin="round">
          <path d="M27 15H10v4.5a2.5 2.5 0 0 1 0 5V29h17" fill={fill} />
          <path d="M14 19.5h8M14 24.5h5" {...line} stroke={stroke} />
          <path
            d="M27 15h7v4.5a2.5 2.5 0 0 0 0 5V29h-7"
            fill={fill}
            style={motion ? { ...motion, transformOrigin: "left center" } : undefined}
          />
          <path d="M27 17v10" {...line} stroke={stroke} strokeDasharray="2 2.5" />
        </g>
      );
    case "participants": // two profiles; the second slides into line with the first
      return (
        <g stroke={stroke} strokeWidth={2}>
          <g style={motion}>
            <circle cx={27.5} cy={18} r={3.5} fill={fill} />
            <path d="M21 31a6.5 6.5 0 0 1 13 0z" fill={fill} strokeLinejoin="round" />
          </g>
          <circle cx={17} cy={18} r={3.5} fill={fill} />
          <path d="M10.5 31a6.5 6.5 0 0 1 13 0z" fill={fill} strokeLinejoin="round" />
        </g>
      );
    case "gmail": // envelope; the connector plugs into it
      return (
        <g stroke={stroke}>
          <rect x={16} y={15.5} width={19} height={13.5} rx={1.5} fill={fill} strokeWidth={2} />
          <path d="M16.5 16.5l9 7 9-7" {...line} stroke={stroke} />
          <g style={motion}>
            <path d="M6 22.25h4" {...line} stroke={stroke} />
            <rect x={10} y={19.75} width={4} height={5} rx={1} fill={stroke} strokeWidth={1} />
            <path d="M14 21h2M14 23.5h2" {...line} stroke={stroke} strokeWidth={1.5} />
          </g>
        </g>
      );
    case "email": // clock; the minute hand advances
      return (
        <g stroke={stroke}>
          <circle cx={22} cy={22} r={9.5} fill={fill} strokeWidth={2} />
          <path d="M22 22v-5.5" {...line} stroke={stroke} />
          <path d="M22 22h5.5" {...line} stroke={stroke} style={motion ? { ...motion, transformOrigin: "left center" } : undefined} />
          <circle cx={22} cy={22} r={1.3} fill={stroke} stroke="none" />
        </g>
      );
  }
}
