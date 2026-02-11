import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';

const rawUrl = process.env.DATABASE_URL ?? 'file:./prisma/dev.db';
if (!rawUrl.startsWith('file:')) {
  throw new Error('DATABASE_URL must use file: for sqlite');
}

const dbPath = path.resolve(process.cwd(), rawUrl.slice('file:'.length));
const sql = readFileSync('prisma/migrations/20260211000000_init/migration.sql', 'utf8');
execFileSync('sqlite3', [dbPath, sql]);
console.log(`Applied migration to ${dbPath}`);
