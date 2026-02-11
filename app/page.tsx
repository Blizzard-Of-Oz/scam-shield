'use client';

import Link from 'next/link';
import { FormEvent, useMemo, useState } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { VerdictBadge } from '@/components/VerdictBadge';
import type { AnalysisResult } from '@/lib/analyzer';
import { SCAM_TYPES } from '@/lib/reporting';
import { formatVerdictSummary } from '@/lib/shareFormat';
import { generateShareCardPng } from '@/lib/shareCard';

const EXAMPLE_SCAM =
  'URGENT: Your bank account is locked. Verify immediately at http://198.51.100.8/login to avoid suspension.';

const EXAMPLE_NORMAL =
  'Hi team, reminder that our meeting is tomorrow at 10 AM. Agenda is in the company drive.';

const REPORTABLE_VERDICTS = new Set(['SUSPICIOUS', 'DANGEROUS']);

export default function HomePage() {
  const [text, setText] = useState('');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shareMessage, setShareMessage] = useState<string | null>(null);

  const [reportOpen, setReportOpen] = useState(false);
  const [reportScamType, setReportScamType] = useState('');
  const [reportNote, setReportNote] = useState('');
  const [confirmNoPersonalInfo, setConfirmNoPersonalInfo] = useState(false);
  const [confirmConsent, setConfirmConsent] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportMessage, setReportMessage] = useState<string | null>(null);
  const [reportSubmitted, setReportSubmitted] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const { data: session } = useSession();

  const canReport = Boolean(result && REPORTABLE_VERDICTS.has(result.verdict));

  const reportUrls = useMemo(() => result?.urls ?? [], [result]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setShareMessage(null);
    setReportMessage(null);
    setSaveMessage(null);
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
      setReportOpen(false);
      setReportSubmitted(false);
      setReportScamType('');
      setReportNote('');
      setConfirmNoPersonalInfo(false);
      setConfirmConsent(false);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function handleClear() {
    setText('');
    setResult(null);
    setError(null);
    setShareMessage(null);
    setReportMessage(null);
    setReportOpen(false);
    setReportSubmitted(false);
    setSaveMessage(null);
  }

  async function copyVerdictSummary() {
    if (!result) {
      return;
    }

    try {
      await navigator.clipboard.writeText(formatVerdictSummary(result));
      setShareMessage('Verdict copied to clipboard.');
    } catch {
      setShareMessage('Clipboard unavailable. Please copy manually.');
    }
  }

  function triggerDownload(blob: Blob, fileName: string) {
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = objectUrl;
    anchor.download = fileName;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(objectUrl);
  }

  async function downloadVerdictImage() {
    if (!result) {
      return;
    }

    try {
      const blob = await generateShareCardPng(result);
      triggerDownload(blob, 'scam-shield-verdict.png');
      setShareMessage('Image downloaded.');
    } catch {
      setShareMessage('Unable to generate image in this browser.');
    }
  }

  async function shareVerdictImage() {
    if (!result) {
      return;
    }

    try {
      const blob = await generateShareCardPng(result);
      const file = new File([blob], 'scam-shield-verdict.png', { type: 'image/png' });

      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: 'Scam Shield verdict',
          files: [file],
        });
        setShareMessage('Shared successfully.');
        return;
      }

      triggerDownload(blob, 'scam-shield-verdict.png');
      setShareMessage('Downloaded (sharing not supported)');
    } catch {
      setShareMessage('Share was cancelled or failed.');
    }
  }

  async function submitReport() {
    if (!result) {
      return;
    }

    setReportLoading(true);
    setReportMessage(null);

    try {
      const response = await fetch('/api/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          verdict: result.verdict,
          score: result.score,
          scamType: reportScamType || undefined,
          note: reportNote || undefined,
          urls: reportUrls,
        }),
      });

      const data = (await response.json()) as { ok?: boolean; error?: string; id?: number };

      if (!response.ok || !data.ok) {
        throw new Error(data.error || 'Unable to submit report.');
      }

      setReportMessage('Thanks — your report was shared (privacy-first).');
      setReportSubmitted(true);
      setReportOpen(false);
      setReportScamType('');
      setReportNote('');
      setConfirmNoPersonalInfo(false);
      setConfirmConsent(false);
    } catch (submitError) {
      const message =
        submitError instanceof Error ? submitError.message : 'Unable to submit report.';
      setReportSubmitted(false);
      setReportMessage(message);
    } finally {
      setReportLoading(false);
    }
  }

  async function saveToMyHistory() {
    if (!result) {
      return;
    }

    setSaveLoading(true);
    setSaveMessage(null);

    try {
      const response = await fetch('/api/save-check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          verdict: result.verdict,
          score: result.score,
          reasons: result.reasons,
          urls: result.urls,
        }),
      });

      const data = (await response.json()) as { ok?: boolean; error?: string };

      if (!response.ok || !data.ok) {
        throw new Error(data.error || 'Unable to save this check.');
      }

      setSaveMessage('Saved to your private history.');
    } catch (saveError) {
      const message = saveError instanceof Error ? saveError.message : 'Unable to save this check.';
      setSaveMessage(message);
    } finally {
      setSaveLoading(false);
    }
  }

  return (
    <main className="space-y-8">
      <header className="space-y-3">
        <p className="text-sm font-medium uppercase tracking-wide text-brand-700">Scam Shield</p>
        <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">
          Risk check for suspicious messages
        </h1>
        <p className="text-slate-600">
          Paste a message or link to get a quick, privacy-first risk assessment.
        </p>
      </header>

      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
      >
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

        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            disabled={loading || text.trim().length === 0}
            className="inline-flex items-center justify-center rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Checking…' : 'Check'}
          </button>

          <button
            type="button"
            onClick={handleClear}
            className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Clear
          </button>

          <button
            type="button"
            onClick={() => setText(EXAMPLE_SCAM)}
            className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Try an example (scam)
          </button>

          <button
            type="button"
            onClick={() => setText(EXAMPLE_NORMAL)}
            className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Try an example (normal)
          </button>
        </div>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}
      </form>

      {result ? (
        <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-xl font-semibold text-slate-900">Result</h2>
            <VerdictBadge verdict={result.verdict} />
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-700">Risk score: {result.score}/100</p>
            <div className="h-2 w-full rounded-full bg-slate-200">
              <div
                className="h-2 rounded-full bg-brand-500 transition-all"
                style={{ width: `${result.score}%` }}
                aria-hidden="true"
              />
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Reasons
            </h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-slate-700">
              {result.reasons.map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Detected URLs
            </h3>
            {result.urls.length > 0 ? (
              <ul className="mt-2 space-y-1 text-sm text-slate-700">
                {result.urls.map((url) => (
                  <li key={url} className="break-all rounded bg-slate-50 px-2 py-1">
                    <a
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-brand-700 underline-offset-4 hover:underline"
                    >
                      {url}
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-slate-600">No URLs found.</p>
            )}
          </div>

          <div className="flex items-center justify-between gap-3 rounded-xl bg-brand-50 px-3 py-2">
            <p className="text-sm text-brand-900">Want recent community intel?</p>
            <Link
              href="/reports"
              className="inline-flex items-center justify-center rounded-lg border border-brand-300 px-3 py-1.5 text-sm font-semibold text-brand-800 transition hover:bg-brand-100"
            >
              View public feed
            </Link>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={copyVerdictSummary}
              className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Copy verdict
            </button>
            <button
              type="button"
              onClick={shareVerdictImage}
              className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Share image
            </button>
            <button
              type="button"
              onClick={downloadVerdictImage}
              className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Download image
            </button>
            {session?.user ? (
              <button
                type="button"
                onClick={saveToMyHistory}
                disabled={saveLoading}
                className="inline-flex items-center justify-center rounded-xl border border-brand-400 px-4 py-2 text-sm font-semibold text-brand-700 transition hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saveLoading ? 'Saving…' : 'Save to my history'}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => signIn('google')}
                className="inline-flex items-center justify-center rounded-xl border border-brand-300 px-4 py-2 text-sm font-semibold text-brand-700 transition hover:bg-brand-50"
              >
                Sign in to save
              </button>
            )}
            {canReport ? (
              <button
                type="button"
                onClick={() => {
                  setReportOpen((open) => !open);
                  setReportMessage(null);
                  setReportSubmitted(false);
                }}
                className="inline-flex items-center justify-center rounded-xl border border-brand-400 px-4 py-2 text-sm font-semibold text-brand-700 transition hover:bg-brand-50"
              >
                {reportOpen ? 'Cancel report' : 'Report scam'}
              </button>
            ) : null}
          </div>

          {canReport && reportOpen ? (
            <section className="space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <h3 className="text-base font-semibold text-slate-900">
                Share this report (privacy-first)
              </h3>
              <p className="text-sm text-slate-600">
                We only store sanitized URLs, verdict/score, optional scam type, optional short
                note, and timestamp.
              </p>

              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Detected URLs
                </h4>
                {reportUrls.length > 0 ? (
                  <ul className="mt-2 space-y-1 text-sm text-slate-700">
                    {reportUrls.map((url) => (
                      <li key={`report-${url}`} className="break-all rounded bg-white px-2 py-1">
                        {url}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-sm text-red-600">
                    No URLs found, so this report cannot be submitted.
                  </p>
                )}
              </div>

              <label className="block space-y-1 text-sm">
                <span className="font-medium text-slate-700">Scam type (optional)</span>
                <select
                  value={reportScamType}
                  onChange={(event) => setReportScamType(event.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-sm text-slate-900"
                >
                  <option value="">Select a category</option>
                  {SCAM_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block space-y-1 text-sm">
                <span className="font-medium text-slate-700">Optional note (max 280 chars)</span>
                <textarea
                  rows={3}
                  maxLength={280}
                  value={reportNote}
                  onChange={(event) => setReportNote(event.target.value)}
                  placeholder="Avoid names, phone numbers, account IDs, and one-time codes."
                  className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-sm text-slate-900"
                />
                <span className="text-xs text-amber-700">
                  Warning: Do not include personal data (names, numbers, addresses, IDs, or codes).
                </span>
              </label>

              <label className="flex items-start gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={confirmNoPersonalInfo}
                  onChange={(event) => setConfirmNoPersonalInfo(event.target.checked)}
                  className="mt-0.5"
                />
                <span>I confirm I removed personal info (names, numbers, codes).</span>
              </label>

              <label className="flex items-start gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={confirmConsent}
                  onChange={(event) => setConfirmConsent(event.target.checked)}
                  className="mt-0.5"
                />
                <span>I consent to share these URLs for scam intelligence.</span>
              </label>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={submitReport}
                  disabled={
                    !confirmNoPersonalInfo ||
                    !confirmConsent ||
                    reportUrls.length === 0 ||
                    reportLoading
                  }
                  className="inline-flex items-center justify-center rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {reportLoading ? 'Submitting…' : 'Submit report'}
                </button>
                <button
                  type="button"
                  onClick={() => setReportOpen(false)}
                  className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                >
                  Cancel
                </button>
              </div>
            </section>
          ) : null}

          {shareMessage ? <p className="text-sm text-slate-600">{shareMessage}</p> : null}
          {saveMessage ? <p className="text-sm text-slate-600">{saveMessage}</p> : null}
          {reportMessage ? (
            <div
              className={`rounded-xl border p-3 text-sm ${
                reportSubmitted
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-900'
                  : 'border-slate-200 bg-slate-50 text-slate-700'
              }`}
            >
              <p>{reportMessage}</p>
              {reportSubmitted ? (
                <Link
                  href="/reports"
                  className="mt-2 inline-flex items-center justify-center rounded-lg border border-emerald-400 px-3 py-1.5 font-semibold text-emerald-800 transition hover:bg-emerald-100"
                >
                  View public feed
                </Link>
              ) : null}
            </div>
          ) : null}

          <p className="text-sm text-slate-600">
            Disclaimer: This tool provides a conservative risk assessment, not certainty. Always
            verify through trusted channels before taking action.
          </p>
        </section>
      ) : null}

      <footer className="space-y-3 text-sm text-slate-600">
        <p>
          We are privacy-first by default. Public reporting and private history save only verdict details, reasons, and detected domains — never the full original message. Learn more on our{' '}
          <Link
            href="/privacy"
            className="font-medium text-brand-700 underline-offset-4 hover:underline"
          >
            privacy page
          </Link>
          .
        </p>
      </footer>
    </main>
  );
}
