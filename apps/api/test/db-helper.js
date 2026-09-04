// Test-only helpers. The API e2e suite runs against a dedicated, throwaway
// database (…_test) so the normal dev database is never touched. The test URL
// is derived from the same local env files `corepack pnpm setup` creates.
'use strict';
const fs = require('fs');
const path = require('path');

const API_ROOT = path.resolve(__dirname, '..'); // apps/api
const DB_PKG = path.resolve(API_ROOT, '../..', 'packages', 'database');
const TEST_DB_NAME = 'ethiopia_ai_transparency_test';

function readBaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  for (const dir of [API_ROOT, DB_PKG]) {
    const file = path.join(dir, '.env');
    if (fs.existsSync(file)) {
      const line = fs
        .readFileSync(file, 'utf8')
        .split(/\r?\n/)
        .find((l) => /^DATABASE_URL=/.test(l));
      if (line) return line.slice('DATABASE_URL='.length).trim();
    }
  }
  throw new Error(
    'DATABASE_URL not found. Run `corepack pnpm setup` once to start Postgres and create the local env files.',
  );
}

function withDatabase(url, db) {
  const parsed = new URL(url);
  parsed.pathname = '/' + db;
  return parsed.toString();
}

module.exports = {
  API_ROOT,
  DB_PKG,
  TEST_DB_NAME,
  testUrl: () => withDatabase(readBaseUrl(), TEST_DB_NAME),
  maintenanceUrl: () => withDatabase(readBaseUrl(), 'postgres'),
};
