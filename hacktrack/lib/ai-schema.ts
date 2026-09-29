import { z } from "zod";

/**
 * Strict schema for the AI extraction output.
 * Values may be null when the information is not present in the pasted text.
 * No information should ever be fabricated.
 */
export const AiExtractedHackathonSchema = z.object({
  name: z.string().nullable().default(null),
  description: z.string().nullable().default(null),
  roundDetails: z.string().nullable().default(null),
  hackathonDate: z.string().nullable().default(null),
  registrationDeadline: z.string().nullable().default(null),
  fee: z.string().nullable().default(null),
  location: z.string().nullable().default(null),
  registrationLink: z.string().nullable().default(null),
  hasDateConflict: z.boolean().default(false),
  dateConflictNote: z.string().nullable().default(null),
  warnings: z.array(z.string()).default([]),
});

export type AiExtractedHackathon = z.infer<typeof AiExtractedHackathonSchema>;
