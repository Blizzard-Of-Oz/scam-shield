import { describe, expect, it } from 'vitest';
import { buildShareCardText, extractHostnames } from '@/lib/shareCard';

describe('extractHostnames', () => {
  it('returns unique hostnames only', () => {
    const hostnames = extractHostnames([
      'https://example.com/path?x=1',
      'https://EXAMPLE.com/other',
      'http://sub.example.org/login',
      'not-a-url',
    ]);

    expect(hostnames).toEqual(['example.com', 'sub.example.org']);
  });
});

describe('buildShareCardText', () => {
  it('builds text from verdict/score/reasons/hostnames and limits reasons', () => {
    const card = buildShareCardText({
      verdict: 'SUSPICIOUS',
      score: 61,
      reasons: ['A', 'B', 'C', 'D', 'E'],
      urls: ['https://example.com/a'],
    });

    expect(card.verdict).toBe('SUSPICIOUS');
    expect(card.score).toBe(61);
    expect(card.reasons).toEqual(['A', 'B', 'C', 'D']);
    expect(card.hostnames).toEqual(['example.com']);
  });

  it('never includes raw message text from unknown fields', () => {
    const rawMessage = 'SECRET OTP 1234 from pasted message';
    const card = buildShareCardText({
      verdict: 'SAFE',
      score: 12,
      reasons: ['No major indicators detected.'],
      urls: ['https://safe.example'],
      rawMessage,
    } as never);

    const flattened = JSON.stringify(card);
    expect(flattened).not.toContain(rawMessage);
    expect(flattened).not.toContain('OTP 1234');
  });
});
