import { execFileSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { hashUrls } from '@/lib/urlHash';
import { SCAM_TYPES, type ReportInput, type ScamReportRecord } from '@/lib/reporting';

function resolveDbPath(): string {
  const raw = process.env.DATABASE_URL ?? 'file:./prisma/dev.db';

  if (!raw.startsWith('file:')) {
    throw new Error('Only sqlite file DATABASE_URL values are supported.');
  }

  const filePath = raw.slice('file:'.length);

  if (path.isAbsolute(filePath)) {
    return filePath;
  }

  return path.resolve(process.cwd(), filePath);
}

function runSql(sql: string): string {
  const dbPath = resolveDbPath();
  mkdirSync(path.dirname(dbPath), { recursive: true });

  return execFileSync('sqlite3', ['-json', dbPath, sql], {
    encoding: 'utf-8',
  });
}

function ensureColumn(table: string, column: string, definition: string) {
  const output = runSql(`PRAGMA table_info(${table});`);
  const columns = output.trim() ? (JSON.parse(output) as Array<{ name: string }>) : [];

  if (!columns.some((entry) => entry.name === column)) {
    runSql(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition};`);
  }
}

export function applyMigrations() {
  const createTableSql = `
    CREATE TABLE IF NOT EXISTS ScamReport (
      id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      verdict TEXT NOT NULL,
      score INTEGER NOT NULL,
      scamType TEXT,
      note TEXT,
      urls TEXT NOT NULL,
      urlHash TEXT,
      count INTEGER NOT NULL DEFAULT 1,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `;

  runSql(createTableSql);
  ensureColumn('ScamReport', 'urlHash', 'TEXT');
  ensureColumn('ScamReport', 'count', 'INTEGER NOT NULL DEFAULT 1');
  ensureColumn('ScamReport', 'updatedAt', 'DATETIME');

  runSql(`CREATE INDEX IF NOT EXISTS ScamReport_urlHash_idx ON ScamReport(urlHash);`);
  runSql(`CREATE INDEX IF NOT EXISTS ScamReport_updatedAt_idx ON ScamReport(updatedAt);`);

  runSql(`UPDATE ScamReport SET urlHash = '' WHERE urlHash IS NULL;`);
  runSql(`UPDATE ScamReport SET updatedAt = createdAt WHERE updatedAt IS NULL;`);
  runSql(`UPDATE ScamReport SET count = 1 WHERE count IS NULL OR count < 1;`);
}

export function insertOrMergeReport(input: ReportInput): { id: number; merged: boolean } {
  applyMigrations();

  const escapedVerdict = input.verdict.replaceAll("'", "''");
  const escapedScamType = (input.scamType ?? '').replaceAll("'", "''");
  const escapedNote = (input.note ?? '').replaceAll("'", "''");
  const escapedUrls = JSON.stringify(input.urls).replaceAll("'", "''");
  const escapedHash = hashUrls(input.urls).replaceAll("'", "''");

  const existingSql = `
    SELECT id, scamType, note
    FROM ScamReport
    WHERE urlHash = '${escapedHash}'
      AND datetime(updatedAt) >= datetime('now', '-24 hours')
    ORDER BY datetime(updatedAt) DESC
    LIMIT 1;
  `;

  const existingOutput = runSql(existingSql);
  const existingRows = existingOutput.trim()
    ? (JSON.parse(existingOutput) as Array<{ id: number; scamType: string | null; note: string | null }>)
    : [];

  const existing = existingRows[0];

  if (existing) {
    const nextScamType = existing.scamType ?? input.scamType ?? null;
    const nextNote = existing.note && existing.note.trim().length > 0 ? existing.note : (input.note ?? null);

    const updateSql = `
      UPDATE ScamReport
      SET
        count = count + 1,
        updatedAt = CURRENT_TIMESTAMP,
        scamType = ${nextScamType ? `'${nextScamType.replaceAll("'", "''")}'` : 'NULL'},
        note = ${nextNote ? `'${nextNote.replaceAll("'", "''")}'` : 'NULL'}
      WHERE id = ${existing.id};
    `;

    runSql(updateSql);
    return { id: existing.id, merged: true };
  }

  const insertSql = `
    INSERT INTO ScamReport (verdict, score, scamType, note, urls, urlHash, count, updatedAt)
    VALUES (
      '${escapedVerdict}',
      ${Math.round(input.score)},
      ${input.scamType ? `'${escapedScamType}'` : 'NULL'},
      ${input.note ? `'${escapedNote}'` : 'NULL'},
      '${escapedUrls}',
      '${escapedHash}',
      1,
      CURRENT_TIMESTAMP
    );
    SELECT last_insert_rowid() AS id;
  `;

  const output = runSql(insertSql);
  const parsed = JSON.parse(output) as Array<{ id: number }>;

  return { id: parsed[0]?.id ?? 0, merged: false };
}

export function getRecentReports(limit: number): ScamReportRecord[] {
  applyMigrations();

  const safeLimit = Math.min(Math.max(limit, 1), 100);
  const sql = `
    SELECT id, createdAt, updatedAt, verdict, score, scamType, note, urls, count
    FROM ScamReport
    ORDER BY datetime(updatedAt) DESC
    LIMIT ${safeLimit};
  `;

  const output = runSql(sql);

  if (!output.trim()) {
    return [];
  }

  const rows = JSON.parse(output) as Array<{
    id: number;
    createdAt: string;
    updatedAt: string;
    verdict: ScamReportRecord['verdict'];
    score: number;
    scamType: string | null;
    note: string | null;
    urls: string;
    count: number;
  }>;

  return rows.map((row) => {
    let parsedUrls: string[] = [];

    try {
      const candidate = JSON.parse(row.urls) as unknown;
      if (Array.isArray(candidate) && candidate.every((item) => typeof item === 'string')) {
        parsedUrls = candidate;
      }
    } catch {
      parsedUrls = [];
    }

    return {
      id: row.id,
      createdAt: new Date(row.createdAt).toISOString(),
      updatedAt: new Date(row.updatedAt).toISOString(),
      verdict: row.verdict,
      score: row.score,
      scamType: row.scamType && SCAM_TYPES.includes(row.scamType as (typeof SCAM_TYPES)[number])
        ? (row.scamType as ScamReportRecord['scamType'])
        : null,
      note: row.note,
      urls: parsedUrls,
      count: Number.isFinite(row.count) ? row.count : 1,
    };
  });
}
