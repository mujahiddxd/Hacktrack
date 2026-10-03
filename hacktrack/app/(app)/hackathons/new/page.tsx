"use client";

import * as React from "react";
import { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createHackathon, checkHackathonDateConflict, type DateConflictCheckResult } from "@/actions/hackathons";
import { Button, buttonVariants } from "@/components/ui/button";
import { FormActions, FormSection, PageHeader, PageShell } from "@/components/ui/page-header";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { DateConflictAlert } from "@/components/DateConflictAlert";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import {
  PlusCircle,
  Sparkles,
  Send,
} from "lucide-react";
import { toast } from "sonner";

export default function NewHackathonPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enableBroadcast, setEnableBroadcast] = useState(true);

  // Date conflict state
  const [hackathonDate, setHackathonDate] = useState("");
  const [isCheckingConflict, setIsCheckingConflict] = useState(false);
  const [conflictData, setConflictData] = useState<DateConflictCheckResult | null>(null);
  const [showConflictConfirm, setShowConflictConfirm] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<FormData | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Suggested default broadcast datetime: tomorrow at 09:00 AM
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
  tomorrow.setHours(9, 0, 0, 0);
  const defaultBroadcastDate = tomorrow.toISOString().slice(0, 16);

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
    setError(null);

    const formData = new FormData(e.currentTarget);

    // If a conflict was detected and user hasn't overridden it yet, confirm first
    if (conflictData?.hasConflict) {
      setPendingFormData(formData);
      setShowConflictConfirm(true);
      return;
    }

    await executeSubmit(formData);
  }

  async function executeSubmit(formData: FormData, allowDuplicate = false) {
    setIsSubmitting(true);
    setError(null);

    if (allowDuplicate) {
      formData.set("allowDuplicateDate", "true");
    }

    const res = await createHackathon(formData);

    if (res?.error) {
      setError(res.error);
      toast.error(res.error);
      setIsSubmitting(false);
      return;
    }

    toast.success("Hackathon successfully created with scheduled broadcast!");
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
    <PageShell width="narrow">
      <PageHeader
        backHref="/hackathons"
        backLabel="All hackathons"
        icon={PlusCircle}
        title="Create a hackathon"
        description="Add the event details, then optionally schedule a welcome email and pre-register participants."
        actions={
          <Link href="/ai-add" className={buttonVariants({ variant: "outline", size: "sm" })}>
            <Sparkles className="h-4 w-4" />
            Import with AI instead
          </Link>
        }
      />

      <div className="brutal-card rounded-2xl bg-surface p-5 sm:p-6 md:p-8">
        {error && (
          <div className="mb-6 p-4 bg-[#FF5252]/15 border-2 border-[#FF5252] rounded-lg text-xs font-bold text-[#FF5252]">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Core Details */}
          <FormSection step={1} title="Hackathon information">

            <Input
              label="Hackathon Name"
              name="name"
              required
              placeholder="e.g. CodeStorm 2026"
              helperText="The public title of your hackathon"
            />

            <Textarea
              label="Description"
              name="description"
              required
              rows={3}
              placeholder="Describe the themes, target builders, and expectations..."
              helperText="Brief summary for prospective participants"
            />

            <Textarea
              label="Round Details & Milestones (Optional)"
              name="roundDetails"
              rows={3}
              placeholder="Round 1: Idea Pitch & Architecture&#10;Round 2: MVP Prototype Review&#10;Round 3: Grand Finale Demo"
              helperText="Breakdown of submission stages and timelines"
            />

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
                    helperText="When the hackathon officially commences"
                  />
                </div>

                <Input
                  label="Registration Deadline"
                  name="registrationDeadline"
                  type="datetime-local"
                  required
                  helperText="Final cutoff for participant sign-ups"
                />
              </div>

              {/* Real-time date conflict warning alert */}
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
                defaultValue="Free"
                placeholder="e.g. Free or ₹500"
                helperText="Participation cost"
              />

              <Input
                label="Location / Venue"
                name="location"
                required
                placeholder="e.g. Online / Discord or Bangalore Hub"
                helperText="Physical or virtual meetup coordinates"
              />
            </div>

            <Input
              label="External Registration URL (Optional)"
              name="registrationLink"
              type="url"
              placeholder="https://devpost.com/hackathon-xyz"
              helperText="Link to external registration portal or platform"
            />
          </FormSection>

          {/* Section 2: Automated Email Broadcast to Participants */}
          <div className="p-4 sm:p-5 bg-[#FFEB3B]/15 border-3 border-ink rounded-xl space-y-4 shadow-brutal-sm">
            <div className="flex flex-col gap-3 pb-3 border-b-2 border-ink sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 border-ink bg-[#FFEB3B] text-on-accent font-mono text-[11px] font-bold">
                  2
                </span>
                <Send className="w-4 h-4 shrink-0 text-ink" />
                <h3 className="font-mono text-xs sm:text-sm font-bold uppercase tracking-wider text-ink">
                  Welcome email broadcast
                </h3>
              </div>
              <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-bold">
                <input
                  type="checkbox"
                  checked={enableBroadcast}
                  onChange={(e) => setEnableBroadcast(e.target.checked)}
                  className="w-4 h-4 accent-ink cursor-pointer"
                />
                Schedule Broadcast
              </label>
            </div>

            <p className="text-xs text-muted font-medium leading-relaxed">
              Specify the broadcast message to be sent to each participant&apos;s Gmail address. The background worker will automatically dispatch it at the exact scheduled date entered below. Any participants added to this hackathon will automatically receive it on that date.
            </p>

            {enableBroadcast && (
              <div className="space-y-4 pt-2">
                <Input
                  label="Broadcast Message Title / Subject"
                  name="broadcastSubject"
                  required={enableBroadcast}
                  placeholder="e.g. CodeStorm 2026: Official Guidelines & Discord Access"
                  defaultValue="Important Guidelines & Schedule"
                  helperText="Subject line that participants will see in their Gmail inbox"
                />

                <div>
                  <Textarea
                    label="Broadcast Message Description / Body"
                    name="broadcastMessage"
                    required={enableBroadcast}
                    rows={4}
                    placeholder="Hello {name},&#10;&#10;Welcome to {hackathonName}! Please review the round milestones and make sure your team is ready.&#10;&#10;Happy hacking!&#10;Organizing Committee"
                    defaultValue={`Hello {name},\n\nWelcome to the hackathon! Please review the event guidelines and be ready for round 1.\n\nBest regards,\nOrganizing Committee`}
                    helperText="Email body sent to participants. Tags like {name} and {hackathonName} will be dynamically personalized."
                  />
                  <div className="flex flex-wrap items-center gap-2 mt-1.5">
                    <span className="text-[11px] font-mono text-muted">
                      Personalization tokens:
                    </span>
                    <Badge variant="outline" className="font-mono text-[10px]">
                      {"{name}"}
                    </Badge>
                    <Badge variant="outline" className="font-mono text-[10px]">
                      {"{hackathonName}"}
                    </Badge>
                  </div>
                </div>

                <Input
                  label="Broadcast Send Date & Time (Participant Gmail Delivery)"
                  name="broadcastScheduledAt"
                  type="datetime-local"
                  required={enableBroadcast}
                  defaultValue={defaultBroadcastDate}
                  helperText="The exact date and time the background worker will dispatch this email to participants."
                />
              </div>
            )}
          </div>

          {/* Section 3: Optional Initial Participants */}
          <FormSection step={3} title="Initial participants (optional)">
            <Textarea
              label="Pre-register Participants (One per line)"
              name="initialParticipants"
              rows={3}
              placeholder="Rahul Sharma <rahul@gmail.com>&#10;Aditya Patil, aditya@gmail.com&#10;akash@gmail.com"
              helperText="Optional: Paste known participant Gmail addresses now. You can also add more participants anytime later from the hackathon page!"
            />
          </FormSection>

          {/* Submit Actions */}
          <FormActions>
            <Link href="/hackathons" className={buttonVariants({ variant: "outline" })}>
              Cancel
            </Link>
            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={isSubmitting}
              className="gap-2 font-black"
            >
              <Sparkles className="w-4 h-4" />
              {isSubmitting ? "Creating & Scheduling..." : "Save & Launch Hackathon"}
            </Button>
          </FormActions>
        </form>
      </div>

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
    </PageShell>
  );
}
