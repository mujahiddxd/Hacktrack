"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { processDueScheduledMessages } from "@/lib/scheduler";

const MessageSchema = z.object({
  hackathonId: z.string().min(1, "Hackathon ID is required"),
  subject: z.string().min(2, "Subject is required"),
  message: z.string().min(5, "Message body must be at least 5 characters"),
  scheduledAt: z.string().min(1, "Scheduled date and time are required"),
  recipientMode: z.enum(["all", "selected"]).default("all"),
});

async function requireAdmin() {
  const session = await getSession();
  if (!session) {
    throw new Error("Unauthorized. Please log in as Admin.");
  }
  return session;
}

export async function scheduleMessageAction(formData: FormData) {
  await requireAdmin();

  const hackathonId = formData.get("hackathonId") as string;
  const subject = formData.get("subject") as string;
  const message = formData.get("message") as string;
  const scheduledAtStr = formData.get("scheduledAt") as string;
  const recipientMode = (formData.get("recipientMode") as "all" | "selected") || "all";
  const selectedParticipantIds = formData.getAll("participantIds") as string[];

  const validated = MessageSchema.safeParse({
    hackathonId,
    subject,
    message,
    scheduledAt: scheduledAtStr,
    recipientMode,
  });

  if (!validated.success) {
    return { error: validated.error.issues[0]?.message || "Validation failed" };
  }

  const scheduledAt = new Date(validated.data.scheduledAt);
  if (isNaN(scheduledAt.getTime())) {
    return { error: "Invalid scheduled date and time" };
  }

  try {
    // Determine participants
    let participantIds: string[] = [];

    if (recipientMode === "all" || selectedParticipantIds.length === 0) {
      const allParticipants = await prisma.participant.findMany({
        where: { hackathonId },
        select: { id: true },
      });
      participantIds = allParticipants.map((p) => p.id);
    } else {
      participantIds = selectedParticipantIds;
    }

    if (participantIds.length === 0) {
      return { error: "Cannot schedule message without recipients. Add participants first." };
    }

    // Create ScheduledMessage and recipient records in transaction
    const scheduledMessage = await prisma.$transaction(async (tx) => {
      const msg = await tx.scheduledMessage.create({
        data: {
          hackathonId,
          subject: validated.data.subject,
          message: validated.data.message,
          scheduledAt,
          status: "SCHEDULED",
        },
      });

      await tx.messageRecipient.createMany({
        data: participantIds.map((pid) => ({
          scheduledMessageId: msg.id,
          participantId: pid,
          status: "PENDING",
        })),
      });

      return msg;
    });

    // If the scheduled time is right now or in the past, trigger immediate check
    if (scheduledAt <= new Date()) {
      processDueScheduledMessages().catch(console.error);
    }

    revalidatePath(`/hackathons/${hackathonId}`);
    return { success: true, messageId: scheduledMessage.id };
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : "Failed to schedule message" };
  }
}

export async function cancelScheduledMessage(messageId: string, hackathonId: string) {
  await requireAdmin();
  try {
    const existing = await prisma.scheduledMessage.findUnique({
      where: { id: messageId },
    });

    if (!existing) {
      return { error: "Message not found" };
    }

    if (existing.status !== "SCHEDULED") {
      return { error: `Cannot cancel message with status: ${existing.status}` };
    }

    await prisma.scheduledMessage.update({
      where: { id: messageId },
      data: { status: "CANCELLED" },
    });

    revalidatePath(`/hackathons/${hackathonId}`);
    return { success: true };
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : "Failed to cancel message" };
  }
}

export async function triggerManualWorkerDispatch() {
  await requireAdmin();
  try {
    const result = await processDueScheduledMessages();
    return { success: true, ...result };
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : "Worker execution failed" };
  }
}
