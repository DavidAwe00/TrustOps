/**
 * In-memory Rate Limiter
 * Simple token-bucket rate limiter for API routes.
 * For production at scale, replace with Redis-based (@upstash/ratelimit).
 */

interface RateLimitEntry {
  tokens: number;
  lastRefill: number;
}

interface RateLimitConfig {
  /** Max requests allowed in the window */
  maxRequests: number;
  /** Window duration in milliseconds */
  windowMs: number;
}

/** Default: 60 requests per minute */
const DEFAULT_CONFIG: RateLimitConfig = {
  maxRequests: 60,
  windowMs: 60 * 1000,
};

/** Presets for different route types */
export const RateLimitPresets = {
  /** Standard API routes: 60 req/min */
  standard: DEFAULT_CONFIG,
  /** Auth routes: 10 req/min (stricter) */
  auth: { maxRequests: 10, windowMs: 60 * 1000 },
  /** AI / expensive operations: 20 req/min */
  ai: { maxRequests: 20, windowMs: 60 * 1000 },
  /** File uploads: 30 req/min */
  upload: { maxRequests: 30, windowMs: 60 * 1000 },
  /** Cron: 5 req/min */
  cron: { maxRequests: 5, windowMs: 60 * 1000 },
} as const;

class RateLimiter {
  private store = new Map<string, RateLimitEntry>();
  private config: RateLimitConfig;
  private cleanupInterval: ReturnType<typeof setInterval> | null = null;

  constructor(config: RateLimitConfig = DEFAULT_CONFIG) {
    this.config = config;
    // Clean up stale entries every 5 minutes
    if (typeof setInterval !== "undefined") {
      this.cleanupInterval = setInterval(() => this.cleanup(), 5 * 60 * 1000);
    }
  }

  /**
   * Check if a request should be allowed.
   * Returns { allowed, remaining, resetMs }.
   */
  check(key: string): { allowed: boolean; remaining: number; resetMs: number } {
    const now = Date.now();
    let entry = this.store.get(key);

    if (!entry) {
      entry = { tokens: this.config.maxRequests, lastRefill: now };
      this.store.set(key, entry);
    }

    // Refill tokens based on elapsed time
    const elapsed = now - entry.lastRefill;
    const refillRate = this.config.maxRequests / this.config.windowMs;
    const tokensToAdd = elapsed * refillRate;

    entry.tokens = Math.min(this.config.maxRequests, entry.tokens + tokensToAdd);
    entry.lastRefill = now;

    if (entry.tokens >= 1) {
      entry.tokens -= 1;
      return {
        allowed: true,
        remaining: Math.floor(entry.tokens),
        resetMs: Math.ceil((1 - (entry.tokens % 1)) / refillRate),
      };
    }

    return {
      allowed: false,
      remaining: 0,
      resetMs: Math.ceil((1 - entry.tokens) / refillRate),
    };
  }

  private cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.store) {
      if (now - entry.lastRefill > this.config.windowMs * 2) {
        this.store.delete(key);
      }
    }
  }

  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.store.clear();
  }
}

// Singleton limiters per preset
const limiters = new Map<string, RateLimiter>();

function getLimiter(preset: keyof typeof RateLimitPresets): RateLimiter {
  if (!limiters.has(preset)) {
    limiters.set(preset, new RateLimiter(RateLimitPresets[preset]));
  }
  return limiters.get(preset)!;
}

/**
 * Rate-limit a request. Returns null if allowed, or a 429 Response if blocked.
 *
 * Usage in an API route:
 *   const limited = rateLimit(request, "standard");
 *   if (limited) return limited;
 */
export function rateLimit(
  request: Request,
  preset: keyof typeof RateLimitPresets = "standard"
): Response | null {
  // Skip rate limiting in demo mode or testing
  if (process.env.TRUSTOPS_DEMO === "1" || process.env.NODE_ENV === "test") {
    return null;
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  const limiter = getLimiter(preset);
  const result = limiter.check(`${preset}:${ip}`);

  if (!result.allowed) {
    return new Response(
      JSON.stringify({
        error: {
          code: "RATE_LIMITED",
          message: "Too many requests. Please try again later.",
          retryAfterMs: result.resetMs,
        },
      }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": String(Math.ceil(result.resetMs / 1000)),
          "X-RateLimit-Remaining": String(result.remaining),
        },
      }
    );
  }

  return null;
}
