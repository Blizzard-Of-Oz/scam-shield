export const SESSION_COOKIE = 'scam_shield_user';

export type SessionUser = {
  id: string;
  email: string;
  name?: string | null;
  image?: string | null;
};

export type Session = {
  user: SessionUser;
};

export function decodeSessionValue(rawValue: string | undefined): Session | null {
  if (!rawValue) {
    return null;
  }

  try {
    const decoded = Buffer.from(rawValue, 'base64url').toString('utf8');
    const parsed = JSON.parse(decoded) as Session;

    if (!parsed.user?.id || !parsed.user?.email) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export function encodeSessionValue(session: Session): string {
  return Buffer.from(JSON.stringify(session)).toString('base64url');
}
