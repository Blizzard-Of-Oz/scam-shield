import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { applyMigrations } from '@/lib/db';

const tempDirs: string[] = [];

afterEach(() => {
  while (tempDirs.length > 0) {
    const dir = tempDirs.pop();
    if (dir) {
      rmSync(dir, { recursive: true, force: true });
    }
  }
});

describe('applyMigrations', () => {
  it('adds missing columns and backfills updatedAt on existing legacy tables', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'scam-shield-db-test-'));
    tempDirs.push(dir);

    const dbPath = path.join(dir, 'legacy.db');
    const previousUrl = process.env.DATABASE_URL;

    process.env.DATABASE_URL = `file:${dbPath}`;

    try {
      execFileSync('sqlite3', [
        dbPath,
        `
        CREATE TABLE ScamReport (
          id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
          createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          verdict TEXT NOT NULL,
          score INTEGER NOT NULL,
          scamType TEXT,
          note TEXT,
          urls TEXT NOT NULL
        );

        INSERT INTO ScamReport (verdict, score, scamType, note, urls)
        VALUES ('SUSPICIOUS', 70, 'Other', 'legacy row', '["https://example.com"]');
      `,
      ]);

      expect(() => applyMigrations()).not.toThrow();

      const columnsJson = execFileSync('sqlite3', ['-json', dbPath, 'PRAGMA table_info(ScamReport);'], {
        encoding: 'utf-8',
      });

      const columnNames = (JSON.parse(columnsJson) as Array<{ name: string }>).map((column) => column.name);

      expect(columnNames).toContain('urlHash');
      expect(columnNames).toContain('count');
      expect(columnNames).toContain('updatedAt');

      const legacyRowsJson = execFileSync(
        'sqlite3',
        ['-json', dbPath, 'SELECT createdAt, updatedAt FROM ScamReport LIMIT 1;'],
        { encoding: 'utf-8' }
      );
      const legacyRow = (JSON.parse(legacyRowsJson) as Array<{ createdAt: string; updatedAt: string | null }>)[0];

      expect(legacyRow.updatedAt).toBeTruthy();
      expect(legacyRow.updatedAt).toBe(legacyRow.createdAt);
    } finally {
      process.env.DATABASE_URL = previousUrl;
    }
  });
});
