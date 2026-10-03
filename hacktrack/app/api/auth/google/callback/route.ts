import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForTokens, getGoogleProfileFromCode, type GoogleProfile } from "@/lib/gmail";
import { consumeOAuthState, safeReturnPath } from "@/lib/google-oauth";
import { createSession, getSession, markFreshSignIn } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function withParam(baseUrl: string, path: string, key: string, value: string) {
  const sep = path.includes("?") ? "&" : "?";
  return `${baseUrl}${path}${sep}${key}=${encodeURIComponent(value)}`;
}

/** Finds the account for a Google identity, linking or creating one as needed. */
async function findOrCreateGoogleUser(profile: GoogleProfile) {
  const byGoogleId = await prisma.user.findUnique({ where: { googleId: profile.googleId } });
  if (byGoogleId) return byGoogleId;

  const byEmail = await prisma.user.findUnique({ where: { email: profile.email } });
  if (byEmail) {
    // Only auto-link when Google vouches for the address, otherwise anyone could claim it
    if (!profile.emailVerified) {
      throw new Error("Your Google email is not verified, so it can't be linked to an existing account.");
    }
    return prisma.user.update({
      where: { id: byEmail.id },
      data: {
        googleId: profile.googleId,
        name: byEmail.name ?? profile.name,
        image: byEmail.image ?? profile.image,
      },
    });
  }

  return prisma.user.create({
    data: {
      needsOnboarding: true,
      email: profile.email,
      googleId: profile.googleId,
      name: profile.name,
      image: profile.image,
    },
  });
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const state = await consumeOAuthState(searchParams.get("state"));
  if (!state) {
    return NextResponse.redirect(
      withParam(baseUrl, "/login", "error", "Google sign-in expired or was tampered with. Please try again.")
    );
  }

  const fallback = state.flow === "login" ? "/login" : "/settings";
  const errorReturn = state.flow === "login" ? "/login" : safeReturnPath(state.returnTo, fallback);

  if (error) {
    console.error("[Google OAuth Callback Error]:", error);
    return NextResponse.redirect(withParam(baseUrl, errorReturn, "error", error));
  }

  if (!code) {
    return NextResponse.redirect(withParam(baseUrl, errorReturn, "error", "missing_code"));
  }

  try {
    if (state.flow === "login") {
      const profile = await getGoogleProfileFromCode(code);
      const user = await findOrCreateGoogleUser(profile);
      await createSession({ userId: user.id, email: user.email, needsOnboarding: user.needsOnboarding });
      if (user.needsOnboarding) {
        return NextResponse.redirect(`${baseUrl}/onboarding`);
      }
      await markFreshSignIn();
      return NextResponse.redirect(`${baseUrl}${safeReturnPath(state.returnTo, "/home")}`);
    }

    // Gmail-connect flow: tokens belong to whoever is signed in right now
    const session = await getSession();
    if (!session) {
      return NextResponse.redirect(withParam(baseUrl, "/login", "error", "Please sign in before connecting Gmail."));
    }
    await exchangeCodeForTokens(session.userId, code);
    return NextResponse.redirect(withParam(baseUrl, safeReturnPath(state.returnTo, "/settings"), "connected", "true"));
  } catch (err: unknown) {
    console.error("[Google OAuth Exchange Error]:", err);
    const msg = err instanceof Error ? err.message : "Token exchange failed";
    return NextResponse.redirect(withParam(baseUrl, errorReturn, "error", msg));
  }
}
