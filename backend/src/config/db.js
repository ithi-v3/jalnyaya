// JalNyaya - Database Prisma Client Singleton Configuration
let PrismaClient;
try {
  PrismaClient = require('@prisma/client').PrismaClient;
} catch (err) {
  try {
    PrismaClient = require('../../../node_modules/@prisma/client').PrismaClient;
  } catch (err2) {
    throw err;
  }
}

let prisma;
try {
  prisma = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });
} catch (clientErr) {
  try {
    const RootPrisma = require('../../../node_modules/@prisma/client').PrismaClient;
    prisma = new RootPrisma({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });
  } catch (fallbackErr) {
    throw clientErr;
  }
}

module.exports = prisma;
