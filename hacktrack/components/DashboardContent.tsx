"use client";

import * as React from "react";
import { useState, useMemo } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import {
  Calendar,
  Users,
  Send,
  Mail,
  Plus,
  ArrowUpRight,
  MapPin,
  Clock,
  ChevronDown,
  FileText,
} from "lucide-react";

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
  scheduledMessagesCount: number;
  sentMessagesCount: number;
  googleAccount: GoogleStatus;
}

/** Build "MMMM yyyy" label from a Date */
function monthLabel(d: Date): string {
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

/** Build filter key "yyyy-MM" from a Date */
function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default function DashboardContent({
  allHackathons,
  scheduledMessagesCount,
  sentMessagesCount,
  googleAccount,
}: DashboardContentProps) {
  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  const [filterOpen, setFilterOpen] = useState(false);

  // ── Compute distinct months from createdAt (for the filter dropdown) ──
  const filterOptions = useMemo(() => {
    const monthMap = new Map<string, string>();
    for (const h of allHackathons) {
      const d = new Date(h.createdAt);
      const key = monthKey(d);
      if (!monthMap.has(key)) {
        monthMap.set(key, monthLabel(d));
      }
    }
    // Sort descending (most recent first)
    const sorted = Array.from(monthMap.entries()).sort(
      (a, b) => b[0].localeCompare(a[0])
    );
    return sorted;
  }, [allHackathons]);

  // ── Compute the currently-selected label for display ──
  const selectedLabel = useMemo(() => {
    if (selectedMonth === "all") return "All Time";
    const match = filterOptions.find(([key]) => key === selectedMonth);
    return match ? match[1] : "All Time";
  }, [selectedMonth, filterOptions]);

  // ── Filter: hackathons ADDED in selected month (createdAt-based) ──
  const hackathonsAddedInMonth = useMemo(() => {
    if (selectedMonth === "all") return allHackathons;
    return allHackathons.filter((h) => {
      const d = new Date(h.createdAt);
      return monthKey(d) === selectedMonth;
    });
  }, [allHackathons, selectedMonth]);

  // ── UPCOMING hackathons: hackathonDate >= today (unaffected by filter) ──
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

  // ── Group upcoming hackathons by hackathonDate MONTH ──
  const upcomingGrouped = useMemo(() => {
    const groups = new Map<string, { label: string; hackathons: Hackathon[] }>();
    for (const h of upcomingHackathons) {
      const d = new Date(h.hackathonDate);
      const key = monthKey(d);
      if (!groups.has(key)) {
        groups.set(key, { label: monthLabel(d), hackathons: [] });
      }
      groups.get(key)!.hackathons.push(h);
    }
    // Sort groups chronologically
    return Array.from(groups.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([, value]) => value);
  }, [upcomingHackathons]);

  // ── Group activity log by createdAt MONTH ──
  const activityGrouped = useMemo(() => {
    const source =
      selectedMonth === "all" ? allHackathons : hackathonsAddedInMonth;
    const groups = new Map<string, { label: string; hackathons: Hackathon[] }>();
    for (const h of source) {
      const d = new Date(h.createdAt);
      const key = monthKey(d);
      if (!groups.has(key)) {
        groups.set(key, { label: monthLabel(d), hackathons: [] });
      }
      groups.get(key)!.hackathons.push(h);
    }
    // Sort descending (most recent first)
    return Array.from(groups.entries())
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([, value]) => value);
  }, [allHackathons, hackathonsAddedInMonth, selectedMonth]);

  // ── KPI calculations ──
  const hackathonsAddedCount = hackathonsAddedInMonth.length;

  const totalParticipants = useMemo(() => {
    return hackathonsAddedInMonth.reduce(
      (sum, h) => sum + (h._count?.participants || 0),
      0
    );
  }, [hackathonsAddedInMonth]);

  return (
    <div className="space-y-8">
      {/* Top Banner / Welcome */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 brutal-card rounded-2xl bg-[#FFEB3B]">
        <div>
          <span className="inline-block px-2.5 py-0.5 bg-[#121212] text-white text-xs font-mono font-bold uppercase rounded mb-2">
            Overview
          </span>
          <h1 className="text-2xl md:text-3xl font-black text-[#121212] tracking-tight">
            Administrator Command Center
          </h1>
          <p className="text-sm font-bold text-[#121212]/80 mt-1">
            Real-time status of your hackathons, registered participants, and
            scheduled email broadcasts.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {/* Month/Year Filter */}
          <div className="relative">
            <button
              onClick={() => setFilterOpen(!filterOpen)}
              className="brutal-btn bg-white text-[#121212] px-4 py-2 text-sm rounded-lg gap-2 font-bold"
            >
              <Calendar className="w-4 h-4" />
              {selectedLabel}
              <ChevronDown
                className={`w-4 h-4 transition-transform ${filterOpen ? "rotate-180" : ""}`}
              />
            </button>
            {filterOpen && (
              <div className="absolute right-0 top-full mt-2 z-50 w-56 brutal-card rounded-xl bg-white p-1.5 max-h-72 overflow-y-auto">
                <button
                  onClick={() => {
                    setSelectedMonth("all");
                    setFilterOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-sm font-bold rounded-lg transition-colors ${
                    selectedMonth === "all"
                      ? "bg-[#FFEB3B] text-[#121212]"
                      : "hover:bg-[#F4F4F5] text-[#121212]"
                  }`}
                >
                  All Time
                </button>
                {filterOptions.map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => {
                      setSelectedMonth(key);
                      setFilterOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-sm font-bold rounded-lg transition-colors ${
                      selectedMonth === key
                        ? "bg-[#FFEB3B] text-[#121212]"
                        : "hover:bg-[#F4F4F5] text-[#121212]"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <Link href="/hackathons/new">
            <Button variant="dark" size="md" className="gap-2">
              <Plus className="w-4 h-4" />
              Create Hackathon
            </Button>
          </Link>
          <Link href="/settings">
            <Button variant="outline" size="md" className="gap-2">
              <Mail className="w-4 h-4" />
              Gmail Settings
            </Button>
          </Link>
        </div>
      </div>

      {/* 4 Core KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <Card className="bg-white hover:-translate-y-1 transition-transform">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#71717A]">
              Hackathons Added
            </span>
            <div className="p-2 bg-[#FFEB3B] rounded-lg border-2 border-[#121212]">
              <Calendar className="w-4 h-4 text-[#121212]" />
            </div>
          </div>
          <div className="text-4xl font-black font-mono mt-3 text-[#121212]">
            {hackathonsAddedCount}
          </div>
          <p className="text-xs font-medium text-[#71717A] mt-2">
            {selectedLabel}
          </p>
        </Card>

        <Card className="bg-white hover:-translate-y-1 transition-transform">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#71717A]">
              Upcoming
            </span>
            <div className="p-2 bg-[#2196F3] text-white rounded-lg border-2 border-[#121212]">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-4xl font-black font-mono mt-3 text-[#121212]">
            {upcomingHackathons.length}
          </div>
          <p className="text-xs font-medium text-[#71717A] mt-2">
            Starting in the coming days
          </p>
        </Card>

        <Card className="bg-white hover:-translate-y-1 transition-transform">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#71717A]">
              Total Participants
            </span>
            <div className="p-2 bg-[#00E676] text-[#121212] rounded-lg border-2 border-[#121212]">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-4xl font-black font-mono mt-3 text-[#121212]">
            {totalParticipants}
          </div>
          <p className="text-xs font-medium text-[#71717A] mt-2">
            {selectedLabel === "All Time"
              ? "Registered developers"
              : `In ${selectedLabel}`}
          </p>
        </Card>

        <Card className="bg-white hover:-translate-y-1 transition-transform">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#71717A]">
              Scheduled Messages
            </span>
            <div className="p-2 bg-[#FF5252] text-white rounded-lg border-2 border-[#121212]">
              <Send className="w-4 h-4" />
            </div>
          </div>
          <div className="text-4xl font-black font-mono mt-3 text-[#121212]">
            {scheduledMessagesCount}
          </div>
          <p className="text-xs font-medium text-[#71717A] mt-2">
            {sentMessagesCount} broadcasts sent
          </p>
        </Card>
      </div>

      {/* ═══════ Hackathon Activity (grouped by createdAt) ═══════ */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black tracking-tight text-[#121212]">
              Hackathon Activity
            </h2>
            <p className="text-xs font-bold text-[#71717A]">
              Chronological log of hackathons added to HackTrack
              {selectedLabel !== "All Time" ? ` — ${selectedLabel}` : ""}
            </p>
          </div>
        </div>

        {activityGrouped.length === 0 ? (
          <div className="brutal-card p-10 text-center rounded-2xl bg-white">
            <FileText className="w-12 h-12 text-[#71717A] mx-auto mb-3" />
            <h3 className="font-black text-lg text-[#121212]">
              No hackathons added
              {selectedLabel !== "All Time"
                ? ` in ${selectedLabel}`
                : ""}
            </h3>
            <p className="text-xs text-[#71717A] max-w-sm mx-auto mt-1 mb-6">
              {selectedLabel !== "All Time"
                ? "Try selecting a different month or create a new hackathon."
                : "Create your first hackathon to start tracking your activity."}
            </p>
            <Link href="/hackathons/new">
              <Button variant="primary" className="gap-2">
                <Plus className="w-4 h-4" />
                Create Hackathon
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {activityGrouped.map((group) => (
              <div key={group.label}>
                {/* Month heading */}
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-sm font-mono font-black uppercase tracking-wider text-[#121212]">
                    {group.label}
                  </span>
                  <Badge variant="neutral" className="text-[10px]">
                    {group.hackathons.length}
                  </Badge>
                </div>

                {/* Activity entries */}
                <div className="brutal-card rounded-xl overflow-hidden divide-y-2 divide-[#121212]">
                  {group.hackathons.map((h) => {
                    const createdDate = new Date(h.createdAt);
                    const hackDate = new Date(h.hackathonDate);
                    const isUpcoming = hackDate >= today;

                    return (
                      <div
                        key={h.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 hover:bg-[#F4F4F5]/50 transition-colors"
                      >
                        <div className="flex items-start gap-4">
                          {/* Date chip */}
                          <div className="flex flex-col items-center min-w-[52px] py-1">
                            <span className="text-[10px] font-mono font-bold uppercase text-[#71717A]">
                              {createdDate.toLocaleDateString("en-US", {
                                month: "short",
                              })}
                            </span>
                            <span className="text-xl font-black text-[#121212] leading-tight">
                              {createdDate.getDate()}
                            </span>
                          </div>

                          <div className="space-y-1">
                            <Link
                              href={`/hackathons/${h.id}`}
                              className="font-black text-base text-[#121212] hover:underline line-clamp-1"
                            >
                              {h.name}
                            </Link>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-mono text-[#71717A]">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                Event: {formatDate(h.hackathonDate)}
                              </span>
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {h.location}
                              </span>
                              <span className="flex items-center gap-1">
                                <Users className="w-3 h-3" />
                                {h._count?.participants || 0} participants
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 sm:pl-0 pl-[68px]">
                          {isUpcoming ? (
                            <Badge variant="blue" className="text-[10px]">
                              Upcoming
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px]">
                              Past
                            </Badge>
                          )}
                          <Link href={`/hackathons/${h.id}`}>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="gap-1 text-xs"
                            >
                              View
                              <ArrowUpRight className="w-3 h-3" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ═══════ Upcoming Hackathons (grouped by hackathonDate) ═══════ */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black tracking-tight text-[#121212]">
              Upcoming Hackathons
            </h2>
            <p className="text-xs font-bold text-[#71717A]">
              Scheduled events grouped by event month
            </p>
          </div>
          <Link
            href="/history"
            className="text-xs font-bold uppercase tracking-wider hover:underline flex items-center gap-1"
          >
            View All ({upcomingHackathons.length})
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {upcomingGrouped.length === 0 ? (
          <div className="brutal-card p-10 text-center rounded-2xl bg-white">
            <Calendar className="w-12 h-12 text-[#71717A] mx-auto mb-3" />
            <h3 className="font-black text-lg text-[#121212]">
              No upcoming hackathons
            </h3>
            <p className="text-xs text-[#71717A] max-w-sm mx-auto mt-1 mb-6">
              Create your first hackathon to start managing participants and
              scheduling email updates.
            </p>
            <Link href="/hackathons/new">
              <Button variant="primary" className="gap-2">
                <Plus className="w-4 h-4" />
                Create First Hackathon
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {upcomingGrouped.map((group) => (
              <div key={group.label}>
                {/* Month heading */}
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-[#2196F3] rounded-lg border-2 border-[#121212] flex items-center justify-center">
                    <Calendar className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="text-base font-black text-[#121212] tracking-tight">
                    {group.label}
                  </h3>
                  <Badge variant="blue" className="text-[10px]">
                    {group.hackathons.length} event
                    {group.hackathons.length !== 1 ? "s" : ""}
                  </Badge>
                </div>

                {/* Cards grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {group.hackathons.map((hackathon) => (
                    <div
                      key={hackathon.id}
                      className="brutal-card rounded-2xl p-5 bg-white flex flex-col justify-between hover:-translate-y-1 transition-transform"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <Badge variant="yellow" className="text-[10px]">
                            {hackathon.fee}
                          </Badge>
                          <span className="text-xs font-mono font-bold text-[#71717A] flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {formatDate(hackathon.hackathonDate)}
                          </span>
                        </div>

                        <h3 className="font-black text-lg text-[#121212] line-clamp-1 mb-2">
                          {hackathon.name}
                        </h3>
                        <p className="text-xs text-[#71717A] line-clamp-2 mb-4 font-medium">
                          {hackathon.description}
                        </p>

                        <div className="space-y-1.5 pt-3 border-t-2 border-[#121212] text-xs font-mono">
                          <div className="flex items-center justify-between">
                            <span className="text-[#71717A] flex items-center gap-1">
                              <MapPin className="w-3 h-3" /> Location:
                            </span>
                            <strong className="text-[#121212]">
                              {hackathon.location}
                            </strong>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-[#71717A] flex items-center gap-1">
                              <Users className="w-3 h-3" /> Participants:
                            </span>
                            <strong className="text-[#121212]">
                              {hackathon._count?.participants || 0}
                            </strong>
                          </div>
                        </div>
                      </div>

                      <div className="pt-4 mt-4 border-t-2 border-[#121212]">
                        <Link
                          href={`/hackathons/${hackathon.id}`}
                          className="w-full"
                        >
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full justify-between"
                          >
                            <span>View Details</span>
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
