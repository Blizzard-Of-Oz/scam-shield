import { execFileSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { hashUrls } from '../lib/urlHash.ts';
import { sanitizeAndCanonicalizeUrls } from '../lib/urlCanonicalize.ts';

type Row = {
  id: number;
  createdAt: string;
  updatedAt: string | null;
  verdict: string;
  score: number;
  scamType: string | null;
  note: string | null;
  urls: string;
  urlHash: string | null;
  count: number | null;
};

function resolveDbPath(): string {
  const raw = process.env.DATABASE_URL ?? 'file:./prisma/dev.db';
  if (!raw.startsWith('file:')) {
    throw new Error('Only sqlite file DATABASE_URL values are supported.');
  }

  const filePath = raw.slice('file:'.length);
  return path.isAbsolute(filePath) ? filePath : path.resolve(process.cwd(), filePath);
}

function runSql(sql: string): string {
  const dbPath = resolveDbPath();
  mkdirSync(path.dirname(dbPath), { recursive: true });

  return execFileSync('sqlite3', ['-json', dbPath, sql], {
    encoding: 'utf-8',
  });
}

function escapeSql(value: string): string {
  return value.replaceAll("'", "''");
}

function tableExists(tableName: string): boolean {
  const output = runSql(`
    SELECT name
    FROM sqlite_master
    WHERE type = 'table' AND name = '${escapeSql(tableName)}'
    LIMIT 1;
  `);

  const rows = output.trim() ? (JSON.parse(output) as Array<{ name: string }>) : [];
  return rows.length > 0;
}

function parseUrls(rawUrls: string): string[] {
  try {
    const parsed = JSON.parse(rawUrls) as unknown;
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [];
  } catch {
    return [];
  }
}

function getCanonicalHash(rawUrls: string): { urls: string[]; urlHash: string } | null {
  const urls = sanitizeAndCanonicalizeUrls(parseUrls(rawUrls));
  if (urls.length === 0) {
    return null;
  }

  return {
    urls,
    urlHash: hashUrls(urls),
  };
}

function main() {
  if (!tableExists('ScamReport')) {
    console.log('ScamReport table not found. Nothing to merge.');
    return;
  }

  const output = runSql(`
    SELECT id, createdAt, updatedAt, verdict, score, scamType, note, urls, urlHash, count
    FROM ScamReport
    ORDER BY datetime(updatedAt) DESC, id DESC;
  `);

  const rows = output.trim() ? (JSON.parse(output) as Row[]) : [];
  const groups = new Map<string, Row[]>();
  const skipped: number[] = [];

  for (const row of rows) {
    const canonical = getCanonicalHash(row.urls);
    if (!canonical) {
      skipped.push(row.id);
      continue;
    }

    const bucket = groups.get(canonical.urlHash) ?? [];
    bucket.push({ ...row, urls: JSON.stringify(canonical.urls), urlHash: canonical.urlHash });
    groups.set(canonical.urlHash, bucket);
  }

  let mergedRows = 0;
  let deletedRows = 0;

  runSql('BEGIN TRANSACTION;');

  try {
    for (const [urlHash, group] of groups.entries()) {
      const ordered = [...group].sort((a, b) => {
        const aTime = new Date(a.updatedAt ?? a.createdAt).getTime();
        const bTime = new Date(b.updatedAt ?? b.createdAt).getTime();

        if (aTime !== bTime) {
          return bTime - aTime;
        }

        return b.id - a.id;
      });

      const main = ordered[0];
      const duplicates = ordered.slice(1);
      const totalCount = ordered.reduce((sum, row) => sum + Math.max(1, row.count ?? 1), 0);

      const preferredScamType = main.scamType?.trim()
        ? main.scamType
        : ordered.find((row) => row.scamType && row.scamType.trim())?.scamType ?? null;

      const preferredNote = main.note?.trim()
        ? main.note
        : ordered.find((row) => row.note && row.note.trim())?.note ?? null;

      const newestUpdatedAt = new Date(
        Math.max(...ordered.map((row) => new Date(row.updatedAt ?? row.createdAt).getTime()))
      ).toISOString();

      runSql(`
        UPDATE ScamReport
        SET
          urls = '${escapeSql(main.urls)}',
          urlHash = '${escapeSql(urlHash)}',
          count = ${totalCount},
          scamType = ${preferredScamType ? `'${escapeSql(preferredScamType)}'` : 'NULL'},
          note = ${preferredNote ? `'${escapeSql(preferredNote)}'` : 'NULL'},
          updatedAt = '${escapeSql(newestUpdatedAt)}'
        WHERE id = ${main.id};
      `);

      if (duplicates.length > 0) {
        runSql(`DELETE FROM ScamReport WHERE id IN (${duplicates.map((row) => row.id).join(', ')});`);
        deletedRows += duplicates.length;
        mergedRows += 1;
      }
    }

    runSql('COMMIT;');
  } catch (error) {
    runSql('ROLLBACK;');
    throw error;
  }

  const summary = [
    `Processed rows: ${rows.length}`,
    `Merged groups: ${mergedRows}`,
    `Deleted duplicates: ${deletedRows}`,
    `Skipped rows with no canonical URL: ${skipped.length}`,
  ].join('\n');

  console.log(summary);
}

main();
