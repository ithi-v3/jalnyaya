# JalNyaya - DBMS Queries & Advanced Analytical Demonstrations

This document presents the 13 official SQL analytical queries implemented in `database/reports.sql` and used across the backend API, detailing the core database management concepts demonstrated by each query.

---

### Query 1: Streets With Fewest Deliveries
- **DBMS Concept:** `LEFT OUTER JOIN` Preservation.
- **Demonstration:** An `INNER JOIN` between `streets` and `deliveries` would silently eliminate streets that have never received a tanker delivery. Using `LEFT JOIN` guarantees that streets with zero deliveries (such as Rajaji Avenue) are preserved in the result set with `COUNT = 0`.
```sql
SELECT 
    s.street_id, s.street_name, s.area_name, s.panchayat_name, s.population, s.household_count,
    COUNT(d.delivery_id) AS total_deliveries,
    COALESCE(SUM(CASE WHEN d.status = 'COMPLETED' THEN d.quantity_litres ELSE 0 END), 0) AS total_litres_delivered
FROM streets s
LEFT JOIN deliveries d ON s.street_id = d.street_id
GROUP BY s.street_id, s.street_name, s.area_name, s.panchayat_name, s.population, s.household_count
ORDER BY total_deliveries ASC, s.population DESC;
```

---

### Query 2: Streets With Exactly Zero Deliveries
- **DBMS Concept:** Outer Join Anti-Pattern (`WHERE d.delivery_id IS NULL`).
- **Demonstration:** Identifies completely neglected localities requiring urgent emergency relief.
```sql
SELECT 
    s.street_id, s.street_name, s.area_name, s.panchayat_name, s.population, s.household_count, z.zone_name
FROM streets s
JOIN zones z ON s.zone_id = z.zone_id
LEFT JOIN deliveries d ON s.street_id = d.street_id
WHERE d.delivery_id IS NULL
ORDER BY s.population DESC;
```

---

### Query 3: Street Fairness Ranking
- **DBMS Concept:** Common Table Expressions (CTE) + Analytical Window Function `RANK() OVER (...)`.
- **Demonstration:** Computes per-capita litres received ($\text{total\_litres} / \text{population}$), benchmarks each street against the panchayat average, and ranks streets from most underserved (`RANK #1`) to most serviced.
```sql
WITH StreetMetrics AS (
    SELECT 
        s.street_id, s.street_name, s.area_name, s.population,
        COALESCE(SUM(CASE WHEN d.status = 'COMPLETED' THEN d.quantity_litres ELSE 0 END), 0) AS total_litres,
        ROUND(CAST(COALESCE(SUM(CASE WHEN d.status = 'COMPLETED' THEN d.quantity_litres ELSE 0 END), 0) AS DECIMAL(12,2)) / NULLIF(s.population, 0), 2) AS litres_per_person
    FROM streets s
    LEFT JOIN deliveries d ON s.street_id = d.street_id
    GROUP BY s.street_id, s.street_name, s.area_name, s.population
),
PanchayatAvg AS (
    SELECT ROUND(AVG(litres_per_person), 2) AS benchmark_avg FROM StreetMetrics
)
SELECT 
    m.street_id, m.street_name, m.area_name, m.population, m.total_litres, m.litres_per_person,
    p.benchmark_avg,
    ROUND((m.litres_per_person / NULLIF(p.benchmark_avg, 0)) * 100, 1) AS fairness_percentage,
    CASE 
        WHEN (m.litres_per_person / NULLIF(p.benchmark_avg, 0)) * 100 >= 100 THEN 'GOOD'
        WHEN (m.litres_per_person / NULLIF(p.benchmark_avg, 0)) * 100 >= 70 THEN 'BELOW AVERAGE'
        ELSE 'CRITICAL'
    END AS equity_status,
    RANK() OVER (ORDER BY m.litres_per_person ASC) AS priority_need_rank
FROM StreetMetrics m
CROSS JOIN PanchayatAvg p
ORDER BY m.litres_per_person ASC;
```

---

### Query 4: Operator Dispute Rate & Audit Ranking
- **DBMS Concept:** Conditional Aggregation + Window Function `DENSE_RANK()`.
- **Demonstration:** Computes ratio of disputed deliveries ($\text{disputed} / \text{total} \times 100$) to detect driver misconduct or fraudulent loggings.
```sql
SELECT 
    u.user_id AS operator_id, u.name AS operator_name, u.phone AS operator_phone,
    COUNT(d.delivery_id) AS total_deliveries,
    COUNT(CASE WHEN d.status = 'COMPLETED' THEN 1 END) AS completed_deliveries,
    COUNT(CASE WHEN d.status = 'DISPUTED' THEN 1 END) AS disputed_deliveries,
    ROUND(
        (COUNT(CASE WHEN d.status = 'DISPUTED' THEN 1 END) * 100.0) / 
        NULLIF(COUNT(CASE WHEN d.status IN ('COMPLETED', 'DISPUTED') THEN 1 END), 0),
        2
    ) AS dispute_rate_percentage,
    DENSE_RANK() OVER (
        ORDER BY 
            (COUNT(CASE WHEN d.status = 'DISPUTED' THEN 1 END) * 100.0) / 
            NULLIF(COUNT(CASE WHEN d.status IN ('COMPLETED', 'DISPUTED') THEN 1 END), 0) DESC
    ) AS dispute_risk_rank
FROM users u
JOIN roles r ON u.role_id = r.role_id AND r.role_name = 'OPERATOR'
LEFT JOIN deliveries d ON u.user_id = d.operator_id
GROUP BY u.user_id, u.name, u.phone
HAVING total_deliveries > 0
ORDER BY dispute_rate_percentage DESC;
```

---

### Query 5: Complaints Exceeding 48-Hour SLA (5-Table Join)
- **DBMS Concept:** Multi-Table Relational Join with Temporal Calculations.
- **Demonstration:** Joins `complaints`, `users` (residents), `streets`, `users` (assigned operators), and `deliveries`, filtering on `TIMESTAMPDIFF(HOUR, created_at, NOW()) > 48`.
```sql
SELECT 
    c.complaint_id, c.complaint_type, res.name AS resident_name, res.phone AS resident_phone,
    s.street_name, c.priority, c.created_at,
    ROUND(TIMESTAMPDIFF(MINUTE, c.created_at, COALESCE(c.resolved_at, NOW())) / 60.0, 1) AS hours_elapsed,
    op.name AS assigned_operator_name
FROM complaints c
JOIN users res ON c.resident_id = res.user_id
JOIN streets s ON c.street_id = s.street_id
LEFT JOIN users op ON c.assigned_operator_id = op.user_id
LEFT JOIN deliveries d ON c.delivery_id = d.delivery_id
WHERE (c.status IN ('OPEN', 'IN_PROGRESS') AND TIMESTAMPDIFF(HOUR, c.created_at, NOW()) > 48)
   OR (c.status = 'RESOLVED' AND TIMESTAMPDIFF(HOUR, c.created_at, c.resolved_at) > 48)
ORDER BY hours_elapsed DESC;
```

---

### Query 6: Total Volume Delivered with HAVING Threshold
- **DBMS Concept:** `HAVING` clause filtering aggregated sums.
- **Demonstration:** `WHERE` filters rows before aggregation; `HAVING` filters aggregated groups (`total_litres >= 10000`).
```sql
SELECT 
    s.street_id, s.street_name, s.area_name,
    COUNT(d.delivery_id) AS delivery_count,
    SUM(d.quantity_litres) AS total_litres
FROM streets s
JOIN deliveries d ON s.street_id = d.street_id
WHERE d.status = 'COMPLETED'
GROUP BY s.street_id, s.street_name, s.area_name
HAVING total_litres >= 10000
ORDER BY total_litres DESC;
```
