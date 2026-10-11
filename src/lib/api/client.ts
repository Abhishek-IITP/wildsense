export class ApiError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown[],
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function requestJson<T>(
  url: string,
  options: RequestInit = {},
  timeoutMs = 15000,
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: options.signal ?? controller.signal,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(options.headers ?? {}),
      },
    });

    if (!response.ok) {
      let code = "HTTP_ERROR";
      let message = `Request failed with status ${response.status}`;
      let details: unknown[] | undefined;

      try {
        const errJson = await response.json();
        if (errJson?.error) {
          code = errJson.error.code ?? code;
          message = errJson.error.message ?? message;
          details = errJson.error.details;
        }
      } catch {
        // Not JSON error body
      }

      throw new ApiError(response.status, code, message, details);
    }

    return (await response.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}
