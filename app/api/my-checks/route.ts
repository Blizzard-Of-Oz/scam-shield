import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { getSavedChecksForUser, upsertUserByEmail } from '@/lib/db';

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = upsertUserByEmail({
    email: session.user.email,
    name: session.user.name,
    image: session.user.image,
  });

  const checks = getSavedChecksForUser(user.id);

  return NextResponse.json({ checks }, { status: 200 });
}
