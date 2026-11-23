/**
 * SIRAssist – Region-Based Volunteer Assignment Service
 * Matches citizen documents to active volunteers according to geographical service hierarchy:
 *   Priority 1: Same Area / Locality (Direct area_id / PIN code / Taluk match)
 *   Priority 2: Same Constituency (Constituency-associated service areas)
 *   Priority 3: Same District (District-wide coverage)
 * Workload Balancing:
 *   Prefers available volunteers with the fewest active assignments.
 *   Uses deterministic tie-breaker (volunteer_id ASC).
 */
const db = require('../db/connection');

/**
 * Universal query unwrapper that normalizes differences between db.query and raw connection.query
 */
async function runQuery(runner, sql, params = []) {
  if (runner === db) {
    return await db.query(sql, params);
  }
  // Raw connection returns [rows, fields]
  const res = await runner.query(sql, params);
  if (Array.isArray(res) && Array.isArray(res[0])) {
    return res[0];
  }
  return res;
}

/**
 * Identify citizen's region and find the most suitable active volunteer.
 * @param {number} citizenId
 * @param {object} [runner] - Optional db connection or query runner for transactions
 * @returns {Promise<{ volunteer: object|null, matchLevel: string, reason: string, citizenRegion: object }>}
 */
async function findEligibleVolunteerForCitizen(citizenId, runner = db) {
  // 1. Fetch citizen address and voter constituency
  const citRows = await runQuery(
    runner,
    `SELECT c.citizen_id, c.name AS citizen_name,
            a.address_id, a.house_number, a.street, a.village, a.taluk, a.district, a.state, a.pin_code,
            vr.constituency_id, con.name AS constituency_name
     FROM Citizen c
     LEFT JOIN Address a ON a.address_id = c.address_id
     LEFT JOIN Voter_Record vr ON vr.citizen_id = c.citizen_id
     LEFT JOIN Constituency con ON con.constituency_id = vr.constituency_id
     WHERE c.citizen_id = ?`,
    [citizenId]
  );

  if (!citRows || citRows.length === 0) {
    return { volunteer: null, matchLevel: 'NONE', reason: 'Citizen record not found.', citizenRegion: null };
  }

  const cit = citRows[0];
  const citizenRegion = {
    district: cit.district || 'Bengaluru',
    taluk: cit.taluk || '',
    pin_code: cit.pin_code || '',
    constituency_id: cit.constituency_id || null,
    constituency_name: cit.constituency_name || null,
    area_id: null,
    area_name: null
  };

  // Find citizen's Area
  const areaRows = await runQuery(
    runner,
    `SELECT area_id, name, taluk, district, pin_code
     FROM Area
     WHERE (pin_code IS NOT NULL AND pin_code = ?)
        OR (taluk IS NOT NULL AND taluk = ?)
     ORDER BY (pin_code = ?) DESC
     LIMIT 1`,
    [citizenRegion.pin_code, citizenRegion.taluk, citizenRegion.pin_code]
  );

  if (areaRows && areaRows.length > 0) {
    citizenRegion.area_id = areaRows[0].area_id;
    citizenRegion.area_name = areaRows[0].name;
    if (!citizenRegion.district && areaRows[0].district) {
      citizenRegion.district = areaRows[0].district;
    }
  }

  // Helper to query approved, available volunteers with active workload count
  async function getCandidateVolunteers(filterSql, filterParams) {
    const sql = `
      SELECT v.volunteer_id, v.name, v.email, v.mobile, v.area_id, v.availability, v.skills,
             ar.name AS area_name, ar.district AS area_district, ar.taluk AS area_taluk, ar.pin_code AS area_pin,
             COUNT(va.assignment_id) AS active_assignments_count
      FROM Volunteer v
      JOIN Area ar ON ar.area_id = v.area_id
      LEFT JOIN Volunteer_Assignment va
        ON va.volunteer_id = v.volunteer_id AND va.status = 'Active'
      WHERE v.verification_status = 'Approved'
        AND v.availability = 'Available'
        AND (${filterSql})
      GROUP BY v.volunteer_id, ar.name, ar.district, ar.taluk, ar.pin_code
      ORDER BY active_assignments_count ASC, v.volunteer_id ASC
    `;
    return await runQuery(runner, sql, filterParams);
  }

  // --- Priority 1: Same Area / Locality ---
  if (citizenRegion.area_id) {
    const areaCandidates = await getCandidateVolunteers('v.area_id = ?', [citizenRegion.area_id]);
    if (areaCandidates && areaCandidates.length > 0) {
      return {
        volunteer: areaCandidates[0],
        matchLevel: 'AREA',
        reason: `Matched by service locality: ${citizenRegion.area_name} (Workload: ${areaCandidates[0].active_assignments_count})`,
        citizenRegion
      };
    }
  }

  // --- Priority 2: Same Constituency ---
  if (citizenRegion.constituency_id) {
    const constAreaRows = await runQuery(
      runner,
      `SELECT DISTINCT ar.area_id
       FROM Polling_Station ps
       JOIN Address a ON a.address_id = ps.address_id
       JOIN Area ar ON (ar.pin_code = a.pin_code OR ar.taluk = a.taluk OR ar.district = a.district)
       WHERE ps.constituency_id = ?`,
      [citizenRegion.constituency_id]
    );

    const linkedAreaIds = constAreaRows.map(r => r.area_id).filter(Boolean);
    if (linkedAreaIds.length > 0) {
      const placeholders = linkedAreaIds.map(() => '?').join(',');
      const constCandidates = await getCandidateVolunteers(`v.area_id IN (${placeholders})`, linkedAreaIds);
      if (constCandidates && constCandidates.length > 0) {
        return {
          volunteer: constCandidates[0],
          matchLevel: 'CONSTITUENCY',
          reason: `Matched by Assembly Constituency: ${citizenRegion.constituency_name || ('#' + citizenRegion.constituency_id)}`,
          citizenRegion
        };
      }
    }
  }

  // --- Priority 3: Same District ---
  if (citizenRegion.district) {
    const distCandidates = await getCandidateVolunteers('ar.district = ?', [citizenRegion.district]);
    if (distCandidates && distCandidates.length > 0) {
      return {
        volunteer: distCandidates[0],
        matchLevel: 'DISTRICT',
        reason: `Matched by District coverage: ${citizenRegion.district}`,
        citizenRegion
      };
    }
  }

  // --- Priority 4: No volunteer available in the region ---
  return {
    volunteer: null,
    matchLevel: 'PENDING_ASSIGNMENT',
    reason: `No active available volunteer found for region (${citizenRegion.area_name || citizenRegion.district || 'Unspecified'}). Pending admin assignment.`,
    citizenRegion
  };
}

/**
 * Automatically assign an uploaded document to an eligible regional volunteer.
 * @param {number} documentId
 * @param {number} citizenId
 * @param {object} connection - MySQL transaction connection
 * @returns {Promise<object|null>} Assigned volunteer record or null
 */
async function autoAssignDocument(documentId, citizenId, connection) {
  const matchResult = await findEligibleVolunteerForCitizen(citizenId, connection);

  if (matchResult.volunteer && matchResult.volunteer.volunteer_id) {
    const vol = matchResult.volunteer;
    // Fetch system admin user ID for automated regional assignment (assigned_by is required NOT NULL)
    const adminRows = await runQuery(
      connection,
      `SELECT user_id FROM User_Account WHERE role = 'ADMIN' ORDER BY user_id ASC LIMIT 1`
    );
    const systemAdminId = adminRows?.[0]?.user_id || 1;

    // Create Active Volunteer_Assignment
    const [insRes] = await connection.query(
      `INSERT INTO Volunteer_Assignment (document_id, volunteer_id, assigned_by, status, assigned_at)
       VALUES (?, ?, ?, 'Active', NOW())`,
      [documentId, vol.volunteer_id, systemAdminId]
    );

    // Update document status
    await connection.query(
      `UPDATE Document SET file_review_status = 'Pending Review', updated_at = NOW() WHERE document_id = ?`,
      [documentId]
    );

    return {
      assignment_id: insRes?.insertId,
      volunteer_id: vol.volunteer_id,
      volunteer_name: vol.name,
      match_level: matchResult.matchLevel,
      reason: matchResult.reason
    };
  }

  // No regional volunteer found: Document remains pending assignment
  return null;
}

/**
 * Get all volunteers ranked and categorized for a specific citizen for Admin Assignment.
 * Shows Regional matches on top.
 * @param {number} citizenId
 * @returns {Promise<{ citizenRegion: object, volunteers: Array }>}
 */
async function getVolunteersForAdminSelection(citizenId) {
  const match = await findEligibleVolunteerForCitizen(citizenId, db);
  const citRegion = match.citizenRegion || {};

  const allVols = await db.query(
    `SELECT v.volunteer_id, v.name, v.email, v.mobile, v.area_id, v.availability, v.skills, v.verification_status,
            ar.name AS area_name, ar.district AS area_district, ar.taluk AS area_taluk, ar.pin_code AS area_pin,
            COUNT(va.assignment_id) AS active_assignments_count
     FROM Volunteer v
     LEFT JOIN Area ar ON ar.area_id = v.area_id
     LEFT JOIN Volunteer_Assignment va ON va.volunteer_id = v.volunteer_id AND va.status = 'Active'
     WHERE v.verification_status = 'Approved'
     GROUP BY v.volunteer_id, ar.name, ar.district, ar.taluk, ar.pin_code
     ORDER BY v.name ASC`
  );

  const categorized = allVols.map(v => {
    let recommendation = 'Other Region';
    let rank = 4;

    if (citRegion.area_id && v.area_id === citRegion.area_id) {
      recommendation = 'Recommended: Same Locality';
      rank = 1;
    } else if (citRegion.district && v.area_district && v.area_district.toLowerCase() === citRegion.district.toLowerCase()) {
      recommendation = 'Recommended: Same District';
      rank = 2;
    }

    return {
      ...v,
      recommendation,
      rank,
      is_available: v.availability === 'Available'
    };
  });

  // Sort by recommendation rank, then availability, then workload
  categorized.sort((a, b) => {
    if (a.rank !== b.rank) return a.rank - b.rank;
    if (a.is_available !== b.is_available) return a.is_available ? -1 : 1;
    return a.active_assignments_count - b.active_assignments_count;
  });

  return {
    citizenRegion: citRegion,
    volunteers: categorized
  };
}

module.exports = {
  findEligibleVolunteerForCitizen,
  autoAssignDocument,
  getVolunteersForAdminSelection
};
