-- ============================================================================
-- JalNyaya - Database Triggers (MySQL 8.0)
-- ============================================================================

DELIMITER //

-- ============================================================================
-- Trigger 1: Delivery Dispute Trigger (Anti-Fraud Mechanism)
-- Automatically converts completed delivery to DISPUTED if resident reports
-- not receiving the delivery, and logs a high-priority system alert.
-- ============================================================================
DROP TRIGGER IF EXISTS trg_delivery_dispute_insert //

CREATE TRIGGER trg_delivery_dispute_insert
AFTER INSERT ON delivery_confirmations
FOR EACH ROW
BEGIN
    DECLARE v_current_status VARCHAR(30);
    DECLARE v_street_id INT;
    DECLARE v_operator_id INT;
    DECLARE v_street_name VARCHAR(120);
    
    -- Check current delivery status
    SELECT status, street_id, operator_id 
    INTO v_current_status, v_street_id, v_operator_id
    FROM deliveries
    WHERE delivery_id = NEW.delivery_id;
    
    -- If resident explicitly marked confirmed = FALSE
    IF NEW.confirmed = FALSE THEN
        -- Mark delivery as DISPUTED
        UPDATE deliveries
        SET status = 'DISPUTED',
            notes = CONCAT(COALESCE(notes, ''), ' [DISPUTED: Resident flagged delivery as not received]')
        WHERE delivery_id = NEW.delivery_id;

        SELECT street_name INTO v_street_name FROM streets WHERE street_id = v_street_id;

        -- Create high-priority dispute alert
        INSERT INTO alerts (delivery_id, alert_type, message, severity, created_at, resolved)
        VALUES (
            NEW.delivery_id,
            'DELIVERY_DISPUTE',
            CONCAT('Fraud Alert: Resident #', NEW.resident_id, ' disputed Delivery #', NEW.delivery_id, 
                   ' at ', COALESCE(v_street_name, 'Street'), '. Remarks: ', COALESCE(NEW.remarks, 'None')),
            'CRITICAL',
            NOW(),
            FALSE
        );
    END IF;
END //

DROP TRIGGER IF EXISTS trg_delivery_dispute_update //

CREATE TRIGGER trg_delivery_dispute_update
AFTER UPDATE ON delivery_confirmations
FOR EACH ROW
BEGIN
    DECLARE v_current_status VARCHAR(30);
    DECLARE v_street_id INT;
    DECLARE v_street_name VARCHAR(120);
    
    IF NEW.confirmed = FALSE AND (OLD.confirmed IS NULL OR OLD.confirmed = TRUE) THEN
        UPDATE deliveries
        SET status = 'DISPUTED',
            notes = CONCAT(COALESCE(notes, ''), ' [DISPUTED: Confirmation updated to Not Received]')
        WHERE delivery_id = NEW.delivery_id;

        SELECT street_id INTO v_street_id FROM deliveries WHERE delivery_id = NEW.delivery_id;
        SELECT street_name INTO v_street_name FROM streets WHERE street_id = v_street_id;

        INSERT INTO alerts (delivery_id, alert_type, message, severity, created_at, resolved)
        VALUES (
            NEW.delivery_id,
            'DELIVERY_DISPUTE',
            CONCAT('Fraud Alert: Confirmation updated to NOT RECEIVED for Delivery #', NEW.delivery_id, 
                   ' at ', COALESCE(v_street_name, 'Street')),
            'CRITICAL',
            NOW(),
            FALSE
        );
    END IF;
END //


-- ============================================================================
-- Trigger 2: Water Source Depletion & Anomaly Alert
-- Automatically keeps current_level_litres in sync and compares reading against:
-- 1. Source capacity percentage
-- 2. 30-day historical average reading
-- Raises LOW_WATER_LEVEL or CRITICAL_WATER_LEVEL alerts when depletion is detected.
-- ============================================================================
DROP TRIGGER IF EXISTS trg_water_level_reading_insert //

CREATE TRIGGER trg_water_level_reading_insert
AFTER INSERT ON water_level_readings
FOR EACH ROW
BEGIN
    DECLARE v_capacity INT;
    DECLARE v_source_name VARCHAR(120);
    DECLARE v_avg_30d DECIMAL(12,2);
    DECLARE v_existing_active_alerts INT;
    DECLARE v_alert_severity VARCHAR(20);
    DECLARE v_alert_type VARCHAR(50);
    DECLARE v_message TEXT;

    -- 1. Sync the current_level_litres in water_sources
    UPDATE water_sources
    SET current_level_litres = NEW.level_litres,
        status = CASE 
            WHEN NEW.percentage_level <= 20.0 THEN 'DEPLETED'
            ELSE status
        END
    WHERE source_id = NEW.source_id;

    -- Retrieve capacity and name
    SELECT capacity_litres, source_name INTO v_capacity, v_source_name
    FROM water_sources
    WHERE source_id = NEW.source_id;

    -- Calculate 30-day average level excluding the current reading
    SELECT AVG(level_litres) INTO v_avg_30d
    FROM water_level_readings
    WHERE source_id = NEW.source_id
      AND reading_id != NEW.reading_id
      AND reading_date >= DATE_SUB(NOW(), INTERVAL 30 DAY);

    -- Check if an unresolved alert already exists for this source to avoid duplicates
    SELECT COUNT(*) INTO v_existing_active_alerts
    FROM alerts
    WHERE source_id = NEW.source_id
      AND resolved = FALSE
      AND alert_type IN ('LOW_WATER_LEVEL', 'CRITICAL_WATER_LEVEL')
      AND created_at >= DATE_SUB(NOW(), INTERVAL 12 HOUR);

    -- Only generate alert if no active alert in past 12 hours
    IF v_existing_active_alerts = 0 THEN
        -- Check critical conditions: <60% capacity OR <60% of 30-day average
        IF NEW.percentage_level < 60.0 OR (v_avg_30d IS NOT NULL AND NEW.level_litres < (v_avg_30d * 0.60)) THEN
            SET v_alert_type = 'CRITICAL_WATER_LEVEL';
            SET v_alert_severity = 'CRITICAL';
            SET v_message = CONCAT('Critical Depletion: Water Source "', v_source_name, '" (ID #', NEW.source_id, 
                                   ') is at ', ROUND(NEW.percentage_level, 1), '% capacity (', NEW.level_litres, ' L).');

            INSERT INTO alerts (source_id, alert_type, message, severity, created_at, resolved)
            VALUES (NEW.source_id, v_alert_type, v_message, v_alert_severity, NOW(), FALSE);

        -- Check low conditions: <80% capacity OR <80% of 30-day average
        ELSEIF NEW.percentage_level < 80.0 OR (v_avg_30d IS NOT NULL AND NEW.level_litres < (v_avg_30d * 0.80)) THEN
            SET v_alert_type = 'LOW_WATER_LEVEL';
            SET v_alert_severity = 'WARNING';
            SET v_message = CONCAT('Depletion Warning: Water Source "', v_source_name, '" (ID #', NEW.source_id, 
                                   ') fell to ', ROUND(NEW.percentage_level, 1), '% capacity (', NEW.level_litres, ' L).');

            INSERT INTO alerts (source_id, alert_type, message, severity, created_at, resolved)
            VALUES (NEW.source_id, v_alert_type, v_message, v_alert_severity, NOW(), FALSE);
        END IF;
    END IF;
END //

DELIMITER ;
