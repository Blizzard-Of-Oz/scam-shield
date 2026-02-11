import { NextRequest, NextResponse } from 'next/server';
import { insertOrMergeReport } from '@/lib/db';
import { getClientIp, isRateLimited } from '@/lib/rateLimit';
import { validateReportInput } from '@/lib/reporting';

const RATE_LIMIT_ERROR = { error: 'Rate limit exceeded. Try again shortly.' };

export async function POST(request: NextRequest) {
  const ip = getClientIp(request.headers);

  if (isRateLimited(`report:${ip}`, 5, 60_000)) {
    return NextResponse.json(RATE_LIMIT_ERROR, { status: 429 });
  }

  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  try {
    const validInput = validateReportInput(payload);
    const result = insertOrMergeReport(validInput);

    return NextResponse.json({ ok: true, ...result }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid request body.';

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
