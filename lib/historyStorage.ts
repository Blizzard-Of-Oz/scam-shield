import type { Verdict } from '@/lib/analyzer';

const VERDICTS: Verdict[] = ['SAFE', 'SUSPICIOUS', 'DANGEROUS'];

export type SaveCheckInput = {
  verdict: Verdict;
  score: number;
  reasons: string[];
  urls: string[];
};

export function extractHostnames(urls: string[]): string[] {
  const hosts = new Set<string>();

  for (const rawUrl of urls) {
    if (typeof rawUrl !== 'string' || rawUrl.length === 0) {
      continue;
    }

    try {
      const parsed = new URL(rawUrl);

      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        continue;
      }

      if (parsed.hostname.length > 0) {
        hosts.add(parsed.hostname.toLowerCase());
      }
    } catch {
      continue;
    }
  }

  return Array.from(hosts);
}

export function validateSaveCheckInput(payload: unknown): SaveCheckInput {
  if (typeof payload !== 'object' || payload === null) {
    throw new Error('Body must be a JSON object.');
  }

  const { verdict, score, reasons, urls } = payload as {
    verdict?: unknown;
    score?: unknown;
    reasons?: unknown;
    urls?: unknown;
  };

  if (typeof verdict !== 'string' || !VERDICTS.includes(verdict as Verdict)) {
    throw new Error('Invalid verdict.');
  }

  if (typeof score !== 'number' || Number.isNaN(score) || score < 0 || score > 100) {
    throw new Error('Invalid score.');
  }

  if (!Array.isArray(reasons) || reasons.some((reason) => typeof reason !== 'string')) {
    throw new Error('reasons must be an array of strings.');
  }

  if (!Array.isArray(urls) || urls.some((url) => typeof url !== 'string')) {
    throw new Error('urls must be an array of strings.');
  }

  return {
    verdict: verdict as Verdict,
    score,
    reasons,
    urls,
  };
}
