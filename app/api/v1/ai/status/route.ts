import { NextResponse } from "next/server";
import { ollamaClient } from "@/server/ai/ollama.client";

export const runtime = "nodejs";

export async function GET() {
  const status = await ollamaClient.healthCheck();
  return NextResponse.json(status, { status: 200 });
}
