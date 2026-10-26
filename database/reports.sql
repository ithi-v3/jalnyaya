-- ============================================================================
-- JalNyaya - SQL Analytical Reports (MySQL 8.0)
-- Demonstrating DBMS Concepts: Joins, Aggregation, GROUP BY, HAVING, 
-- Subqueries, Common Table Expressions (CTEs), and Window Functions.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Report 1: Streets With Fewest Deliveries (LEFT JOIN + GROUP BY + ASC Order)
-- DBMS Concept: LEFT OUTER JOIN ensures streets with 0 deliveries are NOT excluded.
-- ----------------------------------------------------------------------------
SELECT 
    s.street_id,
    s.street_name,
    s.area_name,
    s.panchayat_name,
    s.population,
    s.household_count,
    COUNT(d.delivery_id) AS total_deliveries,
    COALESCE(SUM(CASE WHEN d.status = 'COMPLETED' THEN d.quantity_litres ELSE 0 END), 0) AS total_litres_delivered
FROM streets s
LEFT JOIN deliveries d ON s.street_id = d.street_id
GROUP BY s.street_id, s.street_name, s.area_name, s.panchayat_name, s.population, s.household_count
ORDER BY total_deliveries ASC, s.population DESC;


-- ----------------------------------------------------------------------------
-- Report 2: Streets With Exactly Zero Deliveries (LEFT JOIN + IS NULL Filter)
-- DBMS Concept: Outer Join Anti-Pattern (finding unmatched rows).
-- ----------------------------------------------------------------------------
SELECT 
    s.street_id,
    s.street_name,
    s.area_name,
    s.panchayat_name,
    s.population,
    s.household_count,
    z.zone_name,
    s.created_at AS street_registered_date
FROM streets s
JOIN zones z ON s.zone_id = z.zone_id
LEFT JOIN deliveries d ON s.street_id = d.street_id
WHERE d.delivery_id IS NULL
ORDER BY s.population DESC;


-- ----------------------------------------------------------------------------
-- Report 3: Street Fairness Ranking (CTE + Window Function RANK())
-- DBMS Concept: Common Table Expressions (WITH clause) & Analytical Window Functions.
-- ----------------------------------------------------------------------------
WITH StreetMetrics AS (
    SELECT 
        s.street_id,
        s.street_name,
        s.area_name,
        s.population,
        COALESCE(SUM(CASE WHEN d.status = 'COMPLETED' THEN d.quantity_litres ELSE 0 END), 0) AS total_litres,
        ROUND(CAST(COALESCE(SUM(CASE WHEN d.status = 'COMPLETED' THEN d.quantity_litres ELSE 0 END), 0) AS DECIMAL(12,2)) / NULLIF(s.population, 0), 2) AS litres_per_person
    FROM streets s
    LEFT JOIN deliveries d ON s.street_id = d.street_id
    GROUP BY s.street_id, s.street_name, s.area_name, s.population
),
PanchayatAvg AS (
    SELECT ROUND(AVG(litres_per_person), 2) AS benchmark_avg
    FROM StreetMetrics
)
SELECT 
    m.street_id,
    m.street_name,
    m.area_name,
    m.population,
    m.total_litres,
    m.litres_per_person,
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


-- ----------------------------------------------------------------------------
-- Report 4: Litres Per Person per Street (Aggregation + Grouping)
-- DBMS Concept: Mathematical expressions in SELECT with NULLIF safety.
-- ----------------------------------------------------------------------------
SELECT 
    s.street_id,
    s.street_name,
    s.area_name,
    s.population,
    COALESCE(SUM(CASE WHEN d.status = 'COMPLETED' THEN d.quantity_litres ELSE 0 END), 0) AS completed_litres,
    ROUND(CAST(COALESCE(SUM(CASE WHEN d.status = 'COMPLETED' THEN d.quantity_litres ELSE 0 END), 0) AS DECIMAL(10,2)) / NULLIF(s.population, 0), 2) AS litres_per_capita
FROM streets s
LEFT JOIN deliveries d ON s.street_id = d.street_id
GROUP BY s.street_id, s.street_name, s.area_name, s.population
ORDER BY litres_per_capita ASC;


-- ----------------------------------------------------------------------------
-- Report 5: Operator Dispute Rate (Aggregation + Window Function DENSE_RANK())
-- DBMS Concept: Conditional aggregation and ratio analysis for audit fraud detection.
-- ----------------------------------------------------------------------------
SELECT 
    u.user_id AS operator_id,
    u.name AS operator_name,
    u.phone AS operator_phone,
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


-- ----------------------------------------------------------------------------
-- Report 6: Average Complaint Resolution Time (GROUP BY + Aggregate AVG/MIN/MAX)
-- DBMS Concept: Multi-dimensional GROUP BY and time-delta aggregation.
-- ----------------------------------------------------------------------------
SELECT 
    c.complaint_type,
    COUNT(*) AS total_resolved,
    ROUND(AVG(TIMESTAMPDIFF(MINUTE, c.created_at, c.resolved_at) / 60.0), 2) AS avg_resolution_hours,
    ROUND(MIN(TIMESTAMPDIFF(MINUTE, c.created_at, c.resolved_at) / 60.0), 2) AS min_resolution_hours,
    ROUND(MAX(TIMESTAMPDIFF(MINUTE, c.created_at, c.resolved_at) / 60.0), 2) AS max_resolution_hours
FROM complaints c
WHERE c.status = 'RESOLVED' AND c.resolved_at IS NOT NULL
GROUP BY c.complaint_type
ORDER BY avg_resolution_hours DESC;


-- ----------------------------------------------------------------------------
-- Report 7: Complaints Exceeding 48-Hour SLA (Multi-table INNER/LEFT JOIN)
-- DBMS Concept: 5-table JOIN (Complaints, Users/Residents, Streets, Deliveries, Users/Operators).
-- ----------------------------------------------------------------------------
SELECT 
    c.complaint_id,
    c.complaint_type,
    res.name AS resident_name,
    res.phone AS resident_phone,
    s.street_name,
    s.area_name,
    c.status AS complaint_status,
    c.priority,
    c.created_at,
    COALESCE(c.resolved_at, NOW()) AS check_timestamp,
    ROUND(TIMESTAMPDIFF(MINUTE, c.created_at, COALESCE(c.resolved_at, NOW())) / 60.0, 1) AS hours_elapsed,
    op.name AS assigned_operator_name,
    d.delivery_id,
    d.status AS delivery_status
FROM complaints c
JOIN users res ON c.resident_id = res.user_id
JOIN streets s ON c.street_id = s.street_id
LEFT JOIN users op ON c.assigned_operator_id = op.user_id
LEFT JOIN deliveries d ON c.delivery_id = d.delivery_id
WHERE (c.status IN ('OPEN', 'IN_PROGRESS') AND TIMESTAMPDIFF(HOUR, c.created_at, NOW()) > 48)
   OR (c.status = 'RESOLVED' AND TIMESTAMPDIFF(HOUR, c.created_at, c.resolved_at) > 48)
ORDER BY hours_elapsed DESC;


-- ----------------------------------------------------------------------------
-- Report 8: Water Source Trends & Depletion History
-- DBMS Concept: Time-series query with Subquery & Correlation.
-- ----------------------------------------------------------------------------
SELECT 
    ws.source_id,
    ws.source_name,
    ws.source_type,
    ws.capacity_litres,
    ws.current_level_litres,
    ROUND((ws.current_level_litres * 100.0) / ws.capacity_litres, 1) AS current_percentage,
    COUNT(r.reading_id) AS total_readings_count,
    ROUND(AVG(r.level_litres), 0) AS average_historical_level,
    MIN(r.level_litres) AS lowest_recorded_level,
    MAX(r.level_litres) AS highest_recorded_level
FROM water_sources ws
LEFT JOIN water_level_readings r ON ws.source_id = r.source_id
GROUP BY ws.source_id, ws.source_name, ws.source_type, ws.capacity_litres, ws.current_level_litres
ORDER BY current_percentage ASC;


-- ----------------------------------------------------------------------------
-- Report 9: Monthly Tanker Utilization (INNER JOIN + Date Formatting + GROUP BY)
-- DBMS Concept: Temporal aggregation by Year-Month.
-- ----------------------------------------------------------------------------
SELECT 
    t.tanker_id,
    t.vehicle_number,
    t.capacity_litres,
    u.name AS operator_name,
    DATE_FORMAT(d.scheduled_date, '%Y-%m') AS operational_month,
    COUNT(d.delivery_id) AS total_trips,
    SUM(CASE WHEN d.status = 'COMPLETED' THEN 1 ELSE 0 END) AS successful_trips,
    SUM(CASE WHEN d.status = 'DISPUTED' THEN 1 ELSE 0 END) AS disputed_trips,
    COALESCE(SUM(CASE WHEN d.status = 'COMPLETED' THEN d.quantity_litres ELSE 0 END), 0) AS total_volume_distributed_litres
FROM tankers t
JOIN users u ON t.operator_id = u.user_id
JOIN deliveries d ON t.tanker_id = d.tanker_id
GROUP BY t.tanker_id, t.vehicle_number, t.capacity_litres, u.name, DATE_FORMAT(d.scheduled_date, '%Y-%m')
ORDER BY operational_month DESC, total_volume_distributed_litres DESC;


-- ----------------------------------------------------------------------------
-- Report 10: Total Litres Delivered Per Street (HAVING Filter on Aggregated Volume)
-- DBMS Concept: HAVING clause to filter aggregate sums.
-- ----------------------------------------------------------------------------
SELECT 
    s.street_id,
    s.street_name,
    s.area_name,
    s.panchayat_name,
    COUNT(d.delivery_id) AS delivery_count,
    SUM(d.quantity_litres) AS total_litres
FROM streets s
JOIN deliveries d ON s.street_id = d.street_id
WHERE d.status = 'COMPLETED'
GROUP BY s.street_id, s.street_name, s.area_name, s.panchayat_name
HAVING total_litres >= 10000
ORDER BY total_litres DESC;


-- ----------------------------------------------------------------------------
-- Report 11: Payment & Revenue Summary by Method (GROUP BY + SUM/AVG)
-- DBMS Concept: Financial aggregation and status distribution in INR (₹).
-- ----------------------------------------------------------------------------
SELECT 
    p.payment_method,
    p.payment_status,
    COUNT(p.payment_id) AS total_transactions,
    SUM(p.amount) AS total_amount_inr,
    ROUND(AVG(p.amount), 2) AS average_amount_inr,
    MIN(p.amount) AS min_amount_inr,
    MAX(p.amount) AS max_amount_inr
FROM payments p
GROUP BY p.payment_method, p.payment_status
ORDER BY total_amount_inr DESC;


-- ----------------------------------------------------------------------------
-- Report 12: Open Complaints Summary by Priority and Street
-- DBMS Concept: Multi-column GROUP BY with active status filter.
-- ----------------------------------------------------------------------------
SELECT 
    s.street_name,
    s.area_name,
    c.priority,
    COUNT(c.complaint_id) AS open_complaint_count
FROM complaints c
JOIN streets s ON c.street_id = s.street_id
WHERE c.status IN ('OPEN', 'IN_PROGRESS')
GROUP BY s.street_name, s.area_name, c.priority
ORDER BY open_complaint_count DESC, c.priority DESC;


-- ----------------------------------------------------------------------------
-- Report 13: Streets With Highest Delivery Priority (Delivery Priority Ranking)
-- DBMS Concept: Complex window ranking with weighted mathematical model.
-- ----------------------------------------------------------------------------
SELECT 
    s.street_id,
    s.street_name,
    s.area_name,
    s.household_count,
    COALESCE(DATEDIFF(NOW(), s.last_delivery_date), 99) AS days_waiting,
    COUNT(CASE WHEN c.status IN ('OPEN', 'IN_PROGRESS') THEN 1 END) AS open_complaints,
    s.priority_score,
    DENSE_RANK() OVER (ORDER BY s.priority_score DESC) AS urgent_dispatch_rank
FROM streets s
LEFT JOIN complaints c ON s.street_id = c.street_id
GROUP BY s.street_id, s.street_name, s.area_name, s.household_count, s.last_delivery_date, s.priority_score
ORDER BY urgent_dispatch_rank ASC;
