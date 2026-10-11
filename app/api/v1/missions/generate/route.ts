import { NextRequest, NextResponse } from "next/server";
import { GenerateMissionInputSchema } from "@/server/schemas/mission.schema";
import { missionService } from "@/server/services/mission.service";
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
    rateLimiter.enforce(ctx.clientIp, RATE_LIMIT_TIERS.MISSION_GENERATE);

    const raw = await parseJsonWithLimit(req);
    const input = GenerateMissionInputSchema.parse(raw);

    const result = await missionService.generateMission(input);
    logRequestMetric(ctx, "POST", "/api/v1/missions/generate", 200);

    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    logRequestMetric(ctx, "POST", "/api/v1/missions/generate", 400);
    return createErrorResponse(err, ctx.requestId);
  }
}
