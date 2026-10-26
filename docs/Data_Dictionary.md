# JalNyaya - Comprehensive Data Dictionary

This data dictionary documents all 13 relational tables, column data types, key constraints, nullability, defaults, and functional descriptions.

| Table | Column | Data Type | Key | Nullable | Default | Description |
|---|---|---|:---:|:---:|---|---|
| **roles** | `role_id` | INT | PK | NO | AUTO_INCREMENT | Unique identifier for role entity |
| roles | `role_name` | VARCHAR(50) | UK | NO | - | Role name (ADMIN, OPERATOR, RESIDENT) |
| roles | `description` | VARCHAR(255) | - | YES | NULL | Description of responsibilities and permissions |
| **zones** | `zone_id` | INT | PK | NO | AUTO_INCREMENT | Unique identifier for administrative zone |
| zones | `zone_name` | VARCHAR(100) | UK | NO | - | Descriptive name of village/town zone |
| zones | `description` | VARCHAR(255) | - | YES | NULL | Geographic boundary notes |
| **streets** | `street_id` | INT | PK | NO | AUTO_INCREMENT | Unique street identifier |
| streets | `street_name` | VARCHAR(120) | - | NO | - | Official street / salai name |
| streets | `area_name` | VARCHAR(120) | - | NO | - | Locality / village section |
| streets | `panchayat_name` | VARCHAR(120) | - | NO | - | Governing village town panchayat |
| streets | `population` | INT | - | NO | - | Total resident population |
| streets | `household_count` | INT | - | NO | - | Number of registered households |
| streets | `zone_id` | INT | FK | NO | - | Reference to zones(zone_id) |
| streets | `last_delivery_date` | DATETIME | - | YES | NULL | Timestamp of most recent completed delivery |
| streets | `priority_score` | FLOAT | - | NO | 0.0 | Dynamic need priority score |
| streets | `created_at` | DATETIME | - | NO | CURRENT_TIMESTAMP | Street registration date |
| **users** | `user_id` | INT | PK | NO | AUTO_INCREMENT | Unique user account identifier |
| users | `name` | VARCHAR(100) | - | NO | - | Full legal name of user |
| users | `email` | VARCHAR(120) | UK | NO | - | Unique login email address |
| users | `phone` | VARCHAR(20) | - | NO | - | Contact phone number |
| users | `password_hash` | VARCHAR(255) | - | NO | - | BCrypt salted password hash |
| users | `role_id` | INT | FK | NO | - | Reference to roles(role_id) |
| users | `street_id` | INT | FK | YES | NULL | Associated street for residents (FK to streets) |
| users | `is_active` | BOOLEAN | - | NO | TRUE | Account status flag |
| users | `created_at` | DATETIME | - | NO | CURRENT_TIMESTAMP | Account creation timestamp |
| users | `updated_at` | DATETIME | - | NO | CURRENT_TIMESTAMP | Last profile update timestamp |
| **households** | `household_id` | INT | PK | NO | AUTO_INCREMENT | Unique household consumer identifier |
| households | `street_id` | INT | FK | NO | - | Reference to streets(street_id) |
| households | `head_name` | VARCHAR(100) | - | NO | - | Name of head of household |
| households | `members_count` | INT | - | NO | - | Count of family members residing (CHECK > 0) |
| households | `phone` | VARCHAR(20) | - | NO | - | Primary contact phone |
| households | `water_requirement`| INT | - | NO | - | Estimated daily requirement in litres (CHECK > 0) |
| households | `created_at` | DATETIME | - | NO | CURRENT_TIMESTAMP | Registration timestamp |
| households | `updated_at` | DATETIME | - | NO | CURRENT_TIMESTAMP | Last update timestamp |
| **tankers** | `tanker_id` | INT | PK | NO | AUTO_INCREMENT | Unique tanker vehicle identifier |
| tankers | `vehicle_number` | VARCHAR(20) | UK | NO | - | Vehicle registration number (e.g. TN-38-AF-4012) |
| tankers | `capacity_litres` | INT | - | NO | - | Tanker payload capacity in litres (CHECK > 0) |
| tankers | `operator_id` | INT | FK | NO | - | Assigned driver-operator FK to users(user_id) |
| tankers | `status` | VARCHAR(30) | - | NO | 'AVAILABLE' | Fleet status (AVAILABLE, IN_TRANSIT, MAINTENANCE) |
| tankers | `last_service_date`| DATETIME | - | YES | NULL | Date of last maintenance service inspection |
| tankers | `created_at` | DATETIME | - | NO | CURRENT_TIMESTAMP | Induction timestamp |
| **deliveries** | `delivery_id` | INT | PK | NO | AUTO_INCREMENT | Unique delivery trip identifier |
| deliveries | `tanker_id` | INT | FK | NO | - | Reference to tankers(tanker_id) |
| deliveries | `street_id` | INT | FK | NO | - | Reference to streets(street_id) |
| deliveries | `operator_id` | INT | FK | NO | - | Driver executing delivery FK to users(user_id) |
| deliveries | `scheduled_date` | DATETIME | - | NO | - | Planned delivery dispatch date |
| deliveries | `delivery_date` | DATETIME | - | YES | NULL | Actual timestamp when completed |
| deliveries | `quantity_litres` | INT | - | NO | - | Volume delivered in litres (CHECK > 0) |
| deliveries | `status` | VARCHAR(30) | - | NO | 'SCHEDULED' | Status: SCHEDULED, COMPLETED, CANCELLED, DISPUTED |
| deliveries | `notes` | TEXT | - | YES | NULL | Driver logs / valve location notes |
| deliveries | `created_at` | DATETIME | - | NO | CURRENT_TIMESTAMP | Schedule creation timestamp |
| deliveries | `updated_at` | DATETIME | - | NO | CURRENT_TIMESTAMP | Last modification timestamp |
| **delivery_confirmations** | `confirmation_id` | INT | PK | NO | AUTO_INCREMENT | Confirmation record identifier |
| delivery_confirmations | `delivery_id` | INT | FK | NO | - | Reference to deliveries(delivery_id) |
| delivery_confirmations | `resident_id` | INT | FK | NO | - | Resident signing FK to users(user_id) |
| delivery_confirmations | `confirmed` | BOOLEAN | - | NO | - | TRUE = Received; FALSE = Dispute (Not Received) |
| delivery_confirmations | `confirmation_time`| DATETIME | - | NO | CURRENT_TIMESTAMP | Verification timestamp |
| delivery_confirmations | `remarks` | VARCHAR(255) | - | YES | NULL | Resident observations on supply |
| **complaints** | `complaint_id` | INT | PK | NO | AUTO_INCREMENT | Unique grievance ticket identifier |
| complaints | `resident_id` | INT | FK | NO | - | Resident filing FK to users(user_id) |
| complaints | `street_id` | INT | FK | NO | - | Location FK to streets(street_id) |
| complaints | `delivery_id` | INT | FK | YES | NULL | Optional reference to specific delivery trip |
| complaints | `complaint_type` | VARCHAR(50) | - | NO | - | Category (MISSED_DELIVERY, WATER_QUALITY, etc.) |
| complaints | `description` | TEXT | - | NO | - | Detailed description of grievance |
| complaints | `status` | VARCHAR(30) | - | NO | 'OPEN' | Ticket status (OPEN, IN_PROGRESS, RESOLVED) |
| complaints | `priority` | VARCHAR(20) | - | NO | 'MEDIUM' | Priority level (LOW, MEDIUM, HIGH, URGENT) |
| complaints | `created_at` | DATETIME | - | NO | CURRENT_TIMESTAMP | Timestamp when grievance lodged |
| complaints | `resolved_at` | DATETIME | - | YES | NULL | Timestamp when resolution recorded |
| complaints | `assigned_operator_id`| INT | FK | YES | NULL | Operator assigned to inspect FK to users(user_id) |
| **water_sources** | `source_id` | INT | PK | NO | AUTO_INCREMENT | Unique water source identifier |
| water_sources | `source_name` | VARCHAR(120) | - | NO | - | Official source name (e.g. Siruvani Reservoir) |
| water_sources | `source_type` | VARCHAR(50) | - | NO | - | Type: BOREWELL, OPEN_WELL, RESERVOIR, TANK |
| water_sources | `location` | VARCHAR(150) | - | NO | - | Physical location or survey parcel |
| water_sources | `capacity_litres`| INT | - | NO | - | Maximum storage capacity (CHECK > 0) |
| water_sources | `current_level_litres`| INT | - | NO | - | Current measured water reserve (CHECK >= 0) |
| water_sources | `status` | VARCHAR(30) | - | NO | 'ACTIVE' | Status: ACTIVE, DEPLETED, MAINTENANCE |
| water_sources | `created_at` | DATETIME | - | NO | CURRENT_TIMESTAMP | Source commissioning date |
| **water_level_readings** | `reading_id` | INT | PK | NO | AUTO_INCREMENT | Reading measurement identifier |
| water_level_readings | `source_id` | INT | FK | NO | - | Reference to water_sources(source_id) |
| water_level_readings | `reading_date` | DATETIME | - | NO | CURRENT_TIMESTAMP | Measurement timestamp |
| water_level_readings | `level_litres` | INT | - | NO | - | Measured volume in litres (CHECK >= 0) |
| water_level_readings | `percentage_level`| FLOAT | - | NO | - | Percentage of capacity (0.0 to 100.0) |
| water_level_readings | `recorded_by` | INT | FK | NO | - | Official logging reading FK to users(user_id) |
| **alerts** | `alert_id` | INT | PK | NO | AUTO_INCREMENT | Automated alarm identifier |
| alerts | `source_id` | INT | FK | YES | NULL | Water source triggering alarm FK |
| alerts | `delivery_id` | INT | FK | YES | NULL | Delivery triggering dispute alarm FK |
| alerts | `alert_type` | VARCHAR(50) | - | NO | - | LOW_WATER_LEVEL, CRITICAL_WATER_LEVEL, DISPUTE |
| alerts | `message` | TEXT | - | NO | - | Detailed alert notification message |
| alerts | `severity` | VARCHAR(20) | - | NO | 'WARNING' | Severity level (INFO, WARNING, CRITICAL) |
| alerts | `created_at` | DATETIME | - | NO | CURRENT_TIMESTAMP | Alarm trigger timestamp |
| alerts | `resolved` | BOOLEAN | - | NO | FALSE | Alarm resolution status flag |
| **payments** | `payment_id` | INT | PK | NO | AUTO_INCREMENT | Financial ledger receipt identifier |
| payments | `delivery_id` | INT | FK | NO | - | Delivery linked FK to deliveries(delivery_id) |
| payments | `amount` | DECIMAL(10,2) | - | NO | - | Monetary amount in ₹ INR (CHECK >= 0) |
| payments | `payment_date` | DATETIME | - | NO | CURRENT_TIMESTAMP | Transaction timestamp |
| payments | `payment_method`| VARCHAR(30) | - | NO | - | PANCHAYAT_VOUCHER, UPI, BANK_TRANSFER, CASH |
| payments | `payment_status`| VARCHAR(30) | - | NO | 'PAID' | Transaction status (PAID, PENDING, FAILED) |
| payments | `reference_number`| VARCHAR(80) | UK | YES | NULL | Bank or voucher audit reference string |
