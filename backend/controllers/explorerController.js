/**
 * SIRAssist – Interactive Database Explorer Controller
 * Provides parameterized, safe, and role-authorized exploration of electoral roll entities:
 * Constituencies, Polling Stations, Citizens, Verification Requests, Volunteers, and Documents.
 * All SQL statements are executed strictly on the backend with zero frontend SQL interpolation.
 */
const db = require('../db/connection');

// Allowlisted Query Categories & Role Mappings
const QUERY_CATEGORIES = [
  {
    id: 'search_constituencies',
    name: '1. Search Constituencies',
    description: 'Retrieve registered assembly constituencies filtered by state and district.',
    roles: ['CITIZEN', 'VOLUNTEER', 'ADMIN', 'GUEST'],
    filters: ['state', 'district', 'search'],
    sqlConcept: 'SELECT, WHERE, ORDER BY'
  },
  {
    id: 'search_polling_stations',
    name: '2. Search Polling Stations',
    description: 'Search polling stations mapped to their constituency and location address.',
    roles: ['CITIZEN', 'VOLUNTEER', 'ADMIN', 'GUEST'],
    filters: ['state', 'district', 'constituencyId', 'pollingStationId', 'search'],
    sqlConcept: 'SELECT, INNER JOIN, WHERE, ORDER BY'
  },
  {
    id: 'constituency_polling_stations',
    name: '3. Constituency-Wise Polling Stations',
    description: 'Display all polling stations belonging to a selected constituency.',
    roles: ['CITIZEN', 'VOLUNTEER', 'ADMIN', 'GUEST'],
    filters: ['district', 'constituencyId'],
    sqlConcept: 'INNER JOIN on common key (constituency_id)'
  },
  {
    id: 'district_constituencies',
    name: '4. District-Wise Constituencies',
    description: 'List assembly constituencies organized by district.',
    roles: ['CITIZEN', 'VOLUNTEER', 'ADMIN', 'GUEST'],
    filters: ['state', 'district'],
    sqlConcept: 'SELECT, WHERE, ORDER BY'
  },
  {
    id: 'constituency_citizens',
    name: '5. Constituency-Wise Citizen Records',
    description: 'Inspect registered voter and citizen electoral records by constituency.',
    roles: ['VOLUNTEER', 'ADMIN'],
    filters: ['district', 'constituencyId', 'recordStatus', 'search'],
    sqlConcept: '3-Table INNER JOIN (Citizen + Voter_Record + Constituency)'
  },
  {
    id: 'polling_station_records',
    name: '6. Polling Station-Wise Records',
    description: 'View voters registered at a specific polling station.',
    roles: ['VOLUNTEER', 'ADMIN'],
    filters: ['constituencyId', 'pollingStationId', 'recordStatus'],
    sqlConcept: 'Multiple-Table JOIN (Polling_Station + Voter_Record + Citizen)'
  },
  {
    id: 'verification_requests',
    name: '7. Verification Request Status',
    description: 'Filter verification requests by constituency, status, and submission date.',
    roles: ['CITIZEN', 'VOLUNTEER', 'ADMIN'],
    filters: ['district', 'constituencyId', 'status', 'requestType', 'startDate', 'endDate'],
    sqlConcept: 'INNER JOIN, WHERE condition, DATE filtering'
  },
  {
    id: 'pending_requests',
    name: '8. Pending Verification Requests',
    description: 'Identify unfinalized verification requests and track turnaround days.',
    roles: ['CITIZEN', 'VOLUNTEER', 'ADMIN'],
    filters: ['district', 'constituencyId', 'requestType'],
    sqlConcept: 'SELECT WHERE current_status IN (...) + DATEDIFF()'
  },
  {
    id: 'volunteer_assistance',
    name: '9. Volunteer Assistance Records',
    description: 'Explore on-ground citizen assistance requests and assigned volunteers.',
    roles: ['CITIZEN', 'VOLUNTEER', 'ADMIN'],
    filters: ['district', 'volunteerId', 'status', 'priority'],
    sqlConcept: 'Multiple-Table JOIN (Assistance_Request + Citizen + Volunteer + Area)'
  },
  {
    id: 'document_reviews',
    name: '10. Document Review Status',
    description: 'Track uploaded supporting documents, manual review decisions, and version logs.',
    roles: ['CITIZEN', 'VOLUNTEER', 'ADMIN'],
    filters: ['reviewStatus', 'docType', 'volunteerId'],
    sqlConcept: '4-Table JOIN (Document + Version + Review + Volunteer)'
  },
  {
    id: 'constituency_record_count',
    name: '11. Constituency-Wise Record Count',
    description: 'Aggregate summary counting total polling stations and voters per constituency.',
    roles: ['CITIZEN', 'VOLUNTEER', 'ADMIN', 'GUEST'],
    filters: ['state', 'district'],
    sqlConcept: 'LEFT JOIN, GROUP BY, COUNT(DISTINCT)'
  },
  {
    id: 'polling_station_record_count',
    name: '12. Polling Station-Wise Record Count',
    description: 'Aggregate count of registered voters allocated to each polling station.',
    roles: ['CITIZEN', 'VOLUNTEER', 'ADMIN', 'GUEST'],
    filters: ['district', 'constituencyId'],
    sqlConcept: 'INNER JOIN, GROUP BY, COUNT(*)'
  },
  {
    id: 'verification_status_summary',
    name: '13. Verification Status Summary',
    description: 'Statistical distribution and relative percentage of verification workflow states.',
    roles: ['CITIZEN', 'VOLUNTEER', 'ADMIN', 'GUEST'],
    filters: [],
    sqlConcept: 'Aggregate Functions: COUNT, SUM, Subquery percentage'
  },
  {
    id: 'volunteer_assignment_summary',
    name: '14. Volunteer Assignment Summary',
    description: 'Workload distribution metrics across approved field volunteers.',
    roles: ['VOLUNTEER', 'ADMIN'],
    filters: ['district'],
    sqlConcept: 'LEFT JOIN, GROUP BY, SUM(CASE ...), COUNT'
  }
];

// Predefined DBMS Demonstration Queries for Academic Evaluation (Phase 11)
const DEMO_CONCEPTS = [
  {
    id: 'concept_select',
    concept: '1. Basic Projection & Selection (SELECT)',
    title: 'Constituency Registry Table',
    description: 'Demonstrates basic column projection (SELECT) and sorting (ORDER BY) to retrieve all registered electoral constituencies in Karnataka.',
    sql: `SELECT constituency_id, name AS constituency_name, district, state FROM Constituency ORDER BY district ASC, name ASC;`
  },
  {
    id: 'concept_where',
    concept: '2. Conditional Filtering (WHERE Clause)',
    title: 'Polling Stations in Bengaluru District',
    description: 'Demonstrates conditional filtering using the WHERE clause on relational attributes combined with string matching.',
    sql: `SELECT ps.polling_station_id, ps.station_name, c.name AS constituency_name, c.district FROM Polling_Station ps JOIN Constituency c ON ps.constituency_id = c.constituency_id WHERE c.district = 'Bengaluru' ORDER BY ps.station_name ASC;`
  },
  {
    id: 'concept_inner_join',
    concept: '3. Relational Equi-Join (INNER JOIN)',
    title: 'Polling Stations with Constituency & Station Address',
    description: 'Demonstrates 2-table and 3-table equi-joins using foreign keys (constituency_id, address_id) to merge distinct normalized entities.',
    sql: `SELECT ps.polling_station_id, ps.station_name, c.name AS constituency_name, c.district, a.street, a.village, a.pin_code FROM Polling_Station ps INNER JOIN Constituency c ON ps.constituency_id = c.constituency_id INNER JOIN Address a ON ps.address_id = a.address_id ORDER BY c.name, ps.station_name;`
  },
  {
    id: 'concept_left_join',
    concept: '4. Outer Join (LEFT OUTER JOIN)',
    title: 'All Constituencies and Polling Station Counts (Preserving Unmatched)',
    description: 'Demonstrates an outer join ensuring that constituencies with zero polling stations are preserved in the result set rather than dropped.',
    sql: `SELECT c.constituency_id, c.name AS constituency_name, c.district, COUNT(ps.polling_station_id) AS total_stations FROM Constituency c LEFT JOIN Polling_Station ps ON c.constituency_id = ps.constituency_id GROUP BY c.constituency_id, c.name, c.district ORDER BY total_stations DESC;`
  },
  {
    id: 'concept_group_by_count',
    concept: '5. Grouping & Aggregation (GROUP BY & COUNT)',
    title: 'Voter Distribution by Polling Station',
    description: 'Demonstrates relational grouping with GROUP BY and aggregate counting to compute voter enrollment density per polling booth.',
    sql: `SELECT ps.polling_station_id, ps.station_name, c.name AS constituency_name, COUNT(vr.voter_id) AS registered_voters FROM Polling_Station ps JOIN Constituency c ON ps.constituency_id = c.constituency_id LEFT JOIN Voter_Record vr ON ps.polling_station_id = vr.polling_station_id GROUP BY ps.polling_station_id, ps.station_name, c.name ORDER BY registered_voters DESC;`
  },
  {
    id: 'concept_order_by_limit',
    concept: '6. Ordering & Pagination (ORDER BY & LIMIT)',
    title: 'Top 5 Most Delayed Unresolved Requests',
    description: 'Demonstrates descending sort evaluation (ORDER BY) and strict row bounding (LIMIT) using date-difference expressions.',
    sql: `SELECT vr.request_id, c.name AS citizen_name, vr.request_type, vr.current_status, vr.submission_date, DATEDIFF(NOW(), vr.submission_date) AS days_pending FROM Verification_Request vr JOIN Citizen c ON vr.citizen_id = c.citizen_id WHERE vr.current_status NOT IN ('RESOLVED', 'CANCELLED') ORDER BY days_pending DESC LIMIT 5;`
  },
  {
    id: 'concept_aggregates',
    concept: '7. Multi-Aggregate Calculations (COUNT, SUM, AVG, MIN, MAX)',
    title: 'Turnaround Metrics by Verification Request Type',
    description: 'Calculates multiple statistical aggregates simultaneously (COUNT, AVG resolution duration in hours, MIN, and MAX).',
    sql: `SELECT vr.request_type, COUNT(*) AS total_requests, ROUND(AVG(TIMESTAMPDIFF(HOUR, vr.submission_date, sh.changed_at)), 1) AS avg_resolution_hours, MIN(TIMESTAMPDIFF(HOUR, vr.submission_date, sh.changed_at)) AS fastest_hours, MAX(TIMESTAMPDIFF(HOUR, vr.submission_date, sh.changed_at)) AS slowest_hours FROM Verification_Request vr JOIN Status_History sh ON vr.request_id = sh.request_id WHERE sh.new_status = 'RESOLVED' GROUP BY vr.request_type;`
  },
  {
    id: 'concept_subquery',
    concept: '8. Nested Subquery (Correlated / Scalar Subquery)',
    title: 'Constituencies with Greater-Than-Average Polling Stations',
    description: 'Demonstrates an advanced nested subquery in the HAVING clause comparing individual group counts against the global table average.',
    sql: `SELECT c.constituency_id, c.name AS constituency_name, c.district, COUNT(ps.polling_station_id) AS station_count FROM Constituency c JOIN Polling_Station ps ON c.constituency_id = ps.constituency_id GROUP BY c.constituency_id, c.name, c.district HAVING station_count > (SELECT AVG(sub.cnt) FROM (SELECT COUNT(polling_station_id) AS cnt FROM Polling_Station GROUP BY constituency_id) sub);`
  },
  {
    id: 'concept_multi_join',
    concept: '9. Complex Multiple-Table Relational Join (4 Tables)',
    title: 'Comprehensive Verification Request Audit View',
    description: 'Demonstrates a normalized multi-table schema join connecting Verification_Request, Citizen, Voter_Record, and Constituency.',
    sql: `SELECT vr.request_id, c.name AS citizen_name, vr.request_type, vr.current_status, vr.submission_date, co.name AS constituency_name, co.district FROM Verification_Request vr JOIN Citizen c ON vr.citizen_id = c.citizen_id JOIN Voter_Record vrec ON vr.voter_id = vrec.voter_id JOIN Constituency co ON vrec.constituency_id = co.constituency_id ORDER BY vr.submission_date DESC LIMIT 10;`
  },
  {
    id: 'concept_having',
    concept: '10. Group Filtering with HAVING Clause',
    title: 'Citizens Logging Multiple Verification Requests',
    description: 'Demonstrates post-aggregation filtering using the HAVING clause to isolate citizens with more than 1 request on record.',
    sql: `SELECT c.citizen_id, c.name AS citizen_name, c.email, COUNT(vr.request_id) AS total_requests FROM Citizen c JOIN Verification_Request vr ON c.citizen_id = vr.citizen_id GROUP BY c.citizen_id, c.name, c.email HAVING COUNT(vr.request_id) > 1 ORDER BY total_requests DESC;`
  }
];

// ─── 1. Get Allowlisted Query Types ──────────────────────────────────────────
async function getQueryTypes(req, res) {
  const role = req.user?.role || 'GUEST';
  const available = QUERY_CATEGORIES.filter(cat => cat.roles.includes(role) || cat.roles.includes('GUEST'));
  res.json({ role, categories: available });
}

// ─── 2. Cascading Dropdown: States ───────────────────────────────────────────
async function getStates(req, res, next) {
  try {
    const rows = await db.query(
      `SELECT DISTINCT state FROM (
         SELECT state FROM Constituency WHERE state IS NOT NULL AND state != ''
         UNION
         SELECT state FROM Address WHERE state IS NOT NULL AND state != ''
       ) states ORDER BY state ASC`
    );
    const states = (rows || []).map(r => r.state);
    res.json(states);
  } catch (err) {
    next(err);
  }
}

// ─── 3. Cascading Dropdown: Districts (dependent on state) ───────────────────
async function getDistricts(req, res, next) {
  try {
    const { state } = req.query;
    let sql = `SELECT DISTINCT district FROM Constituency WHERE district IS NOT NULL AND district != ''`;
    const params = [];

    if (state && state.trim()) {
      sql += ' AND state = ?';
      params.push(state.trim());
    }
    sql += ' ORDER BY district ASC';

    const rows = await db.query(sql, params);
    const districts = (rows || []).map(r => r.district);
    res.json(districts);
  } catch (err) {
    next(err);
  }
}

// ─── 4. Cascading Dropdown: Constituencies (dependent on district/state) ─────
async function getConstituencies(req, res, next) {
  try {
    const { state, district } = req.query;
    let sql = `SELECT constituency_id, name, district, state FROM Constituency WHERE 1=1`;
    const params = [];

    if (state && state.trim()) {
      sql += ' AND state = ?';
      params.push(state.trim());
    }
    if (district && district.trim()) {
      sql += ' AND district = ?';
      params.push(district.trim());
    }
    sql += ' ORDER BY name ASC';

    const rows = await db.query(sql, params);
    res.json(rows || []);
  } catch (err) {
    next(err);
  }
}

// ─── 5. Cascading Dropdown: Polling Stations (dependent on constituency) ─────
async function getPollingStations(req, res, next) {
  try {
    const { constituencyId } = req.query;
    let sql = `SELECT polling_station_id, station_name, constituency_id FROM Polling_Station WHERE 1=1`;
    const params = [];

    if (constituencyId && !isNaN(parseInt(constituencyId))) {
      sql += ' AND constituency_id = ?';
      params.push(parseInt(constituencyId));
    }
    sql += ' ORDER BY station_name ASC';

    const rows = await db.query(sql, params);
    res.json(rows || []);
  } catch (err) {
    next(err);
  }
}

// ─── 6. Master Filter Options Lookup ─────────────────────────────────────────
async function getFilterOptions(req, res, next) {
  try {
    const [statuses, types, reviewStatuses, docTypes, volunteers] = await Promise.all([
      db.query(`SELECT DISTINCT current_status FROM Verification_Request WHERE current_status IS NOT NULL ORDER BY current_status ASC`),
      db.query(`SELECT DISTINCT request_type FROM Verification_Request WHERE request_type IS NOT NULL ORDER BY request_type ASC`),
      db.query(`SELECT DISTINCT file_review_status FROM Document WHERE file_review_status IS NOT NULL ORDER BY file_review_status ASC`),
      db.query(`SELECT DISTINCT document_type FROM Document WHERE document_type IS NOT NULL ORDER BY document_type ASC`),
      db.query(`SELECT volunteer_id, name FROM Volunteer WHERE verification_status = 'Approved' ORDER BY name ASC`)
    ]);

    res.json({
      verificationStatuses: (statuses || []).map(r => r.current_status),
      requestTypes: (types || []).map(r => r.request_type),
      reviewStatuses: (reviewStatuses || []).map(r => r.file_review_status),
      documentTypes: (docTypes || []).map(r => r.document_type),
      volunteers: volunteers || []
    });
  } catch (err) {
    next(err);
  }
}

// ─── 7. Safe Parameterized Search Execution Engine ──────────────────────────
async function searchRecords(req, res, next) {
  try {
    const userRole = req.user?.role || 'GUEST';
    const userId   = req.user?.user_id;
    const citizenId = req.user?.citizen_id;
    const volunteerId = req.user?.volunteer_id;

    const {
      category = 'search_constituencies',
      state,
      district,
      constituencyId,
      pollingStationId,
      status,
      requestType,
      docType,
      reviewStatus,
      volunteerId: selectedVolId,
      startDate,
      endDate,
      search,
      page = 1,
      limit = 10,
      sortBy,
      sortOrder = 'ASC'
    } = req.query;

    // Validate category against allowlist
    const categoryConfig = QUERY_CATEGORIES.find(c => c.id === category);
    if (!categoryConfig) {
      return res.status(400).json({ error: `Invalid query category: ${category}` });
    }

    // Role-based Category Authorization check
    if (!categoryConfig.roles.includes(userRole) && !categoryConfig.roles.includes('GUEST')) {
      return res.status(403).json({
        error: `Access Denied. Role '${userRole}' is not authorized to execute '${categoryConfig.name}'.`
      });
    }

    const pageNum  = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 10));
    const offset   = (pageNum - 1) * limitNum;
    const sanitizedOrder = (String(sortOrder).toUpperCase() === 'DESC') ? 'DESC' : 'ASC';

    let countSql = '';
    let dataSql = '';
    const params = [];
    let countParams = [];

    switch (category) {
      // 1. Search Constituencies
      case 'search_constituencies': {
        let where = 'WHERE 1=1';
        if (state) { where += ' AND c.state = ?'; params.push(state.trim()); }
        if (district) { where += ' AND c.district = ?'; params.push(district.trim()); }
        if (search) { where += ' AND c.name LIKE ?'; params.push(`%${search.trim()}%`); }

        countParams = [...params];
        countSql = `SELECT COUNT(*) AS total FROM Constituency c ${where}`;
        dataSql = `SELECT c.constituency_id, c.name AS constituency_name, c.district, c.state
                   FROM Constituency c ${where}
                   ORDER BY c.district ${sanitizedOrder}, c.name ASC LIMIT ? OFFSET ?`;
        params.push(limitNum, offset);
        break;
      }

      // 2. Search Polling Stations
      case 'search_polling_stations': {
        let where = 'WHERE 1=1';
        if (state) { where += ' AND c.state = ?'; params.push(state.trim()); }
        if (district) { where += ' AND c.district = ?'; params.push(district.trim()); }
        if (constituencyId && !isNaN(parseInt(constituencyId))) {
          where += ' AND ps.constituency_id = ?';
          params.push(parseInt(constituencyId));
        }
        if (pollingStationId && !isNaN(parseInt(pollingStationId))) {
          where += ' AND ps.polling_station_id = ?';
          params.push(parseInt(pollingStationId));
        }
        if (search) {
          where += ' AND (ps.station_name LIKE ? OR c.name LIKE ?)';
          params.push(`%${search.trim()}%`, `%${search.trim()}%`);
        }

        countParams = [...params];
        countSql = `SELECT COUNT(*) AS total
                    FROM Polling_Station ps
                    JOIN Constituency c ON ps.constituency_id = c.constituency_id
                    LEFT JOIN Address a ON ps.address_id = a.address_id ${where}`;
        dataSql = `SELECT ps.polling_station_id, ps.station_name, c.name AS constituency_name,
                          c.district, c.state, COALESCE(a.street, a.village, 'Ward Station') AS station_address, a.pin_code
                   FROM Polling_Station ps
                   JOIN Constituency c ON ps.constituency_id = c.constituency_id
                   LEFT JOIN Address a ON ps.address_id = a.address_id ${where}
                   ORDER BY ps.polling_station_id ${sanitizedOrder} LIMIT ? OFFSET ?`;
        params.push(limitNum, offset);
        break;
      }

      // 3. Constituency-Wise Polling Stations
      case 'constituency_polling_stations': {
        let where = 'WHERE 1=1';
        if (district) { where += ' AND c.district = ?'; params.push(district.trim()); }
        if (constituencyId && !isNaN(parseInt(constituencyId))) {
          where += ' AND ps.constituency_id = ?';
          params.push(parseInt(constituencyId));
        }
        if (search) { where += ' AND ps.station_name LIKE ?'; params.push(`%${search.trim()}%`); }

        countParams = [...params];
        countSql = `SELECT COUNT(*) AS total
                    FROM Polling_Station ps
                    JOIN Constituency c ON ps.constituency_id = c.constituency_id ${where}`;
        dataSql = `SELECT c.name AS constituency_name, ps.polling_station_id, ps.station_name,
                          c.district, a.street, a.pin_code
                   FROM Polling_Station ps
                   JOIN Constituency c ON ps.constituency_id = c.constituency_id
                   LEFT JOIN Address a ON ps.address_id = a.address_id ${where}
                   ORDER BY c.name ASC, ps.polling_station_id ${sanitizedOrder} LIMIT ? OFFSET ?`;
        params.push(limitNum, offset);
        break;
      }

      // 4. District-Wise Constituencies
      case 'district_constituencies': {
        let where = 'WHERE 1=1';
        if (state) { where += ' AND c.state = ?'; params.push(state.trim()); }
        if (district) { where += ' AND c.district = ?'; params.push(district.trim()); }

        countParams = [...params];
        countSql = `SELECT COUNT(*) AS total FROM Constituency c ${where}`;
        dataSql = `SELECT c.district, c.constituency_id, c.name AS constituency_name, c.state
                   FROM Constituency c ${where}
                   ORDER BY c.district ASC, c.name ${sanitizedOrder} LIMIT ? OFFSET ?`;
        params.push(limitNum, offset);
        break;
      }

      // 5. Constituency-Wise Citizen Records (Role restricted)
      case 'constituency_citizens': {
        let where = 'WHERE 1=1';
        if (district) { where += ' AND co.district = ?'; params.push(district.trim()); }
        if (constituencyId && !isNaN(parseInt(constituencyId))) {
          where += ' AND vr.constituency_id = ?';
          params.push(parseInt(constituencyId));
        }
        if (search) {
          where += ' AND (c.name LIKE ? OR vr.epic_reference LIKE ?)';
          params.push(`%${search.trim()}%`, `%${search.trim()}%`);
        }

        countParams = [...params];
        countSql = `SELECT COUNT(*) AS total
                    FROM Citizen c
                    JOIN Voter_Record vr ON c.citizen_id = vr.citizen_id
                    JOIN Constituency co ON vr.constituency_id = co.constituency_id ${where}`;

        // Redact full mobile for non-admins to protect privacy
        const mobileCol = (userRole === 'ADMIN')
          ? 'c.mobile'
          : `CONCAT(LEFT(c.mobile, 3), 'XXXX', RIGHT(c.mobile, 3)) AS mobile`;

        dataSql = `SELECT c.citizen_id, c.name AS citizen_name, ${mobileCol}, vr.epic_reference,
                          vr.record_status, co.name AS constituency_name, co.district
                   FROM Citizen c
                   JOIN Voter_Record vr ON c.citizen_id = vr.citizen_id
                   JOIN Constituency co ON vr.constituency_id = co.constituency_id ${where}
                   ORDER BY vr.voter_id ${sanitizedOrder} LIMIT ? OFFSET ?`;
        params.push(limitNum, offset);
        break;
      }

      // 6. Polling Station-Wise Records
      case 'polling_station_records': {
        let where = 'WHERE 1=1';
        if (constituencyId && !isNaN(parseInt(constituencyId))) {
          where += ' AND ps.constituency_id = ?';
          params.push(parseInt(constituencyId));
        }
        if (pollingStationId && !isNaN(parseInt(pollingStationId))) {
          where += ' AND ps.polling_station_id = ?';
          params.push(parseInt(pollingStationId));
        }

        countParams = [...params];
        countSql = `SELECT COUNT(*) AS total
                    FROM Polling_Station ps
                    JOIN Voter_Record vr ON ps.polling_station_id = vr.polling_station_id
                    JOIN Citizen c ON vr.citizen_id = c.citizen_id ${where}`;
        dataSql = `SELECT ps.station_name, ps.polling_station_id, vr.epic_reference,
                          c.name AS citizen_name, vr.record_status, co.name AS constituency_name
                   FROM Polling_Station ps
                   JOIN Voter_Record vr ON ps.polling_station_id = vr.polling_station_id
                   JOIN Citizen c ON vr.citizen_id = c.citizen_id
                   JOIN Constituency co ON ps.constituency_id = co.constituency_id ${where}
                   ORDER BY ps.polling_station_id ASC, vr.voter_id ${sanitizedOrder} LIMIT ? OFFSET ?`;
        params.push(limitNum, offset);
        break;
      }

      // 7. Verification Request Status
      case 'verification_requests': {
        let where = 'WHERE 1=1';
        // Citizen constraint: citizens can strictly only see their own requests
        if (userRole === 'CITIZEN' && citizenId) {
          where += ' AND vr.citizen_id = ?';
          params.push(citizenId);
        }
        if (district) { where += ' AND co.district = ?'; params.push(district.trim()); }
        if (constituencyId && !isNaN(parseInt(constituencyId))) {
          where += ' AND vrec.constituency_id = ?';
          params.push(parseInt(constituencyId));
        }
        if (status) { where += ' AND vr.current_status = ?'; params.push(status.trim()); }
        if (requestType) { where += ' AND vr.request_type = ?'; params.push(requestType.trim()); }
        if (startDate) { where += ' AND vr.submission_date >= ?'; params.push(startDate.trim()); }
        if (endDate) { where += ' AND vr.submission_date <= ?'; params.push(`${endDate.trim()} 23:59:59`); }

        countParams = [...params];
        countSql = `SELECT COUNT(*) AS total
                    FROM Verification_Request vr
                    JOIN Citizen c ON vr.citizen_id = c.citizen_id
                    LEFT JOIN Voter_Record vrec ON vr.voter_id = vrec.voter_id
                    LEFT JOIN Constituency co ON vrec.constituency_id = co.constituency_id ${where}`;
        dataSql = `SELECT vr.request_id, c.name AS citizen_name, vr.request_type, vr.current_status,
                          vr.submission_date, COALESCE(co.name, 'Unassigned') AS constituency_name,
                          COALESCE(co.district, '—') AS district
                   FROM Verification_Request vr
                   JOIN Citizen c ON vr.citizen_id = c.citizen_id
                   LEFT JOIN Voter_Record vrec ON vr.voter_id = vrec.voter_id
                   LEFT JOIN Constituency co ON vrec.constituency_id = co.constituency_id ${where}
                   ORDER BY vr.submission_date ${sanitizedOrder} LIMIT ? OFFSET ?`;
        params.push(limitNum, offset);
        break;
      }

      // 8. Pending Verification Requests
      case 'pending_requests': {
        let where = `WHERE vr.current_status IN ('SUBMITTED', 'DOCUMENTS_PENDING', 'DOCUMENTS_SUBMITTED', 'UNDER_REVIEW')`;
        if (userRole === 'CITIZEN' && citizenId) {
          where += ' AND vr.citizen_id = ?';
          params.push(citizenId);
        }
        if (district) { where += ' AND co.district = ?'; params.push(district.trim()); }
        if (constituencyId && !isNaN(parseInt(constituencyId))) {
          where += ' AND vrec.constituency_id = ?';
          params.push(parseInt(constituencyId));
        }
        if (requestType) { where += ' AND vr.request_type = ?'; params.push(requestType.trim()); }

        countParams = [...params];
        countSql = `SELECT COUNT(*) AS total
                    FROM Verification_Request vr
                    JOIN Citizen c ON vr.citizen_id = c.citizen_id
                    LEFT JOIN Voter_Record vrec ON vr.voter_id = vrec.voter_id
                    LEFT JOIN Constituency co ON vrec.constituency_id = co.constituency_id ${where}`;
        dataSql = `SELECT vr.request_id, c.name AS citizen_name, vr.request_type, vr.current_status,
                          vr.submission_date, DATEDIFF(NOW(), vr.submission_date) AS days_pending,
                          COALESCE(co.name, 'Unassigned') AS constituency_name
                   FROM Verification_Request vr
                   JOIN Citizen c ON vr.citizen_id = c.citizen_id
                   LEFT JOIN Voter_Record vrec ON vr.voter_id = vrec.voter_id
                   LEFT JOIN Constituency co ON vrec.constituency_id = co.constituency_id ${where}
                   ORDER BY days_pending ${sanitizedOrder} LIMIT ? OFFSET ?`;
        params.push(limitNum, offset);
        break;
      }

      // 9. Volunteer Assistance Records
      case 'volunteer_assistance': {
        let where = 'WHERE 1=1';
        if (userRole === 'CITIZEN' && citizenId) {
          where += ' AND ar.citizen_id = ?';
          params.push(citizenId);
        } else if (userRole === 'VOLUNTEER' && volunteerId) {
          where += ' AND ar.volunteer_id = ?';
          params.push(volunteerId);
        }
        if (district) { where += ' AND a.district = ?'; params.push(district.trim()); }
        if (selectedVolId && !isNaN(parseInt(selectedVolId))) {
          where += ' AND ar.volunteer_id = ?';
          params.push(parseInt(selectedVolId));
        }
        if (status) { where += ' AND ar.status = ?'; params.push(status.trim()); }
        if (startDate) { where += ' AND ar.request_date >= ?'; params.push(startDate.trim()); }

        countParams = [...params];
        countSql = `SELECT COUNT(*) AS total
                    FROM Assistance_Request ar
                    JOIN Citizen c ON ar.citizen_id = c.citizen_id
                    LEFT JOIN Volunteer v ON ar.volunteer_id = v.volunteer_id
                    LEFT JOIN Area a ON v.area_id = a.area_id ${where}`;
        dataSql = `SELECT ar.assistance_id, c.name AS citizen_name, ar.request_type, ar.status,
                          ar.priority, COALESCE(v.name, 'Unassigned') AS volunteer_name,
                          COALESCE(a.district, 'Bengaluru') AS district, ar.request_date
                   FROM Assistance_Request ar
                   JOIN Citizen c ON ar.citizen_id = c.citizen_id
                   LEFT JOIN Volunteer v ON ar.volunteer_id = v.volunteer_id
                   LEFT JOIN Area a ON v.area_id = a.area_id ${where}
                   ORDER BY ar.assistance_id ${sanitizedOrder} LIMIT ? OFFSET ?`;
        params.push(limitNum, offset);
        break;
      }

      // 10. Document Review Status
      case 'document_reviews': {
        let where = 'WHERE 1=1';
        if (userRole === 'CITIZEN' && citizenId) {
          where += ' AND d.citizen_id = ?';
          params.push(citizenId);
        } else if (userRole === 'VOLUNTEER' && volunteerId) {
          where += ' AND (va.volunteer_id = ? OR dr.volunteer_id = ?)';
          params.push(volunteerId, volunteerId);
        }
        if (reviewStatus) { where += ' AND d.file_review_status = ?'; params.push(reviewStatus.trim()); }
        if (docType) { where += ' AND d.document_type = ?'; params.push(docType.trim()); }

        countParams = [...params];
        countSql = `SELECT COUNT(DISTINCT d.document_id) AS total
                    FROM Document d
                    JOIN Citizen c ON d.citizen_id = c.citizen_id
                    LEFT JOIN Volunteer_Assignment va ON va.document_id = d.document_id
                    LEFT JOIN Document_Version dv ON dv.document_id = d.document_id AND dv.version_number = d.current_version
                    LEFT JOIN Document_Review dr ON dr.version_id = dv.version_id ${where}`;
        dataSql = `SELECT d.document_id, c.name AS citizen_name, d.document_type, d.current_version,
                          d.file_review_status, COALESCE(vol.name, 'Awaiting Assignment') AS reviewer_name,
                          dr.review_decision, dr.reviewed_at
                   FROM Document d
                   JOIN Citizen c ON d.citizen_id = c.citizen_id
                   LEFT JOIN Volunteer_Assignment va ON va.document_id = d.document_id AND va.status = 'Active'
                   LEFT JOIN Document_Version dv ON dv.document_id = d.document_id AND dv.version_number = d.current_version
                   LEFT JOIN Document_Review dr ON dr.version_id = dv.version_id
                   LEFT JOIN Volunteer vol ON (dr.volunteer_id = vol.volunteer_id OR va.volunteer_id = vol.volunteer_id)
                   ${where}
                   GROUP BY d.document_id, c.name, d.document_type, d.current_version, d.file_review_status, vol.name, dr.review_decision, dr.reviewed_at
                   ORDER BY d.document_id ${sanitizedOrder} LIMIT ? OFFSET ?`;
        params.push(limitNum, offset);
        break;
      }

      // 11. Constituency-Wise Record Count
      case 'constituency_record_count': {
        let where = 'WHERE 1=1';
        if (state) { where += ' AND co.state = ?'; params.push(state.trim()); }
        if (district) { where += ' AND co.district = ?'; params.push(district.trim()); }

        countParams = [...params];
        countSql = `SELECT COUNT(*) AS total FROM Constituency co ${where}`;
        dataSql = `SELECT co.constituency_id, co.name AS constituency_name, co.district,
                          COUNT(DISTINCT ps.polling_station_id) AS total_polling_stations,
                          COUNT(DISTINCT vr.voter_id) AS total_registered_voters
                   FROM Constituency co
                   LEFT JOIN Polling_Station ps ON co.constituency_id = ps.constituency_id
                   LEFT JOIN Voter_Record vr ON co.constituency_id = vr.constituency_id
                   ${where}
                   GROUP BY co.constituency_id, co.name, co.district
                   ORDER BY total_polling_stations ${sanitizedOrder}, co.name ASC LIMIT ? OFFSET ?`;
        params.push(limitNum, offset);
        break;
      }

      // 12. Polling Station-Wise Record Count
      case 'polling_station_record_count': {
        let where = 'WHERE 1=1';
        if (district) { where += ' AND co.district = ?'; params.push(district.trim()); }
        if (constituencyId && !isNaN(parseInt(constituencyId))) {
          where += ' AND ps.constituency_id = ?';
          params.push(parseInt(constituencyId));
        }

        countParams = [...params];
        countSql = `SELECT COUNT(*) AS total
                    FROM Polling_Station ps
                    JOIN Constituency co ON ps.constituency_id = co.constituency_id ${where}`;
        dataSql = `SELECT ps.polling_station_id, ps.station_name, co.name AS constituency_name,
                          co.district, COUNT(vr.voter_id) AS registered_voters_count
                   FROM Polling_Station ps
                   JOIN Constituency co ON ps.constituency_id = co.constituency_id
                   LEFT JOIN Voter_Record vr ON ps.polling_station_id = vr.polling_station_id
                   ${where}
                   GROUP BY ps.polling_station_id, ps.station_name, co.name, co.district
                   ORDER BY registered_voters_count ${sanitizedOrder} LIMIT ? OFFSET ?`;
        params.push(limitNum, offset);
        break;
      }

      // 13. Verification Status Summary
      case 'verification_status_summary': {
        countSql = `SELECT COUNT(DISTINCT current_status) AS total FROM Verification_Request`;
        dataSql = `SELECT current_status AS verification_status,
                          COUNT(*) AS total_requests,
                          ROUND((COUNT(*) * 100.0 / (SELECT COUNT(*) FROM Verification_Request)), 1) AS percentage_of_total
                   FROM Verification_Request
                   GROUP BY current_status
                   ORDER BY total_requests ${sanitizedOrder}`;
        break;
      }

      // 14. Volunteer Assignment Summary
      case 'volunteer_assignment_summary': {
        let where = 'WHERE 1=1';
        if (district) { where += ' AND a.district = ?'; params.push(district.trim()); }

        countParams = [...params];
        countSql = `SELECT COUNT(*) AS total
                    FROM Volunteer v
                    LEFT JOIN Area a ON v.area_id = a.area_id ${where}`;
        dataSql = `SELECT v.volunteer_id, v.name AS volunteer_name, COALESCE(a.name, 'Zone 1') AS area_name,
                          v.availability,
                          COUNT(DISTINCT va.assignment_id) AS total_document_assignments,
                          SUM(CASE WHEN va.status = 'Completed' THEN 1 ELSE 0 END) AS completed_document_reviews,
                          COUNT(DISTINCT ar.assistance_id) AS total_assistance_tasks
                   FROM Volunteer v
                   LEFT JOIN Area a ON v.area_id = a.area_id
                   LEFT JOIN Volunteer_Assignment va ON v.volunteer_id = va.volunteer_id
                   LEFT JOIN Assistance_Request ar ON v.volunteer_id = ar.volunteer_id
                   ${where}
                   GROUP BY v.volunteer_id, v.name, a.name, v.availability
                   ORDER BY total_document_assignments ${sanitizedOrder} LIMIT ? OFFSET ?`;
        params.push(limitNum, offset);
        break;
      }

      default:
        return res.status(400).json({ error: `Unsupported query category: ${category}` });
    }

    const startTime = Date.now();
    const countResult = await db.query(countSql, countParams);
    const totalRecords = countResult[0]?.total || 0;
    const records = await db.query(dataSql, params);
    const executionTimeMs = Date.now() - startTime;

    res.json({
      category,
      categoryName: categoryConfig.name,
      sqlConcept: categoryConfig.sqlConcept,
      totalRecords,
      totalPages: Math.ceil(totalRecords / limitNum) || 1,
      currentPage: pageNum,
      pageSize: limitNum,
      executionTimeMs,
      records: records || []
    });
  } catch (err) {
    next(err);
  }
}

// ─── 8. Predefined Academic Demonstration Queries (Phase 11) ─────────────────
async function getDemoConcepts(req, res) {
  res.json(DEMO_CONCEPTS.map(c => ({
    id: c.id,
    concept: c.concept,
    title: c.title,
    description: c.description,
    sql: c.sql
  })));
}

async function executeDemoConcept(req, res, next) {
  try {
    const { conceptId } = req.body;
    const target = DEMO_CONCEPTS.find(c => c.id === conceptId);
    if (!target) {
      return res.status(404).json({ error: `Demonstration concept not found: ${conceptId}` });
    }

    const start = Date.now();
    const results = await db.query(target.sql);
    const executionTimeMs = Date.now() - start;

    res.json({
      id: target.id,
      concept: target.concept,
      title: target.title,
      description: target.description,
      sql: target.sql,
      executionTimeMs,
      rowCount: results ? results.length : 0,
      columns: results && results.length > 0 ? Object.keys(results[0]) : [],
      results: results || []
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getQueryTypes,
  getStates,
  getDistricts,
  getConstituencies,
  getPollingStations,
  getFilterOptions,
  searchRecords,
  getDemoConcepts,
  executeDemoConcept
};
