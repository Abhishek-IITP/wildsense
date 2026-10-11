import { NextResponse } from "next/server";
import { ollamaClient } from "@/server/ai/ollama.client";
import { getServerConfig } from "@/server/config/env";

export const runtime = "nodejs";

export async function GET() {
  const config = getServerConfig();
  try {
    const health = await ollamaClient.healthCheck();
    return NextResponse.json({
      ok: health.available,
      model: health.model,
      ...(health.reason ? { reason: health.reason } : {}),
    });
  } catch {
    return NextResponse.json({ ok: false, model: config.OLLAMA_MODEL });
  }
}