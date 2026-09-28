"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

const ParticipantSchema = z.object({
  hackathonId: z.string().min(1, "Hackathon ID is required"),
  name: z.string().min(2, "Participant name must be at least 2 characters"),
  email: z.string().email("Valid Gmail or email address is required"),
});

async function requireAdmin() {
  const session = await getSession();
  if (!session) {
    throw new Error("Unauthorized. Please log in as Admin.");
  }
  return session;
}

export async function addParticipant(formData: FormData) {
  await requireAdmin();

  const hackathonId = formData.get("hackathonId") as string;
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;

  const validated = ParticipantSchema.safeParse({ hackathonId, name, email });
  if (!validated.success) {
    return { error: validated.error.issues[0]?.message || "Invalid input" };
  }

  try {
    // Check if participant already exists in this hackathon
    const existing = await prisma.participant.findFirst({
      where: {
        hackathonId: validated.data.hackathonId,
        email: validated.data.email.trim().toLowerCase(),
      },
    });

    if (existing) {
      return { error: "This participant is already registered for this hackathon." };
    }

    const participant = await prisma.participant.create({
      data: {
        hackathonId: validated.data.hackathonId,
        name: validated.data.name.trim(),
        email: validated.data.email.trim().toLowerCase(),
      },
    });

    // Auto-enroll new participant in any pending SCHEDULED messages for this hackathon
    const pendingMessages = await prisma.scheduledMessage.findMany({
      where: {
        hackathonId: validated.data.hackathonId,
        status: "SCHEDULED",
      },
    });

    for (const msg of pendingMessages) {
      await prisma.messageRecipient.create({
        data: {
          scheduledMessageId: msg.id,
          participantId: participant.id,
          status: "PENDING",
        },
      });
    }

    revalidatePath(`/hackathons/${hackathonId}`);
    return { success: true, participant };
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : "Failed to add participant" };
  }
}

export async function updateParticipant(id: string, formData: FormData) {
  await requireAdmin();

  const name = formData.get("name") as string;
  const email = formData.get("email") as string;

  if (!name || name.trim().length < 2) {
    return { error: "Name must be at least 2 characters" };
  }
  if (!email || !email.includes("@")) {
    return { error: "Valid email is required" };
  }

  try {
    const updated = await prisma.participant.update({
      where: { id },
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
      },
    });

    revalidatePath(`/hackathons/${updated.hackathonId}`);
    return { success: true, participant: updated };
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : "Update failed" };
  }
}

export async function deleteParticipant(id: string, hackathonId: string) {
  await requireAdmin();
  try {
    await prisma.participant.delete({
      where: { id },
    });

    revalidatePath(`/hackathons/${hackathonId}`);
    return { success: true };
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : "Deletion failed" };
  }
}
