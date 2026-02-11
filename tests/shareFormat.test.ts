import { describe, expect, it } from 'vitest';
import { formatVerdictSummary } from '@/lib/shareFormat';

describe('formatVerdictSummary', () => {
  it('formats verdict, score, reasons and tip into shareable text', () => {
    const output = formatVerdictSummary({
      verdict: 'DANGEROUS',
      score: 82,
      reasons: ['Pressure language can indicate social engineering.', 'Contains one or more links.'],
      urls: ['https://example.com'],
    });

    expect(output).toBe(
      [
        'Scam Shield verdict: DANGEROUS (score 82/100)',
        'Reasons: Pressure language can indicate social engineering.; Contains one or more links.',
        'Tip: Verify via official channels.',
      ].join('\n')
    );
  });

  it('uses default reason fallback when no reasons are provided', () => {
    const output = formatVerdictSummary({
      verdict: 'SAFE',
      score: 10,
      reasons: [],
      urls: [],
    });

    expect(output).toContain('Reasons: No specific indicators found.');
  });
});
