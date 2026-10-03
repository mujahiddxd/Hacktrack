import { prisma } from "@/lib/prisma";

/** Qualifying HackTrack actions for the activity streak. */
export type ActivityKind = "HACKATHON_CREATED" | "PARTICIPANT_ADDED" | "EMAIL_DELIVERED";

export type ActivityInput = {
  userId: string;
  kind: ActivityKind;
  /** Id of the record the action produced (hackathon, participant, or message recipient) */
  refId: string;
  occurredAt: Date;
};

export const activityDedupeKey = (kind: ActivityKind, refId: string) => `${kind}:${refId}`;

/**
 * Records actions that have already succeeded. Idempotent: each source record maps to one dedupe key,
 * so retries, double-submits and the backfill can never count an action twice.
 * Never throws; a logging failure must not fail (or roll back) the user's real operation.
 */
export async function recordActivity(events: ActivityInput[]) {
  if (events.length === 0) return;
  try {
    await prisma.activityEvent.createMany({
      data: events.map((e) => ({
        userId: e.userId,
        kind: e.kind,
        dedupeKey: activityDedupeKey(e.kind, e.refId),
        occurredAt: e.occurredAt,
      })),
      skipDuplicates: true,
    });
  } catch (err) {
    console.error("[Activity] Failed to record activity:", err instanceof Error ? err.message : err);
  }
}
