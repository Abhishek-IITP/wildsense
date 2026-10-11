import { NextRequest, NextResponse } from "next/server";
import {
  CreateMissionInputSchema,
  MissionFilterQuerySchema,
} from "@/server/schemas/mission.schema";
import { missionService } from "@/server/services/mission.service";
import {
  createErrorResponse,
} from "@/server/middleware/error-handler";
import {
  extractRequestContext,
  logRequestMetric,
  parseJsonWithLimit,
} from "@/server/middleware/request-context";
import { RATE_LIMIT_TIERS, rateLimiter } from "@/server/middleware/rate-limit";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const ctx = extractRequestContext(req);
  try {
    rateLimiter.enforce(ctx.clientIp, RATE_LIMIT_TIERS.STANDARD);

    const searchParams = Object.fromEntries(req.nextUrl.searchParams.entries());
    const filter = MissionFilterQuerySchema.parse(searchParams);

    const result = await missionService.listMissions(filter);
    logRequestMetric(ctx, "GET", "/api/v1/missions", 200);

    return NextResponse.json(
      {
        data: result.items,
        pagination: {
          total: result.total,
          limit: filter.limit,
          offset: filter.offset,
        },
      },
      { status: 200 },
    );
  } catch (err) {
    logRequestMetric(ctx, "GET", "/api/v1/missions", 400);
    return createErrorResponse(err, ctx.requestId);
  }
}

export async function POST(req: NextRequest) {
  const ctx = extractRequestContext(req);
  try {
    rateLimiter.enforce(ctx.clientIp, RATE_LIMIT_TIERS.STANDARD);

    const raw = await parseJsonWithLimit(req);
    const dto = CreateMissionInputSchema.parse(raw);

    const saved = await missionService.saveMission(dto);
    logRequestMetric(ctx, "POST", "/api/v1/missions", 201);

    return NextResponse.json({ data: saved }, { status: 201 });
  } catch (err) {
    logRequestMetric(ctx, "POST", "/api/v1/missions", 400);
    return createErrorResponse(err, ctx.requestId);
  }
}
