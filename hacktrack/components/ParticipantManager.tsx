"use client";

import * as React from "react";
import { useState } from "react";
import { addParticipant, deleteParticipant } from "@/actions/participants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { SectionHeader } from "@/components/ui/page-header";
import { ParticipantType } from "@/types";
import { Users, UserPlus, Trash2, Mail, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface Props {
  hackathonId: string;
  initialParticipants: ParticipantType[];
}

export function ParticipantManager({ hackathonId, initialParticipants }: Props) {
  const [isAdding, setIsAdding] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = initialParticipants.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.email.toLowerCase().includes(search.toLowerCase())
  );

  async function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);

    const form = e.currentTarget;
    const formData = new FormData(form);
    formData.append("hackathonId", hackathonId);

    const res = await addParticipant(formData);
    if (res?.error) {
      toast.error(res.error);
    } else {
      toast.success("Participant added successfully!");
      form.reset();
      setIsAdding(false);
    }
    setSubmitting(false);
  }

  async function handleDelete(participantId: string, name: string) {
    if (!confirm(`Are you sure you want to remove ${name} from this hackathon?`)) {
      return;
    }

    const res = await deleteParticipant(participantId, hackathonId);
    if (res?.error) {
      toast.error(res.error);
    } else {
      toast.success(`${name} removed.`);
    }
  }

  return (
    <section className="brutal-card rounded-2xl bg-surface p-5 sm:p-6 space-y-5">
      <SectionHeader
        className="mb-0"
        icon={Users}
        iconClassName="bg-[#00E676] text-on-accent"
        title={
          <>
            Participants
            <Badge variant="mint">{initialParticipants.length} registered</Badge>
          </>
        }
        subtitle="Registered builders eligible for email alerts and updates."
        actions={
          <Button variant={isAdding ? "outline" : "primary"} size="sm" onClick={() => setIsAdding(!isAdding)}>
            <UserPlus className="h-4 w-4" />
            {isAdding ? "Close form" : "Add participant"}
          </Button>
        }
      />

      {/* Add Participant Drawer / Form */}
      {isAdding && (
        <form
          onSubmit={handleAdd}
          className="p-4 bg-[#FFEB3B]/20 border-2 border-ink rounded-xl space-y-4"
        >
          <div className="font-bold text-xs uppercase tracking-wider text-ink flex items-center gap-1.5">
            <UserPlus className="w-4 h-4 text-ink" />
            Register Participant
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Full Name"
              name="name"
              required
              placeholder="e.g. Rahul Sharma"
            />
            <Input
              label="Gmail / Email Address"
              name="email"
              type="email"
              required
              placeholder="e.g. rahul@gmail.com"
            />
          </div>

          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end [&>*]:w-full sm:[&>*]:w-auto">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsAdding(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="mint"
              size="sm"
              disabled={submitting}
              className="gap-1 font-bold"
            >
              <CheckCircle2 className="w-4 h-4" />
              {submitting ? "Adding..." : "Save Participant"}
            </Button>
          </div>
        </form>
      )}

      {/* Search Bar */}
      {initialParticipants.length > 5 && (
        <div>
          <Input
            placeholder="Search participants by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="text-xs"
          />
        </div>
      )}

      {/* Participant List */}
      {initialParticipants.length === 0 ? (
        <div className="text-center py-8 border-2 border-dashed border-ink rounded-xl bg-quiet p-6">
          <Users className="w-8 h-8 text-muted mx-auto mb-2" />
          <p className="font-bold text-sm text-ink">
            No participants registered yet
          </p>
          <p className="text-xs text-muted max-w-xs mx-auto mt-1 mb-4">
            Add developers using their Gmail address to schedule automated hackathon reminders.
          </p>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsAdding(true)}
            className="gap-1"
          >
            <UserPlus className="w-4 h-4" />
            Add First Participant
          </Button>
        </div>
      ) : (
        <>
          {filtered.length === 0 && (
            <p className="py-6 text-center text-sm font-medium text-muted">No participants match “{search}”.</p>
          )}

          {/* Phones: stacked rows, nothing scrolls sideways */}
          <ul className="divide-y-2 divide-ink overflow-hidden rounded-xl border-2 border-ink md:hidden">
            {filtered.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-3 p-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-ink">{p.name}</p>
                  <p className="flex items-center gap-1.5 truncate font-mono text-xs text-body">
                    <Mail className="h-3 w-3 shrink-0" />
                    <span className="truncate">{p.email}</span>
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(p.id, p.name)}
                  className="shrink-0 rounded-md border-2 border-transparent p-2 text-[#FF5252] transition-colors hover:border-[#FF5252] hover:bg-tint-coral"
                  aria-label={`Remove ${p.name}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>

          {/* md+: table */}
          <div className="hidden overflow-hidden rounded-xl border-2 border-ink md:block">
            <table className="w-full table-fixed text-left text-sm">
              <thead className="bg-[#121212] font-mono text-xs uppercase text-white">
                <tr>
                  <th className="w-2/5 px-4 py-3">Builder</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="w-20 px-4 py-3 text-right">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-ink font-medium">
                {filtered.map((p) => (
                  <tr key={p.id} className="transition-colors hover:bg-quiet">
                    <td className="truncate px-4 py-3 font-bold text-ink">{p.name}</td>
                    <td className="px-4 py-3 font-mono text-xs text-ink">
                      <span className="flex min-w-0 items-center gap-1.5">
                        <Mail className="h-3.5 w-3.5 shrink-0 text-muted" />
                        <span className="truncate" title={p.email}>
                          {p.email}
                        </span>
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleDelete(p.id, p.name)}
                        className="rounded-md border border-transparent p-1.5 text-[#FF5252] transition-colors hover:border-[#FF5252] hover:bg-tint-coral"
                        aria-label={`Remove ${p.name}`}
                        title="Remove participant"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}
