import { NextRequest, NextResponse } from "next/server";

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

const RATE_LIMITS: Record<string, { max: number; windowMs: number }> = {
  "/api/plan-slides": { max: 10, windowMs: 60_000 },
  "/api/render": { max: 20, windowMs: 60_000 },
  "/api/extract": { max: 15, windowMs: 60_000 },
  "/api/fill-visual-data": { max: 20, windowMs: 60_000 },
  "/api/regenerate-block": { max: 15, windowMs: 60_000 },
};

function getClientIp(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || req.headers.get("x-real-ip")
    || "127.0.0.1";
}

function isApiPath(pathname: string): string | undefined {
  const match = pathname.match(/^(\/api\/[^/]+)/);
  return match ? match[1] : undefined;
}

export function proxy(req: NextRequest) {
  const path = isApiPath(req.nextUrl.pathname);
  if (!path) return NextResponse.next();

  const limit = RATE_LIMITS[path];
  if (!limit) return NextResponse.next();

  const ip = getClientIp(req);
  const now = Date.now();
  const key = `${ip}:${path}`;

  let entry = rateLimitMap.get(key);
  if (!entry || now > entry.resetAt) {
    entry = { count: 0, resetAt: now + limit.windowMs };
    rateLimitMap.set(key, entry);
  }

  entry.count++;

  const remaining = Math.max(0, limit.max - entry.count);
  const resetSeconds = Math.ceil((entry.resetAt - now) / 1000);

  const res = NextResponse.next();
  res.headers.set("X-RateLimit-Limit", String(limit.max));
  res.headers.set("X-RateLimit-Remaining", String(remaining));
  res.headers.set("X-RateLimit-Reset", String(resetSeconds));

  if (entry.count > limit.max) {
    return NextResponse.json(
      { success: false, error: `Rate limit exceeded. Try again in ${resetSeconds}s.` },
      { status: 429, headers: res.headers }
    );
  }

  return res;
}

export const config = {
  matcher: "/api/:path*",
};
