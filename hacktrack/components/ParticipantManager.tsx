"use client";

import * as React from "react";
import { useState } from "react";
import { addParticipant, deleteParticipant } from "@/actions/participants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
    <div className="brutal-card rounded-2xl p-6 bg-white space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b-2 border-[#121212]">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#00E676] text-[#121212] rounded-lg border-2 border-[#121212]">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-black text-xl text-[#121212] flex items-center gap-2">
              Participants
              <Badge variant="mint" className="text-xs">
                {initialParticipants.length} Registered
              </Badge>
            </h3>
            <p className="text-xs text-[#71717A] font-medium">
              Registered builders eligible for email alerts and updates.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={isAdding ? "outline" : "primary"}
            size="sm"
            onClick={() => setIsAdding(!isAdding)}
            className="gap-1.5"
          >
            <UserPlus className="w-4 h-4" />
            {isAdding ? "Close Form" : "+ Add Participant"}
          </Button>
        </div>
      </div>

      {/* Add Participant Drawer / Form */}
      {isAdding && (
        <form
          onSubmit={handleAdd}
          className="p-4 bg-[#FFEB3B]/20 border-2 border-[#121212] rounded-xl space-y-4"
        >
          <div className="font-bold text-xs uppercase tracking-wider text-[#121212] flex items-center gap-1.5">
            <UserPlus className="w-4 h-4 text-[#121212]" />
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

          <div className="flex justify-end gap-2 pt-2">
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
        <div className="text-center py-8 border-2 border-dashed border-[#121212] rounded-xl bg-neutral-50 p-6">
          <Users className="w-8 h-8 text-[#71717A] mx-auto mb-2" />
          <p className="font-bold text-sm text-[#121212]">
            No participants registered yet
          </p>
          <p className="text-xs text-[#71717A] max-w-xs mx-auto mt-1 mb-4">
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
        <div className="overflow-x-auto border-2 border-[#121212] rounded-xl">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#121212] text-white text-xs font-mono uppercase">
              <tr>
                <th className="px-4 py-3">Builder</th>
                <th className="px-4 py-3">Gmail Address</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-[#121212] font-medium">
              {filtered.map((p) => (
                <tr key={p.id} className="hover:bg-neutral-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-bold text-[#121212]">{p.name}</div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-[#71717A]">
                    <span className="flex items-center gap-1.5 text-[#121212]">
                      <Mail className="w-3.5 h-3.5 text-[#71717A]" />
                      {p.email}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleDelete(p.id, p.name)}
                      className="p-1.5 text-[#FF5252] hover:bg-red-50 rounded-md border border-transparent hover:border-[#FF5252] transition-colors"
                      title="Remove participant"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
