const buckets = new Map<string, number[]>();
const dailyBuckets = new Map<string, number>();

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

export function hitDailyLimit(key: string, limit: number): boolean {
  if (!Number.isFinite(limit)) {
    return false;
  }

  const dateKey = new Date().toISOString().slice(0, 10);
  const bucketKey = `${key}:${dateKey}`;
  const used = dailyBuckets.get(bucketKey) ?? 0;

  if (used >= limit) {
    return true;
  }

  dailyBuckets.set(bucketKey, used + 1);
  return false;
}

export function clearRateLimitBuckets() {
  buckets.clear();
  dailyBuckets.clear();
}
