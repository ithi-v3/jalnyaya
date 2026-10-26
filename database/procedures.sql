-- ============================================================================
-- JalNyaya - Stored Procedures (MySQL 8.0)
-- ============================================================================

DELIMITER //

-- Procedure 1: calculate_street_fairness
-- Performs real analytical calculation across all streets:
-- 1. Computes total delivered litres per street
-- 2. Calculates litres per person per street
-- 3. Computes system-wide average litres per person
-- 4. Computes fairness percentage and updates streets.priority_score accordingly
DROP PROCEDURE IF EXISTS calculate_street_fairness //

CREATE PROCEDURE calculate_street_fairness()
BEGIN
    DECLARE v_overall_avg DECIMAL(12,2) DEFAULT 0.00;
    
    -- Step 1: Calculate system-wide average litres per capita
    SELECT 
        COALESCE(AVG(st.litres_per_capita), 0.00) INTO v_overall_avg
    FROM (
        SELECT 
            s.street_id,
            ROUND(CAST(COALESCE(SUM(CASE WHEN d.status = 'COMPLETED' THEN d.quantity_litres ELSE 0 END), 0) AS DECIMAL(12,2)) / NULLIF(s.population, 0), 2) AS litres_per_capita
        FROM streets s
        LEFT JOIN deliveries d ON s.street_id = d.street_id
        GROUP BY s.street_id, s.population
    ) st;

    -- Step 2: Update priority_score on each street based on equity deficit and wait time
    UPDATE streets s
    LEFT JOIN (
        SELECT 
            street_id,
            COALESCE(SUM(CASE WHEN status = 'COMPLETED' THEN quantity_litres ELSE 0 END), 0) AS total_litres
        FROM deliveries
        GROUP BY street_id
    ) del ON s.street_id = del.street_id
    LEFT JOIN (
        SELECT 
            street_id,
            COUNT(*) AS active_complaints
        FROM complaints
        WHERE status IN ('OPEN', 'IN_PROGRESS')
        GROUP BY street_id
    ) cmp ON s.street_id = cmp.street_id
    SET s.priority_score = ROUND(
        (COALESCE(DATEDIFF(NOW(), s.last_delivery_date), 30) * 3.5) +
        (COALESCE(cmp.active_complaints, 0) * 6.0) +
        (s.household_count * 0.4) +
        (CASE 
            WHEN v_overall_avg > 0 AND (COALESCE(del.total_litres, 0) / s.population) < (v_overall_avg * 0.7) THEN 35.0
            WHEN v_overall_avg > 0 AND (COALESCE(del.total_litres, 0) / s.population) < v_overall_avg THEN 18.0
            ELSE 0.0
         END),
        1
    );

    -- Step 3: Return result summary for verification
    SELECT 
        s.street_id,
        s.street_name,
        s.area_name,
        s.population,
        COALESCE(del.total_litres, 0) AS total_litres_delivered,
        ROUND(CAST(COALESCE(del.total_litres, 0) AS DECIMAL(12,2)) / NULLIF(s.population, 0), 2) AS litres_per_person,
        v_overall_avg AS benchmark_litres_per_person,
        s.priority_score,
        CASE 
            WHEN v_overall_avg = 0 OR (COALESCE(del.total_litres, 0) / s.population) >= v_overall_avg THEN 'GOOD'
            WHEN (COALESCE(del.total_litres, 0) / s.population) >= (v_overall_avg * 0.7) THEN 'BELOW AVERAGE'
            ELSE 'CRITICAL'
        END AS equity_status
    FROM streets s
    LEFT JOIN (
        SELECT street_id, SUM(CASE WHEN status = 'COMPLETED' THEN quantity_litres ELSE 0 END) AS total_litres
        FROM deliveries
        GROUP BY street_id
    ) del ON s.street_id = del.street_id
    ORDER BY s.priority_score DESC;
END //


-- Procedure 2: generate_delivery_priority
-- Takes an optional zone parameter (pass NULL or 0 for all zones)
-- Evaluates demand, recent deliveries, pending complaints, and returns prioritized list
DROP PROCEDURE IF EXISTS generate_delivery_priority //

CREATE PROCEDURE generate_delivery_priority(IN p_zone_id INT)
BEGIN
    -- Recalculate baseline fairness first
    CALL calculate_street_fairness();

    -- Return filtered / prioritized schedule
    SELECT 
        s.street_id,
        s.street_name,
        s.area_name,
        z.zone_name,
        s.household_count,
        s.population,
        COALESCE(DATEDIFF(NOW(), s.last_delivery_date), 99) AS days_without_water,
        COUNT(CASE WHEN c.status IN ('OPEN', 'IN_PROGRESS') THEN c.complaint_id ELSE NULL END) AS open_complaints,
        s.priority_score,
        DENSE_RANK() OVER (ORDER BY s.priority_score DESC) AS dispatch_priority_rank
    FROM streets s
    JOIN zones z ON s.zone_id = z.zone_id
    LEFT JOIN complaints c ON s.street_id = c.street_id
    WHERE (p_zone_id IS NULL OR p_zone_id = 0 OR s.zone_id = p_zone_id)
    GROUP BY s.street_id, s.street_name, s.area_name, z.zone_name, s.household_count, s.population, s.last_delivery_date, s.priority_score
    ORDER BY s.priority_score DESC;
END //

DELIMITER ;
