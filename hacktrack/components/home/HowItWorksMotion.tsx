"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type CSSProperties } from "react";
import { CalendarCheck, Mail, RotateCcw, Sparkles, Users } from "lucide-react";
import { isSplashActive, subscribeSplash } from "@/lib/splash-signal";

/**
 * "How HackTrack works": a one-shot animated walkthrough across four cards.
 *
 * How it's driven:
 * - Every animated element gets a CSS keyframe animation with an absolute delay taken from `T` below,
 *   so the whole sequence lives on one timeline (~8.6s) defined in one place.
 * - The controller only flips `data-play` on the root between "running" and "paused"; globals.css maps that
 *   to `animation-play-state`, so scrolling away or hiding the tab freezes every element at the same instant.
 * - Base (un-animated) styles are the *finished* state and keyframes animate *from* the start state.
 *   So when it ends (fill: both), every card keeps its final frame.
 * - It plays on every visit to Home (each mount), including for users with reduced motion. That is a product
 *   decision: the walkthrough is the page's main explainer. It waits while the sign-in splash covers the page.
 * - Replay remounts the scene (new key), which restarts every animation from zero.
 */

const ease = "cubic-bezier(0.25, 1, 0.5, 1)"; // gentle ease-out, no overshoot
const easeInOut = "cubic-bezier(0.65, 0, 0.35, 1)";

/** Timeline in seconds. Each step is active from start[i] until end[i]; the indicator travels for 0.5s between. */
const T = {
  start: [0, 2.3, 4.8, 7.0],
  end: [1.8, 4.3, 6.5, 8.6],
  travel: 0.5,
};

type Anim = [name: string, duration: number, delay: number, fill?: "both" | "forwards", timing?: string];

/** Builds an `animation` shorthand list from [name, duration, delay] tuples. */
function anim(...list: Anim[]): CSSProperties {
  return {
    animation: list.map(([n, d, dl, fill = "both", timing = ease]) => `${n} ${d}s ${timing} ${dl}s ${fill}`).join(", "),
  };
}

// Theme-aware illustration colours (CSS variables work in SVG presentation attributes in all modern browsers).
// Accents keep fixed hex values in both themes; ON_ACCENT is the fixed ink used on top of them.
const INK = "var(--ht-ink)";
const SHADOW = "var(--ht-shadow)";
const SURFACE = "var(--ht-surface)";
const QUIET = "var(--ht-quiet)";
const MUTED = "var(--ht-muted)";
const FAINT = "var(--ht-faint)";
const ON_ACCENT = "#121212";
const BLUE = "#2196F3";
const BLUE_SOFT = "var(--ht-tint-blue)";
const GREEN = "#00E676";
const AMBER = "#FFB300";
const GRAY = "var(--ht-illus-line)";

const STEPS = [
  {
    title: "Add a hackathon",
    text: "Type in the details, or paste the announcement into AI Add and review the fields it fills in.",
    icon: Sparkles,
    Art: AnnouncementArt,
  },
  {
    title: "Catch date clashes",
    text: "Before saving, HackTrack warns you if another of your events already falls on that day.",
    icon: CalendarCheck,
    Art: CalendarArt,
  },
  {
    title: "Add participants",
    text: "Keep each hackathon's builders and their emails together in one list.",
    icon: Users,
    Art: ParticipantsArt,
  },
  {
    title: "Schedule the email",
    text: "Write it once, pick a time, and it goes out from your Gmail to everyone or just who you pick.",
    icon: Mail,
    Art: ScheduleArt,
  },
];

/* ── Browser state as external stores (no setState-in-effect) ── */

function subscribeVisibility(cb: () => void) {
  document.addEventListener("visibilitychange", cb);
  return () => document.removeEventListener("visibilitychange", cb);
}
const getTabHidden = () => document.hidden;

export function HowItWorksMotion() {
  const stageRef = useRef<HTMLDivElement>(null);
  const [runKey, setRunKey] = useState(0);
  const [phase, setPhase] = useState<"idle" | "playing" | "done">("idle");
  const [inView, setInView] = useState(false);
  const splashActive = useSyncExternalStore(subscribeSplash, isSplashActive, () => false);
  const tabHidden = useSyncExternalStore(subscribeVisibility, getTabHidden, () => false);

  // Start only once the cards themselves are mostly on screen (so it waits for a scroll when just the heading peeks in
  // below the hero on load); pause whenever they leave view entirely
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        const meaningful =
          entry.intersectionRatio >= 0.6 || entry.intersectionRect.height >= window.innerHeight * 0.5;
        if (meaningful) {
          setInView(true);
          setPhase((p) => (p === "idle" ? "playing" : p));
        } else if (!entry.isIntersecting) {
          setInView(false);
        }
      },
      { threshold: [0, 0.1, 0.25, 0.4, 0.6, 0.8, 1] }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Once done, keep running so the last short transitions (step 4 turning green) can settle instead of freezing mid-fade.
  // While playing, hold whenever it can't be seen: out of view, tab hidden, or the sign-in splash on top.
  const running = phase === "done" || (phase === "playing" && inView && !tabHidden && !splashActive);

  function replay() {
    setRunKey((k) => k + 1);
    setPhase("playing");
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-2xl">
          <p className="font-mono text-xs font-bold uppercase tracking-wider text-muted">How HackTrack works</p>
          <h2 id="how-heading" className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">
            One announcement. Four steps. Ready to send.
          </h2>
        </div>
        {/* Rendered from the start (just hidden) so the header never shifts when it appears */}
        <button
          type="button"
          onClick={replay}
          aria-label="Replay the walkthrough animation"
          className={`inline-flex items-center gap-1.5 rounded-md border-2 border-ink bg-surface px-2.5 py-1 font-mono text-xs font-bold text-ink transition-colors hover:bg-quiet ${
            phase === "idle" ? "invisible" : ""
          }`}
        >
          <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
          Replay
        </button>
      </div>

      {/* Observed for start/pause: the cards themselves, not the heading above them */}
      <div ref={stageRef}>
        <div
          key={runKey}
          className="ht-wt"
          data-play={running ? "running" : "paused"}
          onAnimationEnd={(e) => {
            if ((e.target as Element).hasAttribute("data-wt-final")) setPhase("done");
          }}
        >
          {/* Desktop rail: numbered nodes, connector line, travelling blue indicator */}
          <div aria-hidden="true" className="mb-5 hidden grid-cols-4 gap-5 lg:grid">
            {STEPS.map((s, i) => (
              <div key={s.title} className="relative flex justify-center">
                {i < STEPS.length - 1 && (
                  <span className="absolute left-1/2 top-1/2 h-[3px] w-[calc(100%+1.25rem)] -translate-y-1/2 bg-ink">
                    <span className="absolute inset-0" style={{ opacity: 0, ...anim(["wt-travel", T.travel, T.end[i], "both", easeInOut]) }}>
                      <span className="absolute left-0 top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-ink bg-[#2196F3] text-on-accent" />
                    </span>
                  </span>
                )}
                <StepNode index={i} />
              </div>
            ))}
          </div>
  
          <ol className="grid gap-5 lg:grid-cols-4">
            {STEPS.map(({ title, text, icon: Icon, Art }, i) => (
              <li key={title} className="relative grid grid-cols-[2.5rem_1fr] gap-3 lg:block">
                {/* Mobile rail: node beside each card, vertical connector down to the next one */}
                <div aria-hidden="true" className="relative flex justify-center pt-4 lg:hidden">
                  {i < STEPS.length - 1 && (
                    <span className="absolute left-1/2 top-4 h-[calc(100%+1.25rem)] w-[3px] -translate-x-1/2 bg-ink" />
                  )}
                  <StepNode index={i} />
                </div>
  
                <div className="wt-card relative flex h-full flex-col rounded-xl border-3 border-ink bg-surface shadow-brutal">
                  {/* Active-step outline (blue while this step plays) */}
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute -inset-[7px] rounded-[18px] border-3 border-[#2196F3]"
                    style={{ opacity: 0, ...activeWindow(i) }}
                  />
                  <div
                    aria-hidden="true"
                    className="flex h-44 items-center justify-center overflow-hidden rounded-t-[9px] border-b-2 border-ink bg-canvas px-4"
                  >
                    <Art />
                  </div>
                  <div className="flex-1 p-4 sm:p-5">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border-2 border-ink bg-surface">
                        <Icon className="h-4 w-4" aria-hidden="true" />
                      </span>
                      <h3 className="font-black leading-tight">{title}</h3>
                    </div>
                    <p className="mt-2 text-sm font-medium leading-relaxed text-body">{text}</p>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}

/** Blue while step i is active, then hidden. */
function activeWindow(i: number) {
  return anim(["wt-show", 0.25, T.start[i]], ["wt-hide", 0.25, T.end[i], "forwards"]);
}

function StepNode({ index }: { index: number }) {
  return (
    <span className="relative z-10 flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border-3 border-ink bg-surface font-mono text-sm font-black text-ink">
      {index + 1}
      {/* Current step */}
      <span
        className="absolute inset-0 flex items-center justify-center bg-[#2196F3] text-white"
        style={{ opacity: 0, ...activeWindow(index) }}
      >
        {index + 1}
      </span>
      {/* Completed (the resting state) */}
      <span
        className="absolute inset-0 flex items-center justify-center bg-[#00E676] text-on-accent"
        style={anim(["wt-fade-in", 0.3, T.end[index]])}
      >
        {index + 1}
      </span>
    </span>
  );
}

/* ── Illustrations (decorative, no real data) ── */

const svgProps = {
  viewBox: "0 0 240 150",
  className: "h-full max-h-40 w-full max-w-[280px]",
  fill: "none",
  role: "presentation" as const,
};

function AnnouncementArt() {
  const s = T.start[0];
  return (
    <svg {...svgProps}>
      {/* Sheet enters */}
      <g style={anim(["wt-rise", 0.5, s + 0.1])}>
        <rect x="64" y="22" width="112" height="112" rx="8" fill={SHADOW} />
        <rect x="60" y="18" width="112" height="112" rx="8" fill={SURFACE} stroke={INK} strokeWidth="2.5" />
        <rect x="72" y="30" width="44" height="6" rx="3" fill={INK} />
        {/* Placeholder lines resolve... */}
        <g style={{ opacity: 0, ...anim(["wt-hide", 0.3, s + 0.8, "both"]) }}>
          {[88, 72, 84, 60, 76].map((w, k) => (
            <rect key={k} x="72" y={48 + k * 14} width={w} height="6" rx="3" fill={GRAY} />
          ))}
        </g>
        {/* ...into structured fields */}
        {[52, 40, 60].map((w, k) => (
          <g key={k} style={anim(["wt-slide-in", 0.35, s + 0.9 + k * 0.12])}>
            <rect x="72" y={46 + k * 26} width="24" height="5" rx="2.5" fill={MUTED} />
            <rect x="72" y={54 + k * 26} width="88" height="12" rx="4" fill={BLUE_SOFT} stroke={BLUE} strokeWidth="1.5" />
            <rect x="77" y={58 + k * 26} width={w} height="4" rx="2" fill={BLUE} />
          </g>
        ))}
      </g>
      {/* AI badge with a short sparkle */}
      <g style={anim(["wt-pop", 0.35, s + 0.45])}>
        <rect x="155" y="9" width="30" height="30" rx="7" fill={SHADOW} />
        <rect x="152" y="6" width="30" height="30" rx="7" fill={BLUE} stroke={INK} strokeWidth="2" />
        <path d="M167 12c1 5 3 8 8 9-5 1-7 4-8 9-1-5-3-8-8-9 5-1 7-4 8-9z" fill="#fff" />
      </g>
      {[
        [194, 8, 1],
        [198, 34, 0.8],
        [142, 4, 0.7],
      ].map(([x, y, sc], k) => (
        <path
          key={k}
          d={`M${x} ${y - 5 * sc}l${1.4 * sc} ${3.6 * sc} ${3.6 * sc} ${1.4 * sc}-${3.6 * sc} ${1.4 * sc}-${1.4 * sc} ${3.6 * sc}-${1.4 * sc}-${3.6 * sc}-${3.6 * sc}-${1.4 * sc} ${3.6 * sc}-${1.4 * sc}z`}
          fill={BLUE}
          stroke={INK}
          strokeWidth="1"
          style={{ opacity: 0, ...anim(["wt-spark", 0.6, s + 1.3 + k * 0.08, "both", easeInOut]) }}
        />
      ))}
    </svg>
  );
}

function CalendarArt() {
  const s = T.start[1];
  const col = (c: number) => 52 + c * 20;
  const row = (r: number) => 44 + r * 18;
  return (
    <svg {...svgProps}>
      <g style={anim(["wt-fade-in", 0.3, s])}>
        <rect x="48" y="18" width="152" height="104" rx="8" fill={SHADOW} />
        <rect x="44" y="14" width="152" height="104" rx="8" fill={SURFACE} stroke={INK} strokeWidth="2.5" />
        <path d="M44 22a8 8 0 0 1 8-8h136a8 8 0 0 1 8 8v14H44z" fill={INK} />
        <rect x="76" y="8" width="5" height="12" rx="2.5" fill={INK} />
        <rect x="159" y="8" width="5" height="12" rx="2.5" fill={INK} />
        {Array.from({ length: 21 }, (_, k) => (
          <rect
            key={k}
            x={col(k % 7)}
            y={row(Math.floor(k / 7))}
            width="16"
            height="14"
            rx="3"
            fill={QUIET}
            stroke={INK}
            strokeOpacity="0.25"
          />
        ))}
        {/* An existing event on day (row 1, col 3) */}
        <rect x={col(3) + 4} y={row(1) + 5} width="8" height="4" rx="2" fill={INK} />
      </g>

      {/* Occupied date flashes amber while the selection passes over it */}
      <rect
        x={col(3)}
        y={row(1)}
        width="16"
        height="14"
        rx="3"
        fill={AMBER}
        stroke={INK}
        strokeWidth="1.5"
        style={{ opacity: 0, ...anim(["wt-flash", 0.7, s + 0.65, "both", easeInOut]) }}
      />
      {/* Chosen free date */}
      <g style={anim(["wt-fade-in", 0.25, s + 1.45])}>
        <rect x={col(4)} y={row(1)} width="16" height="14" rx="3" fill={BLUE} stroke={INK} strokeWidth="1.5" />
        <path d={`M${col(4) + 4.5} ${row(1) + 7.5}l2.5 2.5 4.5-5`} stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </g>
      {/* Selection ring: moves across a few cells, pauses on the taken date, settles on a free one */}
      <rect
        x={col(4) - 3}
        y={row(1) - 3}
        width="22"
        height="20"
        rx="5"
        stroke={BLUE}
        strokeWidth="2.5"
        style={anim(["wt-cal-select", 1.5, s + 0.1, "both", "linear"])}
      />

      <g style={anim(["wt-rise", 0.35, s + 1.65])}>
        <rect x="80" y="128" width="84" height="20" rx="5" fill={SHADOW} />
        <rect x="78" y="126" width="84" height="20" rx="5" fill={GREEN} stroke={INK} strokeWidth="2" />
        <text x="120" y="140" textAnchor="middle" fontFamily="ui-monospace, monospace" fontSize="10" fontWeight="800" fill={ON_ACCENT}>
          ✓ NO CLASH
        </text>
      </g>
    </svg>
  );
}

const AVATARS = ["#FFEB3B", "#90CAF9", "#69F0AE", "#FF8A80"];

function ParticipantsArt() {
  const s = T.start[2];
  const ax = (k: number) => 66 + k * 36;
  const slot = (k: number) => ({ x: k % 2 ? 124 : 50, y: k < 2 ? 88 : 110 });
  return (
    <svg {...svgProps}>
      {/* Shared participant list */}
      <g style={anim(["wt-fade-in", 0.3, s + 0.95])}>
        <rect x="44" y="70" width="156" height="72" rx="8" fill={SHADOW} />
        <rect x="40" y="66" width="156" height="72" rx="8" fill={SURFACE} stroke={INK} strokeWidth="2" />
        <rect x="50" y="76" width="44" height="5" rx="2.5" fill={MUTED} />
      </g>

      {AVATARS.map((color, k) => (
        <g key={k} style={anim(["wt-rise-sm", 0.4, s + k * 0.12])}>
          <circle cx={ax(k)} cy="32" r="17" fill={color} stroke={INK} strokeWidth="2" />
          <circle cx={ax(k)} cy="27" r="5.5" fill="#fff" stroke={ON_ACCENT} strokeWidth="1.8" />
          <path d={`M${ax(k) - 9.5} ${44}c1.5-6 5-8.5 9.5-8.5s8 2.5 9.5 8.5`} fill="#fff" stroke={ON_ACCENT} strokeWidth="1.8" />
        </g>
      ))}

      {/* Email chips (placeholder bars, no real addresses) appear under each avatar, then line up in the list */}
      {AVATARS.map((color, k) => {
        const { x, y } = slot(k);
        const from = { "--fx": `${ax(k) - 33 - x}px`, "--fy": `${54 - y}px` } as CSSProperties;
        return (
          <g
            key={k}
            style={{
              ...from,
              ...anim(["wt-fade-in", 0.25, s + 0.45 + k * 0.08], ["wt-from", 0.5, s + 1.0 + k * 0.05, "both", easeInOut]),
            }}
          >
            <rect x={x} y={y} width="66" height="18" rx="9" fill={SURFACE} stroke={INK} strokeWidth="1.8" />
            <circle cx={x + 10} cy={y + 9} r="4" fill={color} stroke={INK} strokeWidth="1.2" />
            <rect x={x + 18} y={y + 7} width="26" height="4" rx="2" fill={FAINT} />
            <rect x={x + 47} y={y + 7} width="11" height="4" rx="2" fill={GRAY} />
          </g>
        );
      })}
    </svg>
  );
}

function ScheduleArt() {
  const s = T.start[3];
  const cx = 182;
  const cy = 58;
  const handOrigin: CSSProperties = { transformBox: "view-box", transformOrigin: `${cx}px ${cy}px` };
  return (
    <svg {...svgProps}>
      <g style={anim(["wt-rise", 0.4, s])}>
        {/* Open flap sits behind the letter until the envelope closes */}
        <path
          d="M40 64 86 34 132 64z"
          fill={SURFACE}
          stroke={INK}
          strokeWidth="2.5"
          strokeLinejoin="round"
          style={{ opacity: 0, ...anim(["wt-hide", 0.15, s + 1.1, "both"]) }}
        />
        {/* Message folds down into the envelope */}
        <g className="wt-origin-bottom" style={{ opacity: 0, ...anim(["wt-letter", 0.6, s + 0.55, "both", easeInOut]) }}>
          <rect x="52" y="22" width="68" height="56" rx="4" fill={SURFACE} stroke={INK} strokeWidth="2" />
          <rect x="60" y="32" width="40" height="5" rx="2.5" fill={INK} />
          <rect x="60" y="44" width="52" height="4" rx="2" fill={GRAY} />
          <rect x="60" y="53" width="44" height="4" rx="2" fill={GRAY} />
        </g>
        <rect x="44" y="68" width="92" height="60" rx="6" fill={SHADOW} />
        <rect x="40" y="64" width="92" height="60" rx="6" fill={SURFACE} stroke={INK} strokeWidth="2.5" />
        <path d="M40 124 86 94l46 30" stroke={INK} strokeWidth="2" strokeLinejoin="round" />
        {/* Flap closes */}
        <path
          className="wt-origin-top"
          d="M40 64 86 96 132 64z"
          fill={BLUE_SOFT}
          stroke={INK}
          strokeWidth="2.5"
          strokeLinejoin="round"
          style={anim(["wt-flap", 0.3, s + 1.1])}
        />
      </g>

      {/* Clock advances to the chosen send time */}
      <g style={anim(["wt-fade-in", 0.3, s + 0.15])}>
        <circle cx={cx + 3} cy={cy + 3} r="23" fill={SHADOW} />
        <circle cx={cx} cy={cy} r="23" fill={SURFACE} stroke={INK} strokeWidth="2.5" />
        {[0, 90, 180, 270].map((deg) => (
          <rect key={deg} x={cx - 1} y={cy - 20} width="2" height="4" rx="1" fill={INK} transform={`rotate(${deg} ${cx} ${cy})`} />
        ))}
        <line
          x1={cx}
          y1={cy}
          x2={cx}
          y2={cy - 11}
          stroke={BLUE}
          strokeWidth="3"
          strokeLinecap="round"
          style={{ ...handOrigin, transform: "rotate(60deg)", ...anim(["wt-rotate", 0.7, s + 0.6, "both", easeInOut]) }}
        />
        <line
          x1={cx}
          y1={cy}
          x2={cx}
          y2={cy - 16}
          stroke={INK}
          strokeWidth="2.5"
          strokeLinecap="round"
          style={{ ...handOrigin, transform: "rotate(270deg)", ...anim(["wt-rotate", 0.7, s + 0.6, "both", easeInOut]) }}
        />
        <circle cx={cx} cy={cy} r="2.5" fill={INK} />
      </g>

      {/* Final element of the whole sequence: its animationend marks the walkthrough as done */}
      <g data-wt-final="" style={anim(["wt-rise", 0.3, T.end[3] - 0.3])}>
        <rect x="74" y="132" width="96" height="16" rx="5" fill={SHADOW} />
        <rect x="72" y="130" width="96" height="16" rx="5" fill={GREEN} stroke={INK} strokeWidth="2" />
        <text x="120" y="141.5" textAnchor="middle" fontFamily="ui-monospace, monospace" fontSize="9.5" fontWeight="800" fill={ON_ACCENT}>
          ✓ SCHEDULED
        </text>
      </g>
    </svg>
  );
}
