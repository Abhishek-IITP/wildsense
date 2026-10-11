import { NextRequest, NextResponse } from "next/server";
import { GenerateMissionInputSchema } from "@/server/schemas/mission.schema";
import { missionService } from "@/server/services/mission.service";
import { parseJsonWithLimit } from "@/server/middleware/request-context";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const raw = await parseJsonWithLimit(request).catch(() => ({}));
    const parsed = GenerateMissionInputSchema.safeParse(raw);
    const input = parsed.success
      ? parsed.data
      : {
          duration: 10,
          difficulty: "Gentle" as const,
          environment: "Park or neighbourhood",
          interest: "Notice small details",
        };

    const result = await missionService.generateMission(input);
    return NextResponse.json(result.mission, { status: 200 });
  } catch {
    return NextResponse.json({ error: "unavailable" }, { status: 503 });
  }
}