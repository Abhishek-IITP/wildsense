import { NextRequest, NextResponse } from "next/server";
import { SyncBatchRequestSchema } from "@/server/schemas/sync.schema";
import { syncService } from "@/server/services/sync.service";
import { createErrorResponse } from "@/server/middleware/error-handler";
import {
  extractRequestContext,
  logRequestMetric,
  parseJsonWithLimit,
} from "@/server/middleware/request-context";
import { RATE_LIMIT_TIERS, rateLimiter } from "@/server/middleware/rate-limit";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const ctx = extractRequestContext(req);
  try {
    rateLimiter.enforce(ctx.clientIp, RATE_LIMIT_TIERS.SYNC);

    const raw = await parseJsonWithLimit(req);
    const batch = SyncBatchRequestSchema.parse(raw);

    const result = await syncService.processSyncBatch(batch);
    logRequestMetric(ctx, "POST", "/api/v1/sync", 200);

    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    logRequestMetric(ctx, "POST", "/api/v1/sync", 400);
    return createErrorResponse(err, ctx.requestId);
  }
}
