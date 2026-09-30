"use client";

import * as React from "react";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  extractAndCheckHackathonAction,
  getAiEngineStatusAction,
  createHackathon,
  checkHackathonDateConflict,
  type DateConflictCheckResult,
} from "@/actions/hackathons";
import type { AiExtractedHackathon } from "@/lib/ai-schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { DateConflictAlert } from "@/components/DateConflictAlert";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import {
  Sparkles,
  ArrowLeft,
  Calendar,
  Send,
  Users,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Loader2,
  RefreshCw,
  Cpu,
  KeyRound,
  Info,
} from "lucide-react";
import { toast } from "sonner";

export default function AiAddPage() {
  const router = useRouter();

  // AI engine status state
  const [engineStatus, setEngineStatus] = useState<{ hasKey: boolean; provider: string } | null>(null);

  // Extraction step state
  const [rawText, setRawText] = useState("");
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<AiExtractedHackathon | null>(null);

  // Controlled form input states
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [roundDetails, setRoundDetails] = useState("");
  const [hackathonDate, setHackathonDate] = useState("");
  const [registrationDeadline, setRegistrationDeadline] = useState("");
  const [fee, setFee] = useState("Free");
  const [location, setLocation] = useState("Online / Discord");
  const [registrationLink, setRegistrationLink] = useState("");

  // Broadcast states
  const [enableBroadcast, setEnableBroadcast] = useState(true);
  const [broadcastSubject, setBroadcastSubject] = useState("");
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [broadcastScheduledAt, setBroadcastScheduledAt] = useState("");

  // Conflict & submission states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingConflict, setIsCheckingConflict] = useState(false);
  const [conflictData, setConflictData] = useState<DateConflictCheckResult | null>(null);
  const [showConflictConfirm, setShowConflictConfirm] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<FormData | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    getAiEngineStatusAction().then(setEngineStatus).catch(() => {});
  }, []);

  const handleExtract = async () => {
    if (!rawText.trim()) {
      toast.error("Please paste hackathon details or announcement text first.");
      return;
    }

    setIsExtracting(true);
    setExtractError(null);

    try {
      const res = await extractAndCheckHackathonAction(rawText);
      if (res?.error) {
        setExtractError(res.error);
        toast.error(res.error);
        return;
      }

      if (res?.data) {
        const d = res.data;
        setExtractedData(d);

        // Update all controlled fields
        setName(d.name || "");
        setDescription(d.description || "");
        setRoundDetails(d.roundDetails || "");
        setFee(d.fee || "Free");
        setLocation(d.location || "Online / Discord");
        setRegistrationLink(d.registrationLink || "");

        const extractedDate = d.hackathonDate || "";
        setHackathonDate(extractedDate);

        const extractedDeadline = d.registrationDeadline || "";
        setRegistrationDeadline(extractedDeadline);

        // Calculate smart broadcast defaults
        const eventName = d.name || "the Hackathon";
        setBroadcastSubject(`Important Guidelines & Access Schedule for ${eventName}`);
        setBroadcastMessage(
          `Hello {name},\n\nWelcome to ${eventName}! Please review our schedule, challenge tracks, and submission guidelines.\n\nHappy hacking!\nOrganizing Committee`
        );

        if (extractedDate) {
          const eventTime = new Date(extractedDate).getTime();
          if (!isNaN(eventTime)) {
            // Default broadcast to 1 day before the hackathon at 9:00 AM
            const oneDayBefore = new Date(eventTime - 24 * 60 * 60 * 1000);
            oneDayBefore.setHours(9, 0, 0, 0);
            setBroadcastScheduledAt(oneDayBefore.toISOString().slice(0, 16));
          } else {
            const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
            tomorrow.setHours(9, 0, 0, 0);
            setBroadcastScheduledAt(tomorrow.toISOString().slice(0, 16));
          }
        } else {
          const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
          tomorrow.setHours(9, 0, 0, 0);
          setBroadcastScheduledAt(tomorrow.toISOString().slice(0, 16));
        }

        // Handle date conflicts
        if (res.dateConflict) {
          setConflictData(res.dateConflict);
          if (res.dateConflict.hasConflict) {
            toast.warning(
              `Date Conflict Detected: A hackathon is already registered on ${res.dateConflict.dateFormatted || "this date"}!`,
              { duration: 6000, id: "ai-date-conflict" }
            );
          } else {
            toast.success("Hackathon extracted! Event date is available with no conflicts.");
          }
        } else {
          setConflictData(null);
          toast.success("Hackathon extracted successfully!");
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Extraction failed";
      setExtractError(msg);
      toast.error(msg);
    } finally {
      setIsExtracting(false);
    }
  };

  const handleDateChange = (val: string) => {
    setHackathonDate(val);
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (!val || val.trim().length < 10) {
      setConflictData(null);
      setIsCheckingConflict(false);
      return;
    }

    setIsCheckingConflict(true);
    debounceTimerRef.current = setTimeout(async () => {
      try {
        const res = await checkHackathonDateConflict(val);
        setConflictData(res);
        if (res.hasConflict) {
          toast.warning(
            `Date Conflict: A hackathon is already registered on ${res.dateFormatted || "this date"}!`,
            { id: "date-conflict-warning" }
          );
        }
      } catch (err) {
        console.error("Conflict check failed:", err);
      } finally {
        setIsCheckingConflict(false);
      }
    }, 350);
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    if (conflictData?.hasConflict) {
      setPendingFormData(formData);
      setShowConflictConfirm(true);
      return;
    }

    await executeSubmit(formData);
  }

  async function executeSubmit(formData: FormData, allowDuplicate = false) {
    setIsSubmitting(true);

    if (allowDuplicate) {
      formData.set("allowDuplicateDate", "true");
    }

    const res = await createHackathon(formData);

    if (res?.error) {
      toast.error(res.error);
      setIsSubmitting(false);
      return;
    }

    toast.success("Hackathon created successfully from AI extraction!");
    if (res?.hackathonId) {
      router.push(`/hackathons/${res.hackathonId}`);
    } else {
      router.push("/hackathons");
    }
  }

  const handleConfirmDuplicate = () => {
    setShowConflictConfirm(false);
    if (pendingFormData) {
      executeSubmit(pendingFormData, true);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back link */}
      <div>
        <Link
          href="/hackathons"
          className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider hover:underline"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Directory
        </Link>
      </div>

      {/* Header */}
      <div className="brutal-card rounded-2xl p-6 md:p-8 bg-white">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b-3 border-[#121212] mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-[#FFEB3B] border-3 border-[#121212] shadow-brutal-sm flex items-center justify-center font-black rounded-xl">
              <Sparkles className="w-6 h-6 text-[#121212]" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-[#121212] tracking-tight">
                AI Smart Hackathon Importer
              </h1>
              <p className="text-xs font-bold text-[#71717A]">
                Paste any hackathon PDF, email announcement, or brochure to automatically extract fields and check for schedule conflicts.
              </p>
            </div>
          </div>

          {/* Engine indicator pill */}
          <div className="shrink-0">
            {engineStatus?.hasKey ? (
              <div className="flex items-center gap-1.5 px-3 py-1 bg-[#00E676]/20 border-2 border-[#121212] rounded-lg text-xs font-mono font-bold text-[#121212] shadow-xs">
                <Cpu className="w-3.5 h-3.5 text-[#00E676]" />
                {engineStatus.provider} Generative AI Active
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-1 bg-[#FFEB3B]/30 border-2 border-[#121212] rounded-lg text-xs font-mono font-bold text-[#121212] shadow-xs">
                <Info className="w-3.5 h-3.5 text-[#121212]" />
                NLP Parser (Add GEMINI_API_KEY for LLM)
              </div>
            )}
          </div>
        </div>

        {/* Step 1: Text Input Area */}
        <div className="space-y-4">
          <Textarea
            label="Paste Hackathon Announcement / PDF Text"
            rows={6}
            placeholder="Paste raw hackathon text here... (e.g. 'CodeStorm 2026 takes place on October 15, 2026. Registration deadline is October 10. Venue: Discord/Online. Free entry. Round 1: Idea Pitch...')"
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            disabled={isExtracting}
            helperText="Extracts event dates, rounds, location, fees, and checks against your existing registered hackathon schedule."
          />

          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-mono text-[#71717A]">
              {rawText.length > 0 ? `${rawText.length.toLocaleString()} characters` : "Empty input"}
            </span>

            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={handleExtract}
              disabled={isExtracting || !rawText.trim()}
              className="gap-2 font-black"
            >
              {isExtracting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analyzing & Checking Schedule...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Extract & Check Schedule
                </>
              )}
            </Button>
          </div>
        </div>

        {extractError && (
          <div className="mt-4 p-4 bg-[#FF5252]/15 border-2 border-[#FF5252] rounded-lg text-xs font-bold text-[#FF5252]">
            {extractError}
          </div>
        )}
      </div>

      {/* Step 2: Extracted Preview & Form */}
      {extractedData && (
        <div className="brutal-card rounded-2xl p-6 md:p-8 bg-white space-y-6 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between pb-4 border-b-3 border-[#121212]">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-[#00E676]" />
              <h2 className="text-xl font-black text-[#121212] tracking-tight">
                Extracted Hackathon Details
              </h2>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleExtract}
              disabled={isExtracting}
              className="gap-1.5 text-xs font-bold"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Re-analyze
            </Button>
          </div>

          {/* AI Warnings / Conflict Banner */}
          {extractedData.warnings && extractedData.warnings.length > 0 && (
            <div className="p-3 bg-[#FFEB3B]/30 border-2 border-[#121212] rounded-xl space-y-1">
              <div className="flex items-center gap-2 text-xs font-black text-[#121212]">
                <AlertTriangle className="w-4 h-4 text-[#FF5252]" />
                Extractor Notes:
              </div>
              <ul className="list-disc list-inside text-xs font-medium text-[#52525B] space-y-0.5">
                {extractedData.warnings.map((w, idx) => (
                  <li key={idx}>{w}</li>
                ))}
              </ul>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Section 1: Core Details */}
            <div className="space-y-4">
              <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-[#121212] pb-1 border-b-2 border-[#121212] flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#2196F3]" />
                1. Hackathon Information (Extracted & Fully Editable)
              </h3>

              <Input
                label="Hackathon Name"
                name="name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. CodeStorm 2026"
              />

              <Textarea
                label="Description"
                name="description"
                required
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Overview of hackathon themes and goals..."
              />

              <Textarea
                label="Round Details & Milestones (Optional)"
                name="roundDetails"
                rows={3}
                value={roundDetails}
                onChange={(e) => setRoundDetails(e.target.value)}
                placeholder="Stage 1, Stage 2, Grand Finale..."
              />

              {/* Date Input with Live Schedule Conflict Detection */}
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <Input
                      label="Hackathon Event Date"
                      name="hackathonDate"
                      type="datetime-local"
                      required
                      value={hackathonDate}
                      onChange={(e) => handleDateChange(e.target.value)}
                      helperText="Commencement date and time"
                    />
                  </div>

                  <Input
                    label="Registration Deadline"
                    name="registrationDeadline"
                    type="datetime-local"
                    required
                    value={registrationDeadline}
                    onChange={(e) => setRegistrationDeadline(e.target.value)}
                    helperText="Cutoff for participant signups"
                  />
                </div>

                {/* Real-time schedule conflict banner */}
                <DateConflictAlert
                  isChecking={isCheckingConflict}
                  hasConflict={conflictData?.hasConflict ?? false}
                  conflicts={conflictData?.conflicts ?? []}
                  dateFormatted={conflictData?.dateFormatted}
                  checkedDate={hackathonDate}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Input
                  label="Registration Fee"
                  name="fee"
                  value={fee}
                  onChange={(e) => setFee(e.target.value)}
                  placeholder="e.g. Free or ₹500"
                />

                <Input
                  label="Location / Venue"
                  name="location"
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Online or Bangalore Hub"
                />
              </div>

              <Input
                label="External Registration URL (Optional)"
                name="registrationLink"
                type="url"
                value={registrationLink}
                onChange={(e) => setRegistrationLink(e.target.value)}
                placeholder="https://..."
              />
            </div>

            {/* Section 2: Automated Email Broadcast */}
            <div className="p-5 bg-[#FFEB3B]/15 border-3 border-[#121212] rounded-xl space-y-4 shadow-brutal-sm">
              <div className="flex items-center justify-between pb-3 border-b-2 border-[#121212]">
                <div className="flex items-center gap-2">
                  <Send className="w-5 h-5 text-[#121212]" />
                  <h3 className="font-black text-base text-[#121212]">
                    2. Automated Participant Email Broadcast
                  </h3>
                </div>
                <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-bold">
                  <input
                    type="checkbox"
                    checked={enableBroadcast}
                    onChange={(e) => setEnableBroadcast(e.target.checked)}
                    className="w-4 h-4 accent-[#121212] cursor-pointer"
                  />
                  Schedule Broadcast
                </label>
              </div>

              {enableBroadcast && (
                <div className="space-y-4 pt-2">
                  <Input
                    label="Broadcast Subject"
                    name="broadcastSubject"
                    required={enableBroadcast}
                    value={broadcastSubject}
                    onChange={(e) => setBroadcastSubject(e.target.value)}
                  />

                  <Textarea
                    label="Broadcast Message"
                    name="broadcastMessage"
                    required={enableBroadcast}
                    rows={3}
                    value={broadcastMessage}
                    onChange={(e) => setBroadcastMessage(e.target.value)}
                  />

                  <Input
                    label="Broadcast Send Date & Time"
                    name="broadcastScheduledAt"
                    type="datetime-local"
                    required={enableBroadcast}
                    value={broadcastScheduledAt}
                    onChange={(e) => setBroadcastScheduledAt(e.target.value)}
                    helperText="Calculated to reach participants prior to event kickoff"
                  />
                </div>
              )}
            </div>

            {/* Submit Actions */}
            <div className="pt-6 border-t-3 border-[#121212] flex items-center justify-end gap-3">
              <Link href="/hackathons">
                <Button type="button" variant="outline" size="md">
                  Cancel
                </Button>
              </Link>
              <Button
                type="submit"
                variant="primary"
                size="lg"
                disabled={isSubmitting}
                className="gap-2 font-black"
              >
                <Sparkles className="w-4 h-4" />
                {isSubmitting ? "Launching Hackathon..." : "Save & Launch Hackathon"}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Date Conflict Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showConflictConfirm}
        onClose={() => setShowConflictConfirm(false)}
        onConfirm={handleConfirmDuplicate}
        title="Hackathon Date Already Registered"
        description={`You already have active hackathon programming registered on ${conflictData?.dateFormatted || "this date"} (${conflictData?.conflicts.map((c) => `"${c.name}"`).join(", ")}). Are you sure you want to schedule another hackathon on the same date?`}
        confirmLabel="Proceed Anyway"
        confirmVariant="primary"
        isLoading={isSubmitting}
      />
    </div>
  );
}
