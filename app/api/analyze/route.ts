import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { analyzeText } from '@/lib/analyzer';
import { getUserPlan, limits } from '@/lib/plan';
import { getClientIp, hitDailyLimit, isRateLimited } from '@/lib/rateLimit';

const RATE_LIMIT_ERROR = { error: 'Rate limit exceeded. Try again shortly.' };
const DAILY_LIMIT_ERROR = { error: 'Free limit reached. Upgrade to Pro.' };

export async function POST(request: NextRequest) {
  const ip = getClientIp(request.headers);
  const session = await getServerSession(authOptions);
  const plan = getUserPlan(session);
  const key = session?.user?.id ? `user:${session.user.id}` : `ip:${ip}`;

  if (plan === 'free' && isRateLimited(`analyze:${key}`, limits.FREE_MAX_ANALYZE_PER_MIN, 60_000)) {
    return NextResponse.json(RATE_LIMIT_ERROR, { status: 429 });
  }

  if (plan === 'free' && hitDailyLimit(`analyze-daily:${key}`, limits.FREE_MAX_ANALYZE_PER_DAY)) {
    return NextResponse.json(DAILY_LIMIT_ERROR, { status: 429 });
  }

  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  if (
    typeof payload !== 'object' ||
    payload === null ||
    !('text' in payload) ||
    typeof payload.text !== 'string'
  ) {
    return NextResponse.json({ error: 'Body must be JSON in the form: { "text": string }' }, { status: 400 });
  }

  const result = analyzeText(payload.text);

  return NextResponse.json(result, { status: 200 });
}
