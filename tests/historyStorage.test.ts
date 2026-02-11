import { describe, expect, it } from 'vitest';
import { extractHostnames } from '@/lib/historyStorage';

describe('extractHostnames', () => {
  it('returns unique lower-cased hostnames only', () => {
    const hosts = extractHostnames([
      'https://Example.com/login?x=1',
      'http://example.com/other',
      'https://sub.example.com/path',
    ]);

    expect(hosts).toEqual(['example.com', 'sub.example.com']);
  });

  it('ignores invalid and non-http urls', () => {
    const hosts = extractHostnames([
      'not-a-url',
      'mailto:test@example.com',
      'ftp://example.com/file',
      'https://valid.example.org/path',
    ]);

    expect(hosts).toEqual(['valid.example.org']);
  });
});
