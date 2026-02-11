import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { SESSION_COOKIE } from '@/lib/nextAuthShim/shared';

export async function POST() {
  cookies().delete(SESSION_COOKIE);
  return NextResponse.json({ ok: true }, { status: 200 });
}
