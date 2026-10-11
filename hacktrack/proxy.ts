import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const sessionSecret = process.env.JWT_SECRET;
if (!sessionSecret) {
  throw new Error("JWT_SECRET must be configured.");
}
const SECRET_KEY = new TextEncoder().encode(sessionSecret);

const SESSION_COOKIE_NAME = "hacktrack_session";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  let isAuthenticated = false;
  let needsOnboarding = false;
  if (sessionToken) {
    try {
      const { payload } = await jwtVerify(sessionToken, SECRET_KEY);
      // Pre multi-user tokens carry `adminId` only; treat them as signed out
      isAuthenticated = typeof payload.userId === "string";
      needsOnboarding = payload.needsOnboarding === true;
    } catch {
      isAuthenticated = false;
    }
  }

  const isAuthRoute = pathname === "/login" || pathname === "/register";
  const isProtectedRoute =
    pathname.startsWith("/home") ||
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/hackathons") ||
    pathname.startsWith("/ai-add") ||
    pathname.startsWith("/history") ||
    pathname.startsWith("/test-email") ||
    pathname.startsWith("/settings") ||
    pathname.startsWith("/account");

  if (isProtectedRoute && !isAuthenticated) {
    const url = new URL("/login", request.url);
    return NextResponse.redirect(url);
  }

  const isOnboardingRoute = pathname.startsWith("/onboarding");

  if (isOnboardingRoute && !isAuthenticated) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // New accounts finish the onboarding questions before using the app
  if (isAuthenticated && needsOnboarding && (isProtectedRoute || isAuthRoute)) {
    return NextResponse.redirect(new URL("/onboarding", request.url));
  }

  if (isAuthRoute && isAuthenticated) {
    const url = new URL("/home", request.url);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/home/:path*",
    "/dashboard/:path*",
    "/hackathons/:path*",
    "/ai-add/:path*",
    "/ai-add",
    "/history/:path*",
    "/test-email/:path*",
    "/settings/:path*",
    "/account/:path*",
    "/onboarding/:path*",
    "/login",
    "/register",
  ],
};
