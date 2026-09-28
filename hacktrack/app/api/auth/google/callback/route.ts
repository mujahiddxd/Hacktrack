import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForTokens } from "@/lib/gmail";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  if (error) {
    console.error("[Google OAuth Callback Error]:", error);
    return NextResponse.redirect(`${baseUrl}/settings?error=${encodeURIComponent(error)}`);
  }

  if (!code) {
    return NextResponse.redirect(`${baseUrl}/settings?error=missing_code`);
  }

  try {
    await exchangeCodeForTokens(code);
    return NextResponse.redirect(`${baseUrl}/settings?connected=true`);
  } catch (err: unknown) {
    console.error("[Google OAuth Exchange Error]:", err);
    const msg = err instanceof Error ? err.message : "Token exchange failed";
    return NextResponse.redirect(`${baseUrl}/settings?error=${encodeURIComponent(msg)}`);
  }
}
