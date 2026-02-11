import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { saveCheckForUser, upsertUserByEmail } from '@/lib/db';
import { extractHostnames, validateSaveCheckInput } from '@/lib/historyStorage';

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  try {
    const valid = validateSaveCheckInput(payload);
    const user = upsertUserByEmail({
      email: session.user.email,
      name: session.user.name,
      image: session.user.image,
    });
    const domains = extractHostnames(valid.urls);

    const saved = saveCheckForUser({
      userId: user.id,
      verdict: valid.verdict,
      score: valid.score,
      reasons: valid.reasons,
      domains,
    });

    return NextResponse.json({ ok: true, check: saved }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid request body.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
