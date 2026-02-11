'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { Session } from '@/lib/nextAuthShim/shared';

type SessionStatus = 'loading' | 'authenticated' | 'unauthenticated';

const SessionContext = createContext<{ data: Session | null; status: SessionStatus }>({
  data: null,
  status: 'loading',
});

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<Session | null>(null);
  const [status, setStatus] = useState<SessionStatus>('loading');

  useEffect(() => {
    async function loadSession() {
      try {
        const response = await fetch('/api/auth/session');
        const payload = (await response.json()) as { session: Session | null };
        setData(payload.session);
        setStatus(payload.session ? 'authenticated' : 'unauthenticated');
      } catch {
        setData(null);
        setStatus('unauthenticated');
      }
    }

    void loadSession();
  }, []);

  const value = useMemo(() => ({ data, status }), [data, status]);
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  return useContext(SessionContext);
}

export async function signIn(provider?: string) {
  void provider;
  window.location.href = '/api/auth/dev-signin';
}

export async function signOut() {
  await fetch('/api/auth/dev-signout', { method: 'POST' });
  window.location.href = '/';
}
