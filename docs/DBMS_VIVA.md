# JalNyaya — DBMS Viva Preparation Guide

> Quick-review guide for the Database Systems Lab viva. Covers every DBMS concept used in JalNyaya with Q&A format.

---

## 1. Primary Keys & Foreign Keys

**Q: What is a primary key? Give examples from JalNyaya.**
A: A primary key uniquely identifies each row in a table. In JalNyaya, every table has an auto-increment integer PK — `user_id` in `users`, `delivery_id` in `deliveries`, `complaint_id` in `complaints`, etc.

**Q: What is a foreign key? Why is it important?**
A: A foreign key creates a link between two tables by referencing the PK of another table. For example, `deliveries.street_id` references `streets.street_id`. This enforces referential integrity — you can't create a delivery for a street that doesn't exist.

**Q: List some FK relationships in JalNyaya.**
A:
- `users.role_id → roles.role_id`
- `users.street_id → streets.street_id`
- `deliveries.tanker_id → tankers.tanker_id`
- `deliveries.street_id → streets.street_id`
- `deliveries.operator_id → users.user_id`
- `complaints.resident_id → users.user_id`
- `water_level_readings.source_id → water_sources.source_id`
- `payments.delivery_id → deliveries.delivery_id`

**Q: What happens if you delete a street that has deliveries?**
A: The FK constraint prevents it (or cascades, depending on the ON DELETE action). In JalNyaya, Prisma uses `RESTRICT` by default, so the delete would be rejected to protect data integrity.

---

## 2. Normalization (1NF, 2NF, 3NF)

**Q: What is 1NF?**
A: First Normal Form requires that every column contains only atomic (indivisible) values and there are no repeating groups. JalNyaya satisfies 1NF — for example, `streets` stores `street_name` as a single string, not a list. Each household is a separate row in `households`.

**Q: What is 2NF?**
A: Second Normal Form requires 1NF plus no partial dependencies — every non-key attribute must depend on the entire primary key, not just part of it. Since all JalNyaya tables use single-column auto-increment PKs, partial dependency is impossible, so 2NF is automatically satisfied.

**Q: What is 3NF?**
A: Third Normal Form requires 2NF plus no transitive dependencies — non-key attributes must depend only on the PK, not on other non-key attributes. For example, we store `street_id` in `deliveries`, NOT `street_name` or `population`. If we stored `street_name` in `deliveries`, changing a street's name would require updating every delivery row — that's a transitive dependency violation.

**Q: Give a specific 3NF example from JalNyaya.**
A: The `deliveries` table stores `street_id` (FK) but NOT `street_name`, `area_name`, or `household_count`. Those belong in the `streets` table. To get the street name for a delivery, we JOIN:
```sql
SELECT d.delivery_id, s.street_name
FROM deliveries d
JOIN streets s ON d.street_id = s.street_id;
```

**Q: Is JalNyaya in BCNF?**
A: Yes. Since every table uses a single-column primary key, and all non-key attributes depend only on that PK, the schema satisfies BCNF (Boyce-Codd Normal Form) as well.

---

## 3. ER Diagram

**Q: What is an ER diagram?**
A: An Entity-Relationship diagram visually represents the database structure — entities (tables), their attributes (columns), and relationships (foreign keys) between them.

**Q: How many entities does JalNyaya have?**
A: 13 entities — `roles`, `users`, `zones`, `streets`, `households`, `tankers`, `deliveries`, `delivery_confirmations`, `complaints`, `water_sources`, `water_level_readings`, `alerts`, `payments`.

**Q: What does cardinality mean?**
A: Cardinality describes how many instances of one entity relate to another. For example:
- One street has **many** deliveries (1:N)
- One tanker has **many** deliveries (1:N)
- One delivery has **one** payment (1:1)
- One delivery has **many** confirmations (1:N)

**Q: Where is the ER diagram?**
A: `docs/ER_Diagram.md` — rendered as a Mermaid diagram.

---

## 4. SQL Joins

**Q: What is an INNER JOIN?**
A: INNER JOIN returns only rows that have matching values in both tables. Example — get deliveries with street names:
```sql
SELECT d.delivery_id, s.street_name, d.quantity_litres
FROM deliveries d
INNER JOIN streets s ON d.street_id = s.street_id;
```

**Q: What is a LEFT JOIN?**
A: LEFT JOIN returns all rows from the left table plus matching rows from the right table (NULLs where there's no match). Example — all streets including those with no deliveries:
```sql
SELECT s.street_name, COUNT(d.delivery_id) AS delivery_count
FROM streets s
LEFT JOIN deliveries d ON s.street_id = d.street_id
GROUP BY s.street_name;
```
This is used in `street_fairness_view` to find streets that never received water.

**Q: Where are JOINs used in JalNyaya?**
A: In all 5 views (`database/views.sql`), in `database/reports.sql`, and implicitly through Prisma's `include` which generates JOINs behind the scenes.

---

## 5. Aggregate Functions

**Q: Name the aggregate functions and give examples from JalNyaya.**
A:
- `COUNT(*)` — Total deliveries per street
- `SUM(quantity_litres)` — Total water delivered to a street
- `AVG(quantity_litres)` — Average delivery size
- `MIN(scheduled_date)` — Earliest delivery date
- `MAX(reading_date)` — Latest water level reading

Example from `reports.sql`:
```sql
SELECT s.street_name, COUNT(d.delivery_id) AS total_deliveries,
       SUM(d.quantity_litres) AS total_litres
FROM streets s
LEFT JOIN deliveries d ON s.street_id = d.street_id
GROUP BY s.street_name;
```

---

## 6. GROUP BY & HAVING

**Q: What is GROUP BY?**
A: GROUP BY groups rows that have the same values in specified columns, allowing aggregate functions to operate on each group. Example — count deliveries per street:
```sql
SELECT street_id, COUNT(*) AS cnt FROM deliveries GROUP BY street_id;
```

**Q: What is the difference between WHERE and HAVING?**
A: WHERE filters individual rows BEFORE grouping. HAVING filters groups AFTER aggregation. Example — streets with fewer than 3 deliveries:
```sql
SELECT street_id, COUNT(*) AS cnt
FROM deliveries
GROUP BY street_id
HAVING COUNT(*) < 3;
```

**Q: Where is HAVING used in JalNyaya?**
A: In `reports.sql` for finding streets with fewest deliveries, and in the fairness analysis queries.

---

## 7. Subqueries

**Q: What is a subquery?**
A: A query nested inside another query. Can be in SELECT, FROM, or WHERE clause.

**Q: Give a correlated subquery example from JalNyaya.**
A: Finding streets that have fewer deliveries than average:
```sql
SELECT s.street_name FROM streets s
WHERE (SELECT COUNT(*) FROM deliveries d WHERE d.street_id = s.street_id)
      < (SELECT AVG(cnt) FROM (SELECT COUNT(*) AS cnt FROM deliveries GROUP BY street_id) t);
```

**Q: Correlated vs non-correlated?**
A: A correlated subquery references the outer query's columns and runs once per row. A non-correlated subquery runs once independently. The inner `SELECT AVG(cnt)...` above is non-correlated; the `SELECT COUNT(*) FROM deliveries d WHERE d.street_id = s.street_id` is correlated.

---

## 8. Views

**Q: What is a view?**
A: A view is a virtual table based on a SELECT query. It doesn't store data — it runs the query each time you access it.

**Q: Why use views?**
A: Simplify complex queries, provide security (restrict column access), create reusable query definitions.

**Q: List all views in JalNyaya.**
A:
| View | Purpose |
|------|---------|
| `street_fairness_view` | Ranks streets by delivery count, total litres, and litres per household — identifies underserved streets |
| `delivery_priority_view` | Calculates delivery priority based on days since last delivery and population |
| `complaint_sla_view` | Tracks complaint resolution time vs SLA thresholds |
| `operator_dispute_view` | Shows dispute rate per operator |
| `monthly_tanker_usage_view` | Aggregates tanker usage by month |

**Q: How do you query a view?**
A: Like a regular table: `SELECT * FROM street_fairness_view ORDER BY fairness_rank;`

**Q: Where are they defined?**
A: `database/views.sql`

---

## 9. Stored Procedures

**Q: What is a stored procedure?**
A: A precompiled set of SQL statements stored in the database that can be called with `CALL`. It can accept parameters, use variables, and contain logic.

**Q: What stored procedures does JalNyaya have?**
A:
1. **`calculate_street_fairness()`** — Recalculates fairness scores for all streets based on delivery count, population, and time since last delivery. Updates `streets.priority_score`.
2. **`generate_delivery_priority()`** — Generates a priority-ranked list of streets for the next delivery cycle.

**Q: How do you call them?**
A: `CALL calculate_street_fairness();` or `CALL generate_delivery_priority();`

**Q: Why use stored procedures instead of application code?**
A: Performance (runs on DB server), reusability, consistency (same logic regardless of calling application), reduced network traffic.

**Q: Where are they defined?**
A: `database/procedures.sql`

---

## 10. Triggers

**Q: What is a trigger?**
A: A trigger is a set of SQL statements that automatically executes when a specified event (INSERT, UPDATE, DELETE) occurs on a table.

**Q: What triggers does JalNyaya have?**
A:
| Trigger | Event | Action |
|---------|-------|--------|
| `trg_delivery_dispute_insert` | AFTER INSERT on `deliveries` | If status is DISPUTED, creates an alert in `alerts` |
| `trg_delivery_dispute_update` | AFTER UPDATE on `deliveries` | If status changes to DISPUTED, creates an alert |
| `trg_water_level_reading_insert` | AFTER INSERT on `water_level_readings` | If level < 20%, creates a depletion alert and updates source status to CRITICAL |

**Q: BEFORE vs AFTER trigger?**
A: BEFORE triggers run before the data change — useful for validation/modification. AFTER triggers run after — useful for logging/alerting. JalNyaya uses AFTER triggers because we want to create alerts after the data is confirmed written.

**Q: Where are they defined?**
A: `database/triggers.sql`

---

## 11. Transactions & ACID

**Q: What is a transaction?**
A: A transaction is a sequence of operations treated as a single unit of work — either all succeed or all fail.

**Q: What does ACID stand for?**
A:
- **Atomicity** — All operations complete or none do
- **Consistency** — Database moves from one valid state to another
- **Isolation** — Concurrent transactions don't interfere
- **Durability** — Once committed, data survives crashes

**Q: Where does JalNyaya use transactions?**
A: In `deliveryController.js` — when completing a delivery, Prisma `$transaction` atomically:
1. Updates delivery status to COMPLETED
2. Updates delivery_date
3. Updates the street's `last_delivery_date`
4. Recalculates `priority_score`

If any step fails, everything rolls back.

```javascript
await prisma.$transaction(async (tx) => {
  await tx.deliveries.update({ ... });
  await tx.streets.update({ ... });
});
```

---

## 12. Indexes

**Q: What is an index?**
A: An index is a data structure (usually B-tree) that speeds up data retrieval on specific columns. Like a book's index — instead of scanning every page, you look up the topic.

**Q: What is the trade-off?**
A: Indexes speed up SELECT queries but slow down INSERT/UPDATE/DELETE because the index must also be updated. They also consume storage.

**Q: What indexes does JalNyaya have?**
A: 13+ indexes including:
- `Users(email)` — Fast login lookup
- `Users(role_id)` — Filter users by role
- `Deliveries(street_id)`, `(operator_id)`, `(status)`, `(delivery_date)` — Delivery queries
- `Complaints(street_id)`, `(status)`, `(created_at)` — Complaint lookups
- `WaterLevelReadings(source_id, reading_date)` — Composite index for trend queries
- `Payments(delivery_id)` — Payment lookup

**Q: Why is there a composite index on `water_level_readings(source_id, reading_date)`?**
A: Because queries often filter by source AND sort by date: `WHERE source_id = ? ORDER BY reading_date DESC`. A composite index handles both conditions efficiently.

**Q: Where are they defined?**
A: `database/indexes.sql` and `prisma/schema.prisma` (@@index annotations)

---

## 13. ORM (Prisma)

**Q: What is an ORM?**
A: Object-Relational Mapping — a technique that maps database tables to programming language objects. Instead of writing raw SQL, you use methods like `prisma.users.findMany()`.

**Q: Why use Prisma?**
A: Type safety, auto-generated queries, migration management, relation handling, SQL injection prevention (parameterized queries).

**Q: When does JalNyaya use raw SQL instead of Prisma?**
A: Only for:
- Calling stored procedures: `prisma.$queryRaw\`CALL calculate_street_fairness()\``
- Querying views: `prisma.$queryRaw\`SELECT * FROM street_fairness_view\``
- Complex analytical reports that are hard to express in Prisma's query API

**Q: Where is the schema defined?**
A: `prisma/schema.prisma` — 13 models with relations, indexes, and constraints

---

## 14. Authentication & Authorization

**Q: How does login work in JalNyaya?**
A: 
1. User sends email + password to `POST /api/auth/login`
2. Server finds user by email using Prisma
3. Compares password with BCrypt hash stored in DB
4. If valid, generates a JWT token containing `user_id` and `role`
5. Returns token to frontend
6. Frontend stores token in localStorage and sends it in `Authorization: Bearer <token>` header

**Q: What is BCrypt?**
A: A password hashing algorithm with built-in salt. Even if two users have the same password, their hashes are different. It's computationally slow on purpose to resist brute-force attacks.

**Q: What is JWT?**
A: JSON Web Token — a self-contained token with encoded payload (user_id, role, expiry). The server signs it with a secret key. On each request, the middleware verifies the signature without needing a database lookup.

**Q: How does RBAC work?**
A: Three roles — ADMIN, OPERATOR, RESIDENT. The `authorizeRoles()` middleware checks the user's role from the JWT payload against allowed roles for each route. Example:
```javascript
router.delete('/streets/:id', auth, authorizeRoles('ADMIN'), deleteStreet);
```
Only admins can delete streets.

**Q: What menus does each role see?**
A:
- **ADMIN**: Dashboard, Streets, Households, Tankers, Deliveries, Complaints, Water Sources, Reports, Payments, Users
- **OPERATOR**: Dashboard, Deliveries, Complaints, Water Sources
- **RESIDENT**: Dashboard, Deliveries, Complaints

---

## 15. Security

**Q: How does JalNyaya prevent SQL injection?**
A: By using Prisma ORM for all standard queries (parameterized internally). For raw SQL, we use Prisma's tagged template literals: `prisma.$queryRaw\`SELECT ... WHERE id = ${id}\`` — which auto-parameterizes values.

**Q: Where are secrets stored?**
A: In `.env` files (not committed to Git). The `.gitignore` excludes `.env`. Only `.env.example` (without real values) is in the repository.

**Q: What secrets does JalNyaya use?**
A: `DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN` — all loaded via `dotenv`.

---

## 16. Backup & Recovery

**Q: How do you backup the JalNyaya database?**
A: Using `mysqldump`:
```bash
mysqldump -h 127.0.0.1 -P 3307 -u jalnyaya_user -p jalnyaya > backup.sql
```
The `database/backup/backup-mysql.bat` script automates this with timestamped filenames.

**Q: How do you restore?**
A:
```bash
mysql -h 127.0.0.1 -P 3307 -u jalnyaya_user -p jalnyaya < backup.sql
```
The `database/backup/restore-mysql.bat` script automates this.

**Q: Why is backup important?**
A: To prevent data loss from hardware failure, accidental deletion, or corruption. In a real panchayat system, losing delivery records could cause disputes and unfairness.

---

## 17. Docker

**Q: What is Docker?**
A: Docker packages an application and its dependencies into a container — a lightweight, portable unit that runs consistently across environments.

**Q: What files does JalNyaya use for Docker?**
A:
- `Dockerfile` — Builds the backend application image
- `docker-compose.yml` — Orchestrates backend + MySQL containers
- `docker-compose.db.yml` — Development-only MySQL container
- `.dockerignore` — Excludes `node_modules`, `.env`, etc. from the image

**Q: What is the difference between a Dockerfile and docker-compose.yml?**
A: Dockerfile defines HOW to build a single image. docker-compose.yml defines HOW to run multiple containers together with networking, volumes, and environment variables.

---

## 18. Deployment & CI/CD

**Q: What is CI/CD?**
A: Continuous Integration / Continuous Deployment — automated pipelines that build, test, and deploy code whenever changes are pushed.

**Q: What CI/CD does JalNyaya use?**
A: GitHub Actions (`.github/workflows/ci.yml`) — on every push it:
1. Starts a MySQL service container
2. Installs dependencies
3. Pushes Prisma schema
4. Seeds the database
5. Applies SQL files
6. Runs backend tests (Jest)
7. Builds the frontend

**Q: Where is JalNyaya deployed?**
A: Frontend on Vercel, backend on Render (see `docs/DEPLOYMENT.md` for instructions).

---

## Quick SQL Commands for Demo

```sql
-- Show all tables
SHOW TABLES;

-- Show all views
SHOW FULL TABLES WHERE Table_type = 'VIEW';

-- Show all triggers
SHOW TRIGGERS;

-- Call stored procedure
CALL calculate_street_fairness();

-- Query a view
SELECT * FROM street_fairness_view ORDER BY fairness_rank;

-- Show indexes on deliveries
SHOW INDEX FROM deliveries;

-- Check password is hashed
SELECT user_id, email, LEFT(password_hash, 20) AS hash_preview FROM users LIMIT 3;

-- Example JOIN query
SELECT d.delivery_id, s.street_name, t.vehicle_number, d.quantity_litres, d.status
FROM deliveries d
JOIN streets s ON d.street_id = s.street_id
JOIN tankers t ON d.tanker_id = t.tanker_id
LIMIT 5;

-- Example aggregate
SELECT s.street_name, COUNT(d.delivery_id) AS deliveries, SUM(d.quantity_litres) AS total_litres
FROM streets s LEFT JOIN deliveries d ON s.street_id = d.street_id
GROUP BY s.street_name ORDER BY deliveries ASC;
```
