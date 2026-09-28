"use client";

import * as React from "react";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createHackathon } from "@/actions/hackathons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  PlusCircle,
  Sparkles,
  Send,
  Users,
  Clock,
  Calendar,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";

export default function NewHackathonPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enableBroadcast, setEnableBroadcast] = useState(true);

  // Suggested default broadcast datetime: tomorrow at 09:00 AM
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
  tomorrow.setHours(9, 0, 0, 0);
  const defaultBroadcastDate = tomorrow.toISOString().slice(0, 16);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
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

  return (
    <div className="max-w-3xl mx-auto space-y-6">
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

      <div className="brutal-card rounded-2xl p-6 md:p-8 bg-white">
        <div className="flex items-center gap-3 pb-6 border-b-3 border-[#121212] mb-6">
          <div className="w-12 h-12 bg-[#FFEB3B] border-3 border-[#121212] shadow-brutal-sm flex items-center justify-center font-black rounded-xl">
            <PlusCircle className="w-6 h-6 text-[#121212]" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-[#121212] tracking-tight">
              Create New Hackathon
            </h1>
            <p className="text-xs font-bold text-[#71717A]">
              Fill in the event details and configure the automated email broadcast for participants.
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-[#FF5252]/15 border-2 border-[#FF5252] rounded-lg text-xs font-bold text-[#FF5252]">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Core Details */}
          <div className="space-y-4">
            <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-[#121212] pb-1 border-b-2 border-[#121212] flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#2196F3]" />
              1. Hackathon Information
            </h2>

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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Input
                label="Hackathon Event Date"
                name="hackathonDate"
                type="datetime-local"
                required
                helperText="When the hackathon officially commences"
              />

              <Input
                label="Registration Deadline"
                name="registrationDeadline"
                type="datetime-local"
                required
                helperText="Final cutoff for participant sign-ups"
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
          </div>

          {/* Section 2: Automated Email Broadcast to Participants */}
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

            <p className="text-xs text-[#71717A] font-medium leading-relaxed">
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
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-[11px] font-mono text-[#71717A]">
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
          <div className="space-y-3 pt-2">
            <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-[#121212] pb-1 border-b-2 border-[#121212] flex items-center gap-2">
              <Users className="w-4 h-4 text-[#00E676]" />
              3. Initial Participants (Optional)
            </h2>
            <Textarea
              label="Pre-register Participants (One per line)"
              name="initialParticipants"
              rows={3}
              placeholder="Rahul Sharma <rahul@gmail.com>&#10;Aditya Patil, aditya@gmail.com&#10;akash@gmail.com"
              helperText="Optional: Paste known participant Gmail addresses now. You can also add more participants anytime later from the hackathon page!"
            />
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
              {isSubmitting ? "Creating & Scheduling..." : "Save & Launch Hackathon"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
