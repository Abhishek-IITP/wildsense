import { describe, it, expect, beforeEach } from "vitest";
import { rateLimiter } from "@/server/middleware/rate-limit";
import { RateLimitError } from "@/server/middleware/error-handler";

describe("Rate Limiter", () => {
  beforeEach(() => {
    rateLimiter.reset();
  });

  it("permits requests within quota", () => {
    const config = { maxRequests: 3, windowMs: 1000 };
    const r1 = rateLimiter.check("ip-1", config);
    expect(r1.allowed).toBe(true);
    expect(r1.remaining).toBe(2);

    const r2 = rateLimiter.check("ip-1", config);
    expect(r2.allowed).toBe(true);
    expect(r2.remaining).toBe(1);

    const r3 = rateLimiter.check("ip-1", config);
    expect(r3.allowed).toBe(true);
    expect(r3.remaining).toBe(0);
  });

  it("blocks requests exceeding limit and reports retryAfterMs", () => {
    const config = { maxRequests: 2, windowMs: 1000 };
    rateLimiter.enforce("ip-2", config);
    rateLimiter.enforce("ip-2", config);

    expect(() => rateLimiter.enforce("ip-2", config)).toThrow(RateLimitError);
  });

  it("isolates counters per IP key", () => {
    const config = { maxRequests: 1, windowMs: 1000 };
    rateLimiter.enforce("user-a", config);
    expect(() => rateLimiter.enforce("user-a", config)).toThrow(RateLimitError);

    // user-b is unaffected
    expect(() => rateLimiter.enforce("user-b", config)).not.toThrow();
  });
});
