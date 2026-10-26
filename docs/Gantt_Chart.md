# JalNyaya - Project Implementation Gantt Chart

The project followed a disciplined 5-week development lifecycle to satisfy all academic requirements for the B.Tech Database Systems Laboratory assessment.

```text
========================================================================================
Activity / Milestone                        | W1 | W2 | W3 | W4 | W5 | Deliverable
========================================================================================
1. Problem Analysis & Domain Study           | ██ |    |    |    |    | Project Proposal
2. Entity-Relationship (ER) Design           | ██ | ██ |    |    |    | ER Diagram & Relational Schema
3. Normalization (1NF, 2NF, 3NF Proof)      |    | ██ |    |    |    | Data Dictionary & Docs
4. DDL & Database Setup (MySQL 8.0)          |    | ██ | ██ |    |    | Prisma Schema & DB Push
5. Advanced SQL (Views, Stored Procs, Trgs)  |    |    | ██ |    |    | views.sql, procedures.sql, triggers.sql
6. Realistic Seeding (Tamil Nadu Dataset)    |    |    | ██ |    |    | seed.js
7. Express Backend & RBAC Middleware         |    |    | ██ | ██ |    | REST API Routes & Controllers
8. Multi-Step ACID Transaction Implementation|    |    |    | ██ |    | Delivery Transaction Engine
9. React + Vite Frontend & Dashboards        |    |    |    | ██ | ██ | Single Page Application
10. Automated Integration Testing            |    |    |    |    | ██ | Jest Test Suite (Best Practice)
11. Backup & Recovery Scripts                |    |    |    |    | ██ | mysqldump & restore.bat
12. Docker, CI/CD Pipeline & Final Viva Docs |    |    |    |    | ██ | Dockerfile, CI Workflow & Viva Guide
========================================================================================
```

### Detailed Phase Breakdown

- **Week 1: Conceptualization & Requirements Specification**
  - Formulated problem statement for water-scarce semi-urban wards in Tamil Nadu.
  - Defined system scope, actors (Admin, Operator, Resident), and core equity metrics.
- **Week 2: Database Modeling & Normalization**
  - Designed Entity-Relationship diagram with 13 entities and primary/foreign key mappings.
  - Performed formal 1NF, 2NF, and 3NF normalization proofs to eliminate redundancy.
  - Compiled comprehensive Data Dictionary.
- **Week 3: Database Implementation & Advanced Programmability**
  - Configured MySQL 8.0 container and Prisma ORM schema.
  - Implemented analytical database views (`street_fairness_view`, `delivery_priority_view`, etc.).
  - Authored stored procedures (`calculate_street_fairness`) and automation triggers (`trg_delivery_dispute_insert`).
  - Seeded realistic Tamil Nadu panchayat dataset.
- **Week 4: API & Frontend Development**
  - Developed Express REST API with JWT authentication and Role-Based Access Control.
  - Programmed ACID database transaction for tanker delivery completion.
  - Built responsive React UI with custom student styling, tables, forms, and charts.
- **Week 5: Quality Assurance, DevOps & Evaluation Preparation**
  - Created automated Jest test suite covering authentication, RBAC, and transactions.
  - Engineered native MySQL backup and recovery automation scripts.
  - Setup Dockerfile, docker-compose, and GitHub Actions CI workflow.
  - Compiled comprehensive DBMS Viva preparation guide.
