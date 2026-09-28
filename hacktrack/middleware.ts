import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const SECRET_KEY = new TextEncoder().encode(
  process.env.JWT_SECRET || "hacktrack-neubrutalism-super-secure-key-2026"
);

const SESSION_COOKIE_NAME = "hacktrack_session";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  let isAuthenticated = false;
  if (sessionToken) {
    try {
      await jwtVerify(sessionToken, SECRET_KEY);
      isAuthenticated = true;
    } catch {
      isAuthenticated = false;
    }
  }

  const isAuthRoute = pathname === "/login";
  const isProtectedRoute =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/hackathons") ||
    pathname.startsWith("/history") ||
    pathname.startsWith("/settings");

  if (isProtectedRoute && !isAuthenticated) {
    const url = new URL("/login", request.url);
    return NextResponse.redirect(url);
  }

  if (isAuthRoute && isAuthenticated) {
    const url = new URL("/dashboard", request.url);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/hackathons/:path*",
    "/history/:path*",
    "/settings/:path*",
    "/login",
  ],
};
