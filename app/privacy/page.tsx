import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <main className="space-y-6">
      <h1 className="text-3xl font-bold">Privacy-first by default</h1>
      <p className="text-slate-700">
        Scam Shield is designed to minimize data exposure. The MVP performs in-memory analysis only
        and does not persist submitted message content.
      </p>
      <ul className="list-disc space-y-2 pl-6 text-slate-700">
        <li>No account is required.</li>
        <li>No database is configured for message storage.</li>
        <li>No third-party paid detection APIs are used.</li>
        <li>Results are risk assessments and should be treated as guidance.</li>
      </ul>
      <p className="text-slate-700">
        For sensitive situations, contact relevant institutions directly through verified channels.
      </p>
      <Link href="/" className="inline-flex rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white">
        Back to scanner
      </Link>
    </main>
  );
}
