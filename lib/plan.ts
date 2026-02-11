import type { Session } from 'next-auth';
import { getUserByEmail } from '@/lib/db';

export type UserPlan = 'free' | 'pro';

export const limits = {
  FREE_MAX_ANALYZE_PER_MIN: 30,
  FREE_MAX_ANALYZE_PER_DAY: 20,
  PRO_MAX_ANALYZE_PER_DAY: Number.POSITIVE_INFINITY,
  FREE_MAX_SAVED_HISTORY: 5,
} as const;

export function getUserPlan(session: Session | null): UserPlan {
  const email = session?.user?.email;

  if (!email) {
    return 'free';
  }

  const user = getUserByEmail(email);
  return user?.plan === 'pro' ? 'pro' : 'free';
}

export function hasReachedAnalyzeDailyLimit(plan: UserPlan, usedToday: number): boolean {
  if (plan === 'pro') {
    return false;
  }

  return usedToday >= limits.FREE_MAX_ANALYZE_PER_DAY;
}

export function hasReachedSavedChecksLimit(plan: UserPlan, savedCount: number): boolean {
  if (plan === 'pro') {
    return false;
  }

  return savedCount >= limits.FREE_MAX_SAVED_HISTORY;
}
