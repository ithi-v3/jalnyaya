# JalNyaya - Relational Schema & 3NF Normalization Analysis

## 1. Formal Relational Schema Representation

Underlined attributes denote **Primary Keys (PK)**. Attributes in bold italics denote **Foreign Keys (FK)**.

1. **`roles`** (
   <ins>role_id</ins>,
   role_name [UNIQUE],
   description
)

2. **`zones`** (
   <ins>zone_id</ins>,
   zone_name [UNIQUE],
   description
)

3. **`streets`** (
   <ins>street_id</ins>,
   street_name,
   area_name,
   panchayat_name,
   population,
   household_count,
   ***zone_id*** $\rightarrow$ `zones`(<ins>zone_id</ins>),
   last_delivery_date,
   priority_score,
   created_at
)

4. **`users`** (
   <ins>user_id</ins>,
   name,
   email [UNIQUE],
   phone,
   password_hash,
   ***role_id*** $\rightarrow$ `roles`(<ins>role_id</ins>),
   ***street_id*** $\rightarrow$ `streets`(<ins>street_id</ins>) [NULLABLE],
   is_active,
   created_at,
   updated_at
)

5. **`households`** (
   <ins>household_id</ins>,
   ***street_id*** $\rightarrow$ `streets`(<ins>street_id</ins>),
   head_name,
   members_count,
   phone,
   water_requirement,
   created_at,
   updated_at
)

6. **`tankers`** (
   <ins>tanker_id</ins>,
   vehicle_number [UNIQUE],
   capacity_litres,
   ***operator_id*** $\rightarrow$ `users`(<ins>user_id</ins>),
   status,
   last_service_date,
   created_at
)

7. **`deliveries`** (
   <ins>delivery_id</ins>,
   ***tanker_id*** $\rightarrow$ `tankers`(<ins>tanker_id</ins>),
   ***street_id*** $\rightarrow$ `streets`(<ins>street_id</ins>),
   ***operator_id*** $\rightarrow$ `users`(<ins>user_id</ins>),
   scheduled_date,
   delivery_date,
   quantity_litres,
   status,
   notes,
   created_at,
   updated_at
)

8. **`delivery_confirmations`** (
   <ins>confirmation_id</ins>,
   ***delivery_id*** $\rightarrow$ `deliveries`(<ins>delivery_id</ins>),
   ***resident_id*** $\rightarrow$ `users`(<ins>user_id</ins>),
   confirmed,
   confirmation_time,
   remarks
)

9. **`complaints`** (
   <ins>complaint_id</ins>,
   ***resident_id*** $\rightarrow$ `users`(<ins>user_id</ins>),
   ***street_id*** $\rightarrow$ `streets`(<ins>street_id</ins>),
   ***delivery_id*** $\rightarrow$ `deliveries`(<ins>delivery_id</ins>) [NULLABLE],
   complaint_type,
   description,
   status,
   priority,
   created_at,
   resolved_at,
   ***assigned_operator_id*** $\rightarrow$ `users`(<ins>user_id</ins>) [NULLABLE]
)

10. **`water_sources`** (
    <ins>source_id</ins>,
    source_name,
    source_type,
    location,
    capacity_litres,
    current_level_litres,
    status,
    created_at
)

11. **`water_level_readings`** (
    <ins>reading_id</ins>,
    ***source_id*** $\rightarrow$ `water_sources`(<ins>source_id</ins>),
    reading_date,
    level_litres,
    percentage_level,
    ***recorded_by*** $\rightarrow$ `users`(<ins>user_id</ins>)
)

12. **`alerts`** (
    <ins>alert_id</ins>,
    ***source_id*** $\rightarrow$ `water_sources`(<ins>source_id</ins>) [NULLABLE],
    ***delivery_id*** $\rightarrow$ `deliveries`(<ins>delivery_id</ins>) [NULLABLE],
    alert_type,
    message,
    severity,
    created_at,
    resolved
)

13. **`payments`** (
    <ins>payment_id</ins>,
    ***delivery_id*** $\rightarrow$ `deliveries`(<ins>delivery_id</ins>),
    amount,
    payment_date,
    payment_method,
    payment_status,
    reference_number [UNIQUE]
)

---

## 2. Normalization Analysis (1NF, 2NF, 3NF Proof)

### First Normal Form (1NF)
A relation is in 1NF if and only if all underlying domains contain only atomic (indivisible) values, and there are no repeating groups.
- **Proof in JalNyaya:**
  - All attributes store single atomic values (integers, strings, floats, timestamps, booleans).
  - Multi-valued attributes (such as multiple household members, multiple tanker deliveries, or multiple resident complaints) are **never** stored as comma-delimited strings in a single row. Instead, separate child tables (`households`, `deliveries`, `complaints`) model each instance with dedicated foreign keys.

### Second Normal Form (2NF)
A relation is in 2NF if it is in 1NF and every non-prime attribute is fully functionally dependent on the entire primary key (no partial functional dependencies).
- **Proof in JalNyaya:**
  - All tables utilize single-column integer surrogate primary keys (`user_id`, `delivery_id`, `street_id`, etc.).
  - Because no composite primary keys exist in our core entities, partial functional dependencies (where a non-key attribute depends on only a subset of the primary key) are mathematically impossible.
  - Every non-key attribute depends directly on the entire primary key.

### Third Normal Form (3NF)
A relation is in 3NF if it is in 2NF and no non-prime attribute is transitively dependent on the primary key (no transitive functional dependency $X \rightarrow Y \rightarrow Z$).
- **Proof in JalNyaya:**
  - **Streets vs Deliveries:** In `deliveries`, we store only `street_id`. We do **NOT** store `street_name`, `area_name`, `panchayat_name`, or `population` inside the `deliveries` record. Storing `population` in `deliveries` would cause a transitive dependency: $\text{delivery\_id} \rightarrow \text{street\_id} \rightarrow \text{population}$. Instead, population is retrieved dynamically via `JOIN`.
  - **Tankers vs Deliveries:** We do not store `tanker_capacity` inside `deliveries`. Instead, `capacity_litres` resides strictly in `tankers`.
  - **Users vs Roles:** We do not duplicate `role_description` inside `users`. Instead, `role_id` references the `roles` table.
  - Therefore, all relations in the JalNyaya database strictly satisfy 3NF.
