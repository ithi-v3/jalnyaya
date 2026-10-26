// JalNyaya - Server Startup File
const app = require('./app');
const prisma = require('./config/db');

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    // Verify database connection
    await prisma.$connect();
    console.log('✔ Connected to MySQL Database (jalnyaya_db)');

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
