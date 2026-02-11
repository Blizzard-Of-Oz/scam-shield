import { describe, expect, it } from 'vitest';
import { hashUrls } from '@/lib/urlHash';

describe('hashUrls', () => {
  it('returns stable hash regardless of URL order', () => {
    const first = hashUrls(['https://b.example', 'https://a.example/path']);
    const second = hashUrls(['https://a.example/path', 'https://b.example']);

    expect(first).toBe(second);
  });
});
