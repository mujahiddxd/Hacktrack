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

export async function getGoogleAuthUrlAction(returnTo?: string) {
  await requireAdmin();
  return getGoogleAuthUrl(returnTo);
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

export async function sendDirectTestEmailAction(to: string, subject?: string, body?: string) {
  await requireAdmin();
  if (!to || !to.includes("@")) {
    return { error: "Please enter a valid recipient email address." };
  }

  try {
    const { sendEmail } = await import("@/lib/gmail");
    const result = await sendEmail({
      to: to.trim(),
      subject: subject?.trim() || "HackTrack Live Test Email",
      body: body?.trim() || "Hello,\n\nThis is a live test email sent from HackTrack to confirm that email dispatch is functioning properly.\n\nBest regards,\nHackTrack Team",
    });

    const isDemo = (result as any)?.isDemo === true;
    const isRealDelivery = (result as any)?.isRealDelivery === true;

    return {
      success: true,
      messageId: (result as any)?.id || "sent",
      timestamp: new Date().toLocaleTimeString(),
      isDemo,
      isRealDelivery,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to send email";
    return { error: msg };
  }
}

