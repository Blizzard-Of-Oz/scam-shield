import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { upsertUserByEmail } from '@/lib/db';
import { createPortalSession } from '@/lib/stripe';

export async function POST() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const appUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000';
  const user = upsertUserByEmail({
    email: session.user.email,
    name: session.user.name,
    image: session.user.image,
  });

  if (!user.stripeCustomerId) {
    return NextResponse.json({ error: 'No billing profile found.' }, { status: 400 });
  }

  const portalSession = await createPortalSession({
    customer: user.stripeCustomerId,
    returnUrl: `${appUrl}/pricing`,
  });

  return NextResponse.json({ url: portalSession.url }, { status: 200 });
}
