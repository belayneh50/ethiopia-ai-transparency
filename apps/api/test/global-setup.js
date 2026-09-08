// Jest global setup (runs once, before all suites, in its own process):
// 1. creates the dedicated test database,
// 2. pushes packages/database/schema.prisma into it,
// 3. seeds the shared demo users (single source: packages/shared-types).
'use strict';
const { execFileSync } = require('child_process');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const { DB_PKG, TEST_DB_NAME, maintenanceUrl, testUrl } = require('./db-helper');

const prismaBin = require.resolve('prisma/build/index.js', { paths: [DB_PKG] });

async function createTestDatabase() {
  process.env.DATABASE_URL = maintenanceUrl();
  const client = new PrismaClient();
  try {
    await client.$executeRawUnsafe(`CREATE DATABASE "${TEST_DB_NAME}"`);
  } catch (err) {
    const message = String((err && err.message) || err);
    // 42P04: duplicate database — a leftover from an interrupted run is fine.
    if (!/already exists/i.test(message)) throw err;
  } finally {
    await client.$disconnect();
  }
}

function runPrisma(args) {
  // `prisma db seed` spawns `tsx` from PATH, so expose the database package's
  // .bin (pnpm keeps it there) regardless of how jest launched this process.
  const binDir = path.join(DB_PKG, 'node_modules', '.bin');
  const env = {
    ...process.env,
    DATABASE_URL: testUrl(),
    PATH: `${binDir}${path.delimiter}${process.env.PATH || ''}`,
  };
  try {
    execFileSync(process.execPath, [prismaBin, ...args], { cwd: DB_PKG, env, stdio: 'pipe' });
  } catch (err) {
    if (err && err.stdout) console.error(String(err.stdout));
    if (err && err.stderr) console.error(String(err.stderr));
    throw err;
  }
}

module.exports = async () => {
  await createTestDatabase();
  runPrisma(['db', 'push', '--schema', 'schema.prisma', '--skip-generate']);
  // Populate only the dedicated test database without tsx's OS-user lookup,
  // which is unavailable in some Windows sandboxes. Never seed the dev DB.
  const url = testUrl();
  if (new URL(url).pathname !== `/${TEST_DB_NAME}`) throw new Error('Unexpected test database');
  const client = new PrismaClient({ datasources: { db: { url } } });
  const bcrypt = require('bcrypt');
  const { DEMO_ACCOUNTS } = require('../../../packages/shared-types/dist/index.js');
  try {
    for (const account of DEMO_ACCOUNTS) {
      const data = { email: account.username, name: account.name, role: account.role, isActive: true, passwordHash: await bcrypt.hash(account.password, 10) };
      await client.user.upsert({ where: { email: account.username }, create: data, update: data });
    }
  } finally { await client.$disconnect(); }
};
