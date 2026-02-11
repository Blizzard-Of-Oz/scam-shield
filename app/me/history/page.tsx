'use client';

import { useEffect, useState } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { VerdictBadge } from '@/components/VerdictBadge';

type SavedCheck = {
  id: string;
  createdAt: string;
  verdict: 'SAFE' | 'SUSPICIOUS' | 'DANGEROUS';
  score: number;
  reasons: string[];
  domains: string[];
};

export default function MyHistoryPage() {
  const { data: session, status } = useSession();
  const [checks, setChecks] = useState<SavedCheck[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadChecks() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/my-checks');
        const data = (await response.json()) as { checks?: SavedCheck[]; error?: string };

        if (!response.ok || !data.checks) {
          throw new Error(data.error ?? 'Unable to load your history.');
        }

        setChecks(data.checks);
      } catch (fetchError) {
        const message = fetchError instanceof Error ? fetchError.message : 'Unable to load your history.';
        setError(message);
      } finally {
        setLoading(false);
      }
    }

    if (session?.user) {
      void loadChecks();
    }
  }, [session]);

  if (status === 'loading') {
    return <main><p className="text-sm text-slate-600">Loading session…</p></main>;
  }

  if (!session?.user) {
    return (
      <main className="space-y-3">
        <h1 className="text-2xl font-bold text-slate-900">My History</h1>
        <p className="text-slate-700">You are not signed in. Sign in to view your private history.</p>
        <button
          type="button"
          onClick={() => signIn('google')}
          className="inline-flex items-center justify-center rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700"
        >
          Sign in with Google
        </button>
      </main>
    );
  }

  return (
    <main className="space-y-4">
      <h1 className="text-2xl font-bold text-slate-900">My History</h1>
      <p className="text-sm text-slate-600">Private checks saved to your account (newest first).</p>

      {loading ? <p className="text-sm text-slate-600">Loading checks…</p> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <ul className="space-y-3">
        {checks.map((check) => (
          <li key={check.id} className="space-y-2 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <VerdictBadge verdict={check.verdict} />
              <span className="text-sm font-medium text-slate-700">Score: {check.score}/100</span>
            </div>
            <p className="text-xs text-slate-500">{new Date(check.createdAt).toLocaleString()}</p>
            <p className="text-sm text-slate-700">Domains: {check.domains.length > 0 ? check.domains.join(', ') : 'None'}</p>
            <ul className="list-disc pl-5 text-sm text-slate-700">
              {check.reasons.map((reason) => (
                <li key={`${check.id}-${reason}`}>{reason}</li>
              ))}
            </ul>
          </li>
        ))}
      </ul>

      {!loading && checks.length === 0 ? (
        <p className="text-sm text-slate-600">No saved checks yet. Analyze a message and click “Save to my history”.</p>
      ) : null}
    </main>
  );
}
