'use client';

import { useEffect, useState } from 'react';
import { signIn, useSession } from 'next-auth/react';

type StripeConfig = {
  configured: boolean;
  missing: string[];
};

export default function PricingPage() {
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState<'checkout' | 'portal' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [stripeConfig, setStripeConfig] = useState<StripeConfig>({ configured: false, missing: [] });
  const [configLoading, setConfigLoading] = useState(true);

  const plan = session?.user?.plan === 'pro' ? 'pro' : 'free';

  useEffect(() => {
    async function loadStripeConfig() {
      setConfigLoading(true);

      try {
        const response = await fetch('/api/stripe/config', { method: 'GET' });
        const data = (await response.json()) as StripeConfig;

        if (!response.ok) {
          throw new Error('Unable to load Stripe config status.');
        }

        setStripeConfig(data);
      } catch {
        setStripeConfig({ configured: false, missing: ['STRIPE_PRICE_ID', 'STRIPE_SECRET_KEY'] });
      } finally {
        setConfigLoading(false);
      }
    }

    void loadStripeConfig();
  }, []);

  async function redirectTo(path: '/api/stripe/checkout' | '/api/stripe/portal', mode: 'checkout' | 'portal') {
    setLoading(mode);
    setError(null);

    try {
      const response = await fetch(path, { method: 'POST' });
      const data = (await response.json()) as { url?: string; error?: string };

      if (!response.ok || !data.url) {
        throw new Error(data.error ?? 'Unable to start checkout.');
      }

      window.location.href = data.url;
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : 'Something went wrong.';
      setError(message);
      setLoading(null);
    }
  }

  const isStripeReady = stripeConfig.configured;

  return (
    <main className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold text-slate-900">Pricing</h1>
        <p className="text-sm text-slate-600">Start free, then upgrade any time to unlock higher limits.</p>
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Free</h2>
          <p className="mt-1 text-sm text-slate-600">$0/month</p>
          <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-slate-700">
            <li>30 analyzes per minute</li>
            <li>20 analyzes per day</li>
            <li>Save up to 5 checks in private history</li>
          </ul>
        </article>

        <article className="rounded-2xl border border-brand-300 bg-brand-50 p-5 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Pro</h2>
          <p className="mt-1 text-sm text-slate-600">$9/month (test mode via Stripe)</p>
          <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-slate-700">
            <li>Higher analyze limits</li>
            <li>Unlimited saved history</li>
            <li>Manage billing in Stripe customer portal</li>
          </ul>

          <div className="mt-5">
            {status === 'loading' || configLoading ? (
              <p className="text-sm text-slate-600">Loading account…</p>
            ) : !session?.user ? (
              <button
                type="button"
                onClick={() => signIn('google')}
                className="rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700"
              >
                Sign in to upgrade
              </button>
            ) : plan === 'free' ? (
              <button
                type="button"
                disabled={loading !== null || !isStripeReady}
                onClick={() => redirectTo('/api/stripe/checkout', 'checkout')}
                className="rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading === 'checkout' ? 'Redirecting…' : 'Upgrade to Pro'}
              </button>
            ) : (
              <button
                type="button"
                disabled={loading !== null || !isStripeReady}
                onClick={() => redirectTo('/api/stripe/portal', 'portal')}
                className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading === 'portal' ? 'Redirecting…' : 'Manage subscription'}
              </button>
            )}
          </div>

          {!configLoading && !isStripeReady ? (
            <p className="mt-3 text-sm text-red-600">
              Stripe is not configured yet. Missing: {stripeConfig.missing.join(', ')}.
            </p>
          ) : null}

          {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
        </article>
      </section>
    </main>
  );
}
