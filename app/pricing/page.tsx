'use client';

import { useState } from 'react';
import { signIn, useSession } from 'next-auth/react';

export default function PricingPage() {
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState<'checkout' | 'portal' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const plan = session?.user?.plan === 'pro' ? 'pro' : 'free';

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
            {status === 'loading' ? (
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
                disabled={loading !== null}
                onClick={() => redirectTo('/api/stripe/checkout', 'checkout')}
                className="rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading === 'checkout' ? 'Redirecting…' : 'Upgrade to Pro'}
              </button>
            ) : (
              <button
                type="button"
                disabled={loading !== null}
                onClick={() => redirectTo('/api/stripe/portal', 'portal')}
                className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading === 'portal' ? 'Redirecting…' : 'Manage subscription'}
              </button>
            )}
          </div>

          {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
        </article>
      </section>
    </main>
  );
}
