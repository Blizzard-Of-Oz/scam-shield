import { describe, expect, it } from 'vitest';
import { hasReachedAnalyzeDailyLimit, hasReachedSavedChecksLimit } from '@/lib/plan';

describe('plan limits', () => {
  it('enforces free daily analyze limit', () => {
    expect(hasReachedAnalyzeDailyLimit('free', 19)).toBe(false);
    expect(hasReachedAnalyzeDailyLimit('free', 20)).toBe(true);
  });

  it('does not enforce pro daily analyze limit', () => {
    expect(hasReachedAnalyzeDailyLimit('pro', 9999)).toBe(false);
  });

  it('enforces saved check limit for free users only', () => {
    expect(hasReachedSavedChecksLimit('free', 4)).toBe(false);
    expect(hasReachedSavedChecksLimit('free', 5)).toBe(true);
    expect(hasReachedSavedChecksLimit('pro', 50)).toBe(false);
  });
});
