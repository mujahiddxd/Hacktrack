import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForTokens } from "@/lib/gmail";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const state = searchParams.get("state") || "/settings";

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const safeReturn = state.startsWith("/") ? state : "/settings";
  const sep = safeReturn.includes("?") ? "&" : "?";

  if (error) {
    console.error("[Google OAuth Callback Error]:", error);
    return NextResponse.redirect(`${baseUrl}${safeReturn}${sep}error=${encodeURIComponent(error)}`);
  }

  if (!code) {
    return NextResponse.redirect(`${baseUrl}${safeReturn}${sep}error=missing_code`);
  }

  try {
    await exchangeCodeForTokens(code);
    return NextResponse.redirect(`${baseUrl}${safeReturn}${sep}connected=true`);
  } catch (err: unknown) {
    console.error("[Google OAuth Exchange Error]:", err);
    const msg = err instanceof Error ? err.message : "Token exchange failed";
    return NextResponse.redirect(`${baseUrl}${safeReturn}${sep}error=${encodeURIComponent(msg)}`);
  }
}
