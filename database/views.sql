-- ============================================================================
-- JalNyaya - Database Views (MySQL 8.0)
-- ============================================================================

-- 1. Street Fairness View (Core Equity Tracker Novelty)
-- Calculates litres received per person and benchmarks against overall average.
-- Implements RANK() window function.
CREATE OR REPLACE VIEW street_fairness_view AS
WITH street_totals AS (
    SELECT 
        s.street_id,
        s.street_name,
        s.area_name,
        s.panchayat_name,
        s.population,
        s.household_count,
        COALESCE(SUM(CASE WHEN d.status = 'COMPLETED' THEN d.quantity_litres ELSE 0 END), 0) AS total_litres_received,
        COUNT(CASE WHEN d.status = 'COMPLETED' THEN d.delivery_id ELSE NULL END) AS deliveries_count
    FROM streets s
    LEFT JOIN deliveries d ON s.street_id = d.street_id
    GROUP BY s.street_id, s.street_name, s.area_name, s.panchayat_name, s.population, s.household_count
),
with_litres_per_person AS (
    SELECT 
        st.*,
        ROUND(CAST(st.total_litres_received AS DECIMAL(12,2)) / NULLIF(st.population, 0), 2) AS litres_per_person
    FROM street_totals st
),
overall_stats AS (
    SELECT 
        COALESCE(ROUND(AVG(litres_per_person), 2), 0.00) AS overall_average_litres_per_person
    FROM with_litres_per_person
)
SELECT 
    w.street_id,
    w.street_name,
    w.area_name,
    w.panchayat_name,
    w.population,
    w.household_count,
    w.deliveries_count,
    w.total_litres_received,
    COALESCE(w.litres_per_person, 0.00) AS litres_per_person,
    o.overall_average_litres_per_person,
    COALESCE(
        ROUND((w.litres_per_person / NULLIF(o.overall_average_litres_per_person, 0)) * 100, 1),
        0.0
    ) AS fairness_percentage,
    CASE 
        WHEN o.overall_average_litres_per_person = 0 OR w.litres_per_person >= o.overall_average_litres_per_person THEN 'GOOD'
        WHEN (w.litres_per_person / NULLIF(o.overall_average_litres_per_person, 0)) * 100 >= 70.0 THEN 'BELOW AVERAGE'
        ELSE 'CRITICAL'
    END AS fairness_status,
    RANK() OVER (ORDER BY COALESCE(w.litres_per_person, 0) ASC) AS fairness_rank
FROM with_litres_per_person w
CROSS JOIN overall_stats o;

-- 2. Delivery Priority View
-- Computes dynamic prioritization score considering:
-- - Days elapsed since last delivery
-- - Number of households in street
-- - Number of open complaints
-- - Water equity status from street_fairness_view
CREATE OR REPLACE VIEW delivery_priority_view AS
SELECT 
    s.street_id,
    s.street_name,
    s.area_name,
    s.panchayat_name,
    s.household_count,
    s.population,
    COALESCE(DATEDIFF(NOW(), s.last_delivery_date), 99) AS days_waiting,
    COUNT(CASE WHEN c.status IN ('OPEN', 'IN_PROGRESS') THEN c.complaint_id ELSE NULL END) AS open_complaints,
    f.litres_per_person,
    f.fairness_status,
    ROUND(
        (COALESCE(DATEDIFF(NOW(), s.last_delivery_date), 30) * 3.5) +
        (COUNT(CASE WHEN c.status IN ('OPEN', 'IN_PROGRESS') THEN c.complaint_id ELSE NULL END) * 6.0) +
        (s.household_count * 0.4) +
        (CASE 
            WHEN f.fairness_status = 'CRITICAL' THEN 35.0
            WHEN f.fairness_status = 'BELOW AVERAGE' THEN 18.0
            ELSE 0.0 
         END), 
        1
    ) AS priority_score,
    DENSE_RANK() OVER (
        ORDER BY (
            (COALESCE(DATEDIFF(NOW(), s.last_delivery_date), 30) * 3.5) +
            (COUNT(CASE WHEN c.status IN ('OPEN', 'IN_PROGRESS') THEN c.complaint_id ELSE NULL END) * 6.0) +
            (s.household_count * 0.4) +
            (CASE 
                WHEN f.fairness_status = 'CRITICAL' THEN 35.0
                WHEN f.fairness_status = 'BELOW AVERAGE' THEN 18.0
                ELSE 0.0 
             END)
        ) DESC
    ) AS priority_rank
FROM streets s
LEFT JOIN complaints c ON s.street_id = c.street_id
LEFT JOIN street_fairness_view f ON s.street_id = f.street_id
GROUP BY s.street_id, s.street_name, s.area_name, s.panchayat_name, s.household_count, s.population, s.last_delivery_date, f.litres_per_person, f.fairness_status;

-- 3. Complaint SLA View (48-hour resolution benchmark)
CREATE OR REPLACE VIEW complaint_sla_view AS
SELECT 
    c.complaint_id,
    c.resident_id,
    u.name AS resident_name,
    u.phone AS resident_phone,
    s.street_name,
    c.complaint_type,
    c.description,
    c.status,
    c.priority,
    c.created_at,
    c.resolved_at,
    c.assigned_operator_id,
    op.name AS assigned_operator_name,
    ROUND(
        TIMESTAMPDIFF(MINUTE, c.created_at, COALESCE(c.resolved_at, NOW())) / 60.0, 
        1
    ) AS elapsed_hours,
    CASE 
        WHEN c.status = 'RESOLVED' THEN 
            CASE 
                WHEN TIMESTAMPDIFF(HOUR, c.created_at, c.resolved_at) <= 48 THEN 'RESOLVED WITHIN SLA'
                ELSE 'RESOLVED BREACHED'
            END
        WHEN TIMESTAMPDIFF(HOUR, c.created_at, NOW()) > 48 THEN 'BREACHED'
        WHEN TIMESTAMPDIFF(HOUR, c.created_at, NOW()) >= 36 THEN 'DUE SOON'
        ELSE 'WITHIN SLA'
    END AS sla_status
FROM complaints c
JOIN users u ON c.resident_id = u.user_id
JOIN streets s ON c.street_id = s.street_id
LEFT JOIN users op ON c.assigned_operator_id = op.user_id;

-- 4. Operator Dispute View
-- Calculates dispute rate for tanker operators based on deliveries disputed by residents
CREATE OR REPLACE VIEW operator_dispute_view AS
SELECT 
    u.user_id AS operator_id,
    u.name AS operator_name,
    u.phone AS operator_phone,
    COUNT(d.delivery_id) AS total_deliveries,
    COUNT(CASE WHEN d.status = 'COMPLETED' THEN d.delivery_id ELSE NULL END) AS completed_deliveries,
    COUNT(CASE WHEN d.status = 'DISPUTED' THEN d.delivery_id ELSE NULL END) AS disputed_deliveries,
    ROUND(
        (COUNT(CASE WHEN d.status = 'DISPUTED' THEN d.delivery_id ELSE NULL END) * 100.0) / 
        NULLIF(COUNT(CASE WHEN d.status IN ('COMPLETED', 'DISPUTED') THEN d.delivery_id ELSE NULL END), 0),
        2
    ) AS dispute_rate_percentage,
    DENSE_RANK() OVER (
        ORDER BY 
            (COUNT(CASE WHEN d.status = 'DISPUTED' THEN d.delivery_id ELSE NULL END) * 100.0) / 
            NULLIF(COUNT(CASE WHEN d.status IN ('COMPLETED', 'DISPUTED') THEN d.delivery_id ELSE NULL END), 0) DESC
    ) AS dispute_rank
FROM users u
JOIN roles r ON u.role_id = r.role_id AND r.role_name = 'OPERATOR'
LEFT JOIN deliveries d ON u.user_id = d.operator_id
GROUP BY u.user_id, u.name, u.phone;

-- 5. Monthly Tanker Usage View
CREATE OR REPLACE VIEW monthly_tanker_usage_view AS
SELECT 
    t.tanker_id,
    t.vehicle_number,
    t.capacity_litres,
    u.name AS operator_name,
    DATE_FORMAT(d.scheduled_date, '%Y-%m') AS delivery_month,
    COUNT(d.delivery_id) AS total_deliveries,
    COUNT(CASE WHEN d.status = 'COMPLETED' THEN d.delivery_id ELSE NULL END) AS completed_deliveries,
    COALESCE(SUM(CASE WHEN d.status = 'COMPLETED' THEN d.quantity_litres ELSE 0 END), 0) AS total_litres_delivered,
    COUNT(DISTINCT DATE(d.delivery_date)) AS active_delivery_days
FROM tankers t
JOIN users u ON t.operator_id = u.user_id
LEFT JOIN deliveries d ON t.tanker_id = d.tanker_id
GROUP BY t.tanker_id, t.vehicle_number, t.capacity_litres, u.name, DATE_FORMAT(d.scheduled_date, '%Y-%m');
