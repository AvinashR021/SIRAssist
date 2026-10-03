-- =============================================================================
-- SIRAssist – 15+ Advanced DBMS Demonstration Queries
-- Requirement #26: Complex SQL queries with JOIN, GROUP BY, HAVING, subqueries & aggregate functions
-- =============================================================================

USE sirassist_db;

-- -----------------------------------------------------------------------------
-- Query 1: Find all pending verification requests with citizen details
-- -----------------------------------------------------------------------------
SELECT 
    vr.request_id,
    c.name AS citizen_name,
    c.mobile,
    vr.request_type,
    vr.current_status,
    vr.submission_date
FROM Verification_Request vr
JOIN Citizen c ON vr.citizen_id = c.citizen_id
WHERE vr.current_status IN ('SUBMITTED', 'DOCUMENTS_PENDING', 'DOCUMENTS_SUBMITTED', 'UNDER_REVIEW')
ORDER BY vr.submission_date DESC;

-- -----------------------------------------------------------------------------
-- Query 2: Count requests by current status
-- -----------------------------------------------------------------------------
SELECT 
    current_status,
    COUNT(*) AS total_requests,
    ROUND((COUNT(*) * 100.0 / (SELECT COUNT(*) FROM Verification_Request)), 2) AS percentage
FROM Verification_Request
GROUP BY current_status
ORDER BY total_requests DESC;

-- -----------------------------------------------------------------------------
-- Query 3: Find citizens with missing checklist items for their active requests
-- -----------------------------------------------------------------------------
SELECT DISTINCT
    c.citizen_id,
    c.name AS citizen_name,
    c.email,
    vr.request_id,
    vr.request_type,
    dr.document_type AS missing_required_document
FROM Citizen c
JOIN Verification_Request vr ON c.citizen_id = vr.citizen_id
JOIN Document_Requirement dr ON vr.request_type = dr.request_type AND dr.active = 1
WHERE vr.current_status NOT IN ('RESOLVED', 'CANCELLED')
  AND dr.document_type NOT IN (
      SELECT d.document_type
      FROM Request_Document rd
      JOIN Document d ON rd.document_id = d.document_id
      WHERE rd.request_id = vr.request_id
  )
ORDER BY c.citizen_id, vr.request_id;

-- -----------------------------------------------------------------------------
-- Query 4: Find volunteers available in a particular area (e.g. Area ID = 1)
-- -----------------------------------------------------------------------------
SELECT 
    v.volunteer_id,
    v.name AS volunteer_name,
    v.mobile,
    v.email,
    v.skills,
    a.name AS area_name,
    a.district
FROM Volunteer v
JOIN Area a ON v.area_id = a.area_id
WHERE v.area_id = 1
  AND v.availability = 'Available'
  AND v.verification_status = 'Approved';

-- -----------------------------------------------------------------------------
-- Query 5: Find the most common assistance request types
-- -----------------------------------------------------------------------------
SELECT 
    request_type,
    COUNT(*) AS total_assistance_requests,
    SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) AS completed_count,
    SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END) AS pending_count
FROM Assistance_Request
GROUP BY request_type
ORDER BY total_assistance_requests DESC;

-- -----------------------------------------------------------------------------
-- Query 6: Find monthly verification request count
-- -----------------------------------------------------------------------------
SELECT 
    DATE_FORMAT(submission_date, '%Y-%m') AS month_year,
    COUNT(*) AS total_requests,
    SUM(CASE WHEN current_status = 'RESOLVED' THEN 1 ELSE 0 END) AS resolved_requests
FROM Verification_Request
GROUP BY DATE_FORMAT(submission_date, '%Y-%m')
ORDER BY month_year DESC;

-- -----------------------------------------------------------------------------
-- Query 7: Calculate average request resolution time in hours
-- -----------------------------------------------------------------------------
SELECT 
    vr.request_type,
    COUNT(vr.request_id) AS resolved_count,
    ROUND(AVG(TIMESTAMPDIFF(HOUR, vr.submission_date, sh.changed_at)), 2) AS avg_resolution_hours
FROM Verification_Request vr
JOIN Status_History sh ON vr.request_id = sh.request_id
WHERE sh.new_status = 'RESOLVED'
GROUP BY vr.request_type;

-- -----------------------------------------------------------------------------
-- Query 8: Find citizens who have submitted multiple verification requests (HAVING clause)
-- -----------------------------------------------------------------------------
SELECT 
    c.citizen_id,
    c.name AS citizen_name,
    c.email,
    COUNT(vr.request_id) AS total_requests_submitted
FROM Citizen c
JOIN Verification_Request vr ON c.citizen_id = vr.citizen_id
GROUP BY c.citizen_id, c.name, c.email
HAVING COUNT(vr.request_id) > 1
ORDER BY total_requests_submitted DESC;

-- -----------------------------------------------------------------------------
-- Query 9: Find all documents linked to a specific verification request (e.g. Request ID = 1)
-- -----------------------------------------------------------------------------
SELECT 
    vr.request_id,
    vr.request_type,
    d.document_id,
    d.document_type,
    d.document_reference_masked,
    d.verification_status,
    rd.submitted_at
FROM Verification_Request vr
JOIN Request_Document rd ON vr.request_id = rd.request_id
JOIN Document d ON rd.document_id = d.document_id
WHERE vr.request_id = 1;

-- -----------------------------------------------------------------------------
-- Query 10: Find assistance requests that have NOT been assigned to any volunteer
-- -----------------------------------------------------------------------------
SELECT 
    ar.assistance_id,
    c.name AS citizen_name,
    c.mobile,
    ar.request_type,
    ar.priority,
    ar.request_date,
    ar.notes
FROM Assistance_Request ar
JOIN Citizen c ON ar.citizen_id = c.citizen_id
WHERE ar.volunteer_id IS NULL AND ar.status = 'PENDING'
ORDER BY CASE ar.priority WHEN 'High' THEN 1 WHEN 'Medium' THEN 2 ELSE 3 END, ar.request_date ASC;

-- -----------------------------------------------------------------------------
-- Query 11: Find volunteers handling the highest number of assistance requests
-- -----------------------------------------------------------------------------
SELECT 
    v.volunteer_id,
    v.name AS volunteer_name,
    v.email,
    v.availability,
    COUNT(ar.assistance_id) AS total_assigned_requests,
    SUM(CASE WHEN ar.status = 'COMPLETED' THEN 1 ELSE 0 END) AS completed_requests
FROM Volunteer v
LEFT JOIN Assistance_Request ar ON v.volunteer_id = ar.volunteer_id
GROUP BY v.volunteer_id, v.name, v.email, v.availability
ORDER BY total_assigned_requests DESC;

-- -----------------------------------------------------------------------------
-- Query 12: Find verification requests grouped by electoral constituency
-- -----------------------------------------------------------------------------
SELECT 
    co.name AS constituency_name,
    co.district,
    COUNT(vr.request_id) AS total_requests,
    SUM(CASE WHEN vr.current_status = 'RESOLVED' THEN 1 ELSE 0 END) AS resolved_count
FROM Constituency co
JOIN Voter_Record vr_rec ON co.constituency_id = vr_rec.constituency_id
JOIN Verification_Request vr ON vr_rec.voter_id = vr.voter_id
GROUP BY co.constituency_id, co.name, co.district
ORDER BY total_requests DESC;

-- -----------------------------------------------------------------------------
-- Query 13: Find unresolved requests older than 7 days
-- -----------------------------------------------------------------------------
SELECT 
    vr.request_id,
    c.name AS citizen_name,
    vr.request_type,
    vr.current_status,
    vr.submission_date,
    DATEDIFF(NOW(), vr.submission_date) AS days_pending
FROM Verification_Request vr
JOIN Citizen c ON vr.citizen_id = c.citizen_id
WHERE vr.current_status NOT IN ('RESOLVED', 'CANCELLED')
  AND DATEDIFF(NOW(), vr.submission_date) > 7
ORDER BY days_pending DESC;

-- -----------------------------------------------------------------------------
-- Query 14: Find document types most frequently missing across all active requests
-- -----------------------------------------------------------------------------
SELECT 
    dr.document_type,
    COUNT(*) AS times_missing
FROM Verification_Request vr
JOIN Document_Requirement dr ON vr.request_type = dr.request_type AND dr.active = 1
WHERE vr.current_status NOT IN ('RESOLVED', 'CANCELLED')
  AND dr.document_type NOT IN (
      SELECT d.document_type 
      FROM Request_Document rd
      JOIN Document d ON rd.document_id = d.document_id
      WHERE rd.request_id = vr.request_id
  )
GROUP BY dr.document_type
ORDER BY times_missing DESC;

-- -----------------------------------------------------------------------------
-- Query 15: Generate a citizen's complete verification summary audit report (Citizen ID = 1)
-- -----------------------------------------------------------------------------
SELECT 
    c.citizen_id,
    c.name AS citizen_name,
    c.email,
    c.mobile,
    (SELECT COUNT(*) FROM Document d WHERE d.citizen_id = c.citizen_id) AS total_documents_uploaded,
    (SELECT COUNT(*) FROM Verification_Request vr WHERE vr.citizen_id = c.citizen_id) AS total_verification_requests,
    (SELECT COUNT(*) FROM Assistance_Request ar WHERE ar.citizen_id = c.citizen_id) AS total_assistance_requests,
    (SELECT COUNT(*) FROM Notification n WHERE n.citizen_id = c.citizen_id AND n.read_status = 0) AS unread_notifications
FROM Citizen c
WHERE c.citizen_id = 1;
