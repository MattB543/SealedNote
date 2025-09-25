import { NextRequest, NextResponse } from "next/server";

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();
const MAX_BUCKETS = 10_000;

function pruneBuckets() {
  const now = Date.now();
  
  // First pass: delete expired entries
  const keysToDelete: string[] = [];
  buckets.forEach((v, k) => {
    if (now >= v.resetAt) keysToDelete.push(k);
  });
  keysToDelete.forEach(key => buckets.delete(key));
  
  // Prevent memory exhaustion - only sort if we actually need to prune
  if (buckets.size > MAX_BUCKETS) {
    const excess = buckets.size - MAX_BUCKETS;
    
    // For small excess, just delete the first entries
    if (excess < 100) {
      let deleted = 0;
      const iterator = buckets.keys();
      for (let i = 0; i < excess; i++) {
        const result = iterator.next();
        if (!result.done) {
          buckets.delete(result.value);
        }
      }
    } else {
      // For large excess, sort and batch delete
      const entries = Array.from(buckets.entries());
      // Use partial sort to find just the oldest entries we need to delete
      entries.sort((a, b) => a[1].resetAt - b[1].resetAt);
      const toDelete = entries.slice(0, excess);
      toDelete.forEach(([key]) => buckets.delete(key));
    }
  }
}

export function getClientIp(req: NextRequest): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();

  const anyReq = req as any;
  if (anyReq.ip) return String(anyReq.ip);

  const xr = req.headers.get("x-real-ip");
  if (xr) return xr;

  const cf = req.headers.get("cf-connecting-ip");
  if (cf) return cf;

  return "unknown";
}

interface RateLimitOptions {
  windowMs?: number;
  max?: number;
  keyPrefix?: string;
}

export function rateLimit(options: RateLimitOptions = {}) {
  const { 
    windowMs = 60_000, // 1 minute default
    max = 5, // 5 requests per window default for auth endpoints
    keyPrefix = "auth"
  } = options;

  return function checkRateLimit(req: NextRequest): NextResponse | null {
    pruneBuckets();
    
    const ip = getClientIp(req);
    const key = `${keyPrefix}:${ip}`;
    const now = Date.now();
    
    const bucket = buckets.get(key);
    
    if (!bucket || now >= bucket.resetAt) {
      buckets.set(key, { count: 1, resetAt: now + windowMs });
      return null; // Allow request
    }
    
    bucket.count++;
    
    if (bucket.count > max) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': String(max),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(bucket.resetAt),
            'Retry-After': String(Math.ceil((bucket.resetAt - now) / 1000))
          }
        }
      );
    }
    
    return null; // Allow request
  };
}

// Specific rate limiters for different endpoints
export const authRateLimit = rateLimit({ 
  windowMs: 60_000, 
  max: 30, // 30 requests per minute for auth endpoints
  keyPrefix: "auth" 
});

export const feedbackRateLimit = rateLimit({ 
  windowMs: 60_000, 
  max: 20,
  keyPrefix: "feedback" 
});