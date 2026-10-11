import { RateLimitError } from "./error-handler";

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

class InMemoryRateLimiter {
  private hits: Map<string, number[]> = new Map();
  private lastCleanup = Date.now();

  constructor(private readonly defaultWindowMs = 60000, private readonly defaultMax = 60) {}

  public check(key: string, config?: RateLimitConfig): { allowed: boolean; remaining: number; retryAfterMs: number } {
    const now = Date.now();
    const windowMs = config?.windowMs ?? this.defaultWindowMs;
    const maxRequests = config?.maxRequests ?? this.defaultMax;

    this.cleanup(now);

    const timestamps = this.hits.get(key) ?? [];
    const validTimestamps = timestamps.filter((t) => now - t < windowMs);

    if (validTimestamps.length >= maxRequests) {
      const oldest = validTimestamps[0] ?? now;
      const retryAfterMs = Math.max(0, windowMs - (now - oldest));
      return { allowed: false, remaining: 0, retryAfterMs };
    }

    validTimestamps.push(now);
    this.hits.set(key, validTimestamps);
    return {
      allowed: true,
      remaining: maxRequests - validTimestamps.length,
      retryAfterMs: 0,
    };
  }

  public enforce(key: string, config?: RateLimitConfig): void {
    const result = this.check(key, config);
    if (!result.allowed) {
      throw new RateLimitError(`Rate limit exceeded. Please wait ${Math.ceil(result.retryAfterMs / 1000)} seconds.`);
    }
  }

  public reset(key?: string): void {
    if (key) {
      this.hits.delete(key);
    } else {
      this.hits.clear();
    }
  }

  private cleanup(now: number): void {
    // Run cleanup at most once every 30 seconds
    if (now - this.lastCleanup < 30000) return;
    this.lastCleanup = now;

    for (const [key, timestamps] of this.hits.entries()) {
      const fresh = timestamps.filter((t) => now - t < 120000);
      if (fresh.length === 0) {
        this.hits.delete(key);
      } else {
        this.hits.set(key, fresh);
      }
    }
  }
}

export const rateLimiter = new InMemoryRateLimiter();

// Preconfigured tier configs
export const RATE_LIMIT_TIERS = {
  MISSION_GENERATE: { maxRequests: 10, windowMs: 60000 },
  REFLECTION: { maxRequests: 10, windowMs: 60000 },
  SYNC: { maxRequests: 30, windowMs: 60000 },
  JOURNAL_WRITE: { maxRequests: 60, windowMs: 60000 },
  STANDARD: { maxRequests: 120, windowMs: 60000 },
} as const;
