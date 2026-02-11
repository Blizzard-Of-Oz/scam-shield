import crypto from 'node:crypto';

type StripeMetadata = Record<string, string>;

type StripeCheckoutSession = { id: string; url: string | null; subscription: string | null };
type StripePortalSession = { url: string };

type StripeSubscription = {
  id: string;
  customer: string;
  status: string;
  current_period_end: number | null;
  cancel_at_period_end: boolean;
  items: {
    data: Array<{ price: { id: string } }>;
  };
};

type StripeEvent = {
  type: string;
  data: {
    object: Record<string, unknown>;
  };
};

function getSecretKey(): string {
  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    throw new Error('Missing STRIPE_SECRET_KEY');
  }

  return secretKey;
}

async function stripeRequest<T>(path: string, body: URLSearchParams): Promise<T> {
  const response = await fetch(`https://api.stripe.com/v1/${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${getSecretKey()}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  });

  const data = (await response.json()) as T & { error?: { message?: string } };

  if (!response.ok) {
    throw new Error(data.error?.message ?? `Stripe request failed (${response.status}).`);
  }

  return data;
}

async function stripeGet<T>(path: string): Promise<T> {
  const response = await fetch(`https://api.stripe.com/v1/${path}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${getSecretKey()}`,
    },
  });

  const data = (await response.json()) as T & { error?: { message?: string } };

  if (!response.ok) {
    throw new Error(data.error?.message ?? `Stripe request failed (${response.status}).`);
  }

  return data;
}

export async function createStripeCustomer(input: {
  email: string;
  name?: string | null;
  metadata?: StripeMetadata;
}): Promise<{ id: string }> {
  const body = new URLSearchParams();
  body.set('email', input.email);

  if (input.name) {
    body.set('name', input.name);
  }

  Object.entries(input.metadata ?? {}).forEach(([key, value]) => {
    body.set(`metadata[${key}]`, value);
  });

  return stripeRequest<{ id: string }>('customers', body);
}

export async function createCheckoutSession(input: {
  customer: string;
  priceId: string;
  successUrl: string;
  cancelUrl: string;
  metadata?: StripeMetadata;
}): Promise<StripeCheckoutSession> {
  const body = new URLSearchParams();
  body.set('mode', 'subscription');
  body.set('customer', input.customer);
  body.set('line_items[0][price]', input.priceId);
  body.set('line_items[0][quantity]', '1');
  body.set('success_url', input.successUrl);
  body.set('cancel_url', input.cancelUrl);

  Object.entries(input.metadata ?? {}).forEach(([key, value]) => {
    body.set(`metadata[${key}]`, value);
  });

  return stripeRequest<StripeCheckoutSession>('checkout/sessions', body);
}

export async function createPortalSession(input: {
  customer: string;
  returnUrl: string;
}): Promise<StripePortalSession> {
  const body = new URLSearchParams();
  body.set('customer', input.customer);
  body.set('return_url', input.returnUrl);

  return stripeRequest<StripePortalSession>('billing_portal/sessions', body);
}

export async function retrieveSubscription(subscriptionId: string): Promise<StripeSubscription> {
  return stripeGet<StripeSubscription>(`subscriptions/${subscriptionId}`);
}

function safeCompare(a: string, b: string): boolean {
  const aBuffer = Buffer.from(a, 'utf8');
  const bBuffer = Buffer.from(b, 'utf8');

  if (aBuffer.length !== bBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(aBuffer, bBuffer);
}

export function constructStripeWebhookEvent(payload: string, signatureHeader: string, webhookSecret: string): StripeEvent {
  const parts = signatureHeader.split(',').map((part) => part.trim());
  const timestamp = parts.find((part) => part.startsWith('t='))?.slice(2);
  const signature = parts.find((part) => part.startsWith('v1='))?.slice(3);

  if (!timestamp || !signature) {
    throw new Error('Invalid Stripe signature header.');
  }

  const expected = crypto
    .createHmac('sha256', webhookSecret)
    .update(`${timestamp}.${payload}`)
    .digest('hex');

  if (!safeCompare(expected, signature)) {
    throw new Error('Invalid Stripe webhook signature.');
  }

  return JSON.parse(payload) as StripeEvent;
}
