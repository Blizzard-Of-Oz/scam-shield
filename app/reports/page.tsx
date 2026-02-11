import Link from 'next/link';
import { VerdictBadge } from '@/components/VerdictBadge';
import { getRecentReports } from '@/lib/db';
import { relativeTimeFromNow } from '@/lib/reporting';

export const dynamic = 'force-dynamic';

export default function ReportsPage() {
  const reports = getRecentReports(20);

  return (
    <main className="space-y-6">
      <header className="space-y-2">
        <p className="text-sm font-medium uppercase tracking-wide text-brand-700">Scam Shield</p>
        <h1 className="text-3xl font-bold text-slate-900">Public scam reports</h1>
        <p className="text-slate-600">Recent community-shared scam indicators for awareness.</p>
      </header>

      <p className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
        Do not use this to target people. This is for awareness.
      </p>

      <section className="space-y-4">
        {reports.length === 0 ? (
          <p className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">No reports yet.</p>
        ) : (
          reports.map((report) => (
            <article key={report.id} className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-center gap-2">
                <VerdictBadge verdict={report.verdict} />
                <p className="text-sm font-medium text-slate-700">Score: {report.score}/100</p>
                <p className="text-sm text-slate-500">{relativeTimeFromNow(report.createdAt)}</p>
              </div>

              <p className="text-sm text-slate-700">
                Scam type: <span className="font-medium">{report.scamType ?? 'Unspecified'}</span>
              </p>

              {report.note ? <p className="text-sm text-slate-700">Note: {report.note}</p> : null}

              <div>
                <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">URLs</h2>
                <ul className="mt-2 space-y-1 text-sm text-slate-700">
                  {report.urls.map((url) => (
                    <li key={`${report.id}-${url}`} className="break-all rounded bg-slate-50 px-2 py-1">
                      <a href={url} target="_blank" rel="noreferrer" className="text-brand-700 hover:underline">
                        {url}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          ))
        )}
      </section>

      <footer>
        <Link href="/" className="text-sm font-medium text-brand-700 underline-offset-4 hover:underline">
          Back to analyzer
        </Link>
      </footer>
    </main>
  );
}
