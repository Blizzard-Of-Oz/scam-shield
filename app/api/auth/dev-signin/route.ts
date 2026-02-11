import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { upsertUserByEmail } from '@/lib/db';
import { encodeSessionValue, SESSION_COOKIE } from '@/lib/nextAuthShim/shared';

export async function GET() {
  const defaultEmail = process.env.DEV_AUTH_EMAIL ?? 'dev-user@example.com';
  const defaultName = process.env.DEV_AUTH_NAME ?? 'Dev User';

  const user = upsertUserByEmail({ email: defaultEmail, name: defaultName });
  const sessionValue = encodeSessionValue({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      image: user.image,
    },
  });

  cookies().set(SESSION_COOKIE, sessionValue, {
    httpOnly: true,
    sameSite: 'lax',
    secure: false,
    path: '/',
  });

  return NextResponse.redirect(new URL('/', process.env.NEXTAUTH_URL ?? 'http://localhost:3000'));
}
