import { NextRequest, NextResponse } from "next/server";
import { UpdateJournalInputSchema } from "@/server/schemas/journal.schema";
import { journalService } from "@/server/services/journal.service";
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
    const entry = await journalService.getJournalById(id);
    logRequestMetric(ctx, "GET", `/api/v1/journal/${id}`, 200);
    return NextResponse.json({ data: entry }, { status: 200 });
  } catch (err) {
    logRequestMetric(ctx, "GET", "/api/v1/journal/:id", 404);
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
    const patch = UpdateJournalInputSchema.parse(raw);

    const updated = await journalService.updateEntry(id, patch);
    logRequestMetric(ctx, "PATCH", `/api/v1/journal/${id}`, 200);
    return NextResponse.json({ data: updated }, { status: 200 });
  } catch (err) {
    logRequestMetric(ctx, "PATCH", "/api/v1/journal/:id", 400);
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
    const deleted = await journalService.deleteEntry(id);
    logRequestMetric(ctx, "DELETE", `/api/v1/journal/${id}`, 200);
    return NextResponse.json({ success: deleted }, { status: 200 });
  } catch (err) {
    logRequestMetric(ctx, "DELETE", "/api/v1/journal/:id", 400);
    return createErrorResponse(err, ctx.requestId);
  }
}
