const db = require('../db/connection');

const DEMO_QUERIES = [
  {
    id: 1,
    title: "1. Pending Requests with Citizen Info",
    description: "Retrieves all active pending verification requests joined with citizen contact details.",
    sql: `SELECT vr.request_id, c.name AS citizen_name, c.mobile, vr.request_type, vr.current_status, vr.submission_date FROM Verification_Request vr JOIN Citizen c ON vr.citizen_id = c.citizen_id WHERE vr.current_status IN ('SUBMITTED', 'DOCUMENTS_PENDING', 'DOCUMENTS_SUBMITTED', 'UNDER_REVIEW') ORDER BY vr.submission_date DESC`
  },
  {
    id: 2,
    title: "2. Request Count & Percentage by Status",
    description: "Groups requests by status and computes relative percentages using aggregate functions.",
    sql: `SELECT current_status, COUNT(*) AS total_requests, ROUND((COUNT(*) * 100.0 / (SELECT COUNT(*) FROM Verification_Request)), 2) AS percentage FROM Verification_Request GROUP BY current_status ORDER BY total_requests DESC`
  },
  {
    id: 3,
    title: "3. Citizens with Missing Checklist Items",
    description: "Identifies required checklist documents that have not yet been recorded for active requests.",
    sql: `SELECT DISTINCT c.citizen_id, c.name AS citizen_name, c.email, vr.request_id, vr.request_type, dr.document_type AS missing_required_document FROM Citizen c JOIN Verification_Request vr ON c.citizen_id = vr.citizen_id JOIN Document_Requirement dr ON vr.request_type = dr.request_type AND dr.active = 1 WHERE vr.current_status NOT IN ('RESOLVED', 'CANCELLED') AND dr.document_type NOT IN (SELECT d.document_type FROM Request_Document rd JOIN Document d ON rd.document_id = d.document_id WHERE rd.request_id = vr.request_id) ORDER BY c.citizen_id, vr.request_id`
  },
  {
    id: 4,
    title: "4. Available Volunteers in Area #1",
    description: "Finds approved volunteers in Zone 1 who are currently available.",
    sql: `SELECT v.volunteer_id, v.name AS volunteer_name, v.mobile, v.email, v.skills, a.name AS area_name, a.district FROM Volunteer v JOIN Area a ON v.area_id = a.area_id WHERE v.area_id = 1 AND v.availability = 'Available' AND v.verification_status = 'Approved'`
  },
  {
    id: 5,
    title: "5. Most Common Assistance Types",
    description: "Groups assistance requests by category and calculates completion rates.",
    sql: `SELECT request_type, COUNT(*) AS total_assistance_requests, SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) AS completed_count, SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END) AS pending_count FROM Assistance_Request GROUP BY request_type ORDER BY total_assistance_requests DESC`
  },
  {
    id: 6,
    title: "6. Monthly Request Trend",
    description: "Formats submission dates to month-year buckets and aggregates total vs resolved requests.",
    sql: `SELECT DATE_FORMAT(submission_date, '%Y-%m') AS month_year, COUNT(*) AS total_requests, SUM(CASE WHEN current_status = 'RESOLVED' THEN 1 ELSE 0 END) AS resolved_requests FROM Verification_Request GROUP BY DATE_FORMAT(submission_date, '%Y-%m') ORDER BY month_year DESC`
  },
  {
    id: 7,
    title: "7. Average Request Resolution Time (Hours)",
    description: "Calculates the average duration in hours between submission and RESOLVED state.",
    sql: `SELECT vr.request_type, COUNT(vr.request_id) AS resolved_count, ROUND(AVG(TIMESTAMPDIFF(HOUR, vr.submission_date, sh.changed_at)), 2) AS avg_resolution_hours FROM Verification_Request vr JOIN Status_History sh ON vr.request_id = sh.request_id WHERE sh.new_status = 'RESOLVED' GROUP BY vr.request_type`
  },
  {
    id: 8,
    title: "8. Citizens with Multiple Requests (HAVING Clause)",
    description: "Uses HAVING COUNT() > 1 to filter citizens who logged multiple verification requests.",
    sql: `SELECT c.citizen_id, c.name AS citizen_name, c.email, COUNT(vr.request_id) AS total_requests_submitted FROM Citizen c JOIN Verification_Request vr ON c.citizen_id = vr.citizen_id GROUP BY c.citizen_id, c.name, c.email HAVING COUNT(vr.request_id) > 1 ORDER BY total_requests_submitted DESC`
  },
  {
    id: 9,
    title: "9. Documents for Request #1",
    description: "Demonstrates many-to-many junction retrieval using Request_Document.",
    sql: `SELECT vr.request_id, vr.request_type, d.document_id, d.document_type, d.document_reference_masked, d.verification_status, rd.submitted_at FROM Verification_Request vr JOIN Request_Document rd ON vr.request_id = rd.request_id JOIN Document d ON rd.document_id = d.document_id WHERE vr.request_id = 1`
  },
  {
    id: 10,
    title: "10. Assistance Requests Without Assigned Volunteer",
    description: "Lists pending assistance requests needing admin assignment, sorted by priority.",
    sql: `SELECT ar.assistance_id, c.name AS citizen_name, c.mobile, ar.request_type, ar.priority, ar.request_date, ar.notes FROM Assistance_Request ar JOIN Citizen c ON ar.citizen_id = c.citizen_id WHERE ar.volunteer_id IS NULL AND ar.status = 'PENDING' ORDER BY CASE ar.priority WHEN 'High' THEN 1 WHEN 'Medium' THEN 2 ELSE 3 END, ar.request_date ASC`
  },
  {
    id: 11,
    title: "11. Volunteers with Highest Workload",
    description: "Ranks volunteers by total assigned assistance requests.",
    sql: `SELECT v.volunteer_id, v.name AS volunteer_name, v.email, v.availability, COUNT(ar.assistance_id) AS total_assigned_requests, SUM(CASE WHEN ar.status = 'COMPLETED' THEN 1 ELSE 0 END) AS completed_requests FROM Volunteer v LEFT JOIN Assistance_Request ar ON v.volunteer_id = ar.volunteer_id GROUP BY v.volunteer_id, v.name, v.email, v.availability ORDER BY total_assigned_requests DESC`
  },
  {
    id: 12,
    title: "12. Verification Requests by Constituency",
    description: "Joins Constituency, Voter_Record, and Verification_Request to aggregate workload.",
    sql: `SELECT co.name AS constituency_name, co.district, COUNT(vr.request_id) AS total_requests, SUM(CASE WHEN vr.current_status = 'RESOLVED' THEN 1 ELSE 0 END) AS resolved_count FROM Constituency co JOIN Voter_Record vr_rec ON co.constituency_id = vr_rec.constituency_id JOIN Verification_Request vr ON vr_rec.voter_id = vr.voter_id GROUP BY co.constituency_id, co.name, co.district ORDER BY total_requests DESC`
  },
  {
    id: 13,
    title: "13. Unresolved Requests Older Than 7 Days",
    description: "Identifies delayed requests using DATEDIFF(NOW(), submission_date).",
    sql: `SELECT vr.request_id, c.name AS citizen_name, vr.request_type, vr.current_status, vr.submission_date, DATEDIFF(NOW(), vr.submission_date) AS days_pending FROM Verification_Request vr JOIN Citizen c ON vr.citizen_id = c.citizen_id WHERE vr.current_status NOT IN ('RESOLVED', 'CANCELLED') AND DATEDIFF(NOW(), vr.submission_date) > 7 ORDER BY days_pending DESC`
  },
  {
    id: 14,
    title: "14. Frequently Missing Document Types",
    description: "Aggregates missing checklist requirements across all active requests.",
    sql: `SELECT dr.document_type, COUNT(*) AS times_missing FROM Verification_Request vr JOIN Document_Requirement dr ON vr.request_type = dr.request_type AND dr.active = 1 WHERE vr.current_status NOT IN ('RESOLVED', 'CANCELLED') AND dr.document_type NOT IN (SELECT d.document_type FROM Request_Document rd JOIN Document d ON rd.document_id = d.document_id WHERE rd.request_id = vr.request_id) GROUP BY dr.document_type ORDER BY times_missing DESC`
  },
  {
    id: 15,
    title: "15. Complete Citizen Audit Summary",
    description: "Generates a complete summary for Citizen #1 combining documents, requests, and notifications.",
    sql: `SELECT c.citizen_id, c.name AS citizen_name, c.email, c.mobile, (SELECT COUNT(*) FROM Document d WHERE d.citizen_id = c.citizen_id) AS total_documents_uploaded, (SELECT COUNT(*) FROM Verification_Request vr WHERE vr.citizen_id = c.citizen_id) AS total_verification_requests, (SELECT COUNT(*) FROM Assistance_Request ar WHERE ar.citizen_id = c.citizen_id) AS total_assistance_requests, (SELECT COUNT(*) FROM Notification n WHERE n.citizen_id = c.citizen_id AND n.read_status = 0) AS unread_notifications FROM Citizen c WHERE c.citizen_id = 1`
  }
];

function getQueriesList(req, res) {
  res.json(DEMO_QUERIES);
}

async function runQuery(req, res, next) {
  try {
    const { queryId, customSql } = req.body;
    let targetSql = '';

    if (queryId) {
      const qObj = DEMO_QUERIES.find(q => q.id === parseInt(queryId));
      if (!qObj) {
        return res.status(404).json({ error: 'Demo query ID not found.' });
      }
      targetSql = qObj.sql;
    } else if (customSql) {
      // Basic SQL read-only safety guard for demonstration
      if (!customSql.trim().toLowerCase().startsWith('select')) {
        return res.status(400).json({ error: 'Demonstration SQL query runner supports SELECT statements only.' });
      }
      targetSql = customSql;
    } else {
      return res.status(400).json({ error: 'Please specify queryId or customSql.' });
    }

    const startTime = Date.now();
    const rows = await db.query(targetSql);
    const executionTimeMs = Date.now() - startTime;

    res.json({
      sql: targetSql,
      rowCount: Array.isArray(rows) ? rows.length : 0,
      executionTimeMs,
      results: rows
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getQueriesList,
  runQuery
};
