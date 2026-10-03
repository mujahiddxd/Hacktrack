"use client";

import * as React from "react";
import { useMemo } from "react";
import Link from "next/link";
import {
  Users,
  Sparkles,
  CalendarPlus,
  CalendarDays,
  Send,
  CheckCheck,
  Trophy,
  ArrowRight,
  AlertTriangle,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { StreakDeck } from "@/components/streaks/StreakDeck";

type Hackathon = {
  id: string;
  name: string;
  description: string;
  roundDetails: string | null;
  hackathonDate: string | Date;
  registrationDeadline: string | Date;
  fee: string;
  location: string;
  registrationLink: string | null;
  status: string;
  deletedAt: string | Date | null;
  createdAt: string | Date;
  updatedAt: string | Date;
  _count: {
    participants: number;
    scheduledMessages: number;
  };
};

type GoogleStatus = {
  connected: boolean;
  email?: string;
} | null;

interface DashboardContentProps {
  allHackathons: Hackathon[];
  scheduledMessagesCount?: number;
  sentMessagesCount?: number;
  googleAccount?: GoogleStatus;
  userName?: string | null;
}

/** Formats date into short uppercase "OCT 12" */
function formatShortDate(d: Date | string): string {
  const date = new Date(d);
  return date
    .toLocaleDateString("en-US", { month: "short", day: "numeric" })
    .toUpperCase();
}

/** Formats subtitle line e.g. "Online · Registration closes Oct 7" */
function getSubtitle(hackathon: Hackathon): string {
  const parts: string[] = [];
  if (hackathon.location) parts.push(hackathon.location);
  if (hackathon.registrationDeadline) {
    const deadline = new Date(hackathon.registrationDeadline);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (deadline >= today) {
      parts.push(
        `Registration closes ${deadline.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
      );
    } else {
      parts.push("Registration closed");
    }
  } else {
    parts.push("Registration open");
  }
  return parts.join(" · ");
}

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function HackathonCard({ hackathon, accent }: { hackathon: Hackathon; accent: "blue" | "mint" }) {
  return (
    <Link
      href={`/hackathons/${hackathon.id}`}
      className="group flex h-full flex-col justify-between rounded-xl border-2 border-ink bg-surface p-5 shadow-brutal-sm transition-all duration-150 hover:-translate-y-1 hover:shadow-brutal"
    >
      <div className="min-w-0">
        <div className="mb-3 flex items-center justify-between gap-2">
          <span
            className={`rounded-md border-2 border-ink px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider shadow-[1.5px_1.5px_0px_var(--ht-shadow)] ${
              accent === "mint" ? "bg-[#00E676] text-on-accent" : "bg-[#2196F3] text-white"
            }`}
          >
            Upcoming
          </span>
          <span className="font-mono text-xs font-black uppercase tracking-wider text-ink" suppressHydrationWarning>
            {formatShortDate(hackathon.hackathonDate)}
          </span>
        </div>

        <h3 className="mb-1 line-clamp-1 text-lg font-black tracking-tight text-ink group-hover:underline">
          {hackathon.name}
        </h3>
        <p className="mb-4 line-clamp-2 text-xs font-medium text-muted" suppressHydrationWarning>
          {getSubtitle(hackathon)}
        </p>
      </div>

      <div className="flex items-center justify-between border-t border-ink/15 pt-3 text-xs font-bold text-ink">
        <span className="flex items-center gap-1.5">
          <Users className="h-3.5 w-3.5 stroke-[2.2]" />
          {hackathon._count?.participants || 0} participants
        </span>
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
      </div>
    </Link>
  );
}

function StatTile({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  tone: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border-2 border-ink bg-surface p-4 shadow-brutal-sm">
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border-2 border-ink ${tone}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-black leading-none tracking-tight text-ink">{value}</p>
        <p className="mt-1 truncate text-xs font-bold text-muted">{label}</p>
      </div>
    </div>
  );
}

export default function DashboardContent({
  allHackathons,
  scheduledMessagesCount = 0,
  sentMessagesCount = 0,
  googleAccount,
  userName,
}: DashboardContentProps) {
  const currentDateLabel = useMemo(() => {
    return new Date()
      .toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })
      .toUpperCase();
  }, []);

  const today = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return now;
  }, []);

  const upcomingHackathons = useMemo(() => {
    return allHackathons
      .filter((h) => new Date(h.hackathonDate) >= today && h.status === "ACTIVE")
      .sort((a, b) => new Date(a.hackathonDate).getTime() - new Date(b.hackathonDate).getTime());
  }, [allHackathons, today]);

  // Group upcoming events strictly by hackathonDate event month (not createdAt)
  const upcomingGrouped = useMemo(() => {
    const groups = new Map<string, { label: string; hackathons: Hackathon[] }>();
    for (const h of upcomingHackathons) {
      const d = new Date(h.hackathonDate);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (!groups.has(key)) {
        groups.set(key, {
          label: d.toLocaleDateString("en-US", { month: "long", year: "numeric" }).toUpperCase(),
          hackathons: [],
        });
      }
      groups.get(key)!.hackathons.push(h);
    }
    return Array.from(groups.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([, value]) => value);
  }, [upcomingHackathons]);

  const totalParticipants = useMemo(
    () => allHackathons.reduce((sum, h) => sum + (h._count?.participants || 0), 0),
    [allHackathons]
  );

  const firstName = userName?.trim().split(/\s+/)[0];

  return (
    <div className="space-y-10 sm:space-y-12">
      {/* ═══════ Hero ═══════ */}
      <section className="flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-center">
        <div className="max-w-xl">
          <p className="mb-2 font-mono text-xs sm:text-sm font-bold uppercase tracking-wider text-muted" suppressHydrationWarning>
            {currentDateLabel}
          </p>
          <p className="mb-1 text-base sm:text-lg font-black text-ink" suppressHydrationWarning>
            {greeting()}
            {firstName ? `, ${firstName}` : ""} 👋
          </p>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black leading-[1.1] tracking-tight text-ink">
            Your next big thing starts here.
          </h1>
          <p className="mt-3 max-w-lg text-sm sm:text-base font-semibold leading-relaxed text-body">
            All your hackathons, deadlines, and participants in one place.
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link href="/hackathons/new" className={buttonVariants({ size: "lg", className: "font-black" })}>
              <CalendarPlus className="h-5 w-5" />
              New Hackathon
            </Link>
            <Link href="/ai-add" className={buttonVariants({ variant: "outline", size: "lg" })}>
              <Sparkles className="h-5 w-5" />
              Import with AI
            </Link>
          </div>
        </div>

        {/* Illustration: decorative, hidden on phones to keep the fold for content */}
        <div aria-hidden="true" className="hidden shrink-0 self-center sm:flex lg:self-auto">
          <svg className="h-auto w-64 select-none md:w-80" viewBox="0 0 280 200" fill="none" xmlns="http://www.w3.org/2000/svg">
            <line x1="72" y1="36" x2="62" y2="20" stroke="var(--ht-ink)" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="84" y1="32" x2="84" y2="14" stroke="var(--ht-ink)" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="96" y1="36" x2="106" y2="20" stroke="var(--ht-ink)" strokeWidth="2.5" strokeLinecap="round" />
            <rect x="94" y="38" width="160" height="110" rx="10" fill="var(--ht-shadow)" />
            <rect x="90" y="34" width="160" height="110" rx="10" fill="#2196F3" stroke="var(--ht-ink)" strokeWidth="3" />
            <circle cx="106" cy="46" r="2.5" fill="#121212" />
            <circle cx="116" cy="46" r="2.5" fill="#121212" />
            <circle cx="126" cy="46" r="2.5" fill="#121212" />
            <rect x="44" y="68" width="166" height="116" rx="10" fill="var(--ht-shadow)" />
            <rect x="40" y="64" width="166" height="116" rx="10" fill="var(--ht-surface)" stroke="var(--ht-ink)" strokeWidth="3" />
            <circle cx="56" cy="76" r="2.5" fill="var(--ht-ink)" />
            <circle cx="66" cy="76" r="2.5" fill="var(--ht-ink)" />
            <circle cx="76" cy="76" r="2.5" fill="var(--ht-ink)" />
            <text x="54" y="114" fontSize="14" fontWeight="900" fontFamily="system-ui, -apple-system, sans-serif" fill="var(--ht-ink)" letterSpacing="0.05em">
              HACKATHON
            </text>
            <rect x="54" y="130" width="70" height="5" rx="2.5" fill="var(--ht-ink)" />
            <rect x="54" y="142" width="45" height="5" rx="2.5" fill="var(--ht-ink)" />
            <rect x="146" y="108" width="44" height="44" rx="6" fill="#FFEB3B" stroke="var(--ht-ink)" strokeWidth="2.5" />
            <text x="168" y="136" textAnchor="middle" fontSize="17" fontWeight="900" fontFamily="system-ui, -apple-system, sans-serif" fill="#121212">
              HT
            </text>
          </svg>
        </div>
      </section>

      {/* ═══════ At a glance ═══════ */}
      <section aria-labelledby="stats-heading" className="space-y-4">
        <h2 id="stats-heading" className="sr-only">
          At a glance
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <StatTile icon={Trophy} label="Upcoming hackathons" value={upcomingHackathons.length} tone="bg-[#FFEB3B] text-on-accent" />
          <StatTile icon={Users} label="Participants" value={totalParticipants} tone="bg-[#00E676] text-on-accent" />
          <StatTile icon={Send} label="Scheduled emails" value={scheduledMessagesCount} tone="bg-[#2196F3] text-white" />
          <StatTile icon={CheckCheck} label="Emails sent" value={sentMessagesCount} tone="bg-surface text-ink" />
        </div>

        {!googleAccount?.connected && (
          <div className="flex flex-col gap-3 rounded-xl border-2 border-ink bg-[#FFEB3B]/30 p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="flex items-start gap-2.5 text-sm font-bold text-ink">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              Connect an email account so your scheduled broadcasts can be delivered.
            </p>
            <Link href="/settings" className={buttonVariants({ variant: "dark", size: "sm", className: "shrink-0" })}>
              Connect Gmail
            </Link>
          </div>
        )}
      </section>

      {/* ═══════ Upcoming Hackathons ═══════ */}
      <section className="space-y-5 sm:space-y-6">
        <div className="flex items-end justify-between gap-4 border-b-2 border-ink pb-3">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-ink" />
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-ink">Upcoming Hackathons</h2>
          </div>
          <Link href="/hackathons" className="group flex shrink-0 items-center gap-1 text-xs sm:text-sm font-bold text-ink hover:underline">
            View all
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        {upcomingHackathons.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-ink bg-surface p-8 text-center sm:p-10">
            <h3 className="text-lg sm:text-xl font-black tracking-tight text-ink">No upcoming hackathons</h3>
            <p className="mx-auto mt-2 mb-6 max-w-md text-xs sm:text-sm font-medium text-muted">
              Create your first hackathon or use AI extraction to import events.
            </p>
            <Link href="/hackathons/new" className={buttonVariants({ size: "sm", className: "font-black" })}>
              <CalendarPlus className="h-4 w-4" />
              New Hackathon
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {upcomingGrouped.map((group) => (
              <div key={group.label} className="space-y-4">
                {upcomingGrouped.length > 1 && (
                  <div className="flex items-center gap-2">
                    <span className="rounded border border-ink bg-[#FFEB3B] px-2 py-0.5 font-mono text-xs font-black uppercase tracking-wider text-on-accent shadow-[1.5px_1.5px_0px_var(--ht-shadow)]">
                      {group.label}
                    </span>
                    <span className="font-mono text-xs font-bold text-muted">
                      ({group.hackathons.length} event{group.hackathons.length !== 1 ? "s" : ""})
                    </span>
                  </div>
                )}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
                  {group.hackathons.map((hackathon, index) => (
                    <HackathonCard key={hackathon.id} hackathon={hackathon} accent={index % 3 === 2 ? "mint" : "blue"} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ═══════ Developer streaks ═══════ */}
      <section aria-labelledby="streaks-heading" className="space-y-3">
        <div>
          <p className="font-mono text-xs font-bold uppercase tracking-wider text-muted">Consistency</p>
          <h2 id="streaks-heading" className="text-xl sm:text-2xl font-black tracking-tight text-ink">Developer streaks</h2>
        </div>
        <StreakDeck size="compact" />
      </section>
    </div>
  );
}
