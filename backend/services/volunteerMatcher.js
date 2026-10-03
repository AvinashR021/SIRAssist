const db = require('../db/connection');

/**
 * Basic Volunteer Matching Algorithm
 * Matches citizens needing assistance with available volunteers based on Area and Skills.
 */
async function findMatchingVolunteers(areaId, requiredSkill = '') {
  let sql = `
    SELECT 
      v.volunteer_id,
      v.name,
      v.email,
      v.mobile,
      v.availability,
      v.skills,
      v.verification_status,
      a.area_id,
      a.name AS area_name,
      a.district,
      a.pin_code,
      (SELECT COUNT(*) FROM Assistance_Request ar WHERE ar.volunteer_id = v.volunteer_id AND ar.status IN ('ASSIGNED', 'IN_PROGRESS')) AS active_workload
    FROM Volunteer v
    LEFT JOIN Area a ON v.area_id = a.area_id
    WHERE v.verification_status = 'Approved'
      AND v.availability = 'Available'
  `;

  const params = [];

  if (areaId) {
    sql += ` AND v.area_id = ?`;
    params.push(areaId);
  }

  if (requiredSkill) {
    sql += ` AND v.skills LIKE ?`;
    params.push(`%${requiredSkill}%`);
  }

  sql += ` ORDER BY active_workload ASC, v.name ASC`;

  const volunteers = await db.query(sql, params);

  return {
    searched_area_id: areaId,
    required_skill: requiredSkill,
    matches_count: volunteers.length,
    volunteers
  };
}

module.exports = {
  findMatchingVolunteers
};
