import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

const sessionSecret = process.env.JWT_SECRET;
if (!sessionSecret) {
  throw new Error("JWT_SECRET must be configured.");
}
const SECRET_KEY = new TextEncoder().encode(sessionSecret);

const SESSION_COOKIE_NAME = "hacktrack_session";

export interface UserSession {
  userId: string;
  email: string;
  /** Mirrors User.needsOnboarding so the proxy can route new users without a DB lookup */
  needsOnboarding?: boolean;
}

/** Read (and cleared) by the client to show the post-sign-in splash once. Not httpOnly on purpose. */
export const WELCOME_COOKIE_NAME = "hacktrack_welcome";

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function verifyPassword(
  password: string,
  hashed: string
): Promise<boolean> {
  return bcrypt.compare(password, hashed);
}

export async function signSessionToken(payload: UserSession): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(SECRET_KEY);
}

export async function verifySessionToken(
  token: string
): Promise<UserSession | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    // Tokens issued before multi-user support carried `adminId` instead of `userId`.
    if (typeof payload.userId !== "string") return null;
    return {
      userId: payload.userId as string,
      email: payload.email as string,
      needsOnboarding: payload.needsOnboarding === true,
    };
  } catch {
    return null;
  }
}

export async function createSession(payload: UserSession) {
  const token = await signSessionToken(payload);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

/** Flags the next page load to play the welcome splash (sign-in, register, onboarding done). */
export async function markFreshSignIn(kind: "new" | "returning" = "returning") {
  const cookieStore = await cookies();
  cookieStore.set(WELCOME_COOKIE_NAME, kind, {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60,
  });
}

export async function getSession(): Promise<UserSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

/**
 * Resolves the signed-in user for server actions and pages. Verifies the account
 * still exists so sessions of deleted accounts stop working immediately.
 */
export async function requireUser(): Promise<UserSession> {
  const session = await getSession();
  if (!session) {
    throw new Error("Unauthorized. Please log in.");
  }
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, email: true },
  });
  if (!user) {
    throw new Error("Unauthorized. Your account no longer exists.");
  }
  return { userId: user.id, email: user.email };
}
