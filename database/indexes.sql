-- ============================================================================
-- JalNyaya - Database Index Definitions & Justifications (MySQL 8.0)
-- ============================================================================

-- Procedure to safely create indexes only if they do not already exist
DELIMITER //

DROP PROCEDURE IF EXISTS CreateIndexIfNotExists //
CREATE PROCEDURE CreateIndexIfNotExists(
    IN p_table VARCHAR(64),
    IN p_index VARCHAR(64),
    IN p_columns VARCHAR(255)
)
BEGIN
    DECLARE v_exists INT DEFAULT 0;
    
    SELECT COUNT(*) INTO v_exists
    FROM information_schema.statistics
    WHERE table_schema = DATABASE()
      AND table_name = p_table
      AND index_name = p_index;
      
    IF v_exists = 0 THEN
        SET @sql = CONCAT('ALTER TABLE `', p_table, '` ADD INDEX `', p_index, '` (', p_columns, ')');
        PREPARE stmt FROM @sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;
END //

DELIMITER ;

-- 1. Index on users(email)
-- Justification: High-frequency lookup during JWT authentication.
CALL CreateIndexIfNotExists('users', 'idx_users_email', 'email');

-- 2. Index on users(role_id)
-- Justification: Powers Role-Based Access Control (RBAC) filtering and role-based joins.
CALL CreateIndexIfNotExists('users', 'idx_users_role_id', 'role_id');

-- 3. Index on deliveries(street_id)
-- Justification: Accelerated filtering of deliveries by street for equity aggregations.
CALL CreateIndexIfNotExists('deliveries', 'idx_deliveries_street_id', 'street_id');

-- 4. Index on deliveries(operator_id)
-- Justification: Speeds up operator dashboard queries ("My Assigned Deliveries").
CALL CreateIndexIfNotExists('deliveries', 'idx_deliveries_operator_id', 'operator_id');

-- 5. Index on deliveries(delivery_date)
-- Justification: Optimized for date range queries and "days since last delivery".
CALL CreateIndexIfNotExists('deliveries', 'idx_deliveries_delivery_date', 'delivery_date');

-- 6. Index on deliveries(status)
-- Justification: Frequent filtering by status (SCHEDULED, COMPLETED, DISPUTED).
CALL CreateIndexIfNotExists('deliveries', 'idx_deliveries_status', 'status');

-- 7. Composite Index on deliveries(street_id, status)
-- Justification: High-impact composite index for calculating delivered volume by street and status.
CALL CreateIndexIfNotExists('deliveries', 'idx_deliveries_street_status', 'street_id, status');

-- 8. Index on complaints(street_id)
-- Justification: Used when aggregating open complaints per street.
CALL CreateIndexIfNotExists('complaints', 'idx_complaints_street_id', 'street_id');

-- 9. Index on complaints(status)
-- Justification: Speeds up dashboard filtering of OPEN and IN_PROGRESS complaints.
CALL CreateIndexIfNotExists('complaints', 'idx_complaints_status', 'status');

-- 10. Index on complaints(created_at)
-- Justification: Crucial for SLA monitoring calculations (48-hour deadline tracking).
CALL CreateIndexIfNotExists('complaints', 'idx_complaints_created_at', 'created_at');

-- 11. Composite Index on water_level_readings(source_id, reading_date)
-- Justification: Enables rapid retrieval of time-series water level trends and 30d averages.
CALL CreateIndexIfNotExists('water_level_readings', 'idx_readings_source_date', 'source_id, reading_date');

-- 12. Index on delivery_confirmations(delivery_id)
-- Justification: Fast foreign key traversal when verifying resident confirmation status.
CALL CreateIndexIfNotExists('delivery_confirmations', 'idx_confirmations_delivery_id', 'delivery_id');

-- 13. Index on payments(delivery_id)
-- Justification: Relates deliveries directly to payment status and revenue reports.
CALL CreateIndexIfNotExists('payments', 'idx_payments_delivery_id', 'delivery_id');

-- Clean up helper procedure
DROP PROCEDURE IF EXISTS CreateIndexIfNotExists;
