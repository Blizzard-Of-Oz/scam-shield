import { NextRequest, NextResponse } from 'next/server';
import { getUserByStripeCustomerId, setUserPlan, upsertSubscription } from '@/lib/db';
import { constructStripeWebhookEvent, retrieveSubscription } from '@/lib/stripe';

type StripeSubscriptionPayload = {
  id: string;
  customer: string;
  status: string;
  current_period_end: number | null;
  cancel_at_period_end: boolean;
  items: {
    data: Array<{ price: { id: string } }>;
  };
};

function shouldBePro(status: string): boolean {
  return status === 'active' || status === 'trialing';
}

async function handleSubscriptionEvent(subscription: StripeSubscriptionPayload) {
  const user = getUserByStripeCustomerId(subscription.customer);

  if (!user) {
    return;
  }

  const firstItem = subscription.items.data[0];

  upsertSubscription({
    userId: user.id,
    stripeSubscriptionId: subscription.id,
    stripePriceId: firstItem?.price.id ?? null,
    status: subscription.status,
    currentPeriodEnd: subscription.current_period_end
      ? new Date(subscription.current_period_end * 1000)
      : null,
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
  });

  setUserPlan(user.id, shouldBePro(subscription.status) ? 'pro' : 'free');
}

export async function POST(request: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    return NextResponse.json({ error: 'Missing STRIPE_WEBHOOK_SECRET' }, { status: 500 });
  }

  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
  }

  const payload = await request.text();

  let event: ReturnType<typeof constructStripeWebhookEvent>;

  try {
    event = constructStripeWebhookEvent(payload, signature, webhookSecret);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid signature';
    return NextResponse.json({ error: message }, { status: 400 });
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const object = event.data.object as { subscription?: string };
      if (object.subscription) {
        const subscription = await retrieveSubscription(object.subscription);
        await handleSubscriptionEvent(subscription);
      }
      break;
    }
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted': {
      const subscription = event.data.object as unknown as StripeSubscriptionPayload;
      await handleSubscriptionEvent(subscription);
      break;
    }
    default:
      break;
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
