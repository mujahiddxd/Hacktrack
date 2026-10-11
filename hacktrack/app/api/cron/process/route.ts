import { NextRequest, NextResponse } from "next/server";
import { processDueScheduledMessages } from "@/lib/scheduler";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || cronSecret.trim() === "") {
    return NextResponse.json(
      { status: "error", error: "CRON_SECRET is not configured." },
      { status: 503 }
    );
  }

  const authHeader = request.headers.get("authorization");
  const customHeader = request.headers.get("x-cron-secret");
  const providedSecret =
    authHeader?.startsWith("Bearer ")
      ? authHeader.slice(7).trim()
      : customHeader;

  if (!providedSecret || providedSecret !== cronSecret) {
    return NextResponse.json(
      {
        status: "error",
        error: "Unauthorized. Valid CRON_SECRET required.",
      },
      { status: 401 }
    );
  }
  try {
    const result = await processDueScheduledMessages();
    return NextResponse.json({
      status: "success",
      timestamp: new Date().toISOString(),
      ...result,
    });
  } catch (err: unknown) {
    console.error("[Cron Processing Error]:", err);
    return NextResponse.json(
      {
        status: "error",
        error: err instanceof Error ? err.message : "Internal processing error",
      },
      { status: 500 }
    );
  }
}
