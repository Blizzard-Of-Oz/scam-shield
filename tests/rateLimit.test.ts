import { beforeEach, describe, expect, it } from 'vitest';
import { clearRateLimitBuckets, isRateLimited } from '@/lib/rateLimit';

describe('isRateLimited', () => {
  beforeEach(() => {
    clearRateLimitBuckets();
  });

  it('allows requests until the limit, then blocks', () => {
    const key = 'report:127.0.0.1';
    const now = 1_000_000;

    expect(isRateLimited(key, 2, 60_000, now)).toBe(false);
    expect(isRateLimited(key, 2, 60_000, now + 1)).toBe(false);
    expect(isRateLimited(key, 2, 60_000, now + 2)).toBe(true);
  });

  it('resets after window passes', () => {
    const key = 'report:127.0.0.1';
    const now = 1_000_000;

    expect(isRateLimited(key, 1, 60_000, now)).toBe(false);
    expect(isRateLimited(key, 1, 60_000, now + 30_000)).toBe(true);
    expect(isRateLimited(key, 1, 60_000, now + 61_000)).toBe(false);
  });
});
