"use server";

import {
  getConnectedGmailAccount,
  disconnectGmailAccount,
  getGoogleAuthUrl,
  connectDemoAccount,
} from "@/lib/gmail";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

async function requireAdmin() {
  const session = await getSession();
  if (!session) {
    throw new Error("Unauthorized. Please log in as Admin.");
  }
  return session;
}

export async function getGoogleStatusAction() {
  await requireAdmin();
  return getConnectedGmailAccount();
}

export async function getGoogleAuthUrlAction() {
  await requireAdmin();
  return getGoogleAuthUrl();
}

export async function connectDemoAccountAction(email?: string) {
  await requireAdmin();
  await connectDemoAccount(email || "organizer.hacktrack@gmail.com");
  revalidatePath("/settings");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function disconnectGoogleAction() {
  await requireAdmin();
  await disconnectGmailAccount();
  revalidatePath("/settings");
  revalidatePath("/dashboard");
  return { success: true };
}
