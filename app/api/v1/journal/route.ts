import { NextRequest, NextResponse } from "next/server";
import {
  CreateJournalInputSchema,
  JournalQuerySchema,
} from "@/server/schemas/journal.schema";
import { journalService } from "@/server/services/journal.service";
import { createErrorResponse } from "@/server/middleware/error-handler";
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
    const query = JournalQuerySchema.parse(searchParams);

    const result = await journalService.listJournal(query);
    logRequestMetric(ctx, "GET", "/api/v1/journal", 200);

    return NextResponse.json(
      {
        data: result.items,
        pagination: {
          total: result.total,
          limit: query.limit,
          offset: query.offset,
        },
      },
      { status: 200 },
    );
  } catch (err) {
    logRequestMetric(ctx, "GET", "/api/v1/journal", 400);
    return createErrorResponse(err, ctx.requestId);
  }
}

export async function POST(req: NextRequest) {
  const ctx = extractRequestContext(req);
  try {
    rateLimiter.enforce(ctx.clientIp, RATE_LIMIT_TIERS.JOURNAL_WRITE);

    const raw = await parseJsonWithLimit(req);
    const dto = CreateJournalInputSchema.parse(raw);

    const entry = await journalService.createEntry(dto);
    logRequestMetric(ctx, "POST", "/api/v1/journal", 201);

    return NextResponse.json({ data: entry }, { status: 201 });
  } catch (err) {
    logRequestMetric(ctx, "POST", "/api/v1/journal", 400);
    return createErrorResponse(err, ctx.requestId);
  }
}
