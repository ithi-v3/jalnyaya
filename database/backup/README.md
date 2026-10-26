# JalNyaya - Database Backup & Recovery Guide

This directory contains native MySQL backup and recovery scripts and documentation demonstrating enterprise-standard data disaster recovery and database dump procedures.

---

## 1. Environment Variable Architecture (Zero Hardcoded Secrets)

Neither the backup nor restore script hardcodes credentials. They read from environment variables or fall back to standard development parameters:

| Variable | Default Value | Description |
|---|---|---|
| `DB_HOST` | `127.0.0.1` | MySQL Database Host |
| `DB_PORT` | `3307` | Database Port (Docker MySQL container port) |
| `DB_USER` | `jalnyaya_user` | Application Database User |
| `DB_PASSWORD` | Read from environment | User authentication secret |
| `DB_NAME` | `jalnyaya_db` | Database Name |

---

## 2. Command Line Backup (`mysqldump`)

### Windows Batch Execution:
```cmd
cd database\backup
backup-mysql.bat
```

### Direct Native Terminal Command:
```bash
mysqldump -h 127.0.0.1 -P 3307 -u jalnyaya_user -p --routines --triggers --single-transaction jalnyaya_db > jalnyaya_backup.sql
```

### Docker Container Direct Command:
```bash
docker exec jalnyaya-mysql mysqldump -u jalnyaya_user -pjalnyaya123 --routines --triggers --single-transaction jalnyaya_db > jalnyaya_backup.sql
```

Key Flags Used:
- `--routines`: Preserves all stored procedures (`calculate_street_fairness`, `generate_delivery_priority`).
- `--triggers`: Preserves active triggers (`trg_delivery_dispute_insert`, `trg_water_level_reading_insert`).
- `--single-transaction`: Ensures consistent point-in-time snapshot without locking table writes during the backup process (ACID compliance).

---

## 3. Command Line Recovery (`mysql`)

### Windows Batch Execution:
```cmd
cd database\backup
restore-mysql.bat jalnyaya_backup.sql
```

### Direct Native Terminal Command:
```bash
mysql -h 127.0.0.1 -P 3307 -u jalnyaya_user -p jalnyaya_db < jalnyaya_backup.sql
```

### Docker Container Direct Command:
```bash
docker exec -i jalnyaya-mysql mysql -u jalnyaya_user -pjalnyaya123 jalnyaya_db < jalnyaya_backup.sql
```

---

## 4. How to Demonstrate During Viva / Assessment Evaluation

Follow these step-by-step instructions to show the examiner live evidence of backup and recovery:

1. **Step 1: Check Current Database State**
   Show the total deliveries or users in the live system:
   ```sql
   SELECT COUNT(*) FROM deliveries;
   ```
   *(Note the row count, e.g., 42 records)*

2. **Step 2: Take a Backup**
   Run the backup script:
   ```cmd
   database\backup\backup-mysql.bat
   ```
   Show the newly created `.sql` file on your drive. Open it in VS Code to show the DDL and DML statements, stored procedures, and triggers.

3. **Step 3: Simulate Data Loss / Modification**
   Delete or insert a test row to demonstrate state modification:
   ```sql
   DELETE FROM payments WHERE payment_id = 1;
   ```
   Show that the record is gone from the database.

4. **Step 4: Execute Restore**
   Run the restoration script with your backup file:
   ```cmd
   database\backup\restore-mysql.bat jalnyaya_backup.sql
   ```

5. **Step 5: Verify Complete Recovery**
   Query the table again:
   ```sql
   SELECT * FROM payments WHERE payment_id = 1;
   ```
   Confirm the restored record is intact with full data integrity.
