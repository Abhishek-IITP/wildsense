import { NextResponse } from "next/server";
import { healthService } from "@/server/services/health.service";

export const runtime = "nodejs";

export async function GET() {
  const liveness = healthService.getLiveness();
  return NextResponse.json(liveness, { status: 200 });
}
