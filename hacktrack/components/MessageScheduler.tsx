"use client";

import * as React from "react";
import { useState } from "react";
import {
  scheduleMessageAction,
  cancelScheduledMessage,
  triggerManualWorkerDispatch,
} from "@/actions/messages";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { SectionHeader } from "@/components/ui/page-header";
import { formatDateTime } from "@/lib/utils";
import { ParticipantType, ScheduledMessageType } from "@/types";
import {
  Send,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Mail,
  User,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

interface Props {
  hackathonId: string;
  hackathonName: string;
  participants: ParticipantType[];
  initialMessages: ScheduledMessageType[];
}

export function MessageScheduler({
  hackathonId,
  hackathonName,
  participants,
  initialMessages,
}: Props) {
  const [isScheduling, setIsScheduling] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDispatching, setIsDispatching] = useState(false);
  const [expandedMessageId, setExpandedMessageId] = useState<string | null>(null);

  // Form states
  const [recipientMode, setRecipientMode] = useState<"all" | "selected">("all");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Default date: 1 hour in the future formatted for datetime-local
  const defaultDate = new Date(Date.now() + 60 * 60 * 1000)
    .toISOString()
    .slice(0, 16);

  async function handleSchedule(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (participants.length === 0) {
      toast.error("Please add at least one participant before scheduling a message.");
      return;
    }

    setIsSubmitting(true);
    const form = e.currentTarget;
    const formData = new FormData(form);
    formData.append("hackathonId", hackathonId);
    formData.append("recipientMode", recipientMode);

    if (recipientMode === "selected") {
      selectedIds.forEach((id) => formData.append("participantIds", id));
    }

    const res = await scheduleMessageAction(formData);
    if (res?.error) {
      toast.error(res.error);
    } else {
      toast.success("Broadcast message successfully scheduled!");
      form.reset();
      setIsScheduling(false);
      setSelectedIds([]);
    }
    setIsSubmitting(false);
  }

  async function handleCancel(messageId: string) {
    if (!confirm("Are you sure you want to cancel this scheduled message?")) {
      return;
    }

    const res = await cancelScheduledMessage(messageId, hackathonId);
    if (res?.error) {
      toast.error(res.error);
    } else {
      toast.success("Scheduled message cancelled.");
    }
  }

  async function handleManualDispatch() {
    setIsDispatching(true);
    const res = await triggerManualWorkerDispatch();
    if ("error" in res && res.error) {
      toast.error(res.error);
    } else if ("processed" in res) {
      toast.success(
        `Worker checked! Processed: ${res.processed}, Sent: ${res.sent}, Failed: ${res.failed}`
      );
    }
    setIsDispatching(false);
  }

  const toggleSelectAll = () => {
    if (selectedIds.length === participants.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(participants.map((p) => p.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  return (
    <section className="brutal-card rounded-2xl bg-surface p-5 sm:p-6 space-y-5">
      <SectionHeader
        className="mb-0"
        icon={Send}
        title={
          <>
            Email broadcasts
            <Badge variant="yellow">{initialMessages.length} messages</Badge>
          </>
        }
        subtitle="Automated reminders dispatched through your connected Gmail account."
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={handleManualDispatch}
              disabled={isDispatching}
              title="Send any messages that are already due"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isDispatching ? "animate-spin" : ""}`} />
              Check due
            </Button>
            <Button variant={isScheduling ? "outline" : "primary"} size="sm" onClick={() => setIsScheduling(!isScheduling)}>
              <Calendar className="h-4 w-4" />
              {isScheduling ? "Close form" : "Schedule message"}
            </Button>
          </>
        }
      />

      {/* Schedule Form */}
      {isScheduling && (
        <form
          onSubmit={handleSchedule}
          className="p-4 sm:p-5 bg-[#FFEB3B]/15 border-2 border-ink rounded-xl space-y-4"
        >
          <div className="font-bold text-xs uppercase tracking-wider text-ink flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-ink" />
            Compose Scheduled Broadcast
          </div>

          <div className="space-y-4">
            <Input
              label="Email Subject"
              name="subject"
              required
              placeholder="e.g. Hackathon Reminder: Check-in starts at 9:00 AM"
              defaultValue={`Important Update: ${hackathonName}`}
            />

            <div>
              <Textarea
                label="Message Body"
                name="message"
                required
                rows={5}
                placeholder="Hi {name},&#10;&#10;The hackathon {hackathonName} is starting soon. Make sure to join our Discord channel!&#10;&#10;Best,&#10;Organizing Team"
                defaultValue={`Hi {name},\n\nThis is an automated update regarding ${hackathonName}. Please be ready with your environment configured.\n\nBest regards,\nOrganizing Team`}
              />
              <div className="flex flex-wrap gap-2 mt-1.5">
                <span className="text-[11px] font-mono text-muted">
                  Dynamic tags:
                </span>
                <span className="text-[11px] font-mono font-bold bg-surface px-1.5 py-0.5 border border-ink rounded">
                  {"{name}"}
                </span>
                <span className="text-[11px] font-mono font-bold bg-surface px-1.5 py-0.5 border border-ink rounded">
                  {"{hackathonName}"}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Schedule Send Date & Time"
                name="scheduledAt"
                type="datetime-local"
                required
                defaultValue={defaultDate}
                helperText="System will dispatch email at this exact time"
              />

              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-ink">
                  Recipients
                </label>
                <div className="flex flex-col gap-2 pt-1 sm:flex-row sm:flex-wrap sm:gap-4 sm:pt-2">
                  <label className="flex items-center gap-1.5 text-xs font-bold cursor-pointer">
                    <input
                      type="radio"
                      name="recipientModeRadio"
                      checked={recipientMode === "all"}
                      onChange={() => setRecipientMode("all")}
                      className="accent-ink"
                    />
                    All Participants ({participants.length})
                  </label>
                  <label className="flex items-center gap-1.5 text-xs font-bold cursor-pointer">
                    <input
                      type="radio"
                      name="recipientModeRadio"
                      checked={recipientMode === "selected"}
                      onChange={() => setRecipientMode("selected")}
                      className="accent-ink"
                    />
                    Select Specific ({selectedIds.length})
                  </label>
                </div>
              </div>
            </div>

            {/* Recipient selection list */}
            {recipientMode === "selected" && (
              <div className="border-2 border-ink rounded-lg p-3 bg-surface max-h-48 overflow-y-auto space-y-2">
                <div className="flex items-center justify-between pb-2 border-b border-ink">
                  <span className="text-xs font-bold text-muted">
                    Select Recipients
                  </span>
                  <button
                    type="button"
                    onClick={toggleSelectAll}
                    className="text-xs font-bold hover:underline"
                  >
                    {selectedIds.length === participants.length ? "Deselect All" : "Select All"}
                  </button>
                </div>
                {participants.map((p) => (
                  <label
                    key={p.id}
                    className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5 text-xs font-medium cursor-pointer hover:bg-quiet p-1 rounded"
                  >
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(p.id)}
                      onChange={() => toggleSelect(p.id)}
                      className="accent-ink"
                    />
                    <span className="font-bold text-ink">{p.name}</span>
                    <span className="min-w-0 truncate text-muted font-mono text-[11px]">{p.email}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col-reverse gap-2 pt-3 border-t border-ink sm:flex-row sm:justify-end [&>*]:w-full sm:[&>*]:w-auto">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsScheduling(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={isSubmitting}
              className="gap-1 font-bold"
            >
              <Send className="w-4 h-4" />
              {isSubmitting ? "Scheduling..." : "Schedule Broadcast"}
            </Button>
          </div>
        </form>
      )}

      {/* Messages List */}
      {initialMessages.length === 0 ? (
        <div className="text-center py-8 border-2 border-dashed border-ink rounded-xl bg-quiet p-6">
          <Mail className="w-8 h-8 text-muted mx-auto mb-2" />
          <p className="font-bold text-sm text-ink">
            No messages scheduled yet
          </p>
          <p className="text-xs text-muted max-w-xs mx-auto mt-1 mb-4">
            Schedule announcements, guidelines, or round start reminders to be sent automatically.
          </p>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsScheduling(true)}
            className="gap-1"
          >
            <Send className="w-4 h-4" />
            Schedule First Message
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {initialMessages.map((msg) => {
            const isExpanded = expandedMessageId === msg.id;
            const recipientCount = msg.recipients?.length || msg._count?.recipients || 0;
            const sentCount =
              msg.recipients?.filter((r) => r.status === "SENT").length || 0;
            const failedCount =
              msg.recipients?.filter((r) => r.status === "FAILED").length || 0;
            const pendingCount =
              msg.recipients?.filter((r) => r.status === "PENDING").length || 0;

            return (
              <div
                key={msg.id}
                className="border-2 border-ink rounded-xl bg-surface overflow-hidden shadow-brutal-sm"
              >
                {/* Header row */}
                <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                      <StatusBadge status={msg.status} />
                      <span className="text-xs font-mono font-bold text-muted flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        Scheduled for: {formatDateTime(msg.scheduledAt)}
                      </span>
                      {msg.sentAt && (
                        <span className="text-xs font-mono font-bold text-[#00E676] flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Sent at: {formatDateTime(msg.sentAt)}
                        </span>
                      )}
                    </div>
                    <h4 className="break-words font-bold text-base text-ink pt-1">
                      {msg.subject}
                    </h4>
                    <p className="text-xs text-muted line-clamp-1">
                      {msg.message}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 md:shrink-0">
                    {msg.status === "SCHEDULED" && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleCancel(msg.id)}
                        className="text-xs font-bold"
                      >
                        Cancel
                      </Button>
                    )}

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setExpandedMessageId(isExpanded ? null : msg.id)
                      }
                      className="gap-1 text-xs font-bold"
                    >
                      {isExpanded ? (
                        <>
                          Hide Log <ChevronUp className="w-3.5 h-3.5" />
                        </>
                      ) : (
                        <>
                          Delivery Log ({sentCount}/{recipientCount}){" "}
                          <ChevronDown className="w-3.5 h-3.5" />
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Delivery breakdown drawer */}
                {isExpanded && (
                  <div className="p-4 bg-quiet border-t-2 border-ink space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-subtle">
                      <div className="flex flex-wrap items-center gap-2 text-xs font-mono font-bold">
                        <span className="text-[#00E676] bg-tint-mint px-2 py-0.5 border border-ink rounded">
                          SENT: {sentCount}
                        </span>
                        <span className="text-[#FF5252] bg-tint-coral px-2 py-0.5 border border-ink rounded">
                          FAILED: {failedCount}
                        </span>
                        <span className="text-[#2196F3] bg-tint-blue px-2 py-0.5 border border-ink rounded">
                          PENDING: {pendingCount}
                        </span>
                      </div>
                      <span className="text-xs font-mono text-muted">
                        Total Recipients: {recipientCount}
                      </span>
                    </div>

                    {msg.recipients && msg.recipients.length > 0 ? (
                      <div className="max-h-56 overflow-y-auto divide-y divide-subtle text-xs">
                        {msg.recipients.map((rec) => (
                          <div
                            key={rec.id}
                            className="py-2 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-3"
                          >
                            <div className="flex min-w-0 items-center gap-2">
                              <User className="w-3.5 h-3.5 shrink-0 text-muted" />
                              <strong className="shrink-0 text-ink">
                                {rec.participant?.name || "Participant"}
                              </strong>
                              <span className="min-w-0 truncate text-muted font-mono">
                                {rec.participant?.email}
                              </span>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 pl-5 sm:pl-0 sm:shrink-0">
                              {rec.status === "SENT" && (
                                <span className="inline-flex items-center gap-1 font-mono font-bold text-[#00E676]">
                                  <CheckCircle2 className="w-3 h-3" />
                                  SENT
                                </span>
                              )}
                              {rec.status === "FAILED" && (
                                <span
                                  className="inline-flex items-center gap-1 font-mono font-bold text-[#FF5252]"
                                  title={rec.errorMessage || "Error sending email"}
                                >
                                  <XCircle className="w-3 h-3" />
                                  FAILED
                                  {rec.errorMessage && (
                                    <span className="text-[10px] text-red-500 font-normal">
                                      ({rec.errorMessage.slice(0, 30)}...)
                                    </span>
                                  )}
                                </span>
                              )}
                              {rec.status === "PENDING" && (
                                <span className="inline-flex items-center gap-1 font-mono font-bold text-muted">
                                  <Clock className="w-3 h-3" />
                                  PENDING
                                </span>
                              )}
                              {rec.sentAt && (
                                <span className="text-[10px] font-mono text-muted">
                                  {formatDateTime(rec.sentAt)}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted">
                        No recipient logs available for this message.
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
