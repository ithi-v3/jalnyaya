# JalNyaya — Water Tanker Distribution & Equity Tracker

> A full-stack web application for managing and monitoring tanker-water distribution in water-scarce panchayat areas of Tamil Nadu, built as a B.Tech Database Systems Lab project.

---

## Problem Statement

In water-scarce rural and semi-urban areas, tanker-water distribution is often unfair, poorly documented, and difficult to monitor. JalNyaya provides a transparent system for residents, tanker operators, and panchayat administrators to manage deliveries, track complaints, monitor water sources, and ensure equitable distribution.

---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite 5 |
| Backend | Node.js + Express 4 |
| Database | MySQL 8.0 |
| ORM | Prisma |
| Authentication | JWT + BCrypt |
| Containerization | Docker + Docker Compose |
| CI/CD | GitHub Actions |
| Deployment | Vercel (frontend) + Render (backend) |

---

## Features

- **Role-Based Access Control** — 3 roles: Admin, Operator, Resident
- **Street & Household Management** — CRUD with search, filter, pagination
- **Tanker Fleet Management** — Track vehicles, capacity, operator assignment
- **Delivery Scheduling & Tracking** — Full lifecycle with ACID transactions
- **Delivery Confirmations** — Residents confirm or dispute deliveries
- **Complaint System** — Lodge, assign, track, resolve with SLA monitoring
- **Water Source Monitoring** — Track levels, depletion alerts, trend charts
- **Payment Tracking** — Record and manage delivery payments
- **Fairness Analytics** — Street-wise equity scoring and delivery priority
- **DBMS Reports** — 5 analytical report tabs with real SQL queries
- **Public Transparency Page** — Unauthenticated view of fairness data

---

## Database Design

### Tables (13)

| Table | Purpose |
|-------|---------|
| `roles` | User role definitions (ADMIN, OPERATOR, RESIDENT) |
| `users` | Single unified user table with role_id FK |
| `zones` | Geographic zones for grouping streets |
| `streets` | Streets with population, priority scoring |
| `households` | Individual households within streets |
| `tankers` | Water tanker vehicles with operator assignment |
| `deliveries` | Scheduled/completed water deliveries |
| `delivery_confirmations` | Resident confirmations of deliveries |
| `complaints` | Resident complaints with SLA tracking |
| `water_sources` | Water sources (bore wells, reservoirs, etc.) |
| `water_level_readings` | Periodic water level measurements |
| `alerts` | System alerts for depletion, disputes, etc. |
| `payments` | Payment records for deliveries |

### Advanced SQL Objects

| Type | Count | Details |
|------|-------|---------|
| Views | 5 | `street_fairness_view`, `delivery_priority_view`, `complaint_sla_view`, `operator_dispute_view`, `monthly_tanker_usage_view` |
| Stored Procedures | 2 | `calculate_street_fairness`, `generate_delivery_priority` |
| Triggers | 3 | Dispute alert on delivery insert/update, water level alert on reading insert |
| Indexes | 13+ | On frequently queried columns (email, status, dates, FKs) |

### Normalization

The database is designed to satisfy **Third Normal Form (3NF)**:
- **1NF**: All columns contain atomic values, no repeating groups
- **2NF**: No partial dependencies — all non-key attributes depend on the entire primary key
- **3NF**: No transitive dependencies — street name is not stored in deliveries; it's looked up via `street_id` FK

See `docs/Relational_Schema.md` for the complete normalization proof.

---

## DBMS Concepts Demonstrated

| Concept | Implementation |
|---------|---------------|
| ER Diagram | `docs/ER_Diagram.md` — 13 entities with relationships |
| Relational Schema | `docs/Relational_Schema.md` — formal notation |
| Data Dictionary | `docs/Data_Dictionary.md` — all tables/columns |
| CRUD | All controllers via Prisma ORM |
| Joins | Views and reports use INNER JOIN, LEFT JOIN |
| Aggregation | COUNT, SUM, AVG in reports and dashboard |
| GROUP BY / HAVING | Fairness queries, monthly usage |
| Views | 5 views in `database/views.sql` |
| Stored Procedures | 2 procedures in `database/procedures.sql` |
| Triggers | 3 triggers in `database/triggers.sql` |
| Transactions | ACID delivery completion in `deliveryController.js` |
| Indexes | 13+ indexes in `database/indexes.sql` |
| ORM | Prisma for all standard DB operations |
| Authentication | JWT tokens + BCrypt password hashing |
| RBAC | 3 roles with middleware-enforced access control |
| Backup/Recovery | `database/backup/` — mysqldump scripts |

---

## Project Structure

```
jalnyaya/
├── frontend/                # React + Vite
│   └── src/
│       ├── components/
│       ├── pages/           # Login, Dashboard, Streets, etc.
│       ├── layouts/         # AppLayout with sidebar
│       ├── services/        # API service
│       ├── hooks/           # useAuth context
│       └── styles/          # CSS
├── backend/                 # Node.js + Express
│   └── src/
│       ├── routes/          # API route definitions
│       ├── controllers/     # Business logic
│       ├── middleware/      # Auth, error handling
│       ├── services/
│       ├── utils/
│       └── config/          # Prisma client
├── prisma/
│   ├── schema.prisma        # Database schema (13 models)
│   ├── seed.js              # Seed data
│   └── migrations/
├── database/
│   ├── views.sql            # 5 database views
│   ├── procedures.sql       # 2 stored procedures
│   ├── triggers.sql         # 3 triggers
│   ├── indexes.sql          # 13+ indexes
│   ├── reports.sql          # 13 analytical queries
│   └── backup/              # Backup/restore scripts
├── docs/                    # Project documentation
├── .github/workflows/       # CI/CD
├── Dockerfile
├── docker-compose.yml
├── docker-compose.db.yml    # Dev DB only
├── .env.example
├── .gitignore
└── README.md
```

---

## Setup & Installation

### Prerequisites

- Node.js 18+
- MySQL 8.0 (or Docker)
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/<your-username>/jalnyaya.git
cd jalnyaya
```

### 2. Environment Variables

Copy the example env files and update values:

```bash
cp .env.example .env
cp backend/.env.example backend/.env
```

Edit `.env` and `backend/.env`:

```env
DATABASE_URL="mysql://jalnyaya_user:jalnyaya123@localhost:3307/jalnyaya"
JWT_SECRET="your-secret-key-change-in-production"
JWT_EXPIRES_IN="24h"
PORT=5000
```

### 3. Start MySQL (Docker)

```bash
docker-compose -f docker-compose.db.yml up -d
```

This starts MySQL 8.0 on port 3307.

### 4. Install Dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 5. Setup Database

```bash
# From project root
npx prisma db push
npx prisma db seed
```

### 6. Apply SQL Objects

Connect to MySQL and run:

```bash
mysql -h 127.0.0.1 -P 3307 -u jalnyaya_user -pjalnyaya123 jalnyaya < database/views.sql
mysql -h 127.0.0.1 -P 3307 -u jalnyaya_user -pjalnyaya123 jalnyaya < database/procedures.sql
mysql -h 127.0.0.1 -P 3307 -u jalnyaya_user -pjalnyaya123 jalnyaya < database/triggers.sql
mysql -h 127.0.0.1 -P 3307 -u jalnyaya_user -pjalnyaya123 jalnyaya < database/indexes.sql
```

> **Note**: For triggers, you may need to run as root:
> ```sql
> SET GLOBAL log_bin_trust_function_creators = 1;
> GRANT SUPER ON *.* TO 'jalnyaya_user'@'%';
> ```

### 7. Start the Application

```bash
# Terminal 1 — Backend
cd backend
node src/server.js

# Terminal 2 — Frontend
cd frontend
npm run dev
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:5000

---

## Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@jalnyaya.gov.in` | `password123` |
| Operator | `operator1@jalnyaya.gov.in` | `password123` |
| Resident | `resident1@jalnyaya.gov.in` | `password123` |

---

## Running Tests

```bash
cd backend
npm test
```

Runs 10 test cases covering authentication, CRUD, authorization, and validation.

---

## Database Backup & Restore

### Backup

```bash
cd database/backup
backup-mysql.bat
```

Creates a timestamped `.sql` dump file.

### Restore

```bash
cd database/backup
restore-mysql.bat backup_YYYYMMDD_HHMMSS.sql
```

See `database/backup/README.md` for details.

---

## Docker

### Build and run with Docker Compose:

```bash
docker-compose up --build
```

### Or build image manually:

```bash
docker build -t jalnyaya .
```

---

## Deployment

See `docs/DEPLOYMENT.md` for step-by-step deployment instructions.

**Live URL**: [To be updated after deployment]

---

## Suggested Commit Plan

Follow this plan to create meaningful commits with proper branching:

```bash
# Initialize repository
git init
git checkout -b main

# Commit 1: Project setup
git add .gitignore README.md .env.example package.json
git commit -m "chore: initialize project with gitignore, readme, and env example"

# Create dev branch
git checkout -b dev

# Commit 2: Prisma schema
git add prisma/schema.prisma
git commit -m "feat(db): add Prisma schema with 13 tables and relationships"

# Commit 3: Seed data
git add prisma/seed.js
git commit -m "feat(db): add seed data for all tables"

# Commit 4: SQL objects
git add database/
git commit -m "feat(db): add views, procedures, triggers, indexes, and reports"

# Commit 5: Backend config and middleware
git add backend/src/config/ backend/src/middleware/ backend/src/app.js backend/src/server.js backend/package.json backend/.env.example
git commit -m "feat(api): add Express server with auth and error middleware"

# Commit 6: Auth controller and routes
git add backend/src/controllers/authController.js backend/src/routes/auth.routes.js
git commit -m "feat(auth): implement JWT login with BCrypt hashing"

# Commit 7: Core controllers and routes
git add backend/src/controllers/ backend/src/routes/
git commit -m "feat(api): add CRUD controllers for streets, households, tankers, deliveries"

# Commit 8: Analytics and reports
git add backend/src/controllers/analyticsController.js backend/src/routes/analytics.routes.js
git commit -m "feat(api): add analytics endpoints for fairness, priority, and reports"

# Commit 9: Backend tests
git add backend/__tests__/
git commit -m "test: add API tests for auth, CRUD, and authorization"

# Commit 10: Frontend setup and login
git add frontend/package.json frontend/vite.config.js frontend/index.html frontend/src/main.jsx frontend/src/App.jsx frontend/src/pages/Login.jsx frontend/src/hooks/ frontend/src/services/ frontend/src/styles/
git commit -m "feat(ui): add React frontend with login page and auth context"

# Commit 11: Dashboard and layout
git add frontend/src/layouts/ frontend/src/pages/Dashboard.jsx
git commit -m "feat(ui): add sidebar layout and role-based dashboard"

# Commit 12: CRUD pages
git add frontend/src/pages/Streets.jsx frontend/src/pages/Households.jsx frontend/src/pages/Tankers.jsx frontend/src/pages/Deliveries.jsx
git commit -m "feat(ui): add CRUD pages with search, filter, pagination"

# Commit 13: Complaints, water sources, payments
git add frontend/src/pages/Complaints.jsx frontend/src/pages/WaterSources.jsx frontend/src/pages/Payments.jsx
git commit -m "feat(ui): add complaints, water sources, and payments pages"

# Commit 14: Reports and public page
git add frontend/src/pages/Reports.jsx frontend/src/pages/PublicTransparency.jsx frontend/src/pages/Users.jsx frontend/src/pages/VivaGuide.jsx
git commit -m "feat(ui): add reports, public transparency, user management, and viva guide"

# Commit 15: Docker and CI/CD
git add Dockerfile docker-compose.yml docker-compose.db.yml .dockerignore .github/
git commit -m "ops: add Dockerfile, docker-compose, and GitHub Actions CI/CD"

# Commit 16: Documentation
git add docs/ database/backup/README.md
git commit -m "docs: add ER diagram, data dictionary, deployment guide, and checklist"

# Merge to main
git checkout main
git merge dev
git tag v1.0.0

# Push
git remote add origin https://github.com/<your-username>/jalnyaya.git
git push -u origin main
git push origin dev
git push origin --tags
```

> **Note**: Replace `<your-username>` with your actual GitHub username. Do not push `.env` files — they are excluded by `.gitignore`.

---

## Documentation

| Document | Location |
|----------|----------|
| Project Proposal | `docs/PROJECT_PROPOSAL.md` |
| ER Diagram | `docs/ER_Diagram.md` |
| Relational Schema | `docs/Relational_Schema.md` |
| Data Dictionary | `docs/Data_Dictionary.md` |
| Gantt Chart | `docs/Gantt_Chart.md` |
| DBMS Queries | `docs/DBMS_Queries.md` |
| Viva Preparation | `docs/DBMS_VIVA.md` |
| Deployment Guide | `docs/DEPLOYMENT.md` |
| Custom Domain | `docs/CUSTOM_DOMAIN.md` |
| Requirement Checklist | `docs/REQUIREMENT_CHECKLIST.md` |
| Backup/Restore Guide | `database/backup/README.md` |

---

## License

This project is developed for academic purposes as part of the B.Tech Database Systems Lab course.

---

*Built with ❤️ for fair water distribution*
