const TRACKING_PARAMS = new Set(['fbclid', 'gclid', 'mc_cid', 'mc_eid']);

function stripTrackingParams(searchParams: URLSearchParams): URLSearchParams {
  const filtered = new URLSearchParams();

  for (const [key, value] of searchParams.entries()) {
    if (key.toLowerCase().startsWith('utm_') || TRACKING_PARAMS.has(key.toLowerCase())) {
      continue;
    }

    filtered.append(key, value);
  }

  return filtered;
}

export function canonicalizeUrl(rawUrl: string): string | null {
  if (typeof rawUrl !== 'string') {
    return null;
  }

  const trimmed = rawUrl.trim();

  if (!trimmed) {
    return null;
  }

  try {
    const parsed = new URL(trimmed);

    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return null;
    }

    parsed.hostname = parsed.hostname.toLowerCase();
    parsed.hash = '';
    parsed.search = stripTrackingParams(parsed.searchParams).toString();

    if (parsed.pathname.length > 1 && parsed.pathname.endsWith('/')) {
      parsed.pathname = parsed.pathname.slice(0, -1);
    }

    return parsed.toString();
  } catch {
    return null;
  }
}

export function sanitizeAndCanonicalizeUrls(rawUrls: string[]): string[] {
  const unique: string[] = [];

  for (const rawUrl of rawUrls) {
    const canonical = canonicalizeUrl(rawUrl);

    if (!canonical) {
      continue;
    }

    if (!unique.includes(canonical)) {
      unique.push(canonical);
    }
  }

  return unique;
}
