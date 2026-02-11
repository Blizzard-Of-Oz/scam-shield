import { describe, expect, it } from 'vitest';
import { canonicalizeUrl } from '@/lib/urlCanonicalize';

describe('canonicalizeUrl', () => {
  it('lower-cases host, removes fragment, and strips trailing slash', () => {
    expect(canonicalizeUrl('  https://ExAmPle.COM/path/#top  ')).toBe('https://example.com/path');
  });

  it('keeps query params while dropping easy trackers', () => {
    expect(canonicalizeUrl('https://example.com/?utm_source=x&ref=abc#frag')).toBe('https://example.com/?ref=abc');
  });
});
