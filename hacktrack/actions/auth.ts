"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  verifyPassword,
  hashPassword,
  createSession,
  destroySession,
  getSession,
  requireUser,
  markFreshSignIn,
} from "@/lib/auth";
import { parseProfileForm, PROFILE_FIELDS } from "@/lib/profile-options";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

type FormState = { error?: string; success?: string } | null;

const LoginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

const PasswordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password must be at most 128 characters");

const RegisterSchema = z
  .object({
    name: z.string().trim().min(2, "Name must be at least 2 characters").max(80),
    email: z.string().trim().toLowerCase().email("Invalid email address"),
    password: PasswordSchema,
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

const ProfileSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(80),
  email: z.string().trim().toLowerCase().email("Invalid email address"),
});

export async function loginAction(prevState: unknown, formData: FormData) {
  let destination = "/home";
  const validated = LoginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!validated.success) {
    return {
      error: validated.error.issues[0]?.message || "Validation failed",
    };
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: validated.data.email },
    });

    if (!user) {
      return { error: "Invalid email or password." };
    }

    if (!user.passwordHash) {
      return {
        error: "This account uses Google sign-in. Click \"Continue with Google\" instead.",
      };
    }

    const isValid = await verifyPassword(validated.data.password, user.passwordHash);
    if (!isValid) {
      return { error: "Invalid email or password." };
    }

    await createSession({
      userId: user.id,
      email: user.email,
      needsOnboarding: user.needsOnboarding,
    });
    if (!user.needsOnboarding) await markFreshSignIn();
    destination = user.needsOnboarding ? "/onboarding" : "/home";
  } catch (err: unknown) {
    return {
      error: err instanceof Error ? err.message : "Authentication error occurred.",
    };
  }

  redirect(destination);
}

export async function registerAction(prevState: unknown, formData: FormData) {
  const validated = RegisterSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!validated.success) {
    return {
      error: validated.error.issues[0]?.message || "Validation failed",
    };
  }

  try {
    const existing = await prisma.user.findUnique({
      where: { email: validated.data.email },
    });
    if (existing) {
      return { error: "An account with this email already exists. Please sign in." };
    }

    const user = await prisma.user.create({
      data: {
        name: validated.data.name,
        email: validated.data.email,
        passwordHash: await hashPassword(validated.data.password),
        needsOnboarding: true,
      },
    });

    await createSession({
      userId: user.id,
      email: user.email,
      needsOnboarding: true,
    });
  } catch (err: unknown) {
    return {
      error: err instanceof Error ? err.message : "Registration failed.",
    };
  }

  redirect("/onboarding");
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}

export async function getCurrentUser() {
  const session = await getSession();
  if (!session) return null;
  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user) return null;
  // Never send the hash itself to the client
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    image: user.image,
    createdAt: user.createdAt,
    hasPassword: !!user.passwordHash,
    hasGoogle: !!user.googleId,
    needsOnboarding: user.needsOnboarding,
    profile: {
      role: user.role,
      degree: user.degree,
      fieldOfStudy: user.fieldOfStudy,
      institution: user.institution,
      graduationYear: user.graduationYear,
      city: user.city,
      country: user.country,
      experienceLevel: user.experienceLevel,
      skills: user.skills,
      interests: user.interests,
      githubUrl: user.githubUrl,
      linkedinUrl: user.linkedinUrl,
    },
  };
}

export type CurrentUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;

/** Saves the onboarding answers (or an empty skip) and lets the user into the app. */
export async function completeOnboardingAction(prevState: unknown, formData: FormData): Promise<FormState> {
  const session = await requireUser();
  const skipped = formData.get("intent") === "skip";

  const parsed = skipped ? null : parseProfileForm(formData);
  if (parsed && !parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Please check your answers" };
  }

  try {
    await prisma.user.update({
      where: { id: session.userId },
      data: { ...(parsed?.data ?? {}), needsOnboarding: false },
    });
    await createSession({ userId: session.userId, email: session.email, needsOnboarding: false });
    await markFreshSignIn("new");
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : "Could not save your answers" };
  }

  redirect("/home");
}

export async function updateProfileDetailsAction(prevState: unknown, formData: FormData): Promise<FormState> {
  const session = await requireUser();

  const parsed = parseProfileForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Please check your details" };
  }

  // Only touch fields the form actually submitted, so partial forms don't wipe data
  const data = Object.fromEntries(
    PROFILE_FIELDS.filter((key) => formData.has(key)).map((key) => [key, parsed.data[key]])
  );

  try {
    await prisma.user.update({ where: { id: session.userId }, data });
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : "Could not save your details" };
  }

  revalidatePath("/account");
  return { success: "Details saved." };
}

export async function updateProfileAction(prevState: unknown, formData: FormData): Promise<FormState> {
  const session = await requireUser();

  const validated = ProfileSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
  });
  if (!validated.success) {
    return { error: validated.error.issues[0]?.message || "Validation failed" };
  }

  try {
    const user = await prisma.user.findUniqueOrThrow({ where: { id: session.userId } });
    const emailChanged = validated.data.email !== user.email;

    if (emailChanged) {
      // A Google-only account would be locked out if its email changed without a password
      if (!user.passwordHash) {
        return { error: "Set a password before changing your email address." };
      }
      const taken = await prisma.user.findUnique({ where: { email: validated.data.email } });
      if (taken) {
        return { error: "That email is already used by another account." };
      }
    }

    await prisma.user.update({
      where: { id: session.userId },
      data: { name: validated.data.name, email: validated.data.email },
    });

    if (emailChanged) {
      await createSession({
        userId: session.userId,
        email: validated.data.email,
        needsOnboarding: user.needsOnboarding,
      });
    }
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : "Profile update failed" };
  }

  revalidatePath("/", "layout");
  return { success: "Profile updated." };
}

export async function changePasswordAction(prevState: unknown, formData: FormData): Promise<FormState> {
  const session = await requireUser();

  const currentPassword = (formData.get("currentPassword") as string) || "";
  const newPassword = formData.get("newPassword") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  const validated = PasswordSchema.safeParse(newPassword);
  if (!validated.success) {
    return { error: validated.error.issues[0]?.message || "Invalid password" };
  }
  if (newPassword !== confirmPassword) {
    return { error: "Passwords do not match" };
  }

  try {
    const user = await prisma.user.findUniqueOrThrow({ where: { id: session.userId } });

    // Google-only accounts have no password yet and may set one directly
    if (user.passwordHash) {
      const isValid = await verifyPassword(currentPassword, user.passwordHash);
      if (!isValid) {
        return { error: "Current password is incorrect." };
      }
    }

    await prisma.user.update({
      where: { id: session.userId },
      data: { passwordHash: await hashPassword(newPassword) },
    });
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : "Password update failed" };
  }

  revalidatePath("/account");
  return { success: "Password saved." };
}

export async function unlinkGoogleAction(): Promise<FormState> {
  const session = await requireUser();
  const user = await prisma.user.findUniqueOrThrow({ where: { id: session.userId } });
  if (!user.passwordHash) {
    return { error: "Set a password first, otherwise you won't be able to sign in." };
  }
  await prisma.user.update({
    where: { id: session.userId },
    data: { googleId: null },
  });
  revalidatePath("/account");
  return { success: "Google sign-in unlinked." };
}

export async function deleteAccountAction(prevState: unknown, formData: FormData): Promise<FormState> {
  const session = await requireUser();

  const confirmation = ((formData.get("confirmation") as string) || "").trim().toLowerCase();
  if (confirmation !== session.email.toLowerCase()) {
    return { error: "Type your email address exactly to confirm." };
  }

  try {
    // Hackathons, participants, scheduled messages and the Gmail token cascade with the user
    await prisma.user.delete({ where: { id: session.userId } });
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : "Account deletion failed" };
  }

  await destroySession();
  redirect("/login");
}
