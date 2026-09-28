"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyPassword, createSession, destroySession, getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

const LoginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export async function loginAction(prevState: unknown, formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const validated = LoginSchema.safeParse({ email, password });
  if (!validated.success) {
    return {
      error: validated.error.issues[0]?.message || "Validation failed",
    };
  }

  try {
    const admin = await prisma.admin.findUnique({
      where: { email: validated.data.email },
    });

    if (!admin) {
      return { error: "Invalid credentials. Admin account not found." };
    }

    const isValid = await verifyPassword(validated.data.password, admin.passwordHash);
    if (!isValid) {
      return { error: "Invalid email or password." };
    }

    await createSession({
      adminId: admin.id,
      email: admin.email,
    });
  } catch (err: unknown) {
    return {
      error: err instanceof Error ? err.message : "Authentication error occurred.",
    };
  }

  redirect("/dashboard");
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}

export async function getCurrentAdmin() {
  return getSession();
}
