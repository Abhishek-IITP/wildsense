import { NextRequest, NextResponse } from "next/server";
import { UpdateMissionInputSchema } from "@/server/schemas/mission.schema";
import { missionService } from "@/server/services/mission.service";
import { createErrorResponse } from "@/server/middleware/error-handler";
import {
  extractRequestContext,
  logRequestMetric,
  parseJsonWithLimit,
} from "@/server/middleware/request-context";

export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const ctx = extractRequestContext(req);
  try {
    const { id } = await context.params;
    const mission = await missionService.getMissionById(id);
    logRequestMetric(ctx, "GET", `/api/v1/missions/${id}`, 200);
    return NextResponse.json({ data: mission }, { status: 200 });
  } catch (err) {
    logRequestMetric(ctx, "GET", "/api/v1/missions/:id", 404);
    return createErrorResponse(err, ctx.requestId);
  }
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const ctx = extractRequestContext(req);
  try {
    const { id } = await context.params;
    const raw = await parseJsonWithLimit(req);
    const patch = UpdateMissionInputSchema.parse(raw);

    const updated = await missionService.updateMission(id, patch);
    logRequestMetric(ctx, "PATCH", `/api/v1/missions/${id}`, 200);
    return NextResponse.json({ data: updated }, { status: 200 });
  } catch (err) {
    logRequestMetric(ctx, "PATCH", "/api/v1/missions/:id", 400);
    return createErrorResponse(err, ctx.requestId);
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const ctx = extractRequestContext(req);
  try {
    const { id } = await context.params;
    const deleted = await missionService.deleteMission(id);
    logRequestMetric(ctx, "DELETE", `/api/v1/missions/${id}`, 200);
    return NextResponse.json({ success: deleted }, { status: 200 });
  } catch (err) {
    logRequestMetric(ctx, "DELETE", "/api/v1/missions/:id", 400);
    return createErrorResponse(err, ctx.requestId);
  }
}
