"use client";

import * as React from "react";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { updateHackathon, deleteHackathon, checkHackathonDateConflict, type DateConflictCheckResult } from "@/actions/hackathons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DateConflictAlert } from "@/components/DateConflictAlert";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Edit, Trash2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { HackathonType } from "@/types";

export function EditHackathonForm({ hackathon }: { hackathon: HackathonType }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formatDateForInput = (d: Date | string) => {
    return new Date(d).toISOString().slice(0, 16);
  };

  // Date conflict state
  const initialDateStr = formatDateForInput(hackathon.hackathonDate);
  const [hackathonDate, setHackathonDate] = useState(initialDateStr);
  const [isCheckingConflict, setIsCheckingConflict] = useState(false);
  const [conflictData, setConflictData] = useState<DateConflictCheckResult | null>(null);
  const [showConflictConfirm, setShowConflictConfirm] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<FormData | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

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
        // Exclude current hackathon so it doesn't conflict with itself
        const res = await checkHackathonDateConflict(val, hackathon.id);
        setConflictData(res);
        if (res.hasConflict) {
          toast.warning(
            `Date Conflict: Another hackathon is already registered on ${res.dateFormatted || "this date"}!`,
            { id: "edit-date-conflict-warning" }
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

    const res = await updateHackathon(hackathon.id, formData);

    if (res?.error) {
      setError(res.error);
      toast.error(res.error);
      setIsSubmitting(false);
      return;
    }

    toast.success("Hackathon updated successfully!");
    router.push(`/hackathons/${hackathon.id}`);
  }

  const handleConfirmDuplicate = () => {
    setShowConflictConfirm(false);
    if (pendingFormData) {
      executeSubmit(pendingFormData, true);
    }
  };

  async function handleDelete() {
    if (
      !confirm(
        `Are you sure you want to permanently delete "${hackathon.name}"? All participants and scheduled messages will be deleted.`
      )
    ) {
      return;
    }

    setIsDeleting(true);
    const res = await deleteHackathon(hackathon.id);
    if (res?.error) {
      toast.error(res.error);
      setIsDeleting(false);
    } else {
      toast.success("Hackathon deleted.");
      router.push("/hackathons");
    }
  }

  return (
    <div className="brutal-card rounded-2xl p-6 md:p-8 bg-white space-y-6">
      <div className="flex items-center justify-between pb-6 border-b-3 border-[#121212]">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-[#2196F3] text-white border-3 border-[#121212] shadow-brutal-sm flex items-center justify-center font-black rounded-xl">
            <Edit className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-[#121212] tracking-tight">
              Edit Hackathon
            </h1>
            <p className="text-xs font-bold text-[#71717A]">
              Modify dates, location, or round requirements.
            </p>
          </div>
        </div>

        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={handleDelete}
          disabled={isDeleting}
          className="gap-1.5"
        >
          <Trash2 className="w-4 h-4" />
          {isDeleting ? "Deleting..." : "Delete Hackathon"}
        </Button>
      </div>

      {error && (
        <div className="p-4 bg-[#FF5252]/15 border-2 border-[#FF5252] rounded-lg text-xs font-bold text-[#FF5252]">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Input
          label="Hackathon Name"
          name="name"
          required
          defaultValue={hackathon.name}
        />

        <Textarea
          label="Description"
          name="description"
          required
          rows={3}
          defaultValue={hackathon.description}
        />

        <Textarea
          label="Round Details & Milestones (Optional)"
          name="roundDetails"
          rows={4}
          defaultValue={hackathon.roundDetails || ""}
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
              defaultValue={formatDateForInput(hackathon.registrationDeadline)}
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
            defaultValue={hackathon.fee}
          />

          <Input
            label="Location / Venue"
            name="location"
            required
            defaultValue={hackathon.location}
          />
        </div>

        <Input
          label="External Registration URL (Optional)"
          name="registrationLink"
          type="url"
          defaultValue={hackathon.registrationLink || ""}
        />

        <div className="pt-6 border-t-2 border-[#121212] flex items-center justify-end gap-3">
          <Link href={`/hackathons/${hackathon.id}`}>
            <Button type="button" variant="outline" size="md">
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            variant="mint"
            size="lg"
            disabled={isSubmitting}
            className="gap-2 font-black"
          >
            <CheckCircle2 className="w-4 h-4" />
            {isSubmitting ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>

      {/* Date Conflict Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showConflictConfirm}
        onClose={() => setShowConflictConfirm(false)}
        onConfirm={handleConfirmDuplicate}
        title="Hackathon Date Already Registered"
        description={`Another active hackathon is already registered on ${conflictData?.dateFormatted || "this date"} (${conflictData?.conflicts.map((c) => `"${c.name}"`).join(", ")}). Are you sure you want to schedule this hackathon on the same date?`}
        confirmLabel="Proceed Anyway"
        confirmVariant="primary"
        isLoading={isSubmitting}
      />
    </div>
  );
}
