import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const rawUrl = process.env.DATABASE_URL?.trim() || "";
// Strip accidental wrapping quotes if pasted with quotes into Vercel UI
const sanitizedUrl = rawUrl.replace(/^["']|["']$/g, "").trim();

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    ...(sanitizedUrl ? { datasources: { db: { url: sanitizedUrl } } } : {}),
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
export default prisma;
