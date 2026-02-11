import { describe, expect, it } from 'vitest';
import { sanitizeUrls, validateReportInput } from '@/lib/reporting';

describe('sanitizeUrls', () => {
  it('keeps only valid http/https URLs and de-duplicates', () => {
    expect(
      sanitizeUrls([
        'https://example.com/path',
        'http://example.org',
        'ftp://malicious.example',
        'javascript:alert(1)',
        'https://example.com/path',
        'not-a-url',
      ])
    ).toEqual(['https://example.com/path', 'http://example.org/']);
  });
});

describe('validateReportInput', () => {
  it('accepts a valid report payload and sanitizes URLs', () => {
    const result = validateReportInput({
      verdict: 'SUSPICIOUS',
      score: 61,
      scamType: 'Delivery',
      note: 'Seen in a fake shipping SMS.',
      urls: ['https://example.com/track', 'javascript:alert(1)'],
    });

    expect(result).toEqual({
      verdict: 'SUSPICIOUS',
      score: 61,
      scamType: 'Delivery',
      note: 'Seen in a fake shipping SMS.',
      urls: ['https://example.com/track'],
    });
  });

  it('rejects note values above 280 characters', () => {
    expect(() =>
      validateReportInput({
        verdict: 'DANGEROUS',
        score: 90,
        note: 'a'.repeat(281),
        urls: ['https://example.com'],
      })
    ).toThrow('Note must be 280 characters or fewer.');
  });

  it('rejects payloads with no valid urls after sanitization', () => {
    expect(() =>
      validateReportInput({
        verdict: 'SUSPICIOUS',
        score: 45,
        urls: ['ftp://bad.example'],
      })
    ).toThrow('At least one valid http/https URL is required.');
  });
});
