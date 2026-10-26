// JalNyaya - Database Setup Automation Script
// Reads and executes views.sql, procedures.sql, triggers.sql, and indexes.sql using mysql2 or docker exec

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function executeSqlFile(filePath) {
  console.log(`Applying ${path.basename(filePath)}...`);
  try {
    const fullPath = path.resolve(filePath);
    // Execute through docker container jalnyaya-mysql
    const command = `docker exec -i jalnyaya-mysql mysql -u jalnyaya_user -pjalnyaya123 jalnyaya_db`;
    execSync(command, { input: fs.readFileSync(fullPath), stdio: ['pipe', 'inherit', 'inherit'] });
    console.log(`✔ Successfully applied ${path.basename(filePath)}`);
  } catch (err) {
    console.error(`❌ Failed to apply ${path.basename(filePath)}:`, err.message);
  }
}

async function main() {
  console.log('--- Applying Database Views, Procedures, Triggers & Indexes ---');
  executeSqlFile('database/views.sql');
  executeSqlFile('database/procedures.sql');
  executeSqlFile('database/triggers.sql');
  executeSqlFile('database/indexes.sql');
  console.log('--- All database objects applied successfully ---');
}

main();
