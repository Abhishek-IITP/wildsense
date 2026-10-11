import { NextResponse } from "next/server";
import { ZodError } from "zod";

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    requestId: string;
    details?: unknown[];
  };
}

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: unknown[];

  constructor(message: string, statusCode = 500, code = "INTERNAL_SERVER_ERROR", details?: unknown[]) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export class ValidationError extends AppError {
  constructor(message = "The request payload failed validation.", details?: unknown[]) {
    super(message, 400, "VALIDATION_ERROR", details);
  }
}

export class NotFoundError extends AppError {
  constructor(message = "The requested resource was not found.") {
    super(message, 404, "NOT_FOUND");
  }
}

export class ConflictError extends AppError {
  constructor(message = "A concurrency conflict occurred.") {
    super(message, 409, "CONFLICT");
  }
}

export class RateLimitError extends AppError {
  constructor(message = "Too many requests. Please slow down.") {
    super(message, 429, "RATE_LIMIT_EXCEEDED");
  }
}

export class DatabaseUnavailableError extends AppError {
  constructor(message = "Database service is currently unavailable.") {
    super(message, 503, "DATABASE_UNAVAILABLE");
  }
}

export class AIServiceUnavailableError extends AppError {
  constructor(message = "Local AI service is currently unavailable.") {
    super(message, 503, "AI_UNAVAILABLE");
  }
}

export class PayloadTooLargeError extends AppError {
  constructor(message = "Request body exceeded the allowed size limit.") {
    super(message, 413, "PAYLOAD_TOO_LARGE");
  }
}

export function formatErrorResponse(
  error: unknown,
  requestId = `req-${Date.now().toString(36)}`,
): { status: number; body: ApiErrorResponse } {
  if (error instanceof ZodError) {
    return {
      status: 400,
      body: {
        error: {
          code: "VALIDATION_ERROR",
          message: "The request payload failed validation.",
          requestId,
          details: error.errors.map((e) => ({
            path: e.path.join("."),
            message: e.message,
          })),
        },
      },
    };
  }

  if (error instanceof AppError) {
    return {
      status: error.statusCode,
      body: {
        error: {
          code: error.code,
          message: error.message,
          requestId,
          ...(error.details ? { details: error.details } : {}),
        },
      },
    };
  }

  // Generic unexpected error (redact internal message and stack trace)
  console.error(`[${requestId}] Unexpected error:`, error);
  return {
    status: 500,
    body: {
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "An unexpected error occurred while processing the request.",
        requestId,
      },
    },
  };
}

export function createErrorResponse(error: unknown, requestId?: string): NextResponse<ApiErrorResponse> {
  const { status, body } = formatErrorResponse(error, requestId);
  return NextResponse.json(body, { status });
}
