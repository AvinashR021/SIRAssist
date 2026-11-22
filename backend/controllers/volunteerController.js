const db = require('../db/connection');

async function getVolunteers(req, res, next) {
  try {
    const { area_id, availability, search } = req.query;

    let sql = `
      SELECT v.volunteer_id, v.name, v.mobile, v.email, v.availability, v.skills, v.verification_status, v.created_at,
             a.area_id, a.name AS area_name, a.district, a.pin_code
      FROM Volunteer v
      LEFT JOIN Area a ON v.area_id = a.area_id
      WHERE 1=1
    `;

    const params = [];

    if (area_id) {
      sql += ' AND v.area_id = ?';
      params.push(parseInt(area_id));
    }

    if (availability) {
      sql += ' AND v.availability = ?';
      params.push(availability);
    }

    if (search) {
      sql += ' AND (v.name LIKE ? OR v.skills LIKE ? OR v.email LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    sql += ' ORDER BY v.name ASC';

    const volunteers = await db.query(sql, params);
    res.json(volunteers);
  } catch (err) {
    next(err);
  }
}

async function getAvailableVolunteers(req, res, next) {
  try {
    const volunteers = await db.query(
      `SELECT v.volunteer_id, v.name, v.mobile, v.email, v.availability, v.skills, a.name AS area_name
       FROM Volunteer v
       LEFT JOIN Area a ON v.area_id = a.area_id
       WHERE v.verification_status = 'Approved' AND v.availability = 'Available'`
    );
    res.json(volunteers);
  } catch (err) {
    next(err);
  }
}

async function updateVolunteerProfile(req, res, next) {
  try {
    const volunteerId = req.user.volunteer_id || parseInt(req.params.id);
    const { availability, skills, area_id } = req.body;

    if (!volunteerId) {
      return res.status(403).json({ error: 'Volunteer identifier missing in token.' });
    }

    if (availability && !['Available', 'Busy', 'Unavailable'].includes(availability)) {
      return res.status(400).json({ error: 'Availability must be Available, Busy, or Unavailable.' });
    }

    if (skills && (typeof skills !== 'string' || skills.trim().length < 3)) {
      return res.status(400).json({ error: 'Skills must specify at least one skill (min 3 characters).' });
    }

    await db.query(
      'UPDATE Volunteer SET availability = COALESCE(?, availability), skills = COALESCE(?, skills), area_id = COALESCE(?, area_id) WHERE volunteer_id = ?',
      [availability, skills ? skills.trim() : null, area_id ? parseInt(area_id) : null, volunteerId]
    );

    res.json({ message: 'Volunteer profile updated successfully.' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getVolunteers,
  getAvailableVolunteers,
  updateVolunteerProfile
};
