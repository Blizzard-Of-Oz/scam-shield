'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import type { AnalysisResult } from '@/lib/analyzer';

export default function HomePage() {
  const [text, setText] = useState('');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        throw new Error('Could not analyze input right now.');
      }

      const data = (await response.json()) as AnalysisResult;
      setResult(data);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="space-y-8">
      <header className="space-y-3">
        <p className="text-sm font-medium uppercase tracking-wide text-brand-700">Scam Shield</p>
        <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">Risk check for suspicious messages</h1>
        <p className="text-slate-600">
          Paste a message or link to get a quick, privacy-first risk assessment.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <label htmlFor="scam-input" className="block text-sm font-medium text-slate-700">
          Message or link
        </label>
        <textarea
          id="scam-input"
          rows={7}
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Example: Your account is locked. Verify now at https://example.com"
          className="w-full rounded-xl border border-slate-300 p-3 text-sm text-slate-900 outline-none ring-brand-100 transition focus:border-brand-500 focus:ring"
          required
        />

        <button
          type="submit"
          disabled={loading || text.trim().length === 0}
          className="inline-flex items-center justify-center rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? 'Checking…' : 'Check'}
        </button>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}
      </form>

      {result ? (
        <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-xl font-semibold">Result: {result.verdict}</h2>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700">
              Risk score: {result.score}/100
            </span>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Reasons</h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-slate-700">
              {result.reasons.map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Extracted URLs</h3>
            {result.urls.length > 0 ? (
              <ul className="mt-2 space-y-1 text-sm text-slate-700">
                {result.urls.map((url) => (
                  <li key={url} className="break-all rounded bg-slate-50 px-2 py-1">
                    {url}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-slate-600">No URLs found.</p>
            )}
          </div>
        </section>
      ) : null}

      <footer className="space-y-3 text-sm text-slate-600">
        <p>
          Disclaimer: This tool provides a conservative risk assessment, not certainty. Always verify
          through trusted channels before taking action.
        </p>
        <p>
          We are privacy-first by default and do not store submissions. Learn more on our{' '}
          <Link href="/privacy" className="font-medium text-brand-700 underline-offset-4 hover:underline">
            privacy page
          </Link>
          .
        </p>
      </footer>
    </main>
  );
}
