import { google } from "googleapis";
import nodemailer from "nodemailer";
import { prisma } from "@/lib/prisma";

export function getOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI || "http://localhost:3000/api/auth/google/callback"
  );
}

const SCOPES = [
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/userinfo.email",
];

export const SIGN_IN_SCOPES = ["openid", "email", "profile"];

export function getGoogleAuthUrl(state: string): string {
  if (!process.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID.trim() === "") {
    throw new Error(
      "GOOGLE_CLIENT_ID is not configured in hacktrack/.env. Add your Google OAuth credentials or use 'Connect Demo Account' to test immediately."
    );
  }

  const client = getOAuth2Client();
  return client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: SCOPES,
    state,
  });
}

export function getGoogleSignInUrl(state: string): string {
  const client = getOAuth2Client();
  return client.generateAuthUrl({
    scope: SIGN_IN_SCOPES,
    state,
    prompt: "select_account",
  });
}

export interface GoogleProfile {
  googleId: string;
  email: string;
  emailVerified: boolean;
  name: string | null;
  image: string | null;
}

/** Exchanges a sign-in code for the Google profile. Tokens are discarded; only identity is kept. */
export async function getGoogleProfileFromCode(code: string): Promise<GoogleProfile> {
  const client = getOAuth2Client();
  const { tokens } = await client.getToken(code);
  if (!tokens.id_token) {
    throw new Error("Google did not return an ID token.");
  }
  const ticket = await client.verifyIdToken({
    idToken: tokens.id_token,
    audience: process.env.GOOGLE_CLIENT_ID,
  });
  const payload = ticket.getPayload();
  if (!payload?.sub || !payload.email) {
    throw new Error("Google account has no email address.");
  }
  return {
    googleId: payload.sub,
    email: payload.email.toLowerCase(),
    emailVerified: payload.email_verified === true,
    name: payload.name ?? null,
    image: payload.picture ?? null,
  };
}

export async function exchangeCodeForTokens(userId: string, code: string) {
  const client = getOAuth2Client();
  const { tokens } = await client.getToken(code);
  client.setCredentials(tokens);

  // Fetch email of the connected Google account
  const oauth2 = google.oauth2({ version: "v2", auth: client });
  const userInfo = await oauth2.userinfo.get();
  const email = userInfo.data.email || "admin@gmail.com";

  if (!tokens.refresh_token) {
    const existing = await prisma.googleAuthToken.findUnique({
      where: { userId },
    });
    if (existing?.refreshToken) {
      tokens.refresh_token = existing.refreshToken;
    }
  }

  const savedToken = await prisma.googleAuthToken.upsert({
    where: { userId },
    create: {
      userId,
      email: email,
      accessToken: tokens.access_token || "",
      refreshToken: tokens.refresh_token || "",
      tokenType: tokens.token_type || "Bearer",
      scope: tokens.scope || SCOPES.join(" "),
      expiryDate: BigInt(tokens.expiry_date || Date.now() + 3600 * 1000),
    },
    update: {
      email: email,
      accessToken: tokens.access_token || "",
      ...(tokens.refresh_token ? { refreshToken: tokens.refresh_token } : {}),
      tokenType: tokens.token_type || "Bearer",
      scope: tokens.scope || SCOPES.join(" "),
      expiryDate: BigInt(tokens.expiry_date || Date.now() + 3600 * 1000),
    },
  });

  return savedToken;
}

export async function connectDemoAccount(userId: string, email = "organizer.hacktrack@gmail.com") {
  return prisma.googleAuthToken.upsert({
    where: { userId },
    create: {
      userId,
      email: email,
      accessToken: "demo_access_token_" + Date.now(),
      refreshToken: "demo_refresh_token_" + Date.now(),
      tokenType: "Bearer",
      scope: SCOPES.join(" "),
      expiryDate: BigInt(Date.now() + 365 * 24 * 3600 * 1000),
    },
    update: {
      email: email,
      accessToken: "demo_access_token_" + Date.now(),
      refreshToken: "demo_refresh_token_" + Date.now(),
      tokenType: "Bearer",
      scope: SCOPES.join(" "),
      expiryDate: BigInt(Date.now() + 365 * 24 * 3600 * 1000),
    },
  });
}

function getSmtpConfig() {
  const smtpPass = process.env.SMTP_PASS || process.env.SMTP_PASSWORD;
  const smtpUser = process.env.SMTP_USER || process.env.SMTP_EMAIL || "mujahidchoudhry37@gmail.com";
  if (!smtpPass || smtpPass.trim() === "") return null;
  return { user: smtpUser, pass: smtpPass.replace(/\s+/g, "").trim() };
}

/**
 * Delivery priority for a user: their own linked Gmail (OAuth) -> the shared SMTP
 * mailbox from .env -> their demo simulator token.
 */
export async function getConnectedGmailAccount(userId: string) {
  const token = await prisma.googleAuthToken.findUnique({
    where: { userId },
  });
  const isDemo = !!token?.refreshToken.startsWith("demo_");

  if (token?.refreshToken && !isDemo) {
    return {
      email: token.email,
      connected: true,
      isDemo: false,
      isSmtp: false,
      updatedAt: token.updatedAt,
    };
  }

  const smtp = getSmtpConfig();
  if (smtp) {
    return {
      email: smtp.user,
      connected: true,
      isDemo: false,
      isSmtp: true,
      updatedAt: new Date(),
    };
  }

  if (!token || !token.refreshToken) return null;
  return {
    email: token.email,
    connected: true,
    isDemo: true,
    isSmtp: false,
    updatedAt: token.updatedAt,
  };
}

export async function disconnectGmailAccount(userId: string) {
  return prisma.googleAuthToken.deleteMany({
    where: { userId },
  });
}

export async function getAuthenticatedGmailClient(userId: string) {
  const token = await prisma.googleAuthToken.findUnique({
    where: { userId },
  });
  if (!token || !token.refreshToken) {
    throw new Error("Gmail is not connected. Please connect Google OAuth first.");
  }

  const client = getOAuth2Client();

  client.setCredentials({
    access_token: token.accessToken,
    refresh_token: token.refreshToken,
    token_type: token.tokenType,
    expiry_date: Number(token.expiryDate),
  });

  client.on("tokens", async (refreshedTokens) => {
    await prisma.googleAuthToken.update({
      where: { userId },
      data: {
        accessToken: refreshedTokens.access_token || token.accessToken,
        ...(refreshedTokens.refresh_token
          ? { refreshToken: refreshedTokens.refresh_token }
          : {}),
        expiryDate: BigInt(
          refreshedTokens.expiry_date || Date.now() + 3600 * 1000
        ),
      },
    });
  });

  return google.gmail({ version: "v1", auth: client });
}

export async function sendEmail({
  userId,
  to,
  subject,
  body,
}: {
  /** Owner of the message; their linked Gmail is used when available. */
  userId: string | null;
  to: string;
  subject: string;
  body: string;
}) {
  const token = userId
    ? await prisma.googleAuthToken.findUnique({ where: { userId } })
    : null;
  const hasRealToken =
    !!token?.refreshToken &&
    !token.refreshToken.startsWith("demo_") &&
    !!process.env.GOOGLE_CLIENT_SECRET;

  // 1. First priority: the user's own Gmail account linked via OAuth
  if (hasRealToken) {
    const gmail = await getAuthenticatedGmailClient(userId!);

    const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString("base64")}?=`;
    const messageParts = [
      `To: ${to}`,
      `Subject: ${utf8Subject}`,
      "MIME-Version: 1.0",
      "Content-Type: text/plain; charset=utf-8",
      "Content-Transfer-Encoding: 7bit",
      "",
      body,
    ];
    const message = messageParts.join("\r\n");

    const encodedMessage = Buffer.from(message)
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    const response = await gmail.users.messages.send({
      userId: "me",
      requestBody: {
        raw: encodedMessage,
      },
    });

    return { ...response.data, isRealDelivery: true };
  }

  // 2. Second priority: shared Gmail SMTP if an App Password is provided in .env
  const smtp = getSmtpConfig();
  if (smtp) {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: Number(process.env.SMTP_PORT || 465),
      secure: Number(process.env.SMTP_PORT || 465) === 465,
      auth: {
        user: smtp.user,
        pass: smtp.pass,
      },
    });

    const info = await transporter.sendMail({
      from: `"HackTrack" <${smtp.user}>`,
      to,
      subject,
      text: body,
    });

    console.log(`\n======================================================`);
    console.log(`[DISPATCHED VIA REAL GMAIL SMTP]`);
    console.log(`  To: ${to}`);
    console.log(`  From: ${smtp.user}`);
    console.log(`  Message ID: ${info.messageId}`);
    console.log(`======================================================\n`);

    return { id: info.messageId, threadId: info.messageId, isRealDelivery: true };
  }

  if (!token || !token.refreshToken) {
    throw new Error(
      "No live email delivery configured. Connect your Gmail account in Settings, or provide a Google App Password (SMTP_PASS in .env)."
    );
  }

  // 3. Demo Simulator Mode
  console.log(`\n======================================================`);
  console.log(`[DISPATCHED VIA GMAIL SIMULATOR (No real email sent)]`);
  console.log(`  To: ${to}`);
  console.log(`  From: ${token.email}`);
  console.log(`  Subject: ${subject}`);
  console.log(`  Body: ${body.slice(0, 100)}...`);
  console.log(`======================================================\n`);
  await new Promise((resolve) => setTimeout(resolve, 350));
  return {
    id: "demo_msg_" + Date.now(),
    threadId: "demo_th_" + Date.now(),
    isDemo: true,
  };
}
