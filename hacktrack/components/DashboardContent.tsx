"use client";

import * as React from "react";
import { useMemo } from "react";
import Link from "next/link";
import { Users, Plus, Sparkles, CalendarPlus, Mail } from "lucide-react";

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

export default function DashboardContent({
  allHackathons,
}: DashboardContentProps) {
  // Current date for hero header badge e.g. "THURSDAY, OCTOBER 1"
  const currentDateLabel = useMemo(() => {
    return new Date()
      .toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
      })
      .toUpperCase();
  }, []);

  // Filter upcoming active hackathons: hackathonDate >= today && status === "ACTIVE"
  const today = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return now;
  }, []);

  const upcomingHackathons = useMemo(() => {
    return allHackathons
      .filter((h) => new Date(h.hackathonDate) >= today && h.status === "ACTIVE")
      .sort(
        (a, b) =>
          new Date(a.hackathonDate).getTime() -
          new Date(b.hackathonDate).getTime()
      );
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

  return (
    <div className="space-y-8 sm:space-y-10">
      {/* ═══════ 2. Hero Section ═══════ */}
      <section className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8 pt-4 sm:pt-6">
        {/* Left: Date, Headline, Description, and CTAs */}
        <div className="max-w-xl">
          <div className="flex items-center gap-2 mb-2">
            <p className="text-xs sm:text-sm font-bold font-mono tracking-wider text-[#71717A] uppercase">
              {currentDateLabel}
            </p>
            {/* Subtle doodle accent in whitespace */}
            <span className="font-mono text-xs font-bold text-[#121212]/30 select-none">&lt;/&gt;</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-[#121212] tracking-tight leading-[1.1]">
            Your next big thing starts here.
          </h1>
          <p className="text-sm sm:text-base text-[#71717A] font-semibold mt-3 max-w-lg leading-relaxed">
            All your hackathons, deadlines, and participants in one place.
          </p>

          <div className="flex flex-wrap items-center gap-3.5 mt-6">
            <Link href="/hackathons/new">
              <button className="brutal-btn bg-[#FFEB3B] hover:bg-[#FDD835] text-[#121212] border-2 border-[#121212] shadow-brutal px-5 py-2.5 rounded-lg font-black text-sm sm:text-base">
                + New Hackathon
              </button>
            </Link>

            <Link href="/ai-add">
              <button className="brutal-btn bg-white hover:bg-[#F4F4F5] text-[#121212] border-2 border-[#121212] shadow-brutal px-5 py-2.5 rounded-lg font-bold text-sm sm:text-base flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#121212]" />
                <span>Import with AI</span>
              </button>
            </Link>
          </div>
        </div>

        {/* Right: Exact Dual-Window Vector Illustration */}
        <div className="self-center lg:self-auto shrink-0 w-full sm:w-auto flex justify-center mt-2 lg:mt-0">
          <svg
            className="w-64 sm:w-72 md:w-80 h-auto select-none"
            viewBox="0 0 280 200"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Top-left burst lines */}
            <line x1="72" y1="36" x2="62" y2="20" stroke="#121212" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="84" y1="32" x2="84" y2="14" stroke="#121212" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="96" y1="36" x2="106" y2="20" stroke="#121212" strokeWidth="2.5" strokeLinecap="round" />

            {/* Back Window (Blue) */}
            <g>
              <rect x="94" y="38" width="160" height="110" rx="10" fill="#121212" />
              <rect
                x="90"
                y="34"
                width="160"
                height="110"
                rx="10"
                fill="#2196F3"
                stroke="#121212"
                strokeWidth="3"
              />
              <circle cx="106" cy="46" r="2.5" fill="#121212" />
              <circle cx="116" cy="46" r="2.5" fill="#121212" />
              <circle cx="126" cy="46" r="2.5" fill="#121212" />
            </g>

            {/* Front Window (White) */}
            <g>
              {/* Drop Shadow */}
              <rect x="44" y="68" width="166" height="116" rx="10" fill="#121212" />
              {/* White Box */}
              <rect
                x="40"
                y="64"
                width="166"
                height="116"
                rx="10"
                fill="#FFFFFF"
                stroke="#121212"
                strokeWidth="3"
              />
              {/* Top Bar Dots */}
              <circle cx="56" cy="76" r="2.5" fill="#121212" />
              <circle cx="66" cy="76" r="2.5" fill="#121212" />
              <circle cx="76" cy="76" r="2.5" fill="#121212" />

              {/* Title & Placeholder Lines */}
              <text
                x="54"
                y="114"
                fontSize="14"
                fontWeight="900"
                fontFamily="system-ui, -apple-system, sans-serif"
                fill="#121212"
                letterSpacing="0.05em"
              >
                HACKATHON
              </text>
              <rect x="54" y="130" width="70" height="5" rx="2.5" fill="#121212" />
              <rect x="54" y="142" width="45" height="5" rx="2.5" fill="#121212" />

              {/* Yellow [HT] Badge inside Front Window */}
              <rect
                x="146"
                y="108"
                width="44"
                height="44"
                rx="6"
                fill="#FFEB3B"
                stroke="#121212"
                strokeWidth="2.5"
              />
              <text
                x="168"
                y="136"
                textAnchor="middle"
                fontSize="17"
                fontWeight="900"
                fontFamily="system-ui, -apple-system, sans-serif"
                fill="#121212"
              >
                HT
              </text>
            </g>
          </svg>
        </div>
      </section>

      {/* ═══════ Thin Divider directly between Hero & Upcoming ═══════ */}
      <div className="w-full border-t border-[#121212]/20 my-6 sm:my-8" />

      {/* ═══════ 4. Upcoming Hackathons ═══════ */}
      <section className="space-y-5 sm:space-y-6">
        {/* Section Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-black text-[#121212] tracking-tight">
              Upcoming Hackathons
            </h2>
            {/* Subtle doodle accent */}
            <span className="font-mono text-xs font-bold text-[#121212]/25 select-none tracking-widest">&#123; &#125;</span>
          </div>
          <Link
            href="/hackathons"
            className="text-xs sm:text-sm font-bold text-[#121212] hover:underline flex items-center gap-1 group"
          >
            <span>View all</span>
            <span className="transition-transform group-hover:translate-x-1 font-bold">
              →
            </span>
          </Link>
        </div>

        {/* Empty state or cards */}
        {upcomingHackathons.length === 0 ? (
          <div className="brutal-card p-8 sm:p-10 text-center rounded-2xl bg-white border-2 border-[#121212] shadow-brutal-sm">
            <h3 className="font-black text-lg sm:text-xl text-[#121212] tracking-tight">
              No upcoming hackathons
            </h3>
            <p className="text-xs sm:text-sm text-[#71717A] max-w-md mx-auto mt-2 mb-6 font-medium">
              Create your first hackathon or use AI extraction to import events.
            </p>
            <Link href="/hackathons/new">
              <button className="brutal-btn bg-[#FFEB3B] hover:bg-[#FDD835] text-[#121212] border-2 border-[#121212] shadow-brutal-sm px-4 py-2 rounded-lg font-black text-sm">
                + New Hackathon
              </button>
            </Link>
          </div>
        ) : upcomingGrouped.length > 1 ? (
          /* Multi-month grouped layout strictly by hackathonDate event month */
          <div className="space-y-8">
            {upcomingGrouped.map((group) => (
              <div key={group.label} className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-black text-[#121212] uppercase tracking-wider bg-[#FFEB3B] px-2 py-0.5 border border-[#121212] rounded shadow-[1.5px_1.5px_0px_#121212]">
                    {group.label}
                  </span>
                  <span className="text-xs font-mono font-bold text-[#71717A]">
                    ({group.hackathons.length} event{group.hackathons.length !== 1 ? "s" : ""})
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {group.hackathons.map((hackathon, index) => {
                    const isMint = index % 3 === 2;
                    return (
                      <Link
                        key={hackathon.id}
                        href={`/hackathons/${hackathon.id}`}
                        className="group block"
                      >
                        <div className="brutal-card rounded-xl p-5 bg-white border-2 border-[#121212] shadow-brutal-sm flex flex-col justify-between hover:-translate-y-1 hover:shadow-brutal transition-all duration-150 h-full">
                          <div>
                            {/* Top Row: UPCOMING Badge + Short Date */}
                            <div className="flex items-center justify-between gap-2 mb-3">
                              <span
                                className={`px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider border-2 border-[#121212] shadow-[1.5px_1.5px_0px_#121212] ${
                                  isMint
                                    ? "bg-[#00E676] text-[#121212]"
                                    : "bg-[#2196F3] text-white"
                                }`}
                              >
                                UPCOMING
                              </span>
                              <span className="text-xs font-mono font-black text-[#121212] uppercase tracking-wider">
                                {formatShortDate(hackathon.hackathonDate)}
                              </span>
                            </div>

                            {/* Hackathon Name */}
                            <h3 className="font-black text-lg text-[#121212] line-clamp-1 mb-1 tracking-tight group-hover:underline">
                              {hackathon.name}
                            </h3>

                            {/* Location & Registration Subtitle */}
                            <p className="text-xs text-[#71717A] font-medium line-clamp-1 mb-4">
                              {getSubtitle(hackathon)}
                            </p>
                          </div>

                          {/* Bottom Row: Participants + Right Arrow */}
                          <div className="flex items-center justify-between pt-3 border-t border-[#121212]/15 text-xs font-bold text-[#121212]">
                            <div className="flex items-center gap-1.5">
                              <Users className="w-3.5 h-3.5 stroke-[2.2] text-[#121212]" />
                              <span>
                                {hackathon._count?.participants || 0} participants
                              </span>
                            </div>
                            <span className="text-base font-black text-[#121212] group-hover:translate-x-1 transition-transform">
                              →
                            </span>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Single month layout: direct 3-column responsive grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {upcomingHackathons.map((hackathon, index) => {
              const isMint = index % 3 === 2;
              return (
                <Link
                  key={hackathon.id}
                  href={`/hackathons/${hackathon.id}`}
                  className="group block"
                >
                  <div className="brutal-card rounded-xl p-5 bg-white border-2 border-[#121212] shadow-brutal-sm flex flex-col justify-between hover:-translate-y-1 hover:shadow-brutal transition-all duration-150 h-full">
                    <div>
                      {/* Top Row: UPCOMING Badge + Short Date */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span
                          className={`px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider border-2 border-[#121212] shadow-[1.5px_1.5px_0px_#121212] ${
                            isMint
                              ? "bg-[#00E676] text-[#121212]"
                              : "bg-[#2196F3] text-white"
                          }`}
                        >
                          UPCOMING
                        </span>
                        <span className="text-xs font-mono font-black text-[#121212] uppercase tracking-wider">
                          {formatShortDate(hackathon.hackathonDate)}
                        </span>
                      </div>

                      {/* Hackathon Name */}
                      <h3 className="font-black text-lg text-[#121212] line-clamp-1 mb-1 tracking-tight group-hover:underline">
                        {hackathon.name}
                      </h3>

                      {/* Location & Registration Subtitle */}
                      <p className="text-xs text-[#71717A] font-medium line-clamp-1 mb-4">
                        {getSubtitle(hackathon)}
                      </p>
                    </div>

                    {/* Bottom Row: Participants + Right Arrow */}
                    <div className="flex items-center justify-between pt-3 border-t border-[#121212]/15 text-xs font-bold text-[#121212]">
                      <div className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 stroke-[2.2] text-[#121212]" />
                        <span>
                          {hackathon._count?.participants || 0} participants
                        </span>
                      </div>
                      <span className="text-base font-black text-[#121212] group-hover:translate-x-1 transition-transform">
                        →
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* ═══════ 5. Get started with HackTrack (Three-Step Guide) ═══════ */}
      <section className="brutal-card rounded-2xl p-5 sm:p-6 bg-[#FEFDF8] border-2 border-[#121212] shadow-brutal-sm">
        <div className="flex items-center gap-2">
          <h2 className="text-xl sm:text-2xl font-black text-[#121212] tracking-tight">
            Get started with HackTrack
          </h2>
          {/* Subtle terminal prompt doodle */}
          <span className="font-mono text-xs font-bold text-[#121212]/25 select-none">&gt;_</span>
        </div>
        <p className="text-xs sm:text-sm text-[#71717A] font-medium mt-1 mb-5 sm:mb-6">
          A simple workflow to keep every event organized.
        </p>

        <div className="space-y-4 sm:space-y-5">
          {/* Step 1: Create an event */}
          <Link
            href="/hackathons/new"
            className="group flex items-start gap-3.5 p-1 rounded-xl hover:bg-black/[0.02] transition-colors"
          >
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-[#FFEB3B] flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
              <CalendarPlus className="w-5 h-5 text-[#121212] stroke-[2]" />
            </div>
            <div>
              <h3 className="font-black text-sm sm:text-base text-[#121212] group-hover:underline">
                1. Create an event
              </h3>
              <p className="text-xs sm:text-sm text-[#71717A] font-medium mt-0.5 leading-relaxed">
                Enter hackathon dates, rounds, fees, and registration details.
              </p>
            </div>
          </Link>

          {/* Step 2: Add participants */}
          <Link
            href="/hackathons"
            className="group flex items-start gap-3.5 p-1 rounded-xl hover:bg-black/[0.02] transition-colors"
          >
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-[#DDEBFF] flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
              <Users className="w-5 h-5 text-[#121212] stroke-[2]" />
            </div>
            <div>
              <h3 className="font-black text-sm sm:text-base text-[#121212] group-hover:underline">
                2. Add participants
              </h3>
              <p className="text-xs sm:text-sm text-[#71717A] font-medium mt-0.5 leading-relaxed">
                Keep participant names and email addresses organized per event.
              </p>
            </div>
          </Link>

          {/* Step 3: Schedule updates */}
          <Link
            href={
              upcomingHackathons.length > 0
                ? `/hackathons/${upcomingHackathons[0].id}`
                : "/hackathons"
            }
            className="group flex items-start gap-3.5 p-1 rounded-xl hover:bg-black/[0.02] transition-colors"
          >
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-[#DCFCE7] flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
              <Mail className="w-5 h-5 text-[#121212] stroke-[2]" />
            </div>
            <div>
              <h3 className="font-black text-sm sm:text-base text-[#121212] group-hover:underline">
                3. Schedule updates
              </h3>
              <p className="text-xs sm:text-sm text-[#71717A] font-medium mt-0.5 leading-relaxed">
                Prepare messages and choose when they should be sent.
              </p>
            </div>
          </Link>
        </div>
      </section>
    </div>
  );
}
