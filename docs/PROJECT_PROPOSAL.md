# PROJECT PROPOSAL

## 1. Project Title
**JalNyaya – Water Tanker Distribution & Equity Tracker**

---

## 2. Problem Statement
In water-scarce regions, particularly rural and semi-urban panchayats of Tamil Nadu (such as Coimbatore rural wards in Vadavalli, Thondamuthur, and Perur), water tanker delivery systems face severe logistical and governance challenges:
- Tanker distribution is often unfair, opaque, and prone to political or influential favoritism, leaving tail-end streets severely underserved.
- Deliveries are logged on paper manifests without resident verification, leading to phantom deliveries and unverified contractor bills.
- Citizens lack transparent mechanisms to monitor water supply schedules, file water shortage grievances, or verify whether public tankers actually reached their locality.
- Panchayat administrators lack real-time telemetry on communal borewell and open well aquifer depletion rates.

---

## 3. Objectives
1. **Promote Water Equity (Jal Nyaya):** Implement a database-driven per-capita distribution tracker that measures litres per person per street against panchayat benchmarks and flags critical deficits.
2. **Prevent Delivery Fraud:** Enforce resident-based delivery verification where resident non-confirmation automatically converts deliveries into `DISPUTED` status for administrative audit.
3. **Automate Need-Based Priority Dispatch:** Dynamically calculate delivery priority scores based on days elapsed without water, household count, pending grievances, and fairness deficits.
4. **Enforce 48-Hour Grievance SLA:** Monitor citizen complaints against a strict 48-hour resolution benchmark with automated breach status tags.
5. **Real-time Aquifer Depletion Alerts:** Track water levels in communal wells and overhead tanks, automatically triggering alerts when sources fall below 80% (Warning) or 60% (Critical) capacity.
6. **Demonstrate Relational DBMS Best Practices:** Design a fully normalized 3NF relational database with primary keys, foreign keys, constraints, composite indexes, views, stored procedures, triggers, and ACID transactions.

---

## 4. Scope
- **Included:**
  - Administrative zone, street, and household registration across panchayat wards.
  - Unified user authentication with Role-Based Access Control (RBAC) for Admin, Tanker Operator, and Resident.
  - Tanker fleet tracking and dispatch scheduling.
  - Multi-step ACID transactions for delivery completion.
  - Resident delivery confirmation and anti-fraud dispute workflows.
  - 48-Hour SLA grievance redressal module.
  - Water source level monitoring with depletion trend charting.
  - Public transparency portal accessible to citizens without login.
  - Financial ledger recording delivery payments and subsidized vouchers in ₹ INR.
- **Excluded:**
  - Hardware IoT sensor integration (telemetry values logged digitally via administrative interface).
  - Commercial payment gateways (recorded internally via cash/voucher/UPI reference numbers).
  - Heavy GIS map engines (utilizes lightweight relational geographic hierarchy: Zones → Streets → Households).

---

## 5. Team Members and Responsibilities
*(Solo B.Tech Database Systems Lab Project)*

| Member Name | Degree / Specialization | Responsibilities |
|---|---|---|
| **Student (Lead Developer & DB Architect)** | B.Tech Computer Science & Engineering | - Problem formulation and requirements engineering<br>- Relational database design, ER diagram, 3NF normalization<br>- DDL, DML, Views, Stored Procedures, Triggers, and Indexes<br>- Express backend API development and Prisma ORM integration<br>- Role-Based Access Control (RBAC) and JWT authentication<br>- React + Vite frontend development and data visualizations<br>- Automated integration test suite development<br>- Docker containerization, CI/CD pipeline, and DBMS viva documentation |

---

## 6. Technology Stack

| Layer | Technology | Justification |
|---|---|---|
| **Frontend** | React (v18) + Vite | Fast, responsive Single Page Application with clean student aesthetic. |
| **Backend** | Node.js + Express (v4) | Lightweight, modular REST API server with centralized error handling. |
| **Database** | MySQL 8.0 | Robust relational database supporting views, triggers, procedures, and window functions. |
| **ORM** | Prisma ORM (v5) | Type-safe database queries, migrations, relationships, and transaction management. |
| **Authentication** | JWT + BCrypt.js | Stateless bearer token authentication and salted password hashing. |
| **Testing** | Jest + Supertest | Automated integration tests for authentication, RBAC, transactions, and SLA. |
| **DevOps / CI/CD** | Docker + GitHub Actions | Containerized MySQL environment and automated CI build/test workflow. |

---

## 7. Major Deliverables
1. **Relational Database Schema:** Fully normalized (3NF) MySQL database with 13 tables, foreign key constraints, and performance indexes.
2. **Database Automation Objects:**
   - 5 Analytical Views (`street_fairness_view`, `delivery_priority_view`, `complaint_sla_view`, `operator_dispute_view`, `monthly_tanker_usage_view`).
   - 2 Stored Procedures (`calculate_street_fairness`, `generate_delivery_priority`).
   - 2 Active Triggers (`trg_delivery_dispute_insert`, `trg_water_level_reading_insert`).
3. **Full-Stack Web Application:**
   - Responsive web dashboard for Admin, Tanker Operator, and Resident.
   - Public transparency portal accessible without login.
   - Complete CRUD operations across all entities.
4. **Industry Best Practice Test Suite:** Automated Jest test suite testing core DBMS workflows.
5. **Project Documentation:** ER diagram, relational schema, data dictionary, SQL reports, backup/restore scripts, and DBMS viva preparation notes.

---

## 8. Simple Gantt Chart

| Task / Milestone | Week 1 | Week 2 | Week 3 | Week 4 | Week 5 |
|---|:---:|:---:|:---:|:---:|:---:|
| Problem Analysis & Requirements Specification | ✓ | | | | |
| ER Modeling & 3NF Schema Normalization | ✓ | ✓ | | | |
| Database Implementation (DDL, Views, Procedures, Triggers) | | ✓ | ✓ | | |
| Backend API Development & Prisma ORM Integration | | | ✓ | ✓ | |
| Frontend React UI & Role-Based Dashboards | | | ✓ | ✓ | |
| Integration Testing & Disaster Recovery Scripts | | | | ✓ | ✓ |
| Docker Containerization, CI/CD Pipeline & Final Viva Docs | | | | | ✓ |
