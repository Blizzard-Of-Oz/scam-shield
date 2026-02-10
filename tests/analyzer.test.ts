import { describe, expect, it } from 'vitest';
import { extractUrls, scoreToVerdict } from '@/lib/analyzer';

describe('extractUrls', () => {
  it('extracts unique URLs from mixed text', () => {
    const text =
      'Check https://example.com and http://test.dev/path?x=1 and https://example.com again';

    expect(extractUrls(text)).toEqual(['https://example.com', 'http://test.dev/path?x=1']);
  });

  it('returns an empty array when no URLs exist', () => {
    expect(extractUrls('no links here')).toEqual([]);
  });
});

describe('scoreToVerdict', () => {
  it('maps scores below 35 to SAFE', () => {
    expect(scoreToVerdict(0)).toBe('SAFE');
    expect(scoreToVerdict(34)).toBe('SAFE');
  });

  it('maps scores between 35 and 69 to SUSPICIOUS', () => {
    expect(scoreToVerdict(35)).toBe('SUSPICIOUS');
    expect(scoreToVerdict(69)).toBe('SUSPICIOUS');
  });

  it('maps scores >= 70 to DANGEROUS', () => {
    expect(scoreToVerdict(70)).toBe('DANGEROUS');
    expect(scoreToVerdict(100)).toBe('DANGEROUS');
  });
});
