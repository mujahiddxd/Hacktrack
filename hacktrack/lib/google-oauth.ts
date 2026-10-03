import { cookies } from "next/headers";
import { randomBytes, timingSafeEqual } from "crypto";

const STATE_COOKIE_NAME = "hacktrack_oauth_state";

export type OAuthFlow = "login" | "gmail";

interface OAuthState {
  nonce: string;
  flow: OAuthFlow;
  returnTo: string;
}

export function isGoogleOAuthConfigured(): boolean {
  return !!process.env.GOOGLE_CLIENT_ID?.trim() && !!process.env.GOOGLE_CLIENT_SECRET?.trim();
}

export function safeReturnPath(path: string | null | undefined, fallback: string): string {
  // Only allow same-origin relative paths ("//evil.com" is protocol-relative, so reject it)
  if (!path || !path.startsWith("/") || path.startsWith("//")) return fallback;
  return path;
}

/**
 * Creates a signed-by-cookie OAuth state value. Both the sign-in and Gmail-connect flows
 * share one registered redirect URI, so the state also records which flow started it.
 */
export async function createOAuthState(flow: OAuthFlow, returnTo: string): Promise<string> {
  const nonce = randomBytes(24).toString("base64url");
  const cookieStore = await cookies();
  cookieStore.set(STATE_COOKIE_NAME, nonce, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 10, // 10 minutes to finish the Google consent screen
  });
  const state: OAuthState = { nonce, flow, returnTo };
  return Buffer.from(JSON.stringify(state)).toString("base64url");
}

/** Validates the state against the cookie set by createOAuthState and consumes it. */
export async function consumeOAuthState(raw: string | null): Promise<OAuthState | null> {
  const cookieStore = await cookies();
  const expected = cookieStore.get(STATE_COOKIE_NAME)?.value;
  cookieStore.delete(STATE_COOKIE_NAME);
  if (!raw || !expected) return null;

  try {
    const parsed = JSON.parse(Buffer.from(raw, "base64url").toString("utf8")) as OAuthState;
    if (typeof parsed.nonce !== "string" || (parsed.flow !== "login" && parsed.flow !== "gmail")) {
      return null;
    }
    const a = Buffer.from(parsed.nonce);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
    return parsed;
  } catch {
    return null;
  }
}
