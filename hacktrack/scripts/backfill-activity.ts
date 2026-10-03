import { PrismaClient } from "@prisma/client";

/**
 * One-time (re-runnable) backfill of ActivityEvent from records that already prove an action happened:
 *   - Hackathon.createdAt                      -> HACKATHON_CREATED
 *   - Participant.createdAt                    -> PARTICIPANT_ADDED
 *   - MessageRecipient.sentAt (status SENT)    -> EMAIL_DELIVERED
 *
 * Nothing is inferred: rows without an owner or a delivery timestamp are skipped, and actions whose
 * records were hard-deleted before this table existed can't be recovered. Dedupe keys match lib/activity.ts,
 * so running this twice (or alongside live recording) never double-counts.
 */
const prisma = new PrismaClient();
const BATCH = 500;

type Row = { userId: string; kind: string; dedupeKey: string; occurredAt: Date };

async function insert(rows: Row[]) {
  let inserted = 0;
  for (let i = 0; i < rows.length; i += BATCH) {
    const res = await prisma.activityEvent.createMany({ data: rows.slice(i, i + BATCH), skipDuplicates: true });
    inserted += res.count;
  }
  return inserted;
}

async function main() {
  const hackathons = await prisma.hackathon.findMany({
    where: { userId: { not: null } },
    select: { id: true, userId: true, createdAt: true },
  });
  const participants = await prisma.participant.findMany({
    where: { hackathon: { userId: { not: null } } },
    select: { id: true, createdAt: true, hackathon: { select: { userId: true } } },
  });
  const delivered = await prisma.messageRecipient.findMany({
    where: { status: "SENT", sentAt: { not: null }, scheduledMessage: { hackathon: { userId: { not: null } } } },
    select: { id: true, sentAt: true, scheduledMessage: { select: { hackathon: { select: { userId: true } } } } },
  });

  const rows: Row[] = [
    ...hackathons.map((h) => ({
      userId: h.userId!,
      kind: "HACKATHON_CREATED",
      dedupeKey: `HACKATHON_CREATED:${h.id}`,
      occurredAt: h.createdAt,
    })),
    ...participants.map((p) => ({
      userId: p.hackathon.userId!,
      kind: "PARTICIPANT_ADDED",
      dedupeKey: `PARTICIPANT_ADDED:${p.id}`,
      occurredAt: p.createdAt,
    })),
    ...delivered.map((r) => ({
      userId: r.scheduledMessage.hackathon.userId!,
      kind: "EMAIL_DELIVERED",
      dedupeKey: `EMAIL_DELIVERED:${r.id}`,
      occurredAt: r.sentAt!,
    })),
  ];

  const inserted = await insert(rows);
  console.log(
    `Activity backfill: ${hackathons.length} hackathons, ${participants.length} participants, ` +
      `${delivered.length} delivered emails → ${inserted} new events (${rows.length - inserted} already present).`
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
