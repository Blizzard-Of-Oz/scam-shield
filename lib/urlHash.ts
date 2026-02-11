import { createHash } from 'node:crypto';

export function hashUrls(urls: string[]): string {
  const stableList = [...urls].map((url) => url.trim()).filter(Boolean).sort();

  return createHash('sha256').update(JSON.stringify(stableList)).digest('hex');
}
