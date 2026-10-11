import { NextRequest, NextResponse } from "next/server";
import { reflectionService } from "@/server/services/reflection.service";
import { createErrorResponse } from "@/server/middleware/error-handler";
import {
  extractRequestContext,
  logRequestMetric,
} from "@/server/middleware/request-context";

export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ journalId: string }> },
) {
  const ctx = extractRequestContext(req);
  try {
    const { journalId } = await context.params;
    const status = await reflectionService.getReflectionStatus(journalId);
    logRequestMetric(ctx, "GET", `/api/v1/reflections/${journalId}/status`, 200);
    return NextResponse.json(status, { status: 200 });
  } catch (err) {
    logRequestMetric(ctx, "GET", "/api/v1/reflections/:journalId/status", 400);
    return createErrorResponse(err, ctx.requestId);
  }
}
