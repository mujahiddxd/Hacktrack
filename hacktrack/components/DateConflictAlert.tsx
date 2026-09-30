"use client";

import * as React from "react";
import Link from "next/link";
import { AlertTriangle, Calendar, Clock, MapPin, ExternalLink, Loader2, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { ConflictingHackathon } from "@/actions/hackathons";

interface DateConflictAlertProps {
  isChecking?: boolean;
  hasConflict: boolean;
  conflicts: ConflictingHackathon[];
  dateFormatted?: string;
  checkedDate?: string;
}

export function DateConflictAlert({
  isChecking = false,
  hasConflict,
  conflicts,
  dateFormatted,
  checkedDate,
}: DateConflictAlertProps) {
  // If actively checking date availability
  if (isChecking) {
    return (
      <div className="flex items-center gap-2 p-2.5 bg-[#F4F4F5] border-2 border-[#121212] rounded-lg text-xs font-mono font-bold text-[#71717A] animate-pulse">
        <Loader2 className="w-3.5 h-3.5 animate-spin text-[#121212]" />
        Checking schedule availability for {dateFormatted || "selected date"}...
      </div>
    );
  }

  // If a conflict was detected
  if (hasConflict && conflicts.length > 0) {
    return (
      <div className="p-4 bg-[#FF5252]/10 border-3 border-[#FF5252] rounded-xl space-y-3 shadow-brutal-sm animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-start gap-2.5">
          <div className="p-1.5 bg-[#FF5252] text-white border-2 border-[#121212] rounded-md shrink-0 shadow-xs">
            <AlertTriangle className="w-4 h-4 stroke-[2.5]" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-[11px] font-black uppercase tracking-wider px-2 py-0.5 bg-[#FF5252] text-white rounded border border-[#121212]">
                Date Conflict Alert
              </span>
              <span className="text-xs font-black text-[#121212]">
                {conflicts.length} {conflicts.length === 1 ? "hackathon" : "hackathons"} already registered on {dateFormatted || "this date"}!
              </span>
            </div>
            <p className="text-xs text-[#52525B] mt-1 font-medium leading-relaxed">
              You already have active hackathon programming scheduled for this day. Review the conflicting events below:
            </p>
          </div>
        </div>

        {/* Conflicting Hackathons List */}
        <div className="space-y-2 pt-1">
          {conflicts.map((conflict) => {
            const dateObj = new Date(conflict.hackathonDate);
            const timeStr = !isNaN(dateObj.getTime())
              ? dateObj.toLocaleTimeString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "";

            return (
              <div
                key={conflict.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-white border-2 border-[#121212] rounded-lg shadow-xs hover:border-[#FF5252] transition-colors"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-black text-sm text-[#121212] truncate">
                      {conflict.name}
                    </span>
                    <Badge variant="blue" className="text-[10px] font-mono">
                      {conflict.fee || "Free"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] font-mono text-[#71717A] flex-wrap">
                    {timeStr && (
                      <span className="flex items-center gap-1 font-bold text-[#121212]">
                        <Clock className="w-3 h-3 text-[#2196F3]" />
                        {timeStr}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-[#FF5252]" />
                      {conflict.location}
                    </span>
                  </div>
                </div>

                <Link
                  href={`/hackathons/${conflict.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-bold text-[#2196F3] hover:underline shrink-0 bg-[#2196F3]/10 px-2.5 py-1.5 rounded border border-[#2196F3]/30 hover:border-[#2196F3]"
                  title="View conflicting hackathon in new tab"
                >
                  View Event
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between text-[11px] font-mono text-[#71717A] pt-1 border-t border-[#FF5252]/30">
          <span>💡 Choose an alternate date above to avoid overlapping events.</span>
        </div>
      </div>
    );
  }

  // If checked and clean (no conflicts)
  if (!hasConflict && checkedDate && checkedDate.trim().length >= 10) {
    return (
      <div className="flex items-center gap-2 p-2 bg-[#00E676]/15 border-2 border-[#00E676] rounded-lg text-xs font-mono font-bold text-[#121212] animate-in fade-in duration-150">
        <CheckCircle2 className="w-4 h-4 text-[#00E676] shrink-0 stroke-[2.5]" />
        <span>Date is clear! No hackathons currently registered on {dateFormatted || "this date"}.</span>
      </div>
    );
  }

  return null;
}
