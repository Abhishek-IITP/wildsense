import { NextResponse } from "next/server";
import { healthService } from "@/server/services/health.service";

export const runtime = "nodejs";

export async function GET() {
  const readiness = await healthService.getReadiness();
  return NextResponse.json(readiness, {
    status: readiness.status === "ready" ? 200 : 200, // Return 200 with degraded state so clients know partial capabilities
  });
}
