# JalNyaya — Assessment Requirement Checklist

> Use this checklist during evaluation to verify and demonstrate every requirement.

## Legend

| Symbol | Meaning |
|--------|---------|
| ✅ | Implemented and demonstrable |
| 📁 | File/location reference |
| 🔍 | How to demonstrate |

---

## 1. Project Planning

| # | Requirement | Status | Location | How to Demonstrate |
|---|-------------|--------|----------|--------------------|
| 1 | Project Title | ✅ | `docs/PROJECT_PROPOSAL.md` | Open document, show title section |
| 2 | Problem Statement | ✅ | `docs/PROJECT_PROPOSAL.md` | Show problem section |
| 3 | Objectives | ✅ | `docs/PROJECT_PROPOSAL.md` | Show objectives list |
| 4 | Scope | ✅ | `docs/PROJECT_PROPOSAL.md` | Show scope section |
| 5 | Team Members & Responsibilities | ✅ | `docs/PROJECT_PROPOSAL.md` | Show team table |
| 6 | Technology Stack | ✅ | `docs/PROJECT_PROPOSAL.md`, `README.md` | Show tech stack section |
| 7 | Major Deliverables | ✅ | `docs/PROJECT_PROPOSAL.md` | Show deliverables list |
| 8 | Simple Gantt Chart | ✅ | `docs/Gantt_Chart.md` | Open and show 5-week timeline |

---

## 2. Database Design

| # | Requirement | Status | Location | How to Demonstrate |
|---|-------------|--------|----------|--------------------|
| 9 | ER Diagram | ✅ | `docs/ER_Diagram.md` | Open diagram, explain entities and relationships |
| 10 | Relational Schema | ✅ | `docs/Relational_Schema.md` | Show formal schema with keys |
| 11 | Data Dictionary | ✅ | `docs/Data_Dictionary.md` | Show table-by-table column details |
| 12 | Minimum 4 primary entities | ✅ | 13 entities total | Users, Streets, Deliveries, Complaints, Tankers, etc. |
| 13 | Minimum 3 relationships | ✅ | 15+ relationships | FK relationships across all tables |
| 14 | Minimum 8 tables | ✅ | 13 tables | `prisma/schema.prisma` — list all models |
| 15 | Every table from ER diagram | ✅ | `docs/ER_Diagram.md` ↔ `prisma/schema.prisma` | Cross-reference diagram with schema |
| 16 | Every table has PK | ✅ | `prisma/schema.prisma` | Show `@id` annotation on every model |
| 17 | Appropriate FKs | ✅ | `prisma/schema.prisma` | Show `@relation` annotations |
| 18 | Constraints (CHECK, UNIQUE, NOT NULL, DEFAULT) | ✅ | `prisma/schema.prisma` + MySQL | Show `@unique`, `@default`, CHECK constraints |
| 19 | 3NF or higher | ✅ | `docs/Relational_Schema.md` | Show normalization proof for each entity |
| 20 | Indexes | ✅ | `database/indexes.sql`, `prisma/schema.prisma` | Show `@@index` annotations and SQL file |

---

## 3. Database Implementation

| # | Requirement | Status | Location | How to Demonstrate |
|---|-------------|--------|----------|--------------------|
| 21 | Database creation | ✅ | `docker-compose.db.yml` | `SHOW DATABASES;` in MySQL |
| 22 | 8–10+ related tables | ✅ | 13 tables | `SHOW TABLES;` in MySQL |
| 23 | CRUD operations | ✅ | `backend/src/controllers/` | Demo create/read/update/delete on Streets, Tankers, etc. |
| 24 | Joins | ✅ | `database/reports.sql`, `database/views.sql` | Run JOIN queries, show view definitions |
| 25 | Aggregate queries | ✅ | `database/reports.sql` | Run COUNT, SUM, AVG queries |
| 26 | Views | ✅ | `database/views.sql` | `SHOW FULL TABLES WHERE Table_type = 'VIEW';` — 5 views |
| 27 | Transactions | ✅ | `backend/src/controllers/deliveryController.js` | Show Prisma `$transaction` in delivery completion |
| 28 | Stored Procedure | ✅ | `database/procedures.sql` | `CALL calculate_street_fairness();` |
| 29 | Trigger | ✅ | `database/triggers.sql` | `SHOW TRIGGERS;` — 3 triggers |
| 30 | Indexes | ✅ | `database/indexes.sql` | `SHOW INDEX FROM deliveries;` |
| 31 | ORM integration | ✅ | `prisma/schema.prisma`, all controllers | Show Prisma queries in controllers |

---

## 4. Application

| # | Requirement | Status | Location | How to Demonstrate |
|---|-------------|--------|----------|--------------------|
| 32 | Modern framework | ✅ | React + Vite, Express | Show `package.json` — React 18, Vite 5, Express 4 |
| 33 | Responsive UI | ✅ | `frontend/src/styles/index.css` | Resize browser, show mobile layout |
| 34 | Login page | ✅ | `frontend/src/pages/Login.jsx` | Open app, show login form |
| 35 | Dashboard | ✅ | `frontend/src/pages/Dashboard.jsx` | Login as Admin/Operator/Resident — show different dashboards |
| 36 | CRUD operations in UI | ✅ | Streets, Households, Tankers, Deliveries, Complaints | Add/Edit/Delete records from UI |
| 37 | Search | ✅ | All list pages | Type in search box on Streets, Complaints, etc. |
| 38 | Filtering | ✅ | Deliveries (by status), Complaints (by status/priority) | Use dropdown filters |
| 39 | Pagination | ✅ | All list pages | Click page numbers, show 10 per page |
| 40 | Form validation | ✅ | All forms | Submit empty form — show validation errors |
| 41 | Exception handling | ✅ | `backend/src/middleware/error.middleware.js` | Show centralized error handler, Prisma error codes |

---

## 5. Authentication & Authorization

| # | Requirement | Status | Location | How to Demonstrate |
|---|-------------|--------|----------|--------------------|
| 42 | Secure authentication | ✅ | `backend/src/controllers/authController.js` | Show BCrypt hash + JWT generation |
| 43 | Login | ✅ | `frontend/src/pages/Login.jsx` | Demo login flow |
| 44 | Logout | ✅ | `frontend/src/hooks/useAuth.jsx` | Click logout, show token cleared |
| 45 | Secure session/token handling | ✅ | JWT in localStorage, middleware validation | Show token in DevTools → Application → Local Storage |
| 46 | Retrieve authenticated user | ✅ | `GET /api/auth/me` | Call endpoint, show user data |
| 47 | Minimum 2 roles | ✅ | 3 roles: ADMIN, OPERATOR, RESIDENT | Show roles table in DB |
| 48 | Role-based menu access | ✅ | `frontend/src/layouts/AppLayout.jsx` | Login as different roles, show different sidebar menus |
| 49 | Role-based page access | ✅ | `frontend/src/App.jsx` | Try accessing admin page as resident — redirected |
| 50 | Role-based API access | ✅ | `backend/src/middleware/auth.middleware.js` | Show `authorizeRoles()` middleware on routes |
| 51 | Single Users table | ✅ | `prisma/schema.prisma` | Show ONE `users` model with `role_id` FK |
| 52 | Role/RoleID for permissions | ✅ | `users.role_id → roles.role_id` | Show FK relationship |

---

## 6. Security

| # | Requirement | Status | Location | How to Demonstrate |
|---|-------------|--------|----------|--------------------|
| 53 | BCrypt password hashing | ✅ | `backend/src/controllers/authController.js` | Show `bcrypt.hash()` call, show hashed password in DB |
| 54 | SQL injection prevention | ✅ | Prisma ORM (parameterized), `$queryRaw` with Prisma.sql | Show Prisma queries — no string concatenation |
| 55 | ORM / parameterized queries | ✅ | All controllers use Prisma | Show controller code |
| 56 | `.env` file | ✅ | `.env`, `backend/.env` | Show env files with secrets |
| 57 | dotenv usage | ✅ | `backend/src/config/db.js` | Show `require('dotenv').config()` |
| 58 | No hardcoded DB passwords | ✅ | `DATABASE_URL` in `.env` | Grep codebase — no passwords in source |
| 59 | No hardcoded API keys | ✅ | — | No API keys in source code |
| 60 | No hardcoded JWT secrets | ✅ | `JWT_SECRET` in `.env` | Show env var usage in auth middleware |

---

## 7. Backup & Recovery

| # | Requirement | Status | Location | How to Demonstrate |
|---|-------------|--------|----------|--------------------|
| 61 | Native backup tool | ✅ | `database/backup/backup-mysql.bat` | Run backup script, show `.sql` dump file created |
| 62 | Demonstrate restore | ✅ | `database/backup/restore-mysql.bat` | Run restore script, verify data restored |

---

## 8. Version Control

| # | Requirement | Status | Location | How to Demonstrate |
|---|-------------|--------|----------|--------------------|
| 63 | GitHub repo | ✅ | Create private repo on GitHub | Show GitHub page |
| 64 | Private repository | ✅ | Settings → Private | Show repo visibility |
| 65 | Minimum 10 commits | ✅ | Follow commit plan in README | `git log --oneline` — show 16 commits |
| 66 | Minimum 2 branches (main + dev) | ✅ | `main` + `dev` | `git branch` — show both |
| 67 | Meaningful commit messages | ✅ | Follow commit plan | Show descriptive messages in `git log` |
| 68 | README | ✅ | `README.md` | Open and show |
| 69 | `.gitignore` | ✅ | `.gitignore` | Show excluded files (node_modules, .env, etc.) |
| 70 | Secrets excluded | ✅ | `.gitignore` includes `.env` | Show `.env` not tracked |

---

## 9. Deployment

| # | Requirement | Status | Location | How to Demonstrate |
|---|-------------|--------|----------|--------------------|
| 71 | Free cloud platform | ✅ | `docs/DEPLOYMENT.md` | Follow guide to deploy on Vercel + Render |
| 72 | Live URL | 📝 | Update after deployment | Provide URL to evaluator |

---

## 10. Professional Practice

| # | Requirement | Status | Location | How to Demonstrate |
|---|-------------|--------|----------|--------------------|
| 73 | GitHub | ✅ | GitHub repository | Show repo |
| 74 | Branching | ✅ | `main` + `dev` branches | `git branch` |
| 75 | `.gitignore` | ✅ | `.gitignore` | Show file |
| 76 | Database backup/restore | ✅ | `database/backup/` | Run scripts |
| 77 | Docker | ✅ | `Dockerfile`, `docker-compose.yml` | `docker-compose up` |
| 78 | Docker Hub | ✅ | `docs/DEPLOYMENT.md` | Show push commands |
| 79 | Cloud deployment | ✅ | `docs/DEPLOYMENT.md` | Show deployed app |
| 80 | CI/CD | ✅ | `.github/workflows/ci.yml` | Show GitHub Actions workflow |
| 81 | Custom domain | ✅ | `docs/CUSTOM_DOMAIN.md` | Show documentation |
| 82 | Additional best practice | ✅ | Automated testing (Jest) | `cd backend && npm test` — 10 tests pass |

---

## Quick Demo Script

### For the evaluator walkthrough:

1. **Start app** → `docker-compose up` or `npm run dev` in frontend + backend
2. **Login as Admin** → `admin@jalnyaya.gov.in` / `password123`
3. **Show Dashboard** → Stats, charts, alerts
4. **CRUD** → Create a new street, edit it, delete it
5. **Deliveries** → Create delivery, complete it (transaction), confirm as resident
6. **Complaints** → Lodge complaint, assign operator, resolve
7. **Reports** → Show all 5 report tabs with data
8. **Water Sources** → Add reading, show depletion alert trigger
9. **Payments** → Show payment records, aggregate stats
10. **Role switching** → Logout, login as Operator (different menu), login as Resident (different menu)
11. **Security** → Show `.env`, show password hash in DB, show JWT token
12. **Database** → Open MySQL, run `SHOW TABLES`, `SHOW TRIGGERS`, `SELECT * FROM street_fairness_view`
13. **Backup** → Run `backup-mysql.bat`, show dump file
14. **Git** → `git log --oneline`, `git branch`, show GitHub repo
15. **Docker** → Show Dockerfile, docker-compose.yml
16. **CI/CD** → Show GitHub Actions workflow file
17. **Tests** → `cd backend && npm test`
