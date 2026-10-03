-- =============================================================================
-- SIRAssist – Database Triggers
-- Requirement #11: Triggers for status history tracking & notification generation
-- =============================================================================

USE sirassist_db;

DELIMITER $$

-- Trigger 1: Automatically log status changes into Status_History table
DROP TRIGGER IF EXISTS trg_after_verification_request_update_status$$
CREATE TRIGGER trg_after_verification_request_update_status
AFTER UPDATE ON Verification_Request
FOR EACH ROW
BEGIN
    -- Only execute when status actually changes
    IF OLD.current_status <> NEW.current_status THEN
        INSERT INTO Status_History (
            request_id,
            old_status,
            new_status,
            changed_by,
            changed_at,
            remarks
        ) VALUES (
            NEW.request_id,
            OLD.current_status,
            NEW.current_status,
            'System Trigger',
            NOW(),
            CONCAT('Status updated from ', OLD.current_status, ' to ', NEW.current_status)
        );

        -- Generate automated citizen notification
        INSERT INTO Notification (
            citizen_id,
            request_id,
            message,
            created_at,
            read_status
        ) VALUES (
            NEW.citizen_id,
            NEW.request_id,
            CONCAT('Your verification request #', NEW.request_id, ' status changed from ', OLD.current_status, ' to ', NEW.current_status, '.'),
            NOW(),
            FALSE
        );
    END IF;
END$$

-- Trigger 2: Automatic status history & notification on new request insertion
DROP TRIGGER IF EXISTS trg_after_verification_request_insert$$
CREATE TRIGGER trg_after_verification_request_insert
AFTER INSERT ON Verification_Request
FOR EACH ROW
BEGIN
    INSERT INTO Status_History (
        request_id,
        old_status,
        new_status,
        changed_by,
        changed_at,
        remarks
    ) VALUES (
        NEW.request_id,
        'NONE',
        NEW.current_status,
        'Citizen Submission',
        NOW(),
        'Request created and submitted'
    );

    INSERT INTO Notification (
        citizen_id,
        request_id,
        message,
        created_at,
        read_status
    ) VALUES (
        NEW.citizen_id,
        NEW.request_id,
        CONCAT('Verification request #', NEW.request_id, ' (', NEW.request_type, ') has been successfully created with status: ', NEW.current_status, '.'),
        NOW(),
        FALSE
    );
END$$

DELIMITER ;
