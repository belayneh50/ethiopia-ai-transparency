// Explicit, one-time demo setup; never part of the normal build or startup.
const path = require('node:path');
const { spawnSync } = require('node:child_process');

async function main() {
  const project = 'dpcadcyewpxcxyhqzlqd';
  if (process.env.DEMO_SUPABASE_PROJECT_REF !== project) {
    throw new Error('Demo initialization requires the expected project confirmation.');
  }
  const url = new URL(process.env.DATABASE_URL || '');
  const expectedHost = url.hostname === `db.${project}.supabase.co`;
  const expectedPool = url.hostname.endsWith('.pooler.supabase.com')
    && decodeURIComponent(url.username) === `postgres.${project}`;
  if (!['postgres:', 'postgresql:'].includes(url.protocol)
    || (!expectedHost && !expectedPool) || url.pathname !== '/postgres') {
    throw new Error('Refusing initialization outside the designated Supabase demo.');
  }
  // DDL uses session pooling; the application's transaction-pool URL is unchanged.
  url.port = '5432';
  url.searchParams.delete('pgbouncer');
  url.searchParams.set('schema', 'public');
  url.searchParams.set('connection_limit', '1');
  url.searchParams.set('sslmode', 'require');
  const root = path.resolve(__dirname, '..');
  const api = path.join(root, 'apps', 'api');
  const database = path.join(root, 'packages', 'database');
  const { PrismaClient } = require(require.resolve('@prisma/client', { paths: [api] }));
  const prisma = new PrismaClient({ datasources: { db: { url: url.toString() } } });
  const tables = ['records', 'comparable_listings', 'gemini_guidances',
    'audit_logs', 'users', 'threshold_settings'];
  const env = { ...process.env, DATABASE_URL: url.toString(), CI: '1' };
  const run = (args, cwd) => {
    const result = spawnSync(process.execPath, args, { cwd, env, stdio: 'inherit' });
    if (result.error || result.status !== 0) throw new Error('Demo setup command failed.');
  };
  try {
    const existing = await prisma.$queryRaw`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'`;
    if (existing.some(({ table_name }) => !tables.includes(table_name))) {
      throw new Error('Unexpected existing tables; refusing to modify this database.');
    }
    if (existing.length !== tables.length) {
      await prisma.$disconnect();
      run([require.resolve('prisma/build/index.js', { paths: [api] }),
        'db', 'push', '--schema', path.join(database, 'schema.prisma'),
        '--skip-generate'], database);
      await prisma.$connect();
    }
    for (const table of tables) {
      await prisma.$executeRawUnsafe(`ALTER TABLE "${table}" ENABLE ROW LEVEL SECURITY`);
    }
    await prisma.$disconnect();
    run([require.resolve('tsx/cli', { paths: [database] }),
      path.join(database, 'prisma', 'seed.ts')], database);
    console.log('Supabase demo initialized; existing accounts were preserved.');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  // Never serialize the connection string or the provider's raw error object.
  console.error(error.message.startsWith('Demo ') || error.message.startsWith('Refusing ')
    || error.message.startsWith('Unexpected ')
    ? error.message : 'Supabase demo initialization failed; inspect protected build logs.');
  process.exitCode = 1;
});
