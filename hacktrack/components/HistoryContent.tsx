"use client";

import * as React from "react";
import { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge, HackathonStatusBadge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import {
  deleteHackathon,
  flagHackathon,
  restoreHackathon,
} from "@/actions/hackathons";
import { toast } from "sonner";
import {
  History,
  Search,
  Calendar,
  Filter,
  MoreVertical,
  ArrowUpRight,
  Edit,
  Trash2,
  Flag,
  RotateCcw,
  MapPin,
  Users,
  Clock,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Layers,
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

interface HistoryContentProps {
  initialHackathons: Hackathon[];
}

function monthLabel(d: Date): string {
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default function HistoryContent({ initialHackathons }: HistoryContentProps) {
  const [hackathons, setHackathons] = useState<Hackathon[]>(initialHackathons);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // Dialog and Menu state
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [dialogState, setDialogState] = useState<{
    isOpen: boolean;
    action: "delete" | "flag" | "restore" | null;
    target: Hackathon | null;
    isLoading: boolean;
  }>({
    isOpen: false,
    action: null,
    target: null,
    isLoading: false,
  });

  // Dropdown menus
  const [monthDropdownOpen, setMonthDropdownOpen] = useState(false);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  // Close menus when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenuId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Compute distinct createdAt months for filter
  const monthOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const h of hackathons) {
      const d = new Date(h.createdAt);
      const key = monthKey(d);
      if (!map.has(key)) {
        map.set(key, monthLabel(d));
      }
    }
    return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [hackathons]);

  const selectedMonthLabel = useMemo(() => {
    if (selectedMonth === "all") return "All Time";
    const found = monthOptions.find(([k]) => k === selectedMonth);
    return found ? found[1] : "All Time";
  }, [selectedMonth, monthOptions]);

  const statusOptions = [
    { key: "all", label: "All Statuses" },
    { key: "active", label: "Active" },
    { key: "upcoming", label: "Upcoming" },
    { key: "completed", label: "Completed" },
    { key: "flagged", label: "Flagged" },
    { key: "removed", label: "Removed" },
  ];

  const selectedStatusLabel = useMemo(() => {
    const found = statusOptions.find((s) => s.key === selectedStatus);
    return found ? found.label : "All Statuses";
  }, [selectedStatus]);

  // Reset pagination when any filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedMonth, selectedStatus]);

  // Filtered hackathons
  const filteredHackathons = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return hackathons.filter((h) => {
      // 1. Text Search (name, description, location)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = h.name.toLowerCase().includes(q);
        const matchesDesc = h.description.toLowerCase().includes(q);
        const matchesLoc = h.location.toLowerCase().includes(q);
        if (!matchesName && !matchesDesc && !matchesLoc) return false;
      }

      // 2. Month Filter (createdAt)
      if (selectedMonth !== "all") {
        const d = new Date(h.createdAt);
        if (monthKey(d) !== selectedMonth) return false;
      }

      // 3. Status Filter
      if (selectedStatus !== "all") {
        const isPast = new Date(h.hackathonDate) < today;
        const isUpcoming = new Date(h.hackathonDate) >= today;

        if (selectedStatus === "active") {
          if (h.status !== "ACTIVE") return false;
        } else if (selectedStatus === "upcoming") {
          if (h.status !== "ACTIVE" || !isUpcoming) return false;
        } else if (selectedStatus === "completed") {
          if (h.status !== "ACTIVE" || !isPast) return false;
        } else if (selectedStatus === "flagged") {
          if (h.status !== "FLAGGED") return false;
        } else if (selectedStatus === "removed") {
          if (h.status !== "REMOVED") return false;
        }
      }

      return true;
    });
  }, [hackathons, searchQuery, selectedMonth, selectedStatus]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredHackathons.length / itemsPerPage) || 1;
  const paginatedHackathons = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredHackathons.slice(start, start + itemsPerPage);
  }, [filteredHackathons, currentPage]);

  const hasActiveFilters =
    searchQuery.trim() !== "" ||
    selectedMonth !== "all" ||
    selectedStatus !== "all";

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedMonth("all");
    setSelectedStatus("all");
    setCurrentPage(1);
  };

  // Actions handling
  const handleOpenDialog = (
    action: "delete" | "flag" | "restore",
    target: Hackathon
  ) => {
    setActiveMenuId(null);
    setDialogState({
      isOpen: true,
      action,
      target,
      isLoading: false,
    });
  };

  const handleConfirmAction = async () => {
    const { action, target } = dialogState;
    if (!action || !target) return;

    setDialogState((prev) => ({ ...prev, isLoading: true }));

    try {
      if (action === "delete") {
        const res = await deleteHackathon(target.id);
        if (res.error) {
          toast.error(res.error);
        } else {
          toast.success(`"${target.name}" removed from active records.`);
          setHackathons((prev) =>
            prev.map((h) =>
              h.id === target.id
                ? { ...h, status: "REMOVED", deletedAt: new Date() }
                : h
            )
          );
        }
      } else if (action === "flag") {
        const res = await flagHackathon(target.id);
        if (res.error) {
          toast.error(res.error);
        } else {
          toast.success(`"${target.name}" has been flagged.`);
          setHackathons((prev) =>
            prev.map((h) =>
              h.id === target.id ? { ...h, status: "FLAGGED" } : h
            )
          );
        }
      } else if (action === "restore") {
        const res = await restoreHackathon(target.id);
        if (res.error) {
          toast.error(res.error);
        } else {
          toast.success(`"${target.name}" restored to Active.`);
          setHackathons((prev) =>
            prev.map((h) =>
              h.id === target.id
                ? { ...h, status: "ACTIVE", deletedAt: null }
                : h
            )
          );
        }
      }
    } catch {
      toast.error("Operation failed. Please try again.");
    } finally {
      setDialogState({
        isOpen: false,
        action: null,
        target: null,
        isLoading: false,
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Page Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 brutal-card rounded-2xl bg-[#FFEB3B]">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-block px-2.5 py-0.5 bg-[#121212] text-white text-xs font-mono font-bold uppercase rounded">
              Audit & History
            </span>
            <Badge variant="neutral" className="text-xs">
              {hackathons.length} Total
            </Badge>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-[#121212] tracking-tight flex items-center gap-3">
            <History className="w-7 h-7" />
            Hackathon History
          </h1>
          <p className="text-sm font-bold text-[#121212]/80 mt-1">
            Complete chronological archive of all hackathons entered into HackTrack.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/hackathons/new">
            <Button variant="dark" size="md">
              Create Hackathon
            </Button>
          </Link>
        </div>
      </div>

      {/* ── Filters & Search Toolbar ── */}
      <Card className="bg-white p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Search bar */}
          <div className="md:col-span-5 relative">
            <Search className="w-4 h-4 text-[#71717A] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, description, location..."
              className="w-full pl-10 pr-4 py-2 text-sm font-medium rounded-lg border-2 border-[#121212] bg-[#FEFDF8] text-[#121212] placeholder:text-[#71717A] focus:outline-hidden focus:ring-2 focus:ring-[#FFEB3B]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#71717A] hover:text-[#121212]"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Month Created Filter */}
          <div className="md:col-span-3 relative">
            <button
              onClick={() => {
                setMonthDropdownOpen(!monthDropdownOpen);
                setStatusDropdownOpen(false);
              }}
              className="w-full brutal-btn bg-[#FEFDF8] text-[#121212] px-3.5 py-2 text-sm rounded-lg flex items-center justify-between font-bold border-2 border-[#121212]"
            >
              <span className="flex items-center gap-2 truncate">
                <Calendar className="w-4 h-4 text-[#71717A] shrink-0" />
                <span className="truncate">{selectedMonthLabel}</span>
              </span>
              <ChevronDown
                className={`w-4 h-4 shrink-0 transition-transform ${monthDropdownOpen ? "rotate-180" : ""}`}
              />
            </button>

            {monthDropdownOpen && (
              <div className="absolute left-0 top-full mt-1.5 z-40 w-full min-w-[200px] brutal-card rounded-xl bg-white p-1.5 max-h-60 overflow-y-auto">
                <button
                  onClick={() => {
                    setSelectedMonth("all");
                    setMonthDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                    selectedMonth === "all"
                      ? "bg-[#FFEB3B] text-[#121212]"
                      : "hover:bg-[#F4F4F5] text-[#121212]"
                  }`}
                >
                  All Time
                </button>
                {monthOptions.map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => {
                      setSelectedMonth(key);
                      setMonthDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
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

          {/* Status Filter */}
          <div className="md:col-span-3 relative">
            <button
              onClick={() => {
                setStatusDropdownOpen(!statusDropdownOpen);
                setMonthDropdownOpen(false);
              }}
              className="w-full brutal-btn bg-[#FEFDF8] text-[#121212] px-3.5 py-2 text-sm rounded-lg flex items-center justify-between font-bold border-2 border-[#121212]"
            >
              <span className="flex items-center gap-2 truncate">
                <Filter className="w-4 h-4 text-[#71717A] shrink-0" />
                <span className="truncate">{selectedStatusLabel}</span>
              </span>
              <ChevronDown
                className={`w-4 h-4 shrink-0 transition-transform ${statusDropdownOpen ? "rotate-180" : ""}`}
              />
            </button>

            {statusDropdownOpen && (
              <div className="absolute left-0 top-full mt-1.5 z-40 w-full min-w-[180px] brutal-card rounded-xl bg-white p-1.5">
                {statusOptions.map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => {
                      setSelectedStatus(opt.key);
                      setStatusDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                      selectedStatus === opt.key
                        ? "bg-[#FFEB3B] text-[#121212]"
                        : "hover:bg-[#F4F4F5] text-[#121212]"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Clear Filters Button */}
          <div className="md:col-span-1 flex items-center">
            {hasActiveFilters ? (
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
                className="w-full h-full min-h-[38px] p-2 text-xs font-bold gap-1"
                title="Reset filters"
              >
                <X className="w-3.5 h-3.5" />
                Clear
              </Button>
            ) : (
              <div className="text-[11px] font-mono font-bold text-[#71717A] text-center w-full">
                {filteredHackathons.length} result
                {filteredHackathons.length !== 1 ? "s" : ""}
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* ── Results Container ── */}
      {filteredHackathons.length === 0 ? (
        /* Empty State */
        <div className="brutal-card p-12 text-center rounded-2xl bg-white">
          <div className="w-16 h-16 bg-[#F4F4F5] rounded-2xl border-2 border-[#121212] flex items-center justify-center mx-auto mb-4">
            <Layers className="w-8 h-8 text-[#71717A]" />
          </div>
          <h3 className="font-black text-xl text-[#121212]">
            No hackathons found
          </h3>
          <p className="text-sm font-medium text-[#71717A] max-w-md mx-auto mt-2 mb-6">
            {hasActiveFilters
              ? "No hackathons matched your current search and filter criteria. Try clearing filters or using different keywords."
              : "No hackathons have been entered into HackTrack yet. Start by creating your first entry."}
          </p>
          {hasActiveFilters ? (
            <Button variant="primary" onClick={clearFilters} className="gap-2">
              <RotateCcw className="w-4 h-4" />
              Reset All Filters
            </Button>
          ) : (
            <Link href="/hackathons/new">
              <Button variant="primary">Create Hackathon</Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Desktop Table View (>= md) */}
          <div className="hidden md:block brutal-card rounded-2xl bg-white overflow-visible">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b-3 border-[#121212] bg-[#F4F4F5]">
                    <th className="py-3.5 px-4 font-mono font-black text-xs uppercase tracking-wider text-[#121212]">
                      Hackathon
                    </th>
                    <th className="py-3.5 px-4 font-mono font-black text-xs uppercase tracking-wider text-[#121212]">
                      Event Date
                    </th>
                    <th className="py-3.5 px-4 font-mono font-black text-xs uppercase tracking-wider text-[#121212]">
                      Added On
                    </th>
                    <th className="py-3.5 px-4 font-mono font-black text-xs uppercase tracking-wider text-[#121212]">
                      Location
                    </th>
                    <th className="py-3.5 px-4 font-mono font-black text-xs uppercase tracking-wider text-[#121212] text-center">
                      Participants
                    </th>
                    <th className="py-3.5 px-4 font-mono font-black text-xs uppercase tracking-wider text-[#121212] text-center">
                      Status
                    </th>
                    <th className="py-3.5 px-4 font-mono font-black text-xs uppercase tracking-wider text-[#121212] text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-[#121212]">
                  {paginatedHackathons.map((h) => {
                    const isMenuOpen = activeMenuId === h.id;
                    const isRemoved = h.status === "REMOVED";
                    const isFlagged = h.status === "FLAGGED";

                    return (
                      <tr
                        key={h.id}
                        className={`hover:bg-[#FFEB3B]/10 transition-colors ${
                          isRemoved ? "opacity-60 bg-[#F4F4F5]/40" : ""
                        }`}
                      >
                        {/* Hackathon name & fee */}
                        <td className="py-3.5 px-4 max-w-xs">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge
                              variant={h.fee.toLowerCase().includes("free") ? "yellow" : "outline"}
                              className="text-[10px]"
                            >
                              {h.fee}
                            </Badge>
                          </div>
                          <Link
                            href={`/hackathons/${h.id}`}
                            className="font-black text-sm text-[#121212] hover:underline line-clamp-1"
                          >
                            {h.name}
                          </Link>
                          <p className="text-xs text-[#71717A] line-clamp-1 font-medium mt-0.5">
                            {h.description}
                          </p>
                        </td>

                        {/* Event Date */}
                        <td className="py-3.5 px-4 text-xs font-mono font-bold text-[#121212] whitespace-nowrap">
                          {formatDate(h.hackathonDate)}
                        </td>

                        {/* Added Date (createdAt) */}
                        <td className="py-3.5 px-4 text-xs font-mono text-[#71717A] whitespace-nowrap">
                          {formatDate(h.createdAt)}
                        </td>

                        {/* Location */}
                        <td className="py-3.5 px-4 text-xs font-mono text-[#121212] max-w-[160px] truncate">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-[#71717A] shrink-0" />
                            <span className="truncate">{h.location}</span>
                          </span>
                        </td>

                        {/* Participants */}
                        <td className="py-3.5 px-4 text-center">
                          <span className="inline-flex items-center gap-1 text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-[#F4F4F5] border border-[#121212]">
                            <Users className="w-3 h-3" />
                            {h._count?.participants || 0}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <HackathonStatusBadge
                            status={h.status}
                            hackathonDate={h.hackathonDate}
                          />
                        </td>

                        {/* Actions Menu */}
                        <td className="py-3.5 px-4 text-right relative">
                          <div className="inline-block relative">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveMenuId(isMenuOpen ? null : h.id);
                              }}
                              className="p-1.5 rounded-lg border-2 border-transparent hover:border-[#121212] hover:bg-white text-[#121212] transition-colors"
                              title="More options"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>

                            {isMenuOpen && (
                              <div
                                ref={menuRef}
                                className="absolute right-0 top-full mt-1 z-50 w-44 brutal-card rounded-xl bg-white p-1 text-left shadow-brutal divide-y divide-[#E4E4E7]"
                              >
                                <div className="py-1">
                                  <Link
                                    href={`/hackathons/${h.id}`}
                                    className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-[#121212] hover:bg-[#F4F4F5] rounded-md transition-colors"
                                  >
                                    <ArrowUpRight className="w-3.5 h-3.5" />
                                    View Details
                                  </Link>
                                  <Link
                                    href={`/hackathons/${h.id}/edit`}
                                    className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-[#121212] hover:bg-[#F4F4F5] rounded-md transition-colors"
                                  >
                                    <Edit className="w-3.5 h-3.5" />
                                    Edit
                                  </Link>
                                </div>

                                <div className="py-1">
                                  {isRemoved || isFlagged ? (
                                    <button
                                      onClick={() => handleOpenDialog("restore", h)}
                                      className="flex items-center gap-2 w-full text-left px-3 py-1.5 text-xs font-bold text-[#00E676] hover:bg-[#F4F4F5] rounded-md transition-colors"
                                    >
                                      <RotateCcw className="w-3.5 h-3.5" />
                                      Restore to Active
                                    </button>
                                  ) : (
                                    <>
                                      <button
                                        onClick={() => handleOpenDialog("flag", h)}
                                        className="flex items-center gap-2 w-full text-left px-3 py-1.5 text-xs font-bold text-[#121212] hover:bg-[#F4F4F5] rounded-md transition-colors"
                                      >
                                        <Flag className="w-3.5 h-3.5 text-[#FF5252]" />
                                        Flag / Disqualify
                                      </button>
                                      <button
                                        onClick={() => handleOpenDialog("delete", h)}
                                        className="flex items-center gap-2 w-full text-left px-3 py-1.5 text-xs font-bold text-[#FF5252] hover:bg-[#FF5252]/10 rounded-md transition-colors"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                        Remove Entry
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card View (< md) */}
          <div className="md:hidden space-y-4">
            {paginatedHackathons.map((h) => {
              const isRemoved = h.status === "REMOVED";
              const isFlagged = h.status === "FLAGGED";

              return (
                <div
                  key={h.id}
                  className={`brutal-card rounded-2xl p-4 bg-white space-y-3 ${
                    isRemoved ? "opacity-60 bg-[#F4F4F5]" : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <Badge
                          variant={h.fee.toLowerCase().includes("free") ? "yellow" : "outline"}
                          className="text-[10px]"
                        >
                          {h.fee}
                        </Badge>
                        <HackathonStatusBadge
                          status={h.status}
                          hackathonDate={h.hackathonDate}
                        />
                      </div>
                      <Link
                        href={`/hackathons/${h.id}`}
                        className="font-black text-base text-[#121212] hover:underline"
                      >
                        {h.name}
                      </Link>
                    </div>
                  </div>

                  <p className="text-xs text-[#71717A] font-medium line-clamp-2">
                    {h.description}
                  </p>

                  <div className="space-y-1.5 pt-2 border-t-2 border-[#121212] text-xs font-mono">
                    <div className="flex items-center justify-between">
                      <span className="text-[#71717A] flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Event Date:
                      </span>
                      <strong className="text-[#121212]">
                        {formatDate(h.hackathonDate)}
                      </strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#71717A] flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> Added:
                      </span>
                      <span className="text-[#71717A]">
                        {formatDate(h.createdAt)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#71717A] flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> Location:
                      </span>
                      <span className="text-[#121212] font-bold">
                        {h.location}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#71717A] flex items-center gap-1">
                        <Users className="w-3 h-3" /> Participants:
                      </span>
                      <strong className="text-[#121212]">
                        {h._count?.participants || 0}
                      </strong>
                    </div>
                  </div>

                  {/* Mobile Actions */}
                  <div className="flex items-center gap-2 pt-3 border-t-2 border-[#121212]">
                    <Link href={`/hackathons/${h.id}`} className="flex-1">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-xs"
                      >
                        Details
                      </Button>
                    </Link>
                    <Link href={`/hackathons/${h.id}/edit`}>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs px-2.5"
                        title="Edit"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </Button>
                    </Link>
                    {isRemoved || isFlagged ? (
                      <Button
                        variant="mint"
                        size="sm"
                        className="text-xs gap-1 font-bold"
                        onClick={() => handleOpenDialog("restore", h)}
                      >
                        <RotateCcw className="w-3 h-3" />
                        Restore
                      </Button>
                    ) : (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs px-2.5"
                          title="Flag"
                          onClick={() => handleOpenDialog("flag", h)}
                        >
                          <Flag className="w-3.5 h-3.5 text-[#FF5252]" />
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          className="text-xs px-2.5"
                          title="Remove"
                          onClick={() => handleOpenDialog("delete", h)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── Pagination Controls ── */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 px-1">
            <div className="text-xs font-mono font-bold text-[#71717A]">
              Showing{" "}
              <span className="text-[#121212]">
                {Math.min(
                  (currentPage - 1) * itemsPerPage + 1,
                  filteredHackathons.length
                )}
              </span>{" "}
              to{" "}
              <span className="text-[#121212]">
                {Math.min(
                  currentPage * itemsPerPage,
                  filteredHackathons.length
                )}
              </span>{" "}
              of{" "}
              <span className="text-[#121212]">
                {filteredHackathons.length}
              </span>{" "}
              hackathons
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="gap-1 text-xs"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                Previous
              </Button>

              <div className="px-3 py-1 font-mono text-xs font-black bg-white rounded-lg border-2 border-[#121212]">
                {currentPage} / {totalPages}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setCurrentPage((p) => Math.min(p + 1, totalPages))
                }
                disabled={currentPage === totalPages}
                className="gap-1 text-xs"
              >
                Next
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Action Confirmation Dialog ── */}
      <ConfirmDialog
        isOpen={dialogState.isOpen}
        onClose={() =>
          setDialogState({
            isOpen: false,
            action: null,
            target: null,
            isLoading: false,
          })
        }
        onConfirm={handleConfirmAction}
        isLoading={dialogState.isLoading}
        title={
          dialogState.action === "delete"
            ? "Remove Hackathon Entry?"
            : dialogState.action === "flag"
            ? "Flag Hackathon?"
            : "Restore Hackathon?"
        }
        description={
          dialogState.action === "delete"
            ? `Are you sure you want to remove "${dialogState.target?.name}"? It will be marked as REMOVED and hidden from upcoming lists, but preserved in this history log.`
            : dialogState.action === "flag"
            ? `Are you sure you want to flag "${dialogState.target?.name}"? It will be marked as FLAGGED and visually flagged in the records.`
            : `Restore "${dialogState.target?.name}" to ACTIVE status? It will reappear on dashboard and upcoming lists if its event date is in the future.`
        }
        confirmLabel={
          dialogState.action === "delete"
            ? "Yes, Remove"
            : dialogState.action === "flag"
            ? "Yes, Flag"
            : "Yes, Restore"
        }
        confirmVariant={
          dialogState.action === "delete"
            ? "secondary"
            : dialogState.action === "flag"
            ? "secondary"
            : "primary"
        }
      />
    </div>
  );
}
