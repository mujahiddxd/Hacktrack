import { NextResponse } from "next/server";
import { getGoogleSignInUrl } from "@/lib/gmail";
import { createOAuthState, isGoogleOAuthConfigured } from "@/lib/google-oauth";

export const dynamic = "force-dynamic";

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  if (!isGoogleOAuthConfigured()) {
    const msg = "Google sign-in is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env.";
    return NextResponse.redirect(`${baseUrl}/login?error=${encodeURIComponent(msg)}`);
  }

  const state = await createOAuthState("login", "/home");
  return NextResponse.redirect(getGoogleSignInUrl(state));
}
