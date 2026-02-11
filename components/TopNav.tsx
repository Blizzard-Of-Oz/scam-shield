'use client';

import Link from 'next/link';
import { signIn, signOut, useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';

const LINKS = [
  { href: '/', label: 'Analyzer' },
  { href: '/reports', label: 'Public feed' },
  { href: '/me/history', label: 'My History' },
  { href: '/privacy', label: 'Privacy' },
];

export function TopNav() {
  const pathname = usePathname();
  const { data: session, status } = useSession();

  return (
    <header className="mb-8 border-b border-slate-200 pb-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/" className="text-base font-semibold text-slate-900">
          Scam Shield
        </Link>
        <nav aria-label="Primary" className="flex flex-wrap items-center gap-2">
          {LINKS.map((link) => {
            const isActive = pathname === link.href;

            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={isActive ? 'page' : undefined}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                  isActive
                    ? 'bg-brand-100 text-brand-800'
                    : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                {link.label}
              </Link>
            );
          })}

          {status === 'loading' ? (
            <span className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-500">
              Loading…
            </span>
          ) : session?.user ? (
            <button
              type="button"
              onClick={() => signOut()}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
            >
              Sign out
            </button>
          ) : (
            <button
              type="button"
              onClick={() => signIn('google')}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
            >
              Sign in
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}
