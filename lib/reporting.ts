import type { Verdict } from '@/lib/analyzer';
import { sanitizeAndCanonicalizeUrls } from '@/lib/urlCanonicalize';

export const SCAM_TYPES = [
  'Bank impersonation',
  'Delivery',
  'OTP/code request',
  'Job scam',
  'Crypto scam',
  'Other',
] as const;

export type ScamType = (typeof SCAM_TYPES)[number];

export type ReportInput = {
  verdict: Verdict;
  score: number;
  scamType?: ScamType;
  note?: string;
  urls: string[];
};

export type ScamReportRecord = {
  id: number;
  createdAt: string;
  updatedAt: string;
  verdict: Verdict;
  score: number;
  scamType: ScamType | null;
  note: string | null;
  urls: string[];
  count: number;
};

const VERDICTS: Verdict[] = ['SAFE', 'SUSPICIOUS', 'DANGEROUS'];

export function sanitizeUrls(urls: string[]): string[] {
  return sanitizeAndCanonicalizeUrls(urls);
}

export function validateReportInput(payload: unknown): ReportInput {
  if (typeof payload !== 'object' || payload === null) {
    throw new Error('Body must be a JSON object.');
  }

  const { verdict, score, scamType, note, urls } = payload as {
    verdict?: unknown;
    score?: unknown;
    scamType?: unknown;
    note?: unknown;
    urls?: unknown;
  };

  if (typeof verdict !== 'string' || !VERDICTS.includes(verdict as Verdict)) {
    throw new Error('Invalid verdict.');
  }

  if (typeof score !== 'number' || Number.isNaN(score) || score < 0 || score > 100) {
    throw new Error('Invalid score.');
  }

  if (scamType !== undefined && scamType !== null) {
    if (typeof scamType !== 'string' || !SCAM_TYPES.includes(scamType as ScamType)) {
      throw new Error('Invalid scamType.');
    }
  }

  if (note !== undefined && note !== null) {
    if (typeof note !== 'string') {
      throw new Error('Invalid note.');
    }

    if (note.length > 280) {
      throw new Error('Note must be 280 characters or fewer.');
    }
  }

  if (!Array.isArray(urls)) {
    throw new Error('urls must be an array of strings.');
  }

  if (urls.length > 5) {
    throw new Error('At most 5 URLs are allowed per report.');
  }

  for (const url of urls) {
    if (typeof url === 'string' && url.length > 2048) {
      throw new Error('Each URL must be 2048 characters or fewer.');
    }
  }

  const sanitizedUrls = sanitizeUrls(urls);

  if (sanitizedUrls.length === 0) {
    throw new Error('At least one valid http/https URL is required.');
  }

  return {
    verdict: verdict as Verdict,
    score,
    scamType: (scamType as ScamType | undefined) ?? undefined,
    note: typeof note === 'string' ? note.trim() : undefined,
    urls: sanitizedUrls,
  };
}

export function relativeTimeFromNow(dateIso: string): string {
  const date = new Date(dateIso);
  const diffMs = date.getTime() - Date.now();
  const absMs = Math.abs(diffMs);

  const divisions: Array<{ amount: number; unit: Intl.RelativeTimeFormatUnit }> = [
    { amount: 1000 * 60 * 60 * 24 * 365, unit: 'year' },
    { amount: 1000 * 60 * 60 * 24 * 30, unit: 'month' },
    { amount: 1000 * 60 * 60 * 24, unit: 'day' },
    { amount: 1000 * 60 * 60, unit: 'hour' },
    { amount: 1000 * 60, unit: 'minute' },
  ];

  const formatter = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

  for (const division of divisions) {
    if (absMs >= division.amount) {
      const value = Math.round(diffMs / division.amount);
      return formatter.format(value, division.unit);
    }
  }

  return 'just now';
}
