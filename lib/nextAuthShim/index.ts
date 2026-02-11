import { cookies } from 'next/headers';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { decodeSessionValue, SESSION_COOKIE, type Session } from '@/lib/nextAuthShim/shared';

export type NextAuthOptions = {
  providers?: unknown[];
  callbacks?: {
    signIn?: (params: { user: { email?: string | null; name?: string | null; image?: string | null } }) => Promise<boolean> | boolean;
    jwt?: (params: { token: { sub?: string }; user?: { email?: string | null; name?: string | null; image?: string | null } }) => Promise<{ sub?: string }> | { sub?: string };
    session?: (params: { session: Session; token: { sub?: string } }) => Promise<Session> | Session;
  };
  session?: { strategy?: string };
};

export default function NextAuth(options: NextAuthOptions) {
  void options;
  return async function handler(request: NextRequest) {
    void request;
    return NextResponse.json({ ok: true, shim: true }, { status: 200 });
  };
}

export async function getServerSession(options: NextAuthOptions): Promise<Session | null> {
  void options;
  const cookieStore = cookies();
  return decodeSessionValue(cookieStore.get(SESSION_COOKIE)?.value);
}
