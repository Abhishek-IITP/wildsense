import { NextRequest, NextResponse } from "next/server";
import { ReflectionInputSchema } from "@/server/schemas/ai.schema";
import { reflectionService } from "@/server/services/reflection.service";
import { parseJsonWithLimit } from "@/server/middleware/request-context";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const raw = await parseJsonWithLimit(request).catch(() => ({}));
    const parsed = ReflectionInputSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: "bad request" }, { status: 400 });
    }

    const journalId = (raw as Record<string, unknown>)?.["id"] as string | undefined;
    const result = await reflectionService.generateReflection(parsed.data, journalId);

    return NextResponse.json(
      { reflection: result.reflection },
      { status: 200 },
    );
  } catch {
    return NextResponse.json({ error: "unavailable" }, { status: 503 });
  }
}