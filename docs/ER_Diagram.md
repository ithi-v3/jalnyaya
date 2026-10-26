# JalNyaya - Entity-Relationship (ER) Diagram

This document presents the complete Entity-Relationship diagram for the **JalNyaya Water Tanker Distribution & Equity Tracker**. Every implemented table in the database is represented with its primary keys, foreign keys, attributes, and relationship cardinality.

---

## 1. Mermaid Entity-Relationship Diagram

```mermaid
erDiagram
    ROLES ||--o{ USERS : "assigned to"
    ZONES ||--o{ STREETS : "encompasses"
    STREETS ||--o{ USERS : "resides in"
    STREETS ||--o{ HOUSEHOLDS : "contains"
    STREETS ||--o{ DELIVERIES : "receives"
    STREETS ||--o{ COMPLAINTS : "originates from"
    
    USERS ||--o{ TANKERS : "operates / drives"
    USERS ||--o{ DELIVERIES : "executes as operator"
    USERS ||--o{ DELIVERY_CONFIRMATIONS : "confirms as resident"
    USERS ||--o{ COMPLAINTS : "files as resident"
    USERS ||--o{ COMPLAINTS : "assigned as operator"
    USERS ||--o{ WATER_LEVEL_READINGS : "records"

    TANKERS ||--o{ DELIVERIES : "fulfills"
    DELIVERIES ||--o{ DELIVERY_CONFIRMATIONS : "verified by"
    DELIVERIES ||--o{ COMPLAINTS : "relates to"
    DELIVERIES ||--o{ PAYMENTS : "billed under"
    DELIVERIES ||--o{ ALERTS : "triggers dispute"

    WATER_SOURCES ||--o{ WATER_LEVEL_READINGS : "measures"
    WATER_SOURCES ||--o{ ALERTS : "triggers depletion"

    ROLES {
        int role_id PK
        string role_name UK "RESIDENT, OPERATOR, ADMIN"
        string description
    }

    ZONES {
        int zone_id PK
        string zone_name UK
        string description
    }

    STREETS {
        int street_id PK
        string street_name
        string area_name
        string panchayat_name
        int population
        int household_count
        int zone_id FK
        datetime last_delivery_date
        float priority_score
        datetime created_at
    }

    USERS {
        int user_id PK
        string name
        string email UK
        string phone
        string password_hash
        int role_id FK
        int street_id FK "nullable"
        boolean is_active
        datetime created_at
        datetime updated_at
    }

    HOUSEHOLDS {
        int household_id PK
        int street_id FK
        string head_name
        int members_count
        string phone
        int water_requirement
        datetime created_at
        datetime updated_at
    }

    TANKERS {
        int tanker_id PK
        string vehicle_number UK
        int capacity_litres
        int operator_id FK
        string status "AVAILABLE, IN_TRANSIT, MAINTENANCE, OUT_OF_SERVICE"
        datetime last_service_date
        datetime created_at
    }

    DELIVERIES {
        int delivery_id PK
        int tanker_id FK
        int street_id FK
        int operator_id FK
        datetime scheduled_date
        datetime delivery_date
        int quantity_litres
        string status "SCHEDULED, COMPLETED, CANCELLED, DISPUTED"
        string notes
        datetime created_at
        datetime updated_at
    }

    DELIVERY_CONFIRMATIONS {
        int confirmation_id PK
        int delivery_id FK
        int resident_id FK
        boolean confirmed "true=Confirmed, false=Not Received"
        datetime confirmation_time
        string remarks
    }

    COMPLAINTS {
        int complaint_id PK
        int resident_id FK
        int street_id FK
        int delivery_id FK "nullable"
        string complaint_type
        string description
        string status "OPEN, IN_PROGRESS, RESOLVED"
        string priority "LOW, MEDIUM, HIGH, URGENT"
        datetime created_at
        datetime resolved_at
        int assigned_operator_id FK "nullable"
    }

    WATER_SOURCES {
        int source_id PK
        string source_name
        string source_type "BOREWELL, OPEN_WELL, RESERVOIR, OVERHEAD_TANK"
        string location
        int capacity_litres
        int current_level_litres
        string status "ACTIVE, DEPLETED, MAINTENANCE"
        datetime created_at
    }

    WATER_LEVEL_READINGS {
        int reading_id PK
        int source_id FK
        datetime reading_date
        int level_litres
        float percentage_level
        int recorded_by FK
    }

    ALERTS {
        int alert_id PK
        int source_id FK "nullable"
        int delivery_id FK "nullable"
        string alert_type "LOW_WATER_LEVEL, CRITICAL_WATER_LEVEL, DELIVERY_DISPUTE, SLA_BREACH"
        string message
        string severity "INFO, WARNING, CRITICAL"
        datetime created_at
        boolean resolved
    }

    PAYMENTS {
        int payment_id PK
        int delivery_id FK
        decimal amount "INR ₹"
        datetime payment_date
        string payment_method "PANCHAYAT_VOUCHER, UPI, BANK_TRANSFER, CASH"
        string payment_status "PAID, PENDING, FAILED"
        string reference_number UK
    }
```

---

## 2. Table Summary & Cardinality Analysis

| Relationship | Type | Cardinality | Explanation |
|---|:---:|:---:|---|
| **Roles → Users** | One-to-Many | `1 : N` | One system role is assigned to many users. A user has exactly one role. |
| **Zones → Streets** | One-to-Many | `1 : N` | An administrative zone covers multiple streets. A street belongs to one zone. |
| **Streets → Households** | One-to-Many | `1 : N` | A street contains multiple consumer households. A household belongs to one street. |
| **Streets → Deliveries** | One-to-Many | `1 : N` | A street receives multiple tanker deliveries over time. |
| **Users (Operator) → Tankers** | One-to-Many | `1 : N` | A driver-operator can be assigned one or more tankers in the panchayat fleet. |
| **Tankers → Deliveries** | One-to-Many | `1 : N` | A tanker carries out multiple delivery trips. |
| **Deliveries → Confirmations** | One-to-Many | `1 : N` | A completed delivery can be confirmed or disputed by resident representatives. |
| **Deliveries → Payments** | One-to-Many | `1 : N` | Each delivery trip generates a payment voucher or receipt record. |
| **WaterSources → Readings** | One-to-Many | `1 : N` | A water source accumulates periodic time-series depth/volume readings. |
| **Complaints → Users / Streets** | Many-to-One | `N : 1` | Multiple residents can lodge complaints originating from their respective streets. |
