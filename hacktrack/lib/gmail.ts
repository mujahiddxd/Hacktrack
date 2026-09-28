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

export function getGoogleAuthUrl(returnTo: string = "/settings"): string {
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
    state: returnTo,
  });
}

export async function exchangeCodeForTokens(code: string) {
  const client = getOAuth2Client();
  const { tokens } = await client.getToken(code);
  client.setCredentials(tokens);

  // Fetch email of the connected Google account
  const oauth2 = google.oauth2({ version: "v2", auth: client });
  const userInfo = await oauth2.userinfo.get();
  const email = userInfo.data.email || "admin@gmail.com";

  if (!tokens.refresh_token) {
    const existing = await prisma.googleAuthToken.findUnique({
      where: { id: "primary" },
    });
    if (existing?.refreshToken) {
      tokens.refresh_token = existing.refreshToken;
    }
  }

  const savedToken = await prisma.googleAuthToken.upsert({
    where: { id: "primary" },
    create: {
      id: "primary",
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

export async function connectDemoAccount(email = "organizer.hacktrack@gmail.com") {
  return prisma.googleAuthToken.upsert({
    where: { id: "primary" },
    create: {
      id: "primary",
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

export async function getConnectedGmailAccount() {
  // Check if SMTP App Password is configured in .env
  const smtpPass = process.env.SMTP_PASS || process.env.SMTP_PASSWORD;
  const smtpUser = process.env.SMTP_USER || process.env.SMTP_EMAIL || "mujahidchoudhry37@gmail.com";
  if (smtpPass && smtpPass.trim() !== "") {
    return {
      email: smtpUser,
      connected: true,
      isDemo: false,
      isSmtp: true,
      updatedAt: new Date(),
    };
  }

  const token = await prisma.googleAuthToken.findUnique({
    where: { id: "primary" },
  });
  if (!token || !token.refreshToken) return null;
  return {
    email: token.email,
    connected: true,
    isDemo: token.refreshToken.startsWith("demo_"),
    isSmtp: false,
    updatedAt: token.updatedAt,
  };
}

export async function disconnectGmailAccount() {
  return prisma.googleAuthToken.deleteMany({
    where: { id: "primary" },
  });
}

export async function getAuthenticatedGmailClient() {
  const token = await prisma.googleAuthToken.findUnique({
    where: { id: "primary" },
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
      where: { id: "primary" },
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
  to,
  subject,
  body,
}: {
  to: string;
  subject: string;
  body: string;
}) {
  // 1. First priority: Direct Gmail SMTP if App Password is provided in .env
  const smtpPass = process.env.SMTP_PASS || process.env.SMTP_PASSWORD;
  const smtpUser = process.env.SMTP_USER || process.env.SMTP_EMAIL || "mujahidchoudhry37@gmail.com";

  if (smtpPass && smtpPass.trim() !== "") {
    const cleanPass = smtpPass.replace(/\s+/g, "").trim();
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: Number(process.env.SMTP_PORT || 465),
      secure: Number(process.env.SMTP_PORT || 465) === 465,
      auth: {
        user: smtpUser,
        pass: cleanPass,
      },
    });

    const info = await transporter.sendMail({
      from: `"HackTrack" <${smtpUser}>`,
      to,
      subject,
      text: body,
    });

    console.log(`\n======================================================`);
    console.log(`[DISPATCHED VIA REAL GMAIL SMTP]`);
    console.log(`  To: ${to}`);
    console.log(`  From: ${smtpUser}`);
    console.log(`  Message ID: ${info.messageId}`);
    console.log(`======================================================\n`);

    return { id: info.messageId, threadId: info.messageId, isRealDelivery: true };
  }

  // 2. Second priority: OAuth Token via Google Cloud API
  const token = await prisma.googleAuthToken.findUnique({
    where: { id: "primary" },
  });
  if (!token || !token.refreshToken) {
    throw new Error(
      "No live email delivery configured. To receive real emails in your inbox, either provide a Google App Password (SMTP_PASS in .env) or authorize Google OAuth in Google Cloud Console."
    );
  }

  // Demo Simulator Mode
  if (token.refreshToken.startsWith("demo_") || !process.env.GOOGLE_CLIENT_SECRET) {
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

  // Production Gmail API dispatch
  const gmail = await getAuthenticatedGmailClient();

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
