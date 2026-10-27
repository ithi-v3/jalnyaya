// JalNyaya - Server Startup File with Cloud Auto-Migration
const { execSync } = require('child_process');
const app = require('./app');
const prisma = require('./config/db');
const { ensureViewsExist } = require('./config/initViews');

const PORT = process.env.PORT || 5000;

async function autoInitDatabase() {
  try {
    // Check if 'users' table exists
    const tables = await prisma.$queryRawUnsafe(`SHOW TABLES LIKE 'users'`);
    const tableExists = Array.isArray(tables) && tables.length > 0;

    if (!tableExists) {
      console.log('⚡ Initializing cloud database schema (users table not found)...');
      execSync('npx prisma db push --schema=./prisma/schema.prisma --accept-data-loss', { stdio: 'inherit' });
      console.log('✔ Database schema created.');

      console.log('⚡ Seeding initial panchayat dataset...');
      execSync('node prisma/seed.js', { stdio: 'inherit' });
      console.log('✔ Initial data seeded successfully.');
    } else {
      // Check if seeded users exist
      const userCount = await prisma.user.count();
      if (userCount === 0) {
        console.log('⚡ Seeding initial panchayat dataset...');
        execSync('node prisma/seed.js', { stdio: 'inherit' });
        console.log('✔ Initial data seeded successfully.');
      }
    }

    // Always ensure database analytical views exist
    await ensureViewsExist(prisma);
  } catch (initErr) {
    console.warn('⚠ Database auto-init check notice:', initErr.message);
  }
}

async function startServer() {
  try {
    // Verify database connection
    await prisma.$connect();
    console.log('✔ Connected to MySQL Database');

    // Auto-initialize schema, seed & views if running on fresh cloud DB
    await autoInitDatabase();

    app.listen(PORT, () => {
      console.log(`=======================================================`);
      console.log(`  JalNyaya API Server running on port ${PORT}`);
      console.log(`  Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`  Health Check: http://localhost:${PORT}/api/health`);
      console.log(`=======================================================`);
    });
  } catch (err) {
    console.error('❌ Failed to connect to database or start server:', err);
    process.exit(1);
  }
}

startServer();
