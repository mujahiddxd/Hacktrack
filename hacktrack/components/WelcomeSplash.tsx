"use client";

import { useCallback, useEffect, useState, type CSSProperties } from "react";
import { cn } from "@/lib/utils";
import { setSplashActive } from "@/lib/splash-signal";
import {
  DEV_FACTS,
  FIRST_LOGIN,
  FIRST_LOGIN_TIPS,
  RETURNING_LOGIN,
  type SplashLogLine,
} from "@/lib/splash-content";

const WELCOME_COOKIE_NAME = "hacktrack_welcome";
const SEGMENTS = 20;
const HOLD_MS = 450; // pause on 100% so "Ready" registers
const FADE_MS = 350;

// Fixed positions (no Math.random) keep server and client markup identical.
const FLOATERS = [
  { text: "💻", top: "8%", left: "6%", size: "2.2rem", rot: -8, dur: 9, mobile: true },
  { text: "🚀", top: "14%", left: "88%", size: "2rem", rot: 10, dur: 11, mobile: true },
  { text: "</>", top: "30%", left: "4%", size: "1.4rem", rot: -6, dur: 10, mono: true },
  { text: "🐛", top: "46%", left: "92%", size: "1.8rem", rot: 6, dur: 8 },
  { text: "{ }", top: "64%", left: "7%", size: "1.5rem", rot: 8, dur: 12, mono: true },
  { text: "☕", top: "82%", left: "10%", size: "2rem", rot: -4, dur: 10, mobile: true },
  { text: "🤖", top: "76%", left: "86%", size: "2rem", rot: 4, dur: 9, mobile: true },
  { text: "0101", top: "92%", left: "70%", size: "1rem", rot: -3, dur: 13, mono: true },
  { text: "⌨️", top: "36%", left: "82%", size: "1.6rem", rot: -10, dur: 11 },
  { text: "=>", top: "6%", left: "40%", size: "1.2rem", rot: 0, dur: 12, mono: true },
  { text: "🧠", top: "56%", left: "16%", size: "1.6rem", rot: 12, dur: 10 },
  { text: "💾", top: "90%", left: "34%", size: "1.5rem", rot: -6, dur: 9 },
  { text: "&&", top: "22%", left: "70%", size: "1rem", rot: 6, dur: 14, mono: true },
  { text: "🔧", top: "60%", left: "94%", size: "1.4rem", rot: -12, dur: 10 },
];

/** Starts quick, crawls through the middle, then finishes — like a real install. */
function loaderEase(t: number) {
  if (t < 0.35) return (t / 0.35) * 0.45;
  if (t < 0.75) return 0.45 + ((t - 0.35) / 0.4) * 0.3;
  return 0.75 + (1 - Math.pow(1 - (t - 0.75) / 0.25, 2)) * 0.25;
}

/**
 * Post-sign-in loading screen. The server renders it only when the welcome cookie is present,
 * so it shows on first paint while the dashboard loads underneath.
 * `isNew` (set after onboarding) plays the longer first-time intro; otherwise a quick welcome back.
 */
export function WelcomeSplash({
  name,
  isNew,
  factIndex = 0,
}: {
  name?: string | null;
  isNew?: boolean;
  factIndex?: number;
}) {
  const variant = isNew ? FIRST_LOGIN : RETURNING_LOGIN;
  const [pct, setPct] = useState(0);
  const [phase, setPhase] = useState<"loading" | "fade" | "done">("loading");

  const dismiss = useCallback(() => setPhase((p) => (p === "loading" ? "fade" : p)), []);

  useEffect(() => {
    document.cookie = `${WELCOME_COOKIE_NAME}=; Max-Age=0; path=/`;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const duration = reduced ? variant.durationMs / 2 : variant.durationMs;
    const start = performance.now();
    let raf = 0;
    let hold: ReturnType<typeof setTimeout> | undefined;

    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      setPct(Math.round(loaderEase(t) * 100));
      if (t < 1) raf = requestAnimationFrame(tick);
      else hold = setTimeout(dismiss, HOLD_MS);
    };
    raf = requestAnimationFrame(tick);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Enter") dismiss();
    };
    window.addEventListener("keydown", onKey);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(hold);
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [variant.durationMs, dismiss]);

  useEffect(() => {
    if (phase !== "fade") return;
    const id = setTimeout(() => setPhase("done"), FADE_MS);
    return () => clearTimeout(id);
  }, [phase]);

  useEffect(() => {
    if (phase === "done") document.body.style.overflow = "";
  }, [phase]);

  // Page animations (e.g. the Home walkthrough) wait while the splash covers the screen
  // and start as it fades out, so they aren't played unseen underneath it.
  const covering = phase === "loading";
  useEffect(() => {
    setSplashActive(covering);
    return () => setSplashActive(false);
  }, [covering]);

  if (phase === "done") return null;

  const firstName = name?.trim().split(/\s+/)[0];
  const filled = Math.floor((pct / 100) * SEGMENTS);
  const ready = pct >= 100;
  // Each log line "runs" for an equal slice of the bar
  const activeLine = Math.min(Math.floor((pct / 100) * variant.log.length), variant.log.length);
  const fact = DEV_FACTS[factIndex % DEV_FACTS.length];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={isNew ? "Setting up HackTrack for the first time" : "Signing you in"}
      className={cn(
        "fixed inset-0 z-[100] overflow-y-auto bg-canvas",
        phase === "fade" && "ht-fade-out"
      )}
    >
      {/* Floating dev emojis & code glyphs */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden select-none">
        {FLOATERS.map((f, i) => (
          <span
            key={i}
            className={cn(
              "ht-floater absolute leading-none",
              f.mono ? "font-mono font-black text-ink opacity-15" : "opacity-60",
              !f.mobile && "hidden md:block"
            )}
            style={
              {
                top: f.top,
                left: f.left,
                fontSize: f.size,
                "--ht-rot": `${f.rot}deg`,
                "--ht-dur": `${f.dur}s`,
                "--ht-delay": `${-i * 0.7}s`,
                "--ht-dx": `${i % 2 ? -10 : 10}px`,
                "--ht-dy": `${i % 3 ? -18 : 14}px`,
              } as CSSProperties
            }
          >
            {f.text}
          </span>
        ))}
      </div>

      <div className="relative mx-auto flex min-h-full w-full max-w-xl flex-col items-center justify-center px-4 py-10 text-center">
        <span className={cn("brutal-badge rounded-md font-mono text-[11px]", variant.badgeClass)}>
          ● {variant.badge}
        </span>

        <div className="ht-press mt-6 flex h-20 w-20 items-center justify-center rounded-2xl border-3 border-ink bg-[#FFEB3B] text-on-accent text-4xl">
          <span aria-hidden="true">{variant.emoji}</span>
        </div>

        <h2 className="mt-6 text-2xl sm:text-4xl font-black leading-tight tracking-tight text-ink">
          {variant.title(firstName)}
        </h2>
        <p className="mt-2 text-sm sm:text-base font-semibold text-body">{variant.subtitle}</p>

        {/* Terminal: the command, then one line per step as the bar passes it */}
        <div className="mt-7 w-full overflow-hidden rounded-xl border-3 border-ink bg-[#121212] text-left shadow-brutal">
          <div className="flex items-center gap-2 border-b-2 border-[#3F3F46] px-3 py-2">
            <span className="h-3 w-3 rounded-full border-2 border-ink bg-[#FF5252] text-on-accent" />
            <span className="h-3 w-3 rounded-full border-2 border-ink bg-[#FFEB3B] text-on-accent" />
            <span className="h-3 w-3 rounded-full border-2 border-ink bg-[#00E676] text-on-accent" />
            <span className="ml-2 font-mono text-[11px] font-bold text-faint">~/hacktrack — zsh</span>
          </div>
          <div className="space-y-1.5 px-4 py-3 font-mono text-xs sm:text-sm">
            <p className="text-white">
              <span className="text-[#00E676]">$</span> {variant.command}
            </p>
            {variant.log.map((line, i) =>
              i > activeLine ? null : (
                <p key={line.text} className="ht-step-in flex items-center gap-2 text-[#E4E4E7]">
                  <span className={cn("w-4 shrink-0 font-black", i < activeLine ? "text-[#00E676]" : "text-[#FFEB3B]")}>
                    {i < activeLine ? "✓" : "›"}
                  </span>
                  <span aria-hidden="true">{line.emoji}</span>
                  <span className={i < activeLine ? "" : "ht-caret"}>{line.text}</span>
                </p>
              )
            )}
            {ready && (
              <p className="ht-step-in font-black text-[#00E676]">✓ Done. Let&apos;s hack 🎉</p>
            )}
          </div>
        </div>

        {/* Segmented loading bar */}
        <div className="mt-6 w-full">
          <div className="mb-2 flex items-end justify-between font-mono font-black text-ink">
            <span className="text-xs sm:text-sm uppercase tracking-widest">
              {ready ? "Ready" : "Loading"}
              <span className={ready ? "hidden" : "ht-dots"} aria-hidden="true" />
            </span>
            <span className="text-lg sm:text-xl tabular-nums" aria-hidden="true">
              {pct}%
            </span>
          </div>
          <div
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={pct}
            aria-label="Loading progress"
            className="flex h-7 w-full gap-[3px] rounded-lg border-3 border-ink bg-surface p-[3px] shadow-brutal-sm"
          >
            {Array.from({ length: SEGMENTS }, (_, i) => (
              <span
                key={i}
                className={cn(
                  "h-full flex-1 rounded-[3px] transition-colors duration-150",
                  i < filled ? "bg-[#00E676] text-on-accent" : "bg-quiet",
                  i === filled - 1 && !ready && "bg-[#FFEB3B] text-on-accent"
                )}
              />
            ))}
          </div>
        </div>

        <InfoCard isNew={isNew} fact={fact} />

        <button
          type="button"
          onClick={dismiss}
          className="mt-6 font-mono text-xs font-bold uppercase tracking-wider text-muted underline-offset-4 hover:text-ink hover:underline"
        >
          Skip ⏎
        </button>
      </div>
    </div>
  );
}

function InfoCard({ isNew, fact }: { isNew?: boolean; fact: SplashLogLine }) {
  if (isNew) {
    return (
      <div className="brutal-card mt-6 w-full rounded-xl p-4 text-left">
        <p className="font-mono text-[11px] font-black uppercase tracking-widest text-muted">
          🧭 Here&apos;s what you can do
        </p>
        <ul className="mt-2 space-y-1.5">
          {FIRST_LOGIN_TIPS.map((tip) => (
            <li key={tip.text} className="flex gap-2 text-sm font-semibold text-ink">
              <span aria-hidden="true">{tip.emoji}</span>
              {tip.text}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className="brutal-card mt-6 w-full rounded-xl bg-[#FFEB3B] text-on-accent p-4 text-left">
      <p className="font-mono text-[11px] font-black uppercase tracking-widest text-ink">
        💡 Dev fact while you wait
      </p>
      <p className="mt-1.5 flex gap-2 text-sm font-semibold text-ink">
        <span aria-hidden="true">{fact.emoji}</span>
        {fact.text}
      </p>
    </div>
  );
}
