import { execFileSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
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

export function applyMigrations() {
  const migrationSql = `
    CREATE TABLE IF NOT EXISTS ScamReport (
      id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      verdict TEXT NOT NULL,
      score INTEGER NOT NULL,
      scamType TEXT,
      note TEXT,
      urls TEXT NOT NULL
    );
  `;

  runSql(migrationSql);
}

export function insertReport(input: ReportInput): number {
  applyMigrations();

  const escapedVerdict = input.verdict.replaceAll("'", "''");
  const escapedScamType = (input.scamType ?? '').replaceAll("'", "''");
  const escapedNote = (input.note ?? '').replaceAll("'", "''");
  const escapedUrls = JSON.stringify(input.urls).replaceAll("'", "''");

  const sql = `
    INSERT INTO ScamReport (verdict, score, scamType, note, urls)
    VALUES (
      '${escapedVerdict}',
      ${Math.round(input.score)},
      ${input.scamType ? `'${escapedScamType}'` : 'NULL'},
      ${input.note ? `'${escapedNote}'` : 'NULL'},
      '${escapedUrls}'
    );
    SELECT last_insert_rowid() AS id;
  `;

  const output = runSql(sql);
  const parsed = JSON.parse(output) as Array<{ id: number }>;

  return parsed[0]?.id ?? 0;
}

export function getRecentReports(limit: number): ScamReportRecord[] {
  applyMigrations();

  const safeLimit = Math.min(Math.max(limit, 1), 100);
  const sql = `
    SELECT id, createdAt, verdict, score, scamType, note, urls
    FROM ScamReport
    ORDER BY datetime(createdAt) DESC
    LIMIT ${safeLimit};
  `;

  const output = runSql(sql);

  if (!output.trim()) {
    return [];
  }

  const rows = JSON.parse(output) as Array<{
    id: number;
    createdAt: string;
    verdict: ScamReportRecord['verdict'];
    score: number;
    scamType: string | null;
    note: string | null;
    urls: string;
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
      verdict: row.verdict,
      score: row.score,
      scamType: row.scamType && SCAM_TYPES.includes(row.scamType as (typeof SCAM_TYPES)[number])
        ? (row.scamType as ScamReportRecord['scamType'])
        : null,
      note: row.note,
      urls: parsedUrls,
    };
  });
}
