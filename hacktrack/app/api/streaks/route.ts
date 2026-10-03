import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isValidTimeZone } from "@/lib/streaks/core";
import { getStreakDeck } from "@/lib/streaks/sources";

export const dynamic = "force-dynamic";

/**
 * GET /api/streaks?tz=Area/City
 * Returns the signed-in user's own streak data only (the session decides whose data; no user id is accepted).
 */
export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const exists = await prisma.user.findUnique({ where: { id: session.userId }, select: { id: true } });
  if (!exists) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tzParam = request.nextUrl.searchParams.get("tz") ?? "UTC";
  const timeZone = tzParam.length <= 64 && isValidTimeZone(tzParam) ? tzParam : "UTC";

  const payload = await getStreakDeck(session.userId, timeZone);
  return NextResponse.json(payload, { headers: { "Cache-Control": "private, no-store" } });
}
