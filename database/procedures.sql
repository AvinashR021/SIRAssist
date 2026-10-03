-- =============================================================================
-- SIRAssist – Stored Procedures
-- Requirement #12: DBMS Stored Procedures for Citizen Summary & Volunteer Matching
-- =============================================================================

USE sirassist_db;

DELIMITER $$

-- Procedure 1: Get Citizen Verification Summary
DROP PROCEDURE IF EXISTS GetCitizenVerificationSummary$$
CREATE PROCEDURE GetCitizenVerificationSummary(IN p_citizen_id INT)
BEGIN
    -- Result Set 1: Citizen Profile Details
    SELECT 
        c.citizen_id,
        c.name,
        c.email,
        c.mobile,
        c.gender,
        c.date_of_birth,
        a.house_number,
        a.street,
        a.village,
        a.taluk,
        a.district,
        a.pin_code
    FROM Citizen c
    LEFT JOIN Address a ON c.address_id = a.address_id
    WHERE c.citizen_id = p_citizen_id;

    -- Result Set 2: Request Count Breakdown
    SELECT 
        COUNT(*) AS total_requests,
        SUM(CASE WHEN current_status IN ('SUBMITTED', 'DOCUMENTS_PENDING', 'DOCUMENTS_SUBMITTED', 'UNDER_REVIEW') THEN 1 ELSE 0 END) AS pending_requests,
        SUM(CASE WHEN current_status = 'RESOLVED' THEN 1 ELSE 0 END) AS completed_requests,
        SUM(CASE WHEN current_status = 'CANCELLED' THEN 1 ELSE 0 END) AS cancelled_requests
    FROM Verification_Request
    WHERE citizen_id = p_citizen_id;

    -- Result Set 3: Missing Document Requirements for Active Requests
    SELECT DISTINCT
        vr.request_id,
        vr.request_type,
        dr.document_type AS missing_document_type,
        dr.mandatory,
        dr.description
    FROM Verification_Request vr
    JOIN Document_Requirement dr ON vr.request_type = dr.request_type AND dr.active = 1
    WHERE vr.citizen_id = p_citizen_id
      AND vr.current_status NOT IN ('RESOLVED', 'CANCELLED')
      AND dr.document_type NOT IN (
          SELECT d.document_type 
          FROM Request_Document rd
          JOIN Document d ON rd.document_id = d.document_id
          WHERE rd.request_id = vr.request_id
      );
END$$

-- Procedure 2: Get Available Volunteers for Assistance Matching
DROP PROCEDURE IF EXISTS GetAvailableVolunteers$$
CREATE PROCEDURE GetAvailableVolunteers(
    IN p_area_id INT,
    IN p_skill VARCHAR(100)
)
BEGIN
    SELECT 
        v.volunteer_id,
        v.name,
        v.email,
        v.mobile,
        v.availability,
        v.skills,
        a.name AS area_name,
        a.district,
        a.pin_code,
        (SELECT COUNT(*) FROM Assistance_Request ar WHERE ar.volunteer_id = v.volunteer_id AND ar.status IN ('ASSIGNED', 'IN_PROGRESS')) AS active_workload
    FROM Volunteer v
    LEFT JOIN Area a ON v.area_id = a.area_id
    WHERE v.verification_status = 'Approved'
      AND v.availability = 'Available'
      AND (p_area_id IS NULL OR v.area_id = p_area_id)
      AND (p_skill IS NULL OR p_skill = '' OR v.skills LIKE CONCAT('%', p_skill, '%'))
    ORDER BY active_workload ASC, v.name ASC;
END$$

DELIMITER ;
