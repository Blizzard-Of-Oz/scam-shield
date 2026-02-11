import { readdirSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';

const rawUrl = process.env.DATABASE_URL ?? 'file:./prisma/dev.db';
if (!rawUrl.startsWith('file:')) {
  throw new Error('DATABASE_URL must use file: for sqlite');
}

const dbPath = path.resolve(process.cwd(), rawUrl.slice('file:'.length));
const migrationsDir = path.resolve(process.cwd(), 'prisma/migrations');
const migrationFolders = readdirSync(migrationsDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort((a, b) => a.localeCompare(b));

for (const folder of migrationFolders) {
  const sqlPath = path.join(migrationsDir, folder, 'migration.sql');
  const sql = readFileSync(sqlPath, 'utf8');
  execFileSync('sqlite3', [dbPath, sql]);
}

console.log(`Applied ${migrationFolders.length} migrations to ${dbPath}`);
