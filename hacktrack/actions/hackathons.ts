"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

const HackathonSchema = z.object({
  name: z.string().min(2, "Hackathon name must be at least 2 characters"),
  description: z.string().min(5, "Description must be at least 5 characters"),
  roundDetails: z.string().optional(),
  hackathonDate: z.string().min(1, "Hackathon date is required"),
  registrationDeadline: z.string().min(1, "Registration deadline is required"),
  fee: z.string().default("Free"),
  location: z.string().min(2, "Location is required"),
  registrationLink: z.string().url("Must be a valid URL").optional().or(z.literal("")),
});

async function requireAdmin() {
  const session = await getSession();
  if (!session) {
    throw new Error("Unauthorized. Please log in as Admin.");
  }
  return session;
}

export async function getDashboardMetrics() {
  await requireAdmin();

  const [
    totalHackathons,
    upcomingHackathons,
    totalParticipants,
    scheduledMessagesCount,
    sentMessagesCount,
  ] = await Promise.all([
    prisma.hackathon.count(),
    prisma.hackathon.findMany({
      where: {
        hackathonDate: {
          gte: new Date(),
        },
      },
      include: {
        _count: {
          select: {
            participants: true,
            scheduledMessages: true,
          },
        },
      },
      orderBy: {
        hackathonDate: "asc",
      },
      take: 5,
    }),
    prisma.participant.count(),
    prisma.scheduledMessage.count({
      where: { status: "SCHEDULED" },
    }),
    prisma.scheduledMessage.count({
      where: { status: "SENT" },
    }),
  ]);

  return {
    metrics: {
      totalHackathons,
      upcomingHackathonsCount: upcomingHackathons.length,
      totalParticipants,
      scheduledMessagesCount,
      sentMessagesCount,
    },
    upcomingHackathons,
  };
}

export async function getDashboardData() {
  await requireAdmin();

  const allHackathons = await prisma.hackathon.findMany({
    where: {
      status: "ACTIVE",
    },
    include: {
      _count: {
        select: {
          participants: true,
          scheduledMessages: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const scheduledMessagesCount = await prisma.scheduledMessage.count({
    where: { status: "SCHEDULED" },
  });

  const sentMessagesCount = await prisma.scheduledMessage.count({
    where: { status: "SENT" },
  });

  return {
    allHackathons,
    scheduledMessagesCount,
    sentMessagesCount,
  };
}

export async function getHackathons() {
  await requireAdmin();
  return prisma.hackathon.findMany({
    where: {
      status: "ACTIVE",
    },
    include: {
      _count: {
        select: {
          participants: true,
          scheduledMessages: true,
        },
      },
    },
    orderBy: {
      hackathonDate: "asc",
    },
  });
}

export async function getHackathonById(id: string) {
  await requireAdmin();
  return prisma.hackathon.findUnique({
    where: { id },
    include: {
      participants: {
        orderBy: { createdAt: "desc" },
      },
      scheduledMessages: {
        include: {
          recipients: {
            include: {
              participant: true,
            },
          },
          _count: {
            select: {
              recipients: true,
            },
          },
        },
        orderBy: { scheduledAt: "desc" },
      },
    },
  });
}

export async function createHackathon(formData: FormData) {
  await requireAdmin();

  const rawData = {
    name: formData.get("name") as string,
    description: formData.get("description") as string,
    roundDetails: (formData.get("roundDetails") as string) || undefined,
    hackathonDate: formData.get("hackathonDate") as string,
    registrationDeadline: formData.get("registrationDeadline") as string,
    fee: (formData.get("fee") as string) || "Free",
    location: formData.get("location") as string,
    registrationLink: (formData.get("registrationLink") as string) || undefined,
  };

  const broadcastSubject = (formData.get("broadcastSubject") as string)?.trim();
  const broadcastMessage = (formData.get("broadcastMessage") as string)?.trim();
  const broadcastScheduledAtStr = formData.get("broadcastScheduledAt") as string;
  const initialParticipantsRaw = (formData.get("initialParticipants") as string)?.trim();

  const validated = HackathonSchema.safeParse(rawData);
  if (!validated.success) {
    return { error: validated.error.issues[0]?.message || "Invalid input" };
  }

  try {
    const hackathon = await prisma.hackathon.create({
      data: {
        name: validated.data.name,
        description: validated.data.description,
        roundDetails: validated.data.roundDetails,
        hackathonDate: new Date(validated.data.hackathonDate),
        registrationDeadline: new Date(validated.data.registrationDeadline),
        fee: validated.data.fee,
        location: validated.data.location,
        registrationLink: validated.data.registrationLink || null,
      },
    });

    // Parse and register initial participants if provided
    const createdParticipants: { id: string; email: string }[] = [];
    if (initialParticipantsRaw) {
      const lines = initialParticipantsRaw.split("\n");
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        let name = "Participant";
        let email = "";

        if (trimmed.includes("<") && trimmed.includes(">")) {
          const match = trimmed.match(/^(.*?)\s*<([^>]+)>/);
          if (match) {
            name = match[1]?.trim() || "Participant";
            email = match[2]?.trim().toLowerCase() || "";
          }
        } else if (trimmed.includes(",")) {
          const parts = trimmed.split(",");
          name = parts[0]?.trim() || "Participant";
          email = parts[1]?.trim().toLowerCase() || "";
        } else if (trimmed.includes("@")) {
          email = trimmed.toLowerCase();
          name = email.split("@")[0] || "Participant";
        }

        if (email && email.includes("@")) {
          const p = await prisma.participant.create({
            data: {
              hackathonId: hackathon.id,
              name,
              email,
            },
          });
          createdParticipants.push({ id: p.id, email: p.email });
        }
      }
    }

    // Schedule automated broadcast message if subject, message, and date were specified
    if (broadcastSubject && broadcastMessage && broadcastScheduledAtStr) {
      const scheduledAt = new Date(broadcastScheduledAtStr);
      if (!isNaN(scheduledAt.getTime())) {
        const scheduledMsg = await prisma.scheduledMessage.create({
          data: {
            hackathonId: hackathon.id,
            subject: broadcastSubject,
            message: broadcastMessage,
            scheduledAt,
            status: "SCHEDULED",
          },
        });

        if (createdParticipants.length > 0) {
          await prisma.messageRecipient.createMany({
            data: createdParticipants.map((p) => ({
              scheduledMessageId: scheduledMsg.id,
              participantId: p.id,
              status: "PENDING",
            })),
          });
        }
      }
    }

    revalidatePath("/dashboard");
    revalidatePath("/hackathons");
    return { success: true, hackathonId: hackathon.id };
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : "Creation failed" };
  }
}

export async function updateHackathon(id: string, formData: FormData) {
  await requireAdmin();

  const rawData = {
    name: formData.get("name") as string,
    description: formData.get("description") as string,
    roundDetails: (formData.get("roundDetails") as string) || undefined,
    hackathonDate: formData.get("hackathonDate") as string,
    registrationDeadline: formData.get("registrationDeadline") as string,
    fee: (formData.get("fee") as string) || "Free",
    location: formData.get("location") as string,
    registrationLink: (formData.get("registrationLink") as string) || undefined,
  };

  const validated = HackathonSchema.safeParse(rawData);
  if (!validated.success) {
    return { error: validated.error.issues[0]?.message || "Invalid input" };
  }

  try {
    await prisma.hackathon.update({
      where: { id },
      data: {
        name: validated.data.name,
        description: validated.data.description,
        roundDetails: validated.data.roundDetails,
        hackathonDate: new Date(validated.data.hackathonDate),
        registrationDeadline: new Date(validated.data.registrationDeadline),
        fee: validated.data.fee,
        location: validated.data.location,
        registrationLink: validated.data.registrationLink || null,
      },
    });

    revalidatePath("/dashboard");
    revalidatePath("/hackathons");
    revalidatePath(`/hackathons/${id}`);
    return { success: true };
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : "Update failed" };
  }
}

export async function deleteHackathon(id: string) {
  await requireAdmin();
  try {
    await prisma.hackathon.update({
      where: { id },
      data: {
        status: "REMOVED",
        deletedAt: new Date(),
      },
    });
    revalidatePath("/dashboard");
    revalidatePath("/hackathons");
    revalidatePath("/history");
    return { success: true };
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : "Remove failed" };
  }
}

export const softDeleteHackathon = deleteHackathon;

export async function getHistoryHackathons() {
  await requireAdmin();
  return prisma.hackathon.findMany({
    include: {
      _count: {
        select: {
          participants: true,
          scheduledMessages: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function flagHackathon(id: string) {
  await requireAdmin();
  try {
    await prisma.hackathon.update({
      where: { id },
      data: { status: "FLAGGED" },
    });
    revalidatePath("/dashboard");
    revalidatePath("/hackathons");
    revalidatePath("/history");
    return { success: true };
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : "Flag failed" };
  }
}

export async function restoreHackathon(id: string) {
  await requireAdmin();
  try {
    await prisma.hackathon.update({
      where: { id },
      data: {
        status: "ACTIVE",
        deletedAt: null,
      },
    });
    revalidatePath("/dashboard");
    revalidatePath("/hackathons");
    revalidatePath("/history");
    return { success: true };
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : "Restore failed" };
  }
}
