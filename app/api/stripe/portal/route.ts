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

  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: 'Missing STRIPE_SECRET_KEY. Configure Stripe secret key first.' }, { status: 400 });
  }

  const appUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000';

  try {
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
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Stripe portal request failed.';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
