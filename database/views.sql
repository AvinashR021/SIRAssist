-- =============================================================================
-- SIRAssist – SQL Views
-- Requirement #13: Database Views for Dashboards & Reporting
-- =============================================================================

USE sirassist_db;

-- View 1: Citizen Request Dashboard View
DROP VIEW IF EXISTS vw_citizen_request_dashboard;
CREATE VIEW vw_citizen_request_dashboard AS
SELECT 
    vr.request_id,
    c.citizen_id,
    c.name AS citizen_name,
    c.email AS citizen_email,
    c.mobile AS citizen_mobile,
    vr.request_type,
    vr.current_status,
    vr.submission_date,
    vr.remarks,
    (SELECT COUNT(*) FROM Request_Document rd WHERE rd.request_id = vr.request_id) AS total_documents_submitted
FROM Verification_Request vr
JOIN Citizen c ON vr.citizen_id = c.citizen_id;

-- View 2: Pending Requests View
DROP VIEW IF EXISTS vw_pending_verification_requests;
CREATE VIEW vw_pending_verification_requests AS
SELECT 
    vr.request_id,
    c.citizen_id,
    c.name AS citizen_name,
    c.mobile AS citizen_mobile,
    vr.request_type,
    vr.current_status,
    vr.submission_date,
    TIMESTAMPDIFF(DAY, vr.submission_date, NOW()) AS pending_days,
    a.district,
    a.pin_code
FROM Verification_Request vr
JOIN Citizen c ON vr.citizen_id = c.citizen_id
LEFT JOIN Address a ON c.address_id = a.address_id
WHERE vr.current_status IN ('SUBMITTED', 'DOCUMENTS_PENDING', 'DOCUMENTS_SUBMITTED', 'UNDER_REVIEW')
ORDER BY vr.submission_date ASC;

-- View 3: Volunteer Assistance Dashboard View
DROP VIEW IF EXISTS vw_volunteer_assistance_dashboard;
CREATE VIEW vw_volunteer_assistance_dashboard AS
SELECT 
    ar.assistance_id,
    ar.request_type,
    ar.status AS assistance_status,
    ar.priority,
    ar.request_date,
    c.citizen_id,
    c.name AS citizen_name,
    c.mobile AS citizen_mobile,
    v.volunteer_id,
    v.name AS volunteer_name,
    v.email AS volunteer_email,
    a.area_id,
    a.name AS area_name,
    a.district
FROM Assistance_Request ar
JOIN Citizen c ON ar.citizen_id = c.citizen_id
LEFT JOIN Volunteer v ON ar.volunteer_id = v.volunteer_id
LEFT JOIN Area a ON v.area_id = a.area_id OR (v.area_id IS NULL AND c.address_id IS NOT NULL);
