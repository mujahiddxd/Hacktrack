"use server";

import {
  getConnectedGmailAccount,
  disconnectGmailAccount,
  getGoogleAuthUrl,
  connectDemoAccount,
} from "@/lib/gmail";
import { requireUser } from "@/lib/auth";
import { createOAuthState, safeReturnPath } from "@/lib/google-oauth";
import { revalidatePath } from "next/cache";

export async function getGoogleStatusAction() {
  const { userId } = await requireUser();
  return getConnectedGmailAccount(userId);
}

export async function getGoogleAuthUrlAction(returnTo?: string) {
  await requireUser();
  const state = await createOAuthState("gmail", safeReturnPath(returnTo, "/settings"));
  return getGoogleAuthUrl(state);
}

export async function connectDemoAccountAction(email?: string) {
  const { userId } = await requireUser();
  await connectDemoAccount(userId, email || "organizer.hacktrack@gmail.com");
  revalidatePath("/settings");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function disconnectGoogleAction() {
  const { userId } = await requireUser();
  await disconnectGmailAccount(userId);
  revalidatePath("/settings");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function sendDirectTestEmailAction(to: string, subject?: string, body?: string) {
  const { userId } = await requireUser();
  if (!to || !to.includes("@")) {
    return { error: "Please enter a valid recipient email address." };
  }

  try {
    const { sendEmail } = await import("@/lib/gmail");
    const result = await sendEmail({
      userId,
      to: to.trim(),
      subject: subject?.trim() || "HackTrack Live Test Email",
      body: body?.trim() || "Hello,\n\nThis is a live test email sent from HackTrack to confirm that email dispatch is functioning properly.\n\nBest regards,\nHackTrack Team",
    });

    const isDemo = "isDemo" in result && result.isDemo === true;
    const isRealDelivery = "isRealDelivery" in result && result.isRealDelivery === true;

    return {
      success: true,
      messageId: result.id || "sent",
      timestamp: new Date().toLocaleTimeString(),
      isDemo,
      isRealDelivery,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to send email";
    return { error: msg };
  }
}
