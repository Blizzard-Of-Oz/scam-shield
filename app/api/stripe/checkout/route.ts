import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { setUserStripeCustomerId, upsertUserByEmail } from '@/lib/db';
import { createCheckoutSession, createStripeCustomer } from '@/lib/stripe';

export async function POST() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const priceId = process.env.STRIPE_PRICE_ID;
  const appUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000';

  if (!priceId) {
    return NextResponse.json({ error: 'Missing STRIPE_PRICE_ID' }, { status: 500 });
  }

  const user = upsertUserByEmail({
    email: session.user.email,
    name: session.user.name,
    image: session.user.image,
  });

  let customerId = user.stripeCustomerId;

  if (!customerId) {
    const customer = await createStripeCustomer({
      email: user.email,
      name: user.name,
      metadata: { userId: user.id },
    });

    customerId = customer.id;
    setUserStripeCustomerId(user.id, customer.id);
  }

  const checkoutSession = await createCheckoutSession({
    customer: customerId,
    priceId,
    successUrl: `${appUrl}/me/history?upgraded=1`,
    cancelUrl: `${appUrl}/pricing`,
    metadata: { userId: user.id },
  });

  if (!checkoutSession.url) {
    return NextResponse.json({ error: 'Unable to create checkout session.' }, { status: 500 });
  }

  return NextResponse.json({ url: checkoutSession.url }, { status: 200 });
}
