// Jest global teardown: drop the dedicated test database so repeated runs start
// clean and the dev database is never touched.
'use strict';
const { PrismaClient } = require('@prisma/client');
const { TEST_DB_NAME, maintenanceUrl } = require('./db-helper');

module.exports = async () => {
  process.env.DATABASE_URL = maintenanceUrl();
  const client = new PrismaClient();
  try {
    await client.$executeRawUnsafe(`DROP DATABASE IF EXISTS "${TEST_DB_NAME}" WITH (FORCE)`);
  } catch (err) {
    // Leftover database is acceptable if a teardown fails midway.
    console.warn('[test-teardown] could not drop test database:', (err && err.message) || err);
  } finally {
    await client.$disconnect();
  }
};
