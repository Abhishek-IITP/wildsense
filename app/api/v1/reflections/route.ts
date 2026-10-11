import { NextRequest, NextResponse } from "next/server";
import { ReflectionInputSchema } from "@/server/schemas/ai.schema";
import { reflectionService } from "@/server/services/reflection.service";
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
    rateLimiter.enforce(ctx.clientIp, RATE_LIMIT_TIERS.REFLECTION);

    const raw = await parseJsonWithLimit(req);
    const input = ReflectionInputSchema.parse(raw);
    const journalId = (raw as Record<string, unknown>)?.["journalId"] as string | undefined;

    const result = await reflectionService.generateReflection(input, journalId);
    logRequestMetric(ctx, "POST", "/api/v1/reflections", 200);

    return NextResponse.json(
      {
        reflection: result.reflection,
        source: result.source,
      },
      { status: 200 },
    );
  } catch (err) {
    logRequestMetric(ctx, "POST", "/api/v1/reflections", 400);
    return createErrorResponse(err, ctx.requestId);
  }
}
