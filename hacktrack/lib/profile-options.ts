import { z } from "zod";

export const ROLE_OPTIONS = [
  { value: "student", label: "Student", hint: "Currently studying" },
  { value: "professional", label: "Working professional", hint: "Building in industry" },
  { value: "organizer", label: "Hackathon organizer", hint: "Running events" },
  { value: "mentor", label: "Mentor / Judge", hint: "Guiding teams" },
] as const;

export const DEGREE_OPTIONS = [
  "High School",
  "Diploma",
  "B.Tech / B.E.",
  "B.Sc",
  "BCA",
  "B.Com / BBA",
  "M.Tech / M.E.",
  "M.Sc",
  "MCA",
  "MBA",
  "PhD",
  "Self-taught / Bootcamp",
  "Other",
] as const;

export const EXPERIENCE_OPTIONS = [
  { value: "beginner", label: "Beginner", hint: "0–1 hackathons" },
  { value: "intermediate", label: "Intermediate", hint: "2–5 hackathons" },
  { value: "advanced", label: "Advanced", hint: "6+ or podium finishes" },
] as const;

export const SKILL_OPTIONS = [
  "JavaScript",
  "TypeScript",
  "Python",
  "Java",
  "C++",
  "Go",
  "Rust",
  "React",
  "Node.js",
  "SQL",
  "Machine Learning",
  "Data Science",
  "UI/UX Design",
  "DevOps / Cloud",
  "Mobile",
  "Competitive Programming",
] as const;

export const INTEREST_OPTIONS = [
  "AI / ML",
  "Web Development",
  "Web3 / Blockchain",
  "FinTech",
  "HealthTech",
  "EdTech",
  "Climate / Sustainability",
  "Cybersecurity",
  "IoT / Hardware",
  "Game Dev",
  "Open Source",
  "Social Impact",
] as const;

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v ? v : null));

const optionalUrl = (host: string) =>
  z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? v : null))
    .refine((v) => v === null || /^https?:\/\//i.test(v), "Links must start with http:// or https://")
    .refine((v) => v === null || v.toLowerCase().includes(host), `That doesn't look like a ${host} link`);

/** Comma-joined list from a chip group; keeps only known options. */
const optionList = (allowed: readonly string[]) =>
  z
    .string()
    .optional()
    .transform((v) => {
      const items = (v ?? "")
        .split(",")
        .map((s) => s.trim())
        .filter((s) => allowed.includes(s));
      return items.length ? Array.from(new Set(items)).join(",") : null;
    });

/** Single value from a fixed option set; anything else becomes null. */
const oneOf = (allowed: readonly string[]) =>
  z
    .string()
    .optional()
    .transform((v) => (v && allowed.includes(v) ? v : null));

const currentYear = new Date().getFullYear();

export const ProfileDetailsSchema = z.object({
  role: oneOf(ROLE_OPTIONS.map((r) => r.value)),
  degree: optionalText(60),
  fieldOfStudy: optionalText(80),
  institution: optionalText(120),
  graduationYear: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? Number(v) : null))
    .refine(
      (v) => v === null || (Number.isInteger(v) && v >= 1960 && v <= currentYear + 8),
      `Graduation year must be between 1960 and ${currentYear + 8}`
    ),
  city: optionalText(80),
  country: optionalText(80),
  experienceLevel: oneOf(EXPERIENCE_OPTIONS.map((e) => e.value)),
  skills: optionList(SKILL_OPTIONS),
  interests: optionList(INTEREST_OPTIONS),
  githubUrl: optionalUrl("github.com"),
  linkedinUrl: optionalUrl("linkedin.com"),
});

export type ProfileDetails = z.output<typeof ProfileDetailsSchema>;

export const PROFILE_FIELDS = Object.keys(ProfileDetailsSchema.shape) as (keyof ProfileDetails)[];

export function parseProfileForm(formData: FormData) {
  const raw: Record<string, string | undefined> = {};
  for (const key of PROFILE_FIELDS) {
    const value = formData.get(key);
    raw[key] = typeof value === "string" ? value : undefined;
  }
  return ProfileDetailsSchema.safeParse(raw);
}
