import { NextRequest } from "next/server";
import { PayloadTooLargeError } from "./error-handler";

export interface RequestContext {
  requestId: string;
  clientIp: string;
  startTime: number;
}

export function extractRequestContext(req: NextRequest): RequestContext {
  const requestId =
    req.headers.get("x-request-id") ||
    `ws-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

  // In trusted local/loopback environment, resolve client IP safely
  const forwardedFor = req.headers.get("x-forwarded-for");
  const clientIp = forwardedFor ? forwardedFor.split(",")[0]?.trim() || "127.0.0.1" : "127.0.0.1";

  return {
    requestId,
    clientIp,
    startTime: Date.now(),
  };
}

export async function parseJsonWithLimit<T = unknown>(req: Request, maxBytes = 1048576): Promise<T> {
  const contentLength = Number(req.headers.get("content-length") || "0");
  if (contentLength > maxBytes) {
    throw new PayloadTooLargeError(`Payload exceeds maximum allowed size of ${maxBytes} bytes.`);
  }

  const text = await req.text();
  if (text.length > maxBytes) {
    throw new PayloadTooLargeError(`Payload exceeds maximum allowed size of ${maxBytes} bytes.`);
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error("Malformed JSON payload.");
  }
}

export function logRequestMetric(ctx: RequestContext, method: string, path: string, statusCode: number): void {
  const durationMs = Date.now() - ctx.startTime;
  if (process.env.NODE_ENV !== "test") {
    // Structured log without leaking private content or credentials
    console.info(
      JSON.stringify({
        requestId: ctx.requestId,
        method,
        path,
        statusCode,
        durationMs,
        timestamp: new Date().toISOString(),
      }),
    );
  }
}
