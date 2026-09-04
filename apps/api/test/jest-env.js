// Runs in every test worker before any suite: force DATABASE_URL onto the
// dedicated test database. Nest's ConfigModule never overrides an exported env
// var, and PrismaService reads this when it connects.
'use strict';
const { testUrl } = require('./db-helper');
process.env.DATABASE_URL = testUrl();
