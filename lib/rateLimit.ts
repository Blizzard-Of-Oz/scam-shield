const buckets = new Map<string, number[]>();

export function getClientIp(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for');

  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) {
      return first;
    }
  }

  const realIp = headers.get('x-real-ip')?.trim();
  return realIp || 'unknown';
}

export function isRateLimited(key: string, limit: number, windowMs: number, now = Date.now()): boolean {
  const bucket = buckets.get(key) ?? [];
  const threshold = now - windowMs;
  const recent = bucket.filter((timestamp) => timestamp > threshold);

  if (recent.length >= limit) {
    buckets.set(key, recent);
    return true;
  }

  recent.push(now);
  buckets.set(key, recent);
  return false;
}

export function clearRateLimitBuckets() {
  buckets.clear();
}
