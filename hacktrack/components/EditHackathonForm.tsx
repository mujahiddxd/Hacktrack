"use client";

import * as React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { updateHackathon, deleteHackathon } from "@/actions/hackathons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Input
            label="Hackathon Event Date"
            name="hackathonDate"
            type="datetime-local"
            required
            defaultValue={formatDateForInput(hackathon.hackathonDate)}
          />

          <Input
            label="Registration Deadline"
            name="registrationDeadline"
            type="datetime-local"
            required
            defaultValue={formatDateForInput(hackathon.registrationDeadline)}
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
    </div>
  );
}
