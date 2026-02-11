import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { decodeSessionValue, SESSION_COOKIE } from '@/lib/nextAuthShim/shared';

export async function GET() {
  const cookieStore = cookies();
  const session = decodeSessionValue(cookieStore.get(SESSION_COOKIE)?.value);
  return NextResponse.json({ session }, { status: 200 });
}
